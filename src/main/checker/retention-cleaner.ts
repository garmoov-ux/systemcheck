import fs from 'node:fs';
import path from 'node:path';
import { resolveAppPath } from '../config/app-paths';
import type { DeviceRepository } from '../db/device-repo';
import type { SystemCheckAppConfig } from '@shared/types/domain';

export interface CleanupSummary {
  deletedLogFiles: number;
  deletedDbRows: number;
}

export class RetentionCleanerService {
  private config: SystemCheckAppConfig;
  private readonly repo: DeviceRepository;
  private timer: NodeJS.Timeout | null = null;

  constructor(config: SystemCheckAppConfig, repo: DeviceRepository) {
    this.config = config;
    this.repo = repo;
  }

  public updateConfig(nextConfig: SystemCheckAppConfig): void {
    this.config = nextConfig;
  }

  public startPeriodicCleanup(): void {
    this.stopPeriodicCleanup();
    this.runCleanupNow();
    // 1시간마다 자동 정리 실행
    this.timer = setInterval(
      () => {
        this.runCleanupNow();
      },
      60 * 60 * 1000,
    );
  }

  public stopPeriodicCleanup(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public runCleanupNow(): CleanupSummary {
    const deletedLogFiles = this.cleanDirectoryByAge(
      this.config.paths.logDir,
      this.config.retention.logDays,
      '.log',
    );
    const deletedDbRows = this.repo.deleteOldHistory(this.config.retention.dbHistoryDays);

    return {
      deletedLogFiles,
      deletedDbRows,
    };
  }

  private cleanDirectoryByAge(dirPath: string, retentionDays: number, extFilter?: string): number {
    if (retentionDays <= 0) return 0;
    const resolved = resolveAppPath(dirPath);
    if (!fs.existsSync(resolved)) return 0;

    let deletedCount = 0;
    const cutoffMs = Date.now() - retentionDays * 86400 * 1000;

    try {
      const entries = fs.readdirSync(resolved, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        if (extFilter && !entry.name.toLowerCase().endsWith(extFilter)) continue;

        const fullPath = path.join(resolved, entry.name);
        const stat = fs.statSync(fullPath);
        if (stat.mtimeMs < cutoffMs) {
          fs.unlinkSync(fullPath);
          deletedCount++;
        }
      }
    } catch {
      // 파일 잠금 등 예외 무시
    }

    return deletedCount;
  }
}
