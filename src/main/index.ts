import { join } from 'node:path';
import { app, BrowserWindow, shell } from 'electron';
import { ConfigManager } from './config/config-manager';
import { createDatabaseConnection } from './db/connection';
import { DeviceRepository } from './db/device-repo';
import { CheckSchedulerService } from './checker/check-scheduler';
import { RetentionCleanerService } from './checker/retention-cleaner';
import { createSystemCheckAppIcon, TrayManager } from './tray';
import { registerIpcHandlers } from './ipc/handlers';
import type { SystemCheckAppConfig } from '@shared/types/domain';

let mainWindow: BrowserWindow | null = null;
let schedulerService: CheckSchedulerService | null = null;
let retentionCleaner: RetentionCleanerService | null = null;
let trayManager: TrayManager | null = null;
let currentConfig: SystemCheckAppConfig | null = null;
let isQuitting = false;

function createMainWindow(): BrowserWindow {
  const appIcon = createSystemCheckAppIcon(64);
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    useContentSize: true,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#f5f5f7',
    icon: appIcon,
    title: 'SystemCheck - 무인교통단속장비 상태 점검 및 생존신호 전송 시스템',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  });

  win.on('ready-to-show', () => {
    win.show();
  });

  win.on('close', (event) => {
    if (!isQuitting && currentConfig?.system?.minimizeToTrayOnClose) {
      event.preventDefault();
      win.hide();
    }
  });

  win.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return win;
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show();
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  void app.whenReady().then(() => {
    const configManager = new ConfigManager();
    currentConfig = configManager.loadConfig();
    const db = createDatabaseConnection();
    const repo = new DeviceRepository(db);

    schedulerService = new CheckSchedulerService(currentConfig, repo);
    retentionCleaner = new RetentionCleanerService(currentConfig, repo);

    registerIpcHandlers(
      () => mainWindow,
      configManager,
      repo,
      schedulerService,
      retentionCleaner,
      (updated) => {
        currentConfig = updated;
      },
    );

    mainWindow = createMainWindow();

    trayManager = new TrayManager(
      () => mainWindow,
      schedulerService,
      () => {
        isQuitting = true;
      },
    );
    trayManager.init();

    if (currentConfig.checker.autoStartOnLaunch) {
      schedulerService.start();
    }
    retentionCleaner.startPeriodicCleanup();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createMainWindow();
      } else {
        mainWindow?.show();
      }
    });
  });

  app.on('before-quit', () => {
    isQuitting = true;
    retentionCleaner?.stopPeriodicCleanup();
    schedulerService?.stop();
    trayManager?.destroy();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin' && isQuitting) {
      app.quit();
    }
  });
}
