import fs from 'node:fs';
import dotenv from 'dotenv';
import { resolveAppPath } from './app-paths';
import type { SystemCheckAppConfig, KeepAliveSendMode } from '@shared/types/domain';

dotenv.config({ path: resolveAppPath('.env') });

const DEFAULT_CONFIG: SystemCheckAppConfig = {
  paths: {
    checkDir: process.env.SYSTEMCHECK_CHECK_DIR ?? './check',
    logDir: process.env.SYSTEMCHECK_LOG_DIR ?? './log',
    vncViewerPath: '',
  },
  checker: {
    intervalSec: Number(process.env.SYSTEMCHECK_INTERVAL_SEC ?? 100),
    concurrency: Number(process.env.SYSTEMCHECK_CONCURRENCY ?? 15),
    tcpTimeoutSec: 3,
    autoStartOnLaunch: true,
  },
  keepAlive: {
    enabled: true,
    url: process.env.SYSTEMCHECK_KEEPALIVE_URL ?? 'http://192.168.9.113:8088/api/v2/KeepAlive',
    timeoutSec: 3,
    sendMode: 'per_open_port',
  },
  retention: {
    logDays: 30,
    dbHistoryDays: 30,
  },
  system: {
    minimizeToTrayOnClose: true,
  },
};

interface LegacyOrModernConfig {
  path?: {
    log?: string;
    check?: string;
  };
  check_time?: number;
  paths?: Partial<SystemCheckAppConfig['paths']>;
  checker?: Partial<SystemCheckAppConfig['checker']>;
  keepAlive?: Partial<SystemCheckAppConfig['keepAlive']>;
  retention?: Partial<SystemCheckAppConfig['retention']>;
  system?: Partial<SystemCheckAppConfig['system']>;
}

export class ConfigManager {
  private readonly configPath: string;

  constructor(customConfigPath?: string) {
    this.configPath = customConfigPath ?? resolveAppPath('config.json');
  }

  public loadConfig(): SystemCheckAppConfig {
    try {
      if (!fs.existsSync(this.configPath)) {
        this.saveConfig(DEFAULT_CONFIG);
        return structuredClone(DEFAULT_CONFIG);
      }

      const rawText = fs.readFileSync(this.configPath, 'utf-8');
      const parsed = JSON.parse(rawText) as LegacyOrModernConfig;

      const checkDir =
        parsed.paths?.checkDir ?? parsed.path?.check ?? DEFAULT_CONFIG.paths.checkDir;
      const logDir = parsed.paths?.logDir ?? parsed.path?.log ?? DEFAULT_CONFIG.paths.logDir;
      const intervalSec = Number(
        parsed.checker?.intervalSec ?? parsed.check_time ?? DEFAULT_CONFIG.checker.intervalSec,
      );

      const sendMode: KeepAliveSendMode =
        parsed.keepAlive?.sendMode === 'once_per_device' ? 'once_per_device' : 'per_open_port';

      const normalized: SystemCheckAppConfig = {
        paths: {
          checkDir,
          logDir,
          vncViewerPath: parsed.paths?.vncViewerPath ?? DEFAULT_CONFIG.paths.vncViewerPath,
        },
        checker: {
          intervalSec: Number.isFinite(intervalSec) && intervalSec >= 5 ? intervalSec : 100,
          concurrency: Math.min(
            50,
            Math.max(1, Number(parsed.checker?.concurrency ?? DEFAULT_CONFIG.checker.concurrency)),
          ),
          tcpTimeoutSec: Math.min(
            15,
            Math.max(
              1,
              Number(parsed.checker?.tcpTimeoutSec ?? DEFAULT_CONFIG.checker.tcpTimeoutSec),
            ),
          ),
          autoStartOnLaunch:
            parsed.checker?.autoStartOnLaunch ?? DEFAULT_CONFIG.checker.autoStartOnLaunch,
        },
        keepAlive: {
          enabled: parsed.keepAlive?.enabled ?? DEFAULT_CONFIG.keepAlive.enabled,
          url: parsed.keepAlive?.url?.trim() || DEFAULT_CONFIG.keepAlive.url,
          timeoutSec: Math.min(
            15,
            Math.max(
              1,
              Number(parsed.keepAlive?.timeoutSec ?? DEFAULT_CONFIG.keepAlive.timeoutSec),
            ),
          ),
          sendMode,
        },
        retention: {
          logDays: Number(parsed.retention?.logDays ?? DEFAULT_CONFIG.retention.logDays),
          dbHistoryDays: Number(
            parsed.retention?.dbHistoryDays ?? DEFAULT_CONFIG.retention.dbHistoryDays,
          ),
        },
        system: {
          minimizeToTrayOnClose:
            parsed.system?.minimizeToTrayOnClose ?? DEFAULT_CONFIG.system.minimizeToTrayOnClose,
        },
      };

      this.ensureDirectories(normalized);
      return normalized;
    } catch {
      this.ensureDirectories(DEFAULT_CONFIG);
      return structuredClone(DEFAULT_CONFIG);
    }
  }

  public saveConfig(config: SystemCheckAppConfig): void {
    this.ensureDirectories(config);
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
  }

  private ensureDirectories(config: SystemCheckAppConfig): void {
    const dirs = [config.paths.checkDir, config.paths.logDir];
    for (const d of dirs) {
      const resolved = resolveAppPath(d);
      if (!fs.existsSync(resolved)) {
        fs.mkdirSync(resolved, { recursive: true });
      }
    }
  }
}
