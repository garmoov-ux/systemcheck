import { ensureDataCsvExists, readDataCsvFile, writeDataCsvFile, getDataCsvPath } from './csv-sync';
import { checkSingleDevice } from './network-probes';
import { FileLogger, formatNowDateTime } from './file-logger';
import type { DeviceRepository } from '../db/device-repo';
import type { CheckerSummary, DeviceRecord, SystemCheckAppConfig } from '@shared/types/domain';

type SummaryListener = (summary: CheckerSummary) => void;
type DeviceListener = (device: DeviceRecord) => void;

export class CheckSchedulerService {
  private config: SystemCheckAppConfig;
  private readonly repo: DeviceRepository;
  private readonly logger: FileLogger;

  private isSchedulerRunning = false;
  private isCheckingNow = false;
  private checkedProgress = 0;
  private lastCycleStartedAt: string | null = null;
  private lastCycleCompletedAt: string | null = null;
  private lastCycleDurationMs: number | null = null;
  private nextCheckAt: string | null = null;
  private timer: NodeJS.Timeout | null = null;

  private readonly summaryListeners = new Set<SummaryListener>();
  private readonly deviceListeners = new Set<DeviceListener>();

  constructor(config: SystemCheckAppConfig, repo: DeviceRepository) {
    this.config = config;
    this.repo = repo;
    this.logger = new FileLogger(config.paths.logDir);
    this.initializeDevicesFromCsv();
  }

  public initializeDevicesFromCsv(replaceAll = false): DeviceRecord[] {
    const csvPath = ensureDataCsvExists(this.config.paths.checkDir);
    const rows = readDataCsvFile(csvPath);
    if (rows.length > 0) {
      this.repo.syncDevicesFromCsvRows(rows, replaceAll);
    }
    const devices = this.repo.listAllDevices();
    this.emitSummary();
    return devices;
  }

  public syncDbToCsv(): void {
    const csvPath = getDataCsvPath(this.config.paths.checkDir);
    const devices = this.repo.listAllDevices();
    writeDataCsvFile(csvPath, devices);
  }

  public updateConfig(nextConfig: SystemCheckAppConfig): void {
    const wasRunning = this.isSchedulerRunning;
    this.config = nextConfig;
    this.logger.setLogDir(nextConfig.paths.logDir);
    if (wasRunning) {
      this.scheduleNextTimer();
    }
    this.emitSummary();
  }

  public start(): void {
    if (this.isSchedulerRunning) return;
    this.isSchedulerRunning = true;
    this.logger.logSystem('INFO', '[장비 상태 체크 시작]');
    this.emitSummary();
    void this.runAllCycle();
  }

  public stop(): void {
    this.isSchedulerRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.nextCheckAt = null;
    this.logger.logSystem('INFO', '[장비 상태 체크 일시정지]');
    this.emitSummary();
  }

  public async runAllNow(): Promise<void> {
    await this.runAllCycle();
  }

  public async runSingleDevice(deviceId: string): Promise<DeviceRecord | null> {
    const target = this.repo.getDeviceById(deviceId);
    if (!target) return null;

    const payload = await checkSingleDevice(target, this.config, this.logger);
    const updated = this.repo.recordDeviceCheckResult(payload);
    this.syncDbToCsv();
    this.emitDeviceUpdated(updated);
    this.emitSummary();
    return updated;
  }

  public getSummary(): CheckerSummary {
    const devices = this.repo.listAllDevices();
    let upDevices = 0;
    let downDevices = 0;
    let pingOkCount = 0;
    let msOpenCount = 0;
    let vncOpenCount = 0;
    let keepAliveSuccessCount = 0;

    for (const d of devices) {
      if (d.status === 'Up') upDevices++;
      else downDevices++;
      if (d.pingOk) pingOkCount++;
      if (d.msPortOpen) msOpenCount++;
      if (d.vncPortOpen) vncOpenCount++;
      if (d.keepAliveOk) keepAliveSuccessCount++;
    }

    return {
      isSchedulerRunning: this.isSchedulerRunning,
      isCheckingNow: this.isCheckingNow,
      totalDevices: devices.length,
      upDevices,
      downDevices,
      pingOkCount,
      msOpenCount,
      vncOpenCount,
      keepAliveSuccessCount,
      checkedProgress: this.checkedProgress,
      lastCycleStartedAt: this.lastCycleStartedAt,
      lastCycleCompletedAt: this.lastCycleCompletedAt,
      lastCycleDurationMs: this.lastCycleDurationMs,
      nextCheckAt: this.nextCheckAt,
      intervalSec: this.config.checker.intervalSec,
    };
  }

  public onSummaryChange(listener: SummaryListener): () => void {
    this.summaryListeners.add(listener);
    return () => this.summaryListeners.delete(listener);
  }

  public onDeviceUpdated(listener: DeviceListener): () => void {
    this.deviceListeners.add(listener);
    return () => this.deviceListeners.delete(listener);
  }

  private async runAllCycle(): Promise<void> {
    if (this.isCheckingNow) return;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const devices = this.repo.listAllDevices();
    if (devices.length === 0) {
      this.scheduleNextTimer();
      return;
    }

    this.isCheckingNow = true;
    this.checkedProgress = 0;
    const cycleStartMs = Date.now();
    this.lastCycleStartedAt = formatNowDateTime(new Date(cycleStartMs));
    this.nextCheckAt = null;
    this.emitSummary();

    const concurrency = Math.max(1, Math.min(50, this.config.checker.concurrency));
    let cursor = 0;

    const worker = async () => {
      while (cursor < devices.length) {
        const index = cursor++;
        const device = devices[index];
        if (!device) break;

        const payload = await checkSingleDevice(device, this.config, this.logger);
        const updated = this.repo.recordDeviceCheckResult(payload);
        this.checkedProgress++;
        this.emitDeviceUpdated(updated);
        this.emitSummary();
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, devices.length) }, () => worker());
    await Promise.all(workers);

    this.syncDbToCsv();

    const cycleEndMs = Date.now();
    this.lastCycleCompletedAt = formatNowDateTime(new Date(cycleEndMs));
    this.lastCycleDurationMs = cycleEndMs - cycleStartMs;
    this.isCheckingNow = false;

    if (this.isSchedulerRunning) {
      this.scheduleNextTimer();
    }
    this.emitSummary();
  }

  private scheduleNextTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (!this.isSchedulerRunning) return;

    const waitMs = Math.max(5, this.config.checker.intervalSec) * 1000;
    this.nextCheckAt = formatNowDateTime(new Date(Date.now() + waitMs));
    this.timer = setTimeout(() => {
      void this.runAllCycle();
    }, waitMs);
  }

  private emitSummary(): void {
    const summary = this.getSummary();
    for (const listener of this.summaryListeners) {
      listener(summary);
    }
  }

  private emitDeviceUpdated(device: DeviceRecord): void {
    for (const listener of this.deviceListeners) {
      listener(device);
    }
  }
}
