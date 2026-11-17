import net from 'node:net';
import http from 'node:http';
import { describe, it, expect } from 'vitest';
import { parseDataCsvBuffer, serializeDevicesToCsvBuffer } from '../src/main/checker/csv-sync';
import { checkSingleDevice, probeTcpPort } from '../src/main/checker/network-probes';
import type { SystemCheckAppConfig } from '../src/shared/types/domain';

describe('CP949 data.csv 파싱 및 직렬화 동등성 검증', () => {
  it('DeviceId,Ip,PortMS,PortVNC,CheckTime,Status 포맷을 CP949로 직렬화하고 역파싱한다', () => {
    const sample = [
      {
        deviceId: 'B0041',
        deviceName: '',
        ip: '50.11.30.100',
        portMS: 3389,
        portVNC: 5900,
        checkTime: '2026-11-17 15:30:00',
        status: 'Up' as const,
      },
      {
        deviceId: 'F0218',
        deviceName: '',
        ip: '50.10.137.100',
        portMS: 3389,
        portVNC: 5900,
        checkTime: '2026-11-17 15:30:05',
        status: 'Down' as const,
      },
    ];

    const buf = serializeDevicesToCsvBuffer(sample);
    const parsed = parseDataCsvBuffer(buf);

    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual(sample[0]);
    expect(parsed[1]).toEqual(sample[1]);
  });
});

describe('네트워크 포트 점검 및 센터 생존신호(KeepAlive) 전송 검증', () => {
  it('열린 TCP 포트 감지 및 KeepAlive JSON POST 요청을 정확히 수행한다', async () => {
    // 1. 임시 TCP 서버 생성
    const tcpServer = net.createServer((socket) => {
      socket.end();
    });
    await new Promise<void>((resolve) => tcpServer.listen(0, '127.0.0.1', resolve));
    const openPort = (tcpServer.address() as net.AddressInfo).port;

    // 2. 임시 KeepAlive HTTP 서버 생성
    const receivedBodies: { REGLTEQPMN_ID?: string }[] = [];
    const httpServer = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        receivedBodies.push(JSON.parse(body));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      });
    });
    await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
    const httpPort = (httpServer.address() as net.AddressInfo).port;

    try {
      const probeRes = await probeTcpPort('127.0.0.1', openPort, 1000);
      expect(probeRes.open).toBe(true);

      const testConfig: SystemCheckAppConfig = {
        paths: { checkDir: './check', logDir: './log', vncViewerPath: '' },
        checker: {
          intervalSec: 100,
          concurrency: 5,
          tcpTimeoutSec: 1,
          autoStartOnLaunch: false,
        },
        keepAlive: {
          enabled: true,
          url: `http://127.0.0.1:${httpPort}/api/v2/KeepAlive`,
          timeoutSec: 2,
          sendMode: 'once_per_device',
        },
        retention: { logDays: 30, dbHistoryDays: 30 },
        system: { minimizeToTrayOnClose: true },
      };

      const result = await checkSingleDevice(
        {
          deviceId: 'B0041',
          ip: '127.0.0.1',
          portMS: openPort,
          portVNC: 65431, // 닫힌 포트
        },
        testConfig,
        undefined,
        true,
      );

      expect(result.status).toBe('Up');
      expect(result.msPortOpen).toBe(1);
      expect(result.vncPortOpen).toBe(0);
      expect(result.keepAliveOk).toBe(1);
      expect(result.keepAliveCode).toBe(200);
      expect(receivedBodies).toEqual([{ REGLTEQPMN_ID: 'B0041' }]);
    } finally {
      tcpServer.close();
      httpServer.close();
    }
  });
});
