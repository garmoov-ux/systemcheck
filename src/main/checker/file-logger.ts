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

export type SystemLogLevel = 'INFO' | 'WARNING' | 'ERROR' | '정보' | '주의' | '오류';

function toKoreanLevel(level: SystemLogLevel): '정보' | '주의' | '오류' {
  if (level === 'INFO' || level === '정보') return '정보';
  if (level === 'WARNING' || level === '주의') return '주의';
  return '오류';
}

export class FileLogger {
  private logDir: string;

  constructor(logDir: string) {
    this.logDir = logDir;
  }

  public setLogDir(logDir: string): void {
    this.logDir = logDir;
  }

  public logSystem(level: SystemLogLevel, message: string): void {
    this.writeLog('시스템점검', 'system_check', toKoreanLevel(level), message);
  }

  public logDevice(level: SystemLogLevel, message: string): void {
    this.writeLog('장비상세', 'device_check', toKoreanLevel(level), message);
  }

  private writeLog(
    categoryLabel: '시스템점검' | '장비상세',
    fileSuffix: 'system_check' | 'device_check',
    levelLabel: '정보' | '주의' | '오류',
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
      const line = `[${formatNowDateTime(now)}] [${categoryLabel}] [${levelLabel}] ${message}\r\n`;
      fs.appendFileSync(filePath, line, 'utf-8');
    } catch {
      // 로그 파일 쓰기 실패 시 메인 프로세스 중단 방지
    }
  }
}
