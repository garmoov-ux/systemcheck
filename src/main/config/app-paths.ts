import path from 'node:path';

/**
 * 패키징된 실행 파일(SystemCheck_Portable.exe 또는 SystemCheck.exe) 환경에서는
 * 실행 파일이 위치한 폴더를 기준 경로로 사용하고, 개발 환경에서는 process.cwd()를 사용합니다.
 */
export function getAppBaseDir(): string {
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    return process.env.PORTABLE_EXECUTABLE_DIR;
  }
  const execName = path.basename(process.execPath).toLowerCase();
  if (execName !== 'node.exe' && execName !== 'electron.exe') {
    return path.dirname(process.execPath);
  }
  return process.cwd();
}

export function resolveAppPath(targetPath: string): string {
  if (path.isAbsolute(targetPath)) {
    return path.normalize(targetPath);
  }
  return path.resolve(getAppBaseDir(), targetPath);
}
