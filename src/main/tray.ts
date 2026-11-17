import { app, Menu, nativeImage, Tray, type BrowserWindow } from 'electron';
import type { CheckSchedulerService } from './checker/check-scheduler';

function createTrayIconImage(): Electron.NativeImage {
  // 16x16 RGBA 아이콘 비트맵 생성 (Action Blue #0066cc 원형 뱃지)
  const size = 16;
  const buf = Buffer.alloc(size * size * 4);
  const center = (size - 1) / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dist = Math.hypot(x - center, y - center);

      if (dist <= 7.2) {
        if (dist <= 2.6) {
          buf[idx] = 255;
          buf[idx + 1] = 255;
          buf[idx + 2] = 255;
          buf[idx + 3] = 255;
        } else {
          // BGRA 포맷: #0066cc -> B=204, G=102, R=0
          buf[idx] = 204;
          buf[idx + 1] = 102;
          buf[idx + 2] = 0;
          buf[idx + 3] = 255;
        }
      } else {
        buf[idx + 3] = 0;
      }
    }
  }

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

    const icon = createTrayIconImage();
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
