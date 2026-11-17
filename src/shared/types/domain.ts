export type DeviceStatus = 'Up' | 'Down';

export type KeepAliveSendMode = 'once_per_device' | 'per_open_port';

export interface SystemCheckPathsConfig {
  checkDir: string;
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
  ip: string;
  portMS: number;
  portVNC: number;
}

export interface CheckHistoryRecord {
  id: number;
  deviceId: string;
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
  lastCycleStartedAt: string | null;
  lastCycleCompletedAt: string | null;
  lastCycleDurationMs: number | null;
  nextCheckAt: string | null;
  intervalSec: number;
}

export interface IpcResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
