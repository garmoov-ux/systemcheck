import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { resolveAppPath } from '../config/app-paths';

const VALID_HOST_REGEX = /^[a-zA-Z0-9.-]+$/;

function validateHostAndPort(ip: string, port: number): { host: string; validPort: number } {
  const trimmed = ip.trim();
  if (!VALID_HOST_REGEX.test(trimmed)) {
    throw new Error('유효하지 않은 장비 주소입니다.');
  }
  const validPort = Math.max(1, Math.min(65535, Math.floor(Number(port) || 3389)));
  return { host: trimmed, validPort };
}

export function launchRemoteDesktop(ip: string, portMS: number): void {
  const { host, validPort } = validateHostAndPort(ip, portMS);
  const target = validPort === 3389 ? host : `${host}:${validPort}`;
  const child = spawn('mstsc.exe', [`/v:${target}`], {
    detached: true,
    stdio: 'ignore',
    windowsHide: false,
  });
  child.unref();
}

function findAvailableVncViewer(configuredPath: string): string | null {
  if (configuredPath && configuredPath.trim()) {
    const resolved = resolveAppPath(configuredPath.trim());
    if (fs.existsSync(resolved)) return resolved;
  }

  const candidates = [
    resolveAppPath('./viewer/TightVNC/tvnviewer.exe'),
    resolveAppPath('./viewer/vncviewer.exe'),
    resolveAppPath('../AtoJ/viewer/TightVNC/tvnviewer.exe'),
    resolveAppPath('../AtoJ/viewer/vncviewer.exe'),
    'C:\\Program Files\\TightVNC\\tvnviewer.exe',
    'C:\\Program Files (x86)\\TightVNC\\tvnviewer.exe',
    'C:\\Program Files\\RealVNC\\VNC Viewer\\vncviewer.exe',
    'C:\\Program Files\\UltraVNC\\vncviewer.exe',
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function launchVncViewer(ip: string, portVNC: number, configuredViewerPath: string): void {
  const { host, validPort } = validateHostAndPort(ip, portVNC);
  const viewerExe = findAvailableVncViewer(configuredViewerPath);
  if (!viewerExe) {
    throw new Error(
      'VNC 뷰어 실행 파일을 찾을 수 없습니다. [환경 설정]에서 VNC 뷰어 파일 경로를 지정해 주세요.',
    );
  }

  const child = spawn(viewerExe, [`${host}::${validPort}`], {
    detached: true,
    stdio: 'ignore',
    windowsHide: false,
  });
  child.unref();
}
