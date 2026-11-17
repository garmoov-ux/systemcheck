import fs from 'node:fs';
import path from 'node:path';
import type Database from 'better-sqlite3';
import { resolveAppPath } from '../config/app-paths';
import { lookupFieldDeviceName } from '../checker/default-devices';
import type {
  DailyCheckStatItem,
  DeviceCheckStatItem,
  MonthlyCheckStatsReport,
  StorageFolderItem,
  SystemCheckAppConfig,
} from '@shared/types/domain';

function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthlyCheckStatsReport(
  db: Database.Database,
  requestedYearMonth?: string,
): MonthlyCheckStatsReport {
  const currentYm = getCurrentYearMonth();

  const devicesRows = db
    .prepare<
      [],
      {
        device_id: string;
        device_name: string;
        ip: string;
        status: string;
        ping_ok: number;
        ms_port_open: number;
        vnc_port_open: number;
        latency_ms: number | null;
        keep_alive_ok: number;
        check_time: string;
      }
    >(`SELECT * FROM devices ORDER BY device_id ASC`)
    .all();

  const monthRows = db
    .prepare<[], { ym: string }>(
      `SELECT DISTINCT substr(checked_at, 1, 7) AS ym
       FROM check_history
       WHERE checked_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]*'
       ORDER BY ym DESC`,
    )
    .all();

  const dataMonths = monthRows.map((r) => r.ym).filter(Boolean);
  for (const d of devicesRows) {
    if (/^\d{4}-\d{2}/.test(d.check_time)) {
      const ym = d.check_time.slice(0, 7);
      if (!dataMonths.includes(ym)) dataMonths.push(ym);
    }
  }
  dataMonths.sort((a, b) => b.localeCompare(a));

  const yearMonth =
    requestedYearMonth && /^\d{4}-\d{2}$/.test(requestedYearMonth)
      ? requestedYearMonth
      : dataMonths[0] || currentYm;

  const availableSet = new Set<string>([currentYm, yearMonth, ...dataMonths]);
  const availableMonths = Array.from(availableSet).sort((a, b) => b.localeCompare(a));

  const historyRows = db
    .prepare<
      [string],
      {
        device_id: string;
        device_name: string;
        ip: string;
        status: string;
        ping_ok: number;
        ms_port_open: number;
        vnc_port_open: number;
        latency_ms: number | null;
        keep_alive_ok: number;
        checked_at: string;
      }
    >(
      `SELECT device_id, device_name, ip, status, ping_ok, ms_port_open, vnc_port_open, latency_ms, keep_alive_ok, checked_at
       FROM check_history
       WHERE substr(checked_at, 1, 7) = ?
       ORDER BY checked_at ASC`,
    )
    .all(yearMonth);

  // 점검 이력이 아직 없고 devices 테이블에만 해당 월 데이터가 있는 경우 초기 스냅샷 반영
  const effectiveRows =
    historyRows.length > 0
      ? historyRows
      : devicesRows
          .filter((d) => d.check_time.slice(0, 7) === yearMonth)
          .map((d) => ({
            device_id: d.device_id,
            device_name: d.device_name,
            ip: d.ip,
            status: d.status,
            ping_ok: d.ping_ok,
            ms_port_open: d.ms_port_open,
            vnc_port_open: d.vnc_port_open,
            latency_ms: d.latency_ms,
            keep_alive_ok: d.keep_alive_ok,
            checked_at: d.check_time,
          }));

  const totalDevices = devicesRows.length;
  const currentUpDevices = devicesRows.filter((d) => d.status === 'Up').length;
  const currentDownDevices = totalDevices - currentUpDevices;

  let upCount = 0;
  let downCount = 0;
  let pingOkCount = 0;
  let msOpenCount = 0;
  let vncOpenCount = 0;
  let keepAliveOkCount = 0;
  const latencies: number[] = [];

  const dailyMap = new Map<
    string,
    { total: number; up: number; down: number; kaOk: number; latencies: number[] }
  >();

  const deviceStatMap = new Map<
    string,
    {
      deviceName: string;
      ip: string;
      currentStatus: 'Up' | 'Down';
      total: number;
      up: number;
      down: number;
      kaOk: number;
      latencies: number[];
    }
  >();

  for (const dev of devicesRows) {
    deviceStatMap.set(dev.device_id, {
      deviceName: dev.device_name || lookupFieldDeviceName(dev.device_id),
      ip: dev.ip,
      currentStatus: dev.status === 'Up' ? 'Up' : 'Down',
      total: 0,
      up: 0,
      down: 0,
      kaOk: 0,
      latencies: [],
    });
  }

  for (const r of effectiveRows) {
    const isUp = r.status === 'Up';
    if (isUp) upCount++;
    else downCount++;
    if (r.ping_ok) pingOkCount++;
    if (r.ms_port_open) msOpenCount++;
    if (r.vnc_port_open) vncOpenCount++;
    if (r.keep_alive_ok) keepAliveOkCount++;
    if (r.latency_ms !== null && r.latency_ms >= 0) latencies.push(r.latency_ms);

    const day = r.checked_at.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      const dStat = dailyMap.get(day) || { total: 0, up: 0, down: 0, kaOk: 0, latencies: [] };
      dStat.total++;
      if (isUp) dStat.up++;
      else dStat.down++;
      if (r.keep_alive_ok) dStat.kaOk++;
      if (r.latency_ms !== null && r.latency_ms >= 0) dStat.latencies.push(r.latency_ms);
      dailyMap.set(day, dStat);
    }

    const devEntry = deviceStatMap.get(r.device_id) || {
      deviceName: r.device_name || lookupFieldDeviceName(r.device_id),
      ip: r.ip,
      currentStatus: isUp ? 'Up' : 'Down',
      total: 0,
      up: 0,
      down: 0,
      kaOk: 0,
      latencies: [],
    };
    devEntry.total++;
    if (isUp) devEntry.up++;
    else devEntry.down++;
    if (r.keep_alive_ok) devEntry.kaOk++;
    if (r.latency_ms !== null && r.latency_ms >= 0) devEntry.latencies.push(r.latency_ms);
    deviceStatMap.set(r.device_id, devEntry);
  }

  const totalChecks = effectiveRows.length;
  const uptimeRate = totalChecks > 0 ? Number(((upCount / totalChecks) * 100).toFixed(1)) : 0;
  const avgLatencyMs =
    latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0;

  const dailyStats: DailyCheckStatItem[] = Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, v]) => ({
      day,
      label: `${day.slice(8, 10)}일`,
      totalChecks: v.total,
      upCount: v.up,
      downCount: v.down,
      keepAliveOkCount: v.kaOk,
      uptimeRate: v.total > 0 ? Number(((v.up / v.total) * 100).toFixed(1)) : 0,
      avgLatencyMs:
        v.latencies.length > 0
          ? Math.round(v.latencies.reduce((a, b) => a + b, 0) / v.latencies.length)
          : 0,
    }));

  const deviceStats: DeviceCheckStatItem[] = Array.from(deviceStatMap.entries())
    .filter(([, v]) => v.total > 0)
    .map(([deviceId, v]) => ({
      deviceId,
      deviceName: v.deviceName,
      ip: v.ip,
      currentStatus: v.currentStatus,
      totalChecks: v.total,
      upCount: v.up,
      downCount: v.down,
      keepAliveOkCount: v.kaOk,
      uptimeRate: v.total > 0 ? Number(((v.up / v.total) * 100).toFixed(1)) : 0,
      avgLatencyMs:
        v.latencies.length > 0
          ? Math.round(v.latencies.reduce((a, b) => a + b, 0) / v.latencies.length)
          : 0,
    }))
    .sort((a, b) => b.uptimeRate - a.uptimeRate || a.deviceId.localeCompare(b.deviceId));

  return {
    yearMonth,
    availableMonths,
    totalDevices,
    currentUpDevices,
    currentDownDevices,
    totalChecks,
    upCount,
    downCount,
    pingOkCount,
    msOpenCount,
    vncOpenCount,
    keepAliveOkCount,
    uptimeRate,
    avgLatencyMs,
    dailyStats,
    deviceStats,
  };
}

