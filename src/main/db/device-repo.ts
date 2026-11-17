import type Database from 'better-sqlite3';
import { lookupFieldDeviceName } from '../checker/default-devices';
import type {
  CheckHistoryRecord,
  DeviceRecord,
  DeviceStatus,
  DeviceUpsertInput,
  HistoryQueryFilter,
  HistoryQueryResult,
} from '@shared/types/domain';

interface RawDeviceRow {
  device_id: string;
  device_name: string;
  ip: string;
  port_ms: number;
  port_vnc: number;
  check_time: string;
  status: string;
  ping_ok: number;
  ms_port_open: number;
  vnc_port_open: number;
  latency_ms: number | null;
  keep_alive_ok: number;
  keep_alive_code: number | null;
  updated_at: string;
}

interface RawHistoryRow {
  id: number;
  device_id: string;
  device_name: string;
  ip: string;
  port_ms: number;
  port_vnc: number;
  ping_ok: number;
  ms_port_open: number;
  vnc_port_open: number;
  status: string;
  latency_ms: number | null;
  keep_alive_ok: number;
  keep_alive_code: number | null;
  checked_at: string;
}

export interface DeviceCheckUpdatePayload {
  deviceId: string;
  deviceName?: string;
  ip: string;
  portMS: number;
  portVNC: number;
  checkTime: string;
  status: DeviceStatus;
  pingOk: number;
  msPortOpen: number;
  vncPortOpen: number;
  latencyMs: number | null;
  keepAliveOk: number;
  keepAliveCode: number | null;
}

function mapDeviceRow(row: RawDeviceRow): DeviceRecord {
  return {
    deviceId: row.device_id,
    deviceName: row.device_name ?? '',
    ip: row.ip,
    portMS: row.port_ms,
    portVNC: row.port_vnc,
    checkTime: row.check_time,
    status: row.status === 'Up' ? 'Up' : 'Down',
    pingOk: row.ping_ok,
    msPortOpen: row.ms_port_open,
    vncPortOpen: row.vnc_port_open,
    latencyMs: row.latency_ms,
    keepAliveOk: row.keep_alive_ok,
    keepAliveCode: row.keep_alive_code,
    updatedAt: row.updated_at,
  };
}

function mapHistoryRow(row: RawHistoryRow): CheckHistoryRecord {
  return {
    id: row.id,
    deviceId: row.device_id,
    deviceName: row.device_name ?? '',
    ip: row.ip,
    portMS: row.port_ms,
    portVNC: row.port_vnc,
    pingOk: row.ping_ok,
    msPortOpen: row.ms_port_open,
    vncPortOpen: row.vnc_port_open,
    status: row.status === 'Up' ? 'Up' : 'Down',
    latencyMs: row.latency_ms,
    keepAliveOk: row.keep_alive_ok,
    keepAliveCode: row.keep_alive_code,
    checkedAt: row.checked_at,
  };
}

export class DeviceRepository {
  private readonly db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public getDatabase(): Database.Database {
    return this.db;
  }

  public listAllDevices(): DeviceRecord[] {
    const stmt = this.db.prepare<[], RawDeviceRow>(
      `SELECT * FROM devices ORDER BY device_id ASC`,
    );
    return stmt.all().map(mapDeviceRow);
  }

  public getDeviceById(deviceId: string): DeviceRecord | null {
    const stmt = this.db.prepare<[string], RawDeviceRow>(
      `SELECT * FROM devices WHERE device_id = ?`,
    );
    const row = stmt.get(deviceId);
    return row ? mapDeviceRow(row) : null;
  }

  public upsertDevice(input: DeviceUpsertInput): DeviceRecord {
    const stmt = this.db.prepare(`
      INSERT INTO devices (device_id, device_name, ip, port_ms, port_vnc, updated_at)
      VALUES (@deviceId, @deviceName, @ip, @portMS, @portVNC, datetime('now', 'localtime'))
      ON CONFLICT(device_id) DO UPDATE SET
        device_name = excluded.device_name,
        ip = excluded.ip,
        port_ms = excluded.port_ms,
        port_vnc = excluded.port_vnc,
        updated_at = datetime('now', 'localtime')
    `);
    const cleanId = input.deviceId.trim().toUpperCase();
    const cleanName = (input.deviceName ?? '').trim() || lookupFieldDeviceName(cleanId);
    stmt.run({
      deviceId: cleanId,
      deviceName: cleanName,
      ip: input.ip.trim(),
      portMS: Number(input.portMS) || 3389,
      portVNC: Number(input.portVNC) || 5900,
    });
    return this.getDeviceById(cleanId)!;
  }

  public backfillEmptyDeviceNames(): number {
    const emptyRows = this.db
      .prepare<[], { device_id: string }>(`SELECT device_id FROM devices WHERE device_name = ''`)
      .all();
    if (emptyRows.length === 0) return 0;

    const updateDev = this.db.prepare(
      `UPDATE devices SET device_name = @name WHERE device_id = @id AND device_name = ''`,
    );
    const updateHist = this.db.prepare(
      `UPDATE check_history SET device_name = @name WHERE device_id = @id AND device_name = ''`,
    );
    let updatedCount = 0;
    const tx = this.db.transaction(() => {
      for (const r of emptyRows) {
        const name = lookupFieldDeviceName(r.device_id);
        if (name) {
          updateDev.run({ id: r.device_id, name });
          updateHist.run({ id: r.device_id, name });
          updatedCount++;
        }
      }
    });
    tx();
    return updatedCount;
  }

