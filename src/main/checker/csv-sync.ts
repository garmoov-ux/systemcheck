import fs from 'node:fs';
import path from 'node:path';
import iconv from 'iconv-lite';
import { DEFAULT_DATA_CSV_CONTENT } from './default-devices';
import type { DeviceRecord, DeviceStatus } from '@shared/types/domain';

export interface CsvDeviceRow {
  deviceId: string;
  deviceName?: string;
  ip: string;
  portMS: number;
  portVNC: number;
  checkTime: string;
  status: DeviceStatus;
}

export function getDefaultSeedRows(): CsvDeviceRow[] {
  const buf = iconv.encode(DEFAULT_DATA_CSV_CONTENT, 'cp949');
  return parseDataCsvBuffer(buf);
}

export function parseDataCsvBuffer(buffer: Buffer): CsvDeviceRow[] {
  let content: string;
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

  const headerCols = lines[0].split(',').map((c) => c.trim().toLowerCase());
  const hasDeviceNameCol =
    headerCols[1] === 'devicename' || headerCols[1] === 'device_name' || headerCols[1] === '장비명';

  const rows: CsvDeviceRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    if (hasDeviceNameCol) {
      if (cols.length < 5 || !cols[0] || !cols[2]) continue;
      const deviceId = cols[0];
      const deviceName = cols[1] ?? '';
      const ip = cols[2];
      const portMS = Number(cols[3]) || 3389;
      const portVNC = Number(cols[4]) || 5900;
      const checkTime = cols[5] ?? '';
      const statusRaw = (cols[6] ?? 'Down').toLowerCase();
      const status: DeviceStatus = statusRaw === 'up' || statusRaw.includes('정상') ? 'Up' : 'Down';
      rows.push({ deviceId, deviceName, ip, portMS, portVNC, checkTime, status });
    } else {
      if (cols.length < 4 || !cols[0] || !cols[1]) continue;
      const deviceId = cols[0];
      const ip = cols[1];
      const portMS = Number(cols[2]) || 3389;
      const portVNC = Number(cols[3]) || 5900;
      const checkTime = cols[4] ?? '';
      const statusRaw = (cols[5] ?? 'Down').toLowerCase();
      const status: DeviceStatus = statusRaw === 'up' || statusRaw.includes('정상') ? 'Up' : 'Down';
      rows.push({ deviceId, deviceName: '', ip, portMS, portVNC, checkTime, status });
    }
  }

  return rows;
}

export function readDataCsvFile(csvFilePath: string): CsvDeviceRow[] {
  const buffer = fs.readFileSync(csvFilePath);
  return parseDataCsvBuffer(buffer);
}

export function serializeDevicesToCsvBuffer(
  devices: (Pick<
    DeviceRecord,
    'deviceId' | 'ip' | 'portMS' | 'portVNC' | 'checkTime' | 'status'
  > & { deviceName?: string })[],
  includeDeviceName = false,
): Buffer {
  if (includeDeviceName) {
    const header = 'DeviceId,DeviceName,Ip,PortMS,PortVNC,CheckTime,Status';
    const lines = devices.map(
      (d) =>
        `${d.deviceId},${(d.deviceName ?? '').replace(/,/g, ' ')},${d.ip},${d.portMS},${d.portVNC},${d.checkTime},${d.status}`,
    );
    const fullText = [header, ...lines].join('\r\n') + '\r\n';
    return iconv.encode(fullText, 'cp949');
  }

  const header = 'DeviceId,Ip,PortMS,PortVNC,CheckTime,Status';
  const lines = devices.map(
    (d) => `${d.deviceId},${d.ip},${d.portMS},${d.portVNC},${d.checkTime},${d.status}`,
  );
  const fullText = [header, ...lines].join('\r\n') + '\r\n';
  return iconv.encode(fullText, 'cp949');
}

export function writeDataCsvFile(
  csvFilePath: string,
  devices: (Pick<
    DeviceRecord,
    'deviceId' | 'ip' | 'portMS' | 'portVNC' | 'checkTime' | 'status'
  > & { deviceName?: string })[],
  includeDeviceName = true,
): void {
  const dir = path.dirname(csvFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const encoded = serializeDevicesToCsvBuffer(devices, includeDeviceName);
  fs.writeFileSync(csvFilePath, encoded);
}
