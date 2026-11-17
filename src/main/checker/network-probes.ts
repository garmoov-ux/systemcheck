import net from 'node:net';
import { execFile } from 'node:child_process';
import { formatNowDateTime, type FileLogger } from './file-logger';
import type { DeviceCheckUpdatePayload } from '../db/device-repo';
import type { DeviceRecord, SystemCheckAppConfig } from '@shared/types/domain';

const IPV4_OR_HOST_REGEX = /^[a-zA-Z0-9.-]+$/;

export function probePing(ip: string, timeoutMs = 2000): Promise<boolean> {
  if (!IPV4_OR_HOST_REGEX.test(ip)) {
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    execFile(
      'ping',
      ['-n', '1', '-w', String(timeoutMs), ip],
      { windowsHide: true, timeout: timeoutMs + 1000 },
      (error) => {
        resolve(!error);
      },
    );
  });
}

export function probeTcpPort(
  ip: string,
  port: number,
  timeoutMs = 3000,
): Promise<{ open: boolean; latencyMs: number | null }> {
  return new Promise((resolve) => {
    const started = Date.now();
    const socket = new net.Socket();
    let settled = false;

    const finalize = (open: boolean) => {
      if (settled) return;
      settled = true;
      const elapsed = Date.now() - started;
      socket.destroy();
      resolve({ open, latencyMs: open ? elapsed : null });
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finalize(true));
    socket.once('timeout', () => finalize(false));
    socket.once('error', () => finalize(false));

    try {
      socket.connect(port, ip);
    } catch {
      finalize(false);
    }
  });
}

export async function sendKeepAliveRequest(
  url: string,
  deviceId: string,
  timeoutMs = 3000,
): Promise<{ ok: boolean; statusCode: number | null }> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ REGLTEQPMN_ID: deviceId }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    return {
      ok: response.status === 200,
      statusCode: response.status,
    };
  } catch {
    return {
      ok: false,
      statusCode: null,
    };
  }
}

export async function checkSingleDevice(
  device: Pick<DeviceRecord, 'deviceId' | 'ip' | 'portMS' | 'portVNC'>,
  config: SystemCheckAppConfig,
  logger?: FileLogger,
  skipPing = false,
): Promise<DeviceCheckUpdatePayload> {
  const tcpTimeoutMs = config.checker.tcpTimeoutSec * 1000;
  const keepAliveTimeoutMs = config.keepAlive.timeoutSec * 1000;

  logger?.logDevice('INFO', `장비번호: ${device.deviceId}`);
  logger?.logDevice('INFO', `아이피: ${device.ip}`);

  // 1. 핑 및 두 개 포트(3389, 5900) 동시 점검으로 대기시간 최소화
  const [pingResult, msProbe, vncProbe] = await Promise.all([
    skipPing ? Promise.resolve(true) : probePing(device.ip, Math.min(2000, tcpTimeoutMs)),
    probeTcpPort(device.ip, device.portMS, tcpTimeoutMs),
    probeTcpPort(device.ip, device.portVNC, tcpTimeoutMs),
  ]);

  logger?.logDevice('INFO', pingResult ? '핑테스트: 정상' : '핑테스트: 비정상');

  let keepAliveOk = 0;
  let keepAliveCode: number | null = null;
  let keepAliveSentOnce = false;

  const portResults: { port: number; open: boolean }[] = [
    { port: device.portMS, open: msProbe.open },
    { port: device.portVNC, open: vncProbe.open },
  ];

  for (const item of portResults) {
    if (item.open) {
      logger?.logDevice('INFO', `${device.deviceId} -> ${device.ip}:${item.port} 포트 연결 성공`);

      const shouldSend =
        config.keepAlive.enabled &&
        (config.keepAlive.sendMode === 'per_open_port' || !keepAliveSentOnce);

      if (shouldSend) {
        keepAliveSentOnce = true;
        const payload = { REGLTEQPMN_ID: device.deviceId };
        logger?.logDevice('INFO', `URL -> ${config.keepAlive.url}`);
        logger?.logDevice('INFO', `JSON -> ${JSON.stringify(payload)}`);

        const kaRes = await sendKeepAliveRequest(
          config.keepAlive.url,
          device.deviceId,
          keepAliveTimeoutMs,
        );
        keepAliveCode = kaRes.statusCode;
        logger?.logDevice('INFO', `응답코드 -> ${kaRes.statusCode ?? '연결실패'}`);

        if (kaRes.ok) {
          keepAliveOk = 1;
          logger?.logDevice('INFO', `${device.deviceId} -> KeepAlive 성공`);
        } else {
          logger?.logDevice('INFO', `${device.deviceId} -> KeepAlive 실패`);
        }
      }
    } else {
      logger?.logDevice('WARNING', `${device.deviceId} -> ${device.ip}:${item.port} 포트 연결 실패`);
      logger?.logDevice('INFO', `${device.deviceId} -> KeepAlive 실패`);
    }
  }

  // 기존 legacy_src/app.py 판정 기준과 100% 동일:
  // 포트(PortMS, PortVNC) 중 1개 이상 연결 성공 시 Up, 둘 다 실패 시 Down
  const openPortCount = (msProbe.open ? 1 : 0) + (vncProbe.open ? 1 : 0);
  const status = openPortCount > 0 ? 'Up' : 'Down';

  if (status === 'Up') {
    logger?.logDevice('INFO', '상태: 정상');
  } else {
    logger?.logDevice('WARNING', '상태: 비정상');
  }

  const checkTime = formatNowDateTime(new Date());
  logger?.logDevice('INFO', `체크시간: ${checkTime}`);

  const latencyCandidates = [msProbe.latencyMs, vncProbe.latencyMs].filter(
    (v): v is number => v !== null,
  );
  const latencyMs = latencyCandidates.length > 0 ? Math.min(...latencyCandidates) : null;

  return {
    deviceId: device.deviceId,
    ip: device.ip,
    portMS: device.portMS,
    portVNC: device.portVNC,
    checkTime,
    status,
    pingOk: pingResult ? 1 : 0,
    msPortOpen: msProbe.open ? 1 : 0,
    vncPortOpen: vncProbe.open ? 1 : 0,
    latencyMs,
    keepAliveOk,
    keepAliveCode,
  };
}
