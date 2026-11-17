import { ensureDataCsvExists, readDataCsvFile, writeDataCsvFile, getDataCsvPath } from './csv-sync';
import { checkSingleDevice } from './network-probes';
import { FileLogger, formatNowDateTime } from './file-logger';
import { resolveAppPath } from '../config/app-paths';
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
  private completedCycles = 0;
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
    this.initializeDevicesOnStartup();
  }

  public getLogger(): FileLogger {
    return this.logger;
  }

  private initializeDevicesOnStartup(): void {
    const csvPath = ensureDataCsvExists(this.config.paths.checkDir);
    const existingInDb = this.repo.listAllDevices();
    if (existingInDb.length === 0) {
      const rows = readDataCsvFile(csvPath);
      if (rows.length > 0) {
        this.repo.syncDevicesFromCsvRows(rows, false);
      }
    }
    const devices = this.repo.listAllDevices();
    this.logger.logSystem(
      '정보',
      `내장 데이터베이스(SQLite) 장비 목록 로드 완료 | 등록 장비 수: ${devices.length}대`,
    );
    this.emitSummary();
  }

  public initializeDevicesFromCsv(replaceAll = false): DeviceRecord[] {
    const csvPath = ensureDataCsvExists(this.config.paths.checkDir);
    const rows = readDataCsvFile(csvPath);
    if (rows.length > 0) {
      this.repo.syncDevicesFromCsvRows(rows, replaceAll);
    }
    const devices = this.repo.listAllDevices();
    this.logger.logSystem(
      '정보',
      `기본 장비 목록 파일(data.csv)에서 장비 동기화 완료 | 등록 장비 수: ${devices.length}대 | 파일 경로: ${csvPath}`,
    );
    this.emitSummary();
    return devices;
  }

  public syncDbToCsv(): void {
    const csvPath = getDataCsvPath(this.config.paths.checkDir);
    const devices = this.repo.listAllDevices();
    writeDataCsvFile(csvPath, devices, false);
  }

  public updateConfig(nextConfig: SystemCheckAppConfig): void {
    const wasRunning = this.isSchedulerRunning;
    this.config = nextConfig;
    this.logger.setLogDir(nextConfig.paths.logDir);
    this.logger.logSystem(
      '정보',
      `환경설정이 변경되어 적용되었습니다. | 점검주기: ${nextConfig.checker.intervalSec}초 | 동시점검: ${nextConfig.checker.concurrency}대 | 포트제한시간: ${nextConfig.checker.tcpTimeoutSec}초 | 장비목록폴더: ${resolveAppPath(nextConfig.paths.checkDir)} (설정값: ${nextConfig.paths.checkDir}) | 로그폴더: ${resolveAppPath(nextConfig.paths.logDir)} (설정값: ${nextConfig.paths.logDir}) | 생존신호 전송: ${nextConfig.keepAlive.enabled ? `사용함(${nextConfig.keepAlive.url})` : '사용 안 함'}`,
    );
    if (wasRunning) {
      this.scheduleNextTimer();
    }
    this.emitSummary();
  }

  public start(): void {
    if (this.isSchedulerRunning) return;
    this.isSchedulerRunning = true;
    this.logger.logSystem(
      '정보',
      `단속장비 자동 주기 점검 스케줄러가 가동되었습니다. (점검 주기: ${this.config.checker.intervalSec}초, 동시 병렬 점검: ${this.config.checker.concurrency}대)`,
    );
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
    this.logger.logSystem('주의', '단속장비 자동 주기 점검 스케줄러가 일시정지되었습니다.');
    this.emitSummary();
  }

  public async runAllNow(): Promise<void> {
    await this.runAllCycle();
  }

  public async runSingleDevice(deviceId: string): Promise<DeviceRecord | null> {
    const target = this.repo.getDeviceById(deviceId);
    if (!target) return null;

    this.logger.logSystem(
      '정보',
      `개별 장비 수동 즉시 점검 실행 | 장비번호: ${target.deviceId} ${target.deviceName ? `(${target.deviceName})` : ''} | IP: ${target.ip}`,
    );
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
      completedCycles: this.completedCycles,
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
    this.logger.logSystem(
      '정보',
      `전체 단속장비 일괄 상태 점검을 시작합니다. | 대상 장비: 총 ${devices.length}대 | 동시 병렬 처리: ${concurrency}대 | 포트 응답 제한시간: ${this.config.checker.tcpTimeoutSec}초`,
    );

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
    this.completedCycles++;
    this.isCheckingNow = false;

    if (this.isSchedulerRunning) {
      this.scheduleNextTimer();
    }

    const finalSummary = this.getSummary();
    this.logger.logSystem(
      '정보',
      `전체 단속장비 일괄 상태 점검 완료 (${this.completedCycles}회차) | 총 ${finalSummary.totalDevices}대 중 정상 가동(Up): ${finalSummary.upDevices}대, 연결 끊김(Down): ${finalSummary.downDevices}대 | 핑 응답: ${finalSummary.pingOkCount}대 | 원격데스크톱포트 열림: ${finalSummary.msOpenCount}대 | 원격제어포트 열림: ${finalSummary.vncOpenCount}대 | 센터 생존신호 성공: ${finalSummary.keepAliveSuccessCount}대 | 총 소요시간: ${(this.lastCycleDurationMs / 1000).toFixed(1)}초 | 다음 점검 예정: ${this.nextCheckAt ?? '없음(일시정지)'}`,
    );

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
