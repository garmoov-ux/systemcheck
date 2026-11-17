import { describe, it, expect } from 'vitest';
import { createDatabaseConnection } from '../src/main/db/connection';
import { DeviceRepository } from '../src/main/db/device-repo';

describe('SQLite DeviceRepository 단위 테스트', () => {
  it('장비 등록/수정/삭제 및 점검 이력 기록·조회가 정상 동작한다', () => {
    const db = createDatabaseConnection(':memory:');
    const repo = new DeviceRepository(db);

    repo.upsertDevice({
      deviceId: 'B0041',
      ip: '50.11.30.100',
      portMS: 3389,
      portVNC: 5900,
    });

    const list = repo.listAllDevices();
    expect(list).toHaveLength(1);
    expect(list[0].deviceId).toBe('B0041');
    expect(list[0].status).toBe('Down');

    const updated = repo.recordDeviceCheckResult({
      deviceId: 'B0041',
      ip: '50.11.30.100',
      portMS: 3389,
      portVNC: 5900,
      checkTime: '2026-11-17 15:40:00',
      status: 'Up',
      pingOk: 1,
      msPortOpen: 1,
      vncPortOpen: 1,
      latencyMs: 12,
      keepAliveOk: 1,
      keepAliveCode: 200,
    });

    expect(updated.status).toBe('Up');
    expect(updated.keepAliveOk).toBe(1);

    const history = repo.queryHistory({ status: 'Up', keepAlive: 'OK' });
    expect(history.totalCount).toBe(1);
    expect(history.items[0].deviceId).toBe('B0041');
    expect(history.items[0].latencyMs).toBe(12);

    const deleted = repo.deleteDevice('B0041');
    expect(deleted).toBe(true);
    expect(repo.listAllDevices()).toHaveLength(0);

    db.close();
  });
});
