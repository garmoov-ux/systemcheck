import path from 'node:path';

/**
 * 패키징된 실행 파일(SystemCheck_Portable.exe 또는 SystemCheck.exe) 환경에서는
 * 실행 파일이 위치한 폴더를 기준 경로로 사용하고, 개발 환경에서는 process.cwd()를 사용합니다.
 */
export function getAppBaseDir(): string {
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    return path.resolve(process.env.PORTABLE_EXECUTABLE_DIR);
  }
  const execName = path.basename(process.execPath).toLowerCase();
  if (execName !== 'node.exe' && execName !== 'electron.exe') {
    return path.resolve(path.dirname(process.execPath));
  }
  return path.resolve(process.cwd());
}

export function resolveAppPath(targetPath: string): string {
  const trimmed = (targetPath || '').trim();
  if (!trimmed) {
    return getAppBaseDir();
  }
  if (path.isAbsolute(trimmed)) {
    return path.normalize(trimmed);
  }
  return path.resolve(getAppBaseDir(), trimmed);
}

/**
 * 폴더/파일 선택 대화상자에서 선택한 경로가 프로그램 기준 폴더 내부인 경우,
 * 이동식(Portable) 운영이 가능하도록 './check', './log' 형태의 상대경로로 변환합니다.
 */
export function toPortableRelativeIfInsideBase(selectedPath: string): string {
  const baseDir = getAppBaseDir();
  const resolved = path.resolve(selectedPath);
  const rel = path.relative(baseDir, resolved);

  if (rel === '') {
    return './';
  }
  if (!rel.startsWith('..') && !path.isAbsolute(rel)) {
    return `./${rel.replace(/\\/g, '/')}`;
  }
  return resolved.replace(/\\/g, '/');
}
