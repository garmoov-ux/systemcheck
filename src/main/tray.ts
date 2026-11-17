import { app, Menu, nativeImage, Tray, type BrowserWindow } from 'electron';
import type { CheckSchedulerService } from './checker/check-scheduler';

// 13x9 체크마크 + 펄스 심볼 비트맵 (SystemCheck 전용)
const GLYPH_CHECK_SHIELD = [
  '0000000000011',
  '0000000000111',
  '0000000001110',
  '0000000011100',
  '1100000111000',
  '1110001110000',
  '0111011100000',
  '0011111000000',
  '0001110000000',
];

function drawGlyph(
  buf: Buffer,
  size: number,
  glyph: string[],
  startX: number,
  startY: number,
  scale: number,
): void {
  for (let row = 0; row < glyph.length; row++) {
    for (let col = 0; col < glyph[row].length; col++) {
      if (glyph[row][col] !== '1') continue;
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const px = startX + col * scale + sx;
          const py = startY + row * scale + sy;
          if (px >= 0 && px < size && py >= 0 && py < size) {
            const idx = (py * size + px) * 4;
            buf[idx] = 255; // B
            buf[idx + 1] = 255; // G
            buf[idx + 2] = 255; // R
            buf[idx + 3] = 255; // A
          }
        }
      }
    }
  }
}

function insideRoundedRect(x: number, y: number, size: number, pad: number, radius: number): boolean {
  const min = pad;
  const max = size - 1 - pad;
  if (x < min || x > max || y < min || y > max) return false;

  const cx = x < min + radius ? min + radius : x > max - radius ? max - radius : x;
  const cy = y < min + radius ? min + radius : y > max - radius ? max - radius : y;
  return Math.hypot(x - cx, y - cy) <= radius;
}

/**
 * SystemCheck 전용 아이콘 생성 (Emerald Green #059669 둥근 사각형 배지 + 흰색 체크 심볼)
 * AtoJ(파란색 'A>J')와 작업표시줄 및 트레이에서 즉시 구분되도록 디자인
 */
export function createSystemCheckAppIcon(size = 64): Electron.NativeImage {
  const buf = Buffer.alloc(size * size * 4);
  const pad = Math.max(1, Math.round(size * 0.06));
  const radius = Math.round(size * 0.22);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      if (insideRoundedRect(x, y, size, pad, radius)) {
        // BGRA: Emerald Green #059669 (R=5, G=150, B=105)
        buf[idx] = 105;
        buf[idx + 1] = 150;
        buf[idx + 2] = 5;
        buf[idx + 3] = 255;
      } else {
        buf[idx + 3] = 0;
      }
    }
  }

  const scale = Math.max(1, Math.floor(size / 20));
  const totalWidth = 13 * scale;
  const totalHeight = 9 * scale;
  const startX = Math.floor((size - totalWidth) / 2);
  const startY = Math.floor((size - totalHeight) / 2);

  drawGlyph(buf, size, GLYPH_CHECK_SHIELD, startX, startY, scale);

  return nativeImage.createFromBitmap(buf, { width: size, height: size });
}

export class TrayManager {
  private tray: Tray | null = null;
  private readonly getWindow: () => BrowserWindow | null;
  private readonly scheduler: CheckSchedulerService;
  private readonly onQuitRequest: () => void;

  constructor(
    getWindow: () => BrowserWindow | null,
    scheduler: CheckSchedulerService,
    onQuitRequest: () => void,
  ) {
    this.getWindow = getWindow;
    this.scheduler = scheduler;
    this.onQuitRequest = onQuitRequest;
  }

  public init(): void {
    if (this.tray) return;

    const icon = createSystemCheckAppIcon(32);
    this.tray = new Tray(icon);
    this.tray.setToolTip('SystemCheck - 무인교통단속장비 상태 점검 및 생존신호 전송 시스템');

    this.tray.on('click', () => {
      this.showMainWindow();
    });

    this.tray.on('double-click', () => {
      this.showMainWindow();
    });

    this.scheduler.onSummaryChange(() => {
      this.refreshMenu();
    });

    this.refreshMenu();
  }

  public showMainWindow(): void {
    const win = this.getWindow();
    if (!win) return;
    if (!win.isVisible()) {
      win.show();
    }
    if (win.isMinimized()) {
      win.restore();
    }
    win.focus();
  }

  public refreshMenu(): void {
    if (!this.tray) return;

    const summary = this.scheduler.getSummary();
    const menu = Menu.buildFromTemplate([
      {
        label: 'SystemCheck 관제 창 열기',
        click: () => this.showMainWindow(),
      },
      { type: 'separator' },
      {
        label: summary.isSchedulerRunning
          ? '상태: 자동 주기 점검 작동 중 (일시정지)'
          : '상태: 주기 점검 정지됨 (자동 점검 시작)',
        click: () => {
          if (summary.isSchedulerRunning) {
            this.scheduler.stop();
          } else {
            this.scheduler.start();
          }
          this.refreshMenu();
        },
      },
      {
        label: '전체 장비 즉시 점검 실행',
        click: () => {
          void this.scheduler.runAllNow();
        },
      },
      { type: 'separator' },
      {
        label: '프로그램 완전 종료',
        click: () => {
          this.onQuitRequest();
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(menu);
  }

  public destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
