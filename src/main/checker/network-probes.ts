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
  device: Pick<DeviceRecord, 'deviceId' | 'ip' | 'portMS' | 'portVNC'> & { deviceName?: string },
  config: SystemCheckAppConfig,
  logger?: FileLogger,
  skipPing = false,
): Promise<DeviceCheckUpdatePayload> {
  const tcpTimeoutMs = config.checker.tcpTimeoutSec * 1000;
  const keepAliveTimeoutMs = config.keepAlive.timeoutSec * 1000;
  const nameTag = device.deviceName ? `(${device.deviceName})` : '';

  const [pingResult, msProbe, vncProbe] = await Promise.all([
    skipPing ? Promise.resolve(true) : probePing(device.ip, Math.min(2000, tcpTimeoutMs)),
    probeTcpPort(device.ip, device.portMS, tcpTimeoutMs),
    probeTcpPort(device.ip, device.portVNC, tcpTimeoutMs),
  ]);

  const latencyCandidates = [msProbe.latencyMs, vncProbe.latencyMs].filter(
    (v): v is number => v !== null,
  );
  const latencyMs = latencyCandidates.length > 0 ? Math.min(...latencyCandidates) : null;

  let keepAliveOk = 0;
  let keepAliveCode: number | null = null;
  let keepAliveSentOnce = false;

  const portResults: { label: string; port: number; open: boolean; latency: number | null }[] = [
    {
      label: '원격데스크톱포트',
      port: device.portMS,
      open: msProbe.open,
      latency: msProbe.latencyMs,
    },
    {
      label: '원격제어포트',
      port: device.portVNC,
      open: vncProbe.open,
      latency: vncProbe.latencyMs,
    },
  ];

  for (const item of portResults) {
    if (item.open) {
      logger?.logDevice(
        '정보',
        `[포트연결 성공] 장비: ${device.deviceId}${nameTag} | 접속대상: ${device.ip}:${item.port} (${item.label}) | 응답지연: ${item.latency ?? 0}ms`,
      );

      const shouldSend =
        config.keepAlive.enabled &&
        (config.keepAlive.sendMode === 'per_open_port' || !keepAliveSentOnce);

      if (shouldSend) {
        keepAliveSentOnce = true;
        const payload = { REGLTEQPMN_ID: device.deviceId };

        const kaRes = await sendKeepAliveRequest(
          config.keepAlive.url,
          device.deviceId,
          keepAliveTimeoutMs,
        );
        keepAliveCode = kaRes.statusCode;

        if (kaRes.ok) {
          keepAliveOk = 1;
          logger?.logDevice(
            '정보',
            `[생존신호 성공] 장비: ${device.deviceId}${nameTag} | 전송주소: ${config.keepAlive.url} | 전송데이터: ${JSON.stringify(payload)} | 응답코드: ${kaRes.statusCode} (센터 수신 정상)`,
          );
        } else {
          logger?.logDevice(
            '주의',
            `[생존신호 실패] 장비: ${device.deviceId}${nameTag} | 전송주소: ${config.keepAlive.url} | 전송데이터: ${JSON.stringify(payload)} | 응답코드: ${kaRes.statusCode ?? '서버응답없음(시간초과)'}`,
          );
        }
      }
    } else {
      logger?.logDevice(
        '주의',
        `[포트연결 실패] 장비: ${device.deviceId}${nameTag} | 접속대상: ${device.ip}:${item.port} (${item.label}) | 사유: 제한시간(${config.checker.tcpTimeoutSec}초) 내 응답 없음`,
      );
    }
  }

  const openPortCount = (msProbe.open ? 1 : 0) + (vncProbe.open ? 1 : 0);
  const status = openPortCount > 0 ? 'Up' : 'Down';
  const checkTime = formatNowDateTime(new Date());

  logger?.logDevice(
    status === 'Up' ? '정보' : '주의',
    `[장비점검 종합] 장비: ${device.deviceId}${nameTag} (${device.ip}) | 최종상태: ${status === 'Up' ? '정상 가동(Up)' : '연결 끊김(Down)'} | 핑응답: ${pingResult ? '정상' : '응답없음'} | 원격데스크톱포트(${device.portMS}): ${msProbe.open ? '열림' : '닫힘'} | 원격제어포트(${device.portVNC}): ${vncProbe.open ? '열림' : '닫힘'} | 최소지연: ${latencyMs !== null ? `${latencyMs}ms` : '-'} | 생존신호: ${keepAliveOk ? '전송성공' : '미전송/실패'} | 점검시각: ${checkTime}`,
  );

  return {
    deviceId: device.deviceId,
    deviceName: device.deviceName,
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
