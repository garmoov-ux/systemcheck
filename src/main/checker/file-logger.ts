import fs from 'node:fs';
import path from 'node:path';
import { resolveAppPath } from '../config/app-paths';

export function formatNowDateTime(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

function formatDateCompact(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

export class FileLogger {
  private logDir: string;

  constructor(logDir: string) {
    this.logDir = logDir;
  }

  public setLogDir(logDir: string): void {
    this.logDir = logDir;
  }

  public logSystem(level: 'INFO' | 'WARNING' | 'ERROR', message: string): void {
    this.writeLog('system', 'system_check', level, message);
  }

  public logDevice(level: 'INFO' | 'WARNING' | 'ERROR', message: string): void {
    this.writeLog('device_check', 'device_check', level, message);
  }

  private writeLog(
    loggerName: 'system' | 'device_check',
    fileSuffix: 'system_check' | 'device_check',
    level: 'INFO' | 'WARNING' | 'ERROR',
    message: string,
  ): void {
    try {
      const now = new Date();
      const dir = resolveAppPath(this.logDir);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const fileName = `${formatDateCompact(now)}_${fileSuffix}.log`;
      const filePath = path.join(dir, fileName);
      const line = `[${formatNowDateTime(now)}] [${loggerName}] [${level}] ${message}\n`;
      fs.appendFileSync(filePath, line, 'utf-8');
    } catch {
      // 로그 파일 쓰기 실패 시 메인 프로세스 중단 방지
    }
  }
}
