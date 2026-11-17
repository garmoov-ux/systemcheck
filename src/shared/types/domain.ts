export type DeviceStatus = 'Up' | 'Down';

export type KeepAliveSendMode = 'once_per_device' | 'per_open_port';

export interface SystemCheckPathsConfig {
  logDir: string;
  vncViewerPath: string;
}

export interface SystemCheckCheckerConfig {
  intervalSec: number;
  concurrency: number;
  tcpTimeoutSec: number;
  autoStartOnLaunch: boolean;
}

export interface SystemCheckKeepAliveConfig {
  enabled: boolean;
  url: string;
  timeoutSec: number;
  sendMode: KeepAliveSendMode;
}

export interface SystemCheckRetentionConfig {
  logDays: number;
  dbHistoryDays: number;
}

export interface SystemCheckSystemConfig {
  minimizeToTrayOnClose: boolean;
}

export interface SystemCheckAppConfig {
  paths: SystemCheckPathsConfig;
  checker: SystemCheckCheckerConfig;
  keepAlive: SystemCheckKeepAliveConfig;
  retention: SystemCheckRetentionConfig;
  system: SystemCheckSystemConfig;
}

export interface DeviceRecord {
  deviceId: string;
  deviceName: string;
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
  updatedAt: string;
}

export interface DeviceUpsertInput {
  deviceId: string;
  deviceName?: string;
  ip: string;
  portMS: number;
  portVNC: number;
}

export interface CheckHistoryRecord {
  id: number;
  deviceId: string;
  deviceName: string;
  ip: string;
  portMS: number;
  portVNC: number;
  pingOk: number;
  msPortOpen: number;
  vncPortOpen: number;
  status: DeviceStatus;
  latencyMs: number | null;
  keepAliveOk: number;
  keepAliveCode: number | null;
  checkedAt: string;
}

export interface HistoryQueryFilter {
  search?: string;
  status?: 'ALL' | 'Up' | 'Down';
  keepAlive?: 'ALL' | 'OK' | 'FAIL';
  limit?: number;
  offset?: number;
}

export interface HistoryQueryResult {
  items: CheckHistoryRecord[];
  totalCount: number;
}

export interface CheckerSummary {
  isSchedulerRunning: boolean;
  isCheckingNow: boolean;
  totalDevices: number;
  upDevices: number;
  downDevices: number;
  pingOkCount: number;
  msOpenCount: number;
  vncOpenCount: number;
  keepAliveSuccessCount: number;
  checkedProgress: number;
  completedCycles: number;
  lastCycleStartedAt: string | null;
  lastCycleCompletedAt: string | null;
  lastCycleDurationMs: number | null;
  nextCheckAt: string | null;
  intervalSec: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  category: string;
  level: string;
  message: string;
  fileName: string;
}

export interface DailyCheckStatItem {
  day: string;
  label: string;
  totalChecks: number;
  upCount: number;
  downCount: number;
  keepAliveOkCount: number;
  uptimeRate: number;
  avgLatencyMs: number;
}

export interface DeviceCheckStatItem {
  deviceId: string;
  deviceName: string;
  ip: string;
  currentStatus: DeviceStatus;
  totalChecks: number;
  upCount: number;
  downCount: number;
  keepAliveOkCount: number;
  uptimeRate: number;
  avgLatencyMs: number;
}

export interface MonthlyCheckStatsReport {
  yearMonth: string;
  availableMonths: string[];
  totalDevices: number;
  currentUpDevices: number;
  currentDownDevices: number;
  totalChecks: number;
  upCount: number;
  downCount: number;
  pingOkCount: number;
  msOpenCount: number;
  vncOpenCount: number;
  keepAliveOkCount: number;
  uptimeRate: number;
  avgLatencyMs: number;
  dailyStats: DailyCheckStatItem[];
  deviceStats: DeviceCheckStatItem[];
}

export interface StorageFolderItem {
  key: string;
  label: string;
  relativePath: string;
  resolvedPath: string;
  fileCount: number;
  totalBytes: number;
  description: string;
}

export interface IpcResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
