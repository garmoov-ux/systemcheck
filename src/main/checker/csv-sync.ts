import fs from 'node:fs';
import path from 'node:path';
import iconv from 'iconv-lite';
import { DEFAULT_DATA_CSV_CONTENT } from './default-devices';
import { resolveAppPath } from '../config/app-paths';
import type { DeviceRecord, DeviceStatus } from '@shared/types/domain';

export interface CsvDeviceRow {
  deviceId: string;
  ip: string;
  portMS: number;
  portVNC: number;
  checkTime: string;
  status: DeviceStatus;
}

export function getDataCsvPath(checkDir: string): string {
  return path.join(resolveAppPath(checkDir), 'data.csv');
}

export function ensureDataCsvExists(checkDir: string): string {
  const csvPath = getDataCsvPath(checkDir);
  const dir = path.dirname(csvPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(csvPath)) {
    const encoded = iconv.encode(DEFAULT_DATA_CSV_CONTENT, 'cp949');
    fs.writeFileSync(csvPath, encoded);
  }
  return csvPath;
}

export function parseDataCsvBuffer(buffer: Buffer): CsvDeviceRow[] {
  let content: string;
  // UTF-8 BOM 감지
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    content = buffer.subarray(3).toString('utf-8');
  } else {
    content = iconv.decode(buffer, 'cp949');
  }

  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length <= 1) return [];

  const rows: CsvDeviceRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    if (cols.length < 4 || !cols[0] || !cols[1]) continue;

    const deviceId = cols[0];
    const ip = cols[1];
    const portMS = Number(cols[2]) || 3389;
    const portVNC = Number(cols[3]) || 5900;
    const checkTime = cols[4] ?? '';
    const statusRaw = (cols[5] ?? 'Down').toLowerCase();
    const status: DeviceStatus = statusRaw === 'up' ? 'Up' : 'Down';

    rows.push({
      deviceId,
      ip,
      portMS,
      portVNC,
      checkTime,
      status,
    });
  }

  return rows;
}

export function readDataCsvFile(csvFilePath: string): CsvDeviceRow[] {
  const buffer = fs.readFileSync(csvFilePath);
  return parseDataCsvBuffer(buffer);
}

export function serializeDevicesToCsvBuffer(
  devices: Pick<DeviceRecord, 'deviceId' | 'ip' | 'portMS' | 'portVNC' | 'checkTime' | 'status'>[],
): Buffer {
  const header = 'DeviceId,Ip,PortMS,PortVNC,CheckTime,Status';
  const lines = devices.map(
    (d) => `${d.deviceId},${d.ip},${d.portMS},${d.portVNC},${d.checkTime},${d.status}`,
  );
  const fullText = [header, ...lines].join('\r\n') + '\r\n';
  return iconv.encode(fullText, 'cp949');
}

export function writeDataCsvFile(
  csvFilePath: string,
  devices: Pick<DeviceRecord, 'deviceId' | 'ip' | 'portMS' | 'portVNC' | 'checkTime' | 'status'>[],
): void {
  const dir = path.dirname(csvFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const encoded = serializeDevicesToCsvBuffer(devices);
  fs.writeFileSync(csvFilePath, encoded);
}