  public deleteDevice(deviceId: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM devices WHERE device_id = ?`);
    const info = stmt.run(deviceId);
    return info.changes > 0;
  }

  public syncDevicesFromCsvRows(
    rows: {
      deviceId: string;
      deviceName?: string;
      ip: string;
      portMS: number;
      portVNC: number;
      checkTime: string;
      status: DeviceStatus;
    }[],
    replaceAll = false,
  ): void {
    const upsertStmt = this.db.prepare(`
      INSERT INTO devices (
        device_id, device_name, ip, port_ms, port_vnc, check_time, status,
        ms_port_open, vnc_port_open, updated_at
      )
      VALUES (
        @deviceId, @deviceName, @ip, @portMS, @portVNC, @checkTime, @status,
        @msPortOpen, @vncPortOpen, datetime('now', 'localtime')
      )
      ON CONFLICT(device_id) DO UPDATE SET
        device_name = CASE WHEN excluded.device_name != '' THEN excluded.device_name ELSE devices.device_name END,
        ip = excluded.ip,
        port_ms = excluded.port_ms,
        port_vnc = excluded.port_vnc,
        check_time = CASE WHEN excluded.check_time != '' THEN excluded.check_time ELSE devices.check_time END,
        status = excluded.status,
        updated_at = datetime('now', 'localtime')
    `);

    const tx = this.db.transaction(() => {
      if (replaceAll) {
        this.db.prepare(`DELETE FROM devices`).run();
      }
      for (const r of rows) {
        const isUp = r.status === 'Up' ? 1 : 0;
        const cleanId = r.deviceId.trim().toUpperCase();
        upsertStmt.run({
          deviceId: cleanId,
          deviceName: (r.deviceName ?? '').trim() || lookupFieldDeviceName(cleanId),
          ip: r.ip,
          portMS: r.portMS,
          portVNC: r.portVNC,
          checkTime: r.checkTime,
          status: r.status,
          msPortOpen: isUp,
          vncPortOpen: isUp,
        });
      }
    });

    tx();
  }

  public recordDeviceCheckResult(payload: DeviceCheckUpdatePayload): DeviceRecord {
    const existing = this.getDeviceById(payload.deviceId);
    const resolvedName = payload.deviceName ?? existing?.deviceName ?? '';

    const updateDeviceStmt = this.db.prepare(`
      UPDATE devices SET
        check_time = @checkTime,
        status = @status,
        ping_ok = @pingOk,
        ms_port_open = @msPortOpen,
        vnc_port_open = @vncPortOpen,
        latency_ms = @latencyMs,
        keep_alive_ok = @keepAliveOk,
        keep_alive_code = @keepAliveCode,
        updated_at = datetime('now', 'localtime')
      WHERE device_id = @deviceId
    `);

    const insertHistoryStmt = this.db.prepare(`
      INSERT INTO check_history (
        device_id, device_name, ip, port_ms, port_vnc,
        ping_ok, ms_port_open, vnc_port_open, status,
        latency_ms, keep_alive_ok, keep_alive_code, checked_at
      ) VALUES (
        @deviceId, @deviceName, @ip, @portMS, @portVNC,
        @pingOk, @msPortOpen, @vncPortOpen, @status,
        @latencyMs, @keepAliveOk, @keepAliveCode, @checkTime
      )
    `);

    const tx = this.db.transaction(() => {
      updateDeviceStmt.run(payload);
      insertHistoryStmt.run({
        ...payload,
        deviceName: resolvedName,
      });
    });

    tx();
    return this.getDeviceById(payload.deviceId)!;
  }

  public queryHistory(filter: HistoryQueryFilter): HistoryQueryResult {
    const conditions: string[] = [];
    const params: Record<string, unknown> = {};

    if (filter.search && filter.search.trim()) {
      conditions.push(`(device_id LIKE @search OR device_name LIKE @search OR ip LIKE @search)`);
      params.search = `%${filter.search.trim()}%`;
    }
    if (filter.status && filter.status !== 'ALL') {
      conditions.push(`status = @status`);
      params.status = filter.status;
    }
    if (filter.keepAlive === 'OK') {
      conditions.push(`keep_alive_ok = 1`);
    } else if (filter.keepAlive === 'FAIL') {
      conditions.push(`keep_alive_ok = 0`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = Math.min(500, Math.max(1, filter.limit ?? 150));
    const offset = Math.max(0, filter.offset ?? 0);

    const countStmt = this.db.prepare<Record<string, unknown>, { cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM check_history ${whereClause}`,
    );
    const totalCount = countStmt.get(params)?.cnt ?? 0;

    const listStmt = this.db.prepare<Record<string, unknown>, RawHistoryRow>(
      `SELECT * FROM check_history ${whereClause} ORDER BY id DESC LIMIT @limit OFFSET @offset`,
    );
    const items = listStmt.all({ ...params, limit, offset }).map(mapHistoryRow);

    return { items, totalCount };
  }

  public deleteOldHistory(days: number): number {
    if (days <= 0) return 0;
    const cutoffDate = new Date(Date.now() - days * 86400 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const cutoffStr = `${cutoffDate.getFullYear()}-${pad(cutoffDate.getMonth() + 1)}-${pad(cutoffDate.getDate())} 00:00:00`;

    const stmt = this.db.prepare(`DELETE FROM check_history WHERE checked_at < ?`);
    return stmt.run(cutoffStr).changes;
  }
}