function measureDirectory(dirPath: string): { fileCount: number; totalBytes: number } {
  if (!fs.existsSync(dirPath)) return { fileCount: 0, totalBytes: 0 };
  let fileCount = 0;
  let totalBytes = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      if (entry.isFile()) {
        fileCount++;
        totalBytes += fs.statSync(full).size;
      } else if (entry.isDirectory()) {
        const sub = measureDirectory(full);
        fileCount += sub.fileCount;
        totalBytes += sub.totalBytes;
      }
    }
  } catch {
    // 읽기 권한 오류 무시
  }
  return { fileCount, totalBytes };
}

export function getStorageFoldersInfo(config: SystemCheckAppConfig): StorageFolderItem[] {
  const candidates: { key: string; label: string; rel: string; desc: string }[] = [
    {
      key: 'data',
      label: '내장 데이터베이스 폴더',
      rel: './data',
      desc: '단속장비 마스터 목록 및 상태 점검·생존신호 이력 SQLite DB(app.db) 보관',
    },
    {
      key: 'log',
      label: '운용 로그 폴더',
      rel: config.paths.logDir || './log',
      desc: '일자별 시스템 점검(system_check) 및 장비 상세(device_check) 로그 파일 보관',
    },
    {
      key: 'check',
      label: '장비 목록 CSV 폴더',
      rel: './check',
      desc: '현장 장비 목록 호환 CSV(data.csv) 보관 폴더',
    },
  ];

  return candidates.map((c) => {
    const resolvedPath = resolveAppPath(c.rel);
    const { fileCount, totalBytes } = measureDirectory(resolvedPath);
    return {
      key: c.key,
      label: c.label,
      relativePath: c.rel,
      resolvedPath,
      fileCount,
      totalBytes,
      description: c.desc,
    };
  });
}
