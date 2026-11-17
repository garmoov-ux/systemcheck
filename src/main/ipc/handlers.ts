import fs from 'node:fs';
import { dialog, ipcMain, type BrowserWindow } from 'electron';
import iconv from 'iconv-lite';
import { IPC_CHANNELS } from '@shared/ipc-channels';
import { readDataCsvFile, writeDataCsvFile } from '../checker/csv-sync';
import { launchRemoteDesktop, launchVncViewer } from '../checker/remote-launcher';
import type { ConfigManager } from '../config/config-manager';
import type { DeviceRepository } from '../db/device-repo';
import type { CheckSchedulerService } from '../checker/check-scheduler';
import type { RetentionCleanerService, CleanupSummary } from '../checker/retention-cleaner';
import type {
  CheckerSummary,
  DeviceRecord,
  DeviceUpsertInput,
  HistoryQueryFilter,
  HistoryQueryResult,
  IpcResult,
  SystemCheckAppConfig,
} from '@shared/types/domain';

export function registerIpcHandlers(
  getWindow: () => BrowserWindow | null,
  configManager: ConfigManager,
  repo: DeviceRepository,
  scheduler: CheckSchedulerService,
  retentionCleaner: RetentionCleanerService,
  onConfigUpdated: (config: SystemCheckAppConfig) => void,
): void {
  let activeConfig = configManager.loadConfig();

  scheduler.onSummaryChange((summary) => {
    const win = getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.EVENT_SUMMARY_UPDATED, summary);
    }
  });

  scheduler.onDeviceUpdated((device) => {
    const win = getWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.EVENT_DEVICE_UPDATED, device);
    }
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_GET, (): IpcResult<SystemCheckAppConfig> => {
    activeConfig = configManager.loadConfig();
    return { success: true, data: activeConfig };
  });

  ipcMain.handle(
    IPC_CHANNELS.CONFIG_SAVE,
    (_event, nextConfig: SystemCheckAppConfig): IpcResult<SystemCheckAppConfig> => {
      try {
        configManager.saveConfig(nextConfig);
        activeConfig = configManager.loadConfig();
        scheduler.updateConfig(activeConfig);
        retentionCleaner.updateConfig(activeConfig);
        onConfigUpdated(activeConfig);
        return { success: true, data: activeConfig };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : '설정 저장 실패',
        };
      }
    },
  );

  ipcMain.handle(IPC_CHANNELS.CONFIG_SELECT_DIR, async (): Promise<IpcResult<string>> => {
    const win = getWindow();
    const res = await dialog.showOpenDialog(win ?? undefined!, {
      properties: ['openDirectory', 'createDirectory'],
    });
    if (res.canceled || res.filePaths.length === 0) {
      return { success: false };
    }
    return { success: true, data: res.filePaths[0].replace(/\\/g, '/') };
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_SELECT_FILE, async (): Promise<IpcResult<string>> => {
    const win = getWindow();
    const res = await dialog.showOpenDialog(win ?? undefined!, {
      title: 'VNC 뷰어 실행 파일 선택',
      properties: ['openFile'],
      filters: [{ name: '실행 파일', extensions: ['exe'] }],
    });
    if (res.canceled || res.filePaths.length === 0) {
      return { success: false };
    }
    return { success: true, data: res.filePaths[0].replace(/\\/g, '/') };
  });

  ipcMain.handle(IPC_CHANNELS.CHECKER_GET_SUMMARY, (): IpcResult<CheckerSummary> => {
    return { success: true, data: scheduler.getSummary() };
  });

  ipcMain.handle(IPC_CHANNELS.CHECKER_START, (): IpcResult<CheckerSummary> => {
    scheduler.start();
    return { success: true, data: scheduler.getSummary() };
  });

  ipcMain.handle(IPC_CHANNELS.CHECKER_STOP, (): IpcResult<CheckerSummary> => {
    scheduler.stop();
    return { success: true, data: scheduler.getSummary() };
  });

  ipcMain.handle(IPC_CHANNELS.CHECKER_RUN_ALL_NOW, async (): Promise<IpcResult<CheckerSummary>> => {
    void scheduler.runAllNow();
    return { success: true, data: scheduler.getSummary() };
  });

  ipcMain.handle(
    IPC_CHANNELS.CHECKER_RUN_SINGLE,
    async (_event, deviceId: string): Promise<IpcResult<DeviceRecord>> => {
      const updated = await scheduler.runSingleDevice(deviceId);
      if (!updated) {
        return { success: false, error: '해당 장비를 찾을 수 없습니다.' };
      }
      return { success: true, data: updated };
    },
  );

  ipcMain.handle(IPC_CHANNELS.DEVICES_LIST, (): IpcResult<DeviceRecord[]> => {
    return { success: true, data: repo.listAllDevices() };
  });

  ipcMain.handle(
    IPC_CHANNELS.DEVICES_UPSERT,
    (_event, input: DeviceUpsertInput): IpcResult<DeviceRecord[]> => {
      try {
        if (!input.deviceId?.trim() || !input.ip?.trim()) {
          return { success: false, error: '장비번호와 IP 주소를 모두 입력해 주세요.' };
        }
        repo.upsertDevice(input);
        scheduler.syncDbToCsv();
        return { success: true, data: repo.listAllDevices() };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : '장비 등록/수정 실패',
        };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.DEVICES_DELETE,
    (_event, deviceId: string): IpcResult<DeviceRecord[]> => {
      try {
        repo.deleteDevice(deviceId);
        scheduler.syncDbToCsv();
        return { success: true, data: repo.listAllDevices() };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : '장비 삭제 실패',
        };
      }
    },
  );

  ipcMain.handle(IPC_CHANNELS.DEVICES_RELOAD_CSV, (): IpcResult<DeviceRecord[]> => {
    try {
      const devices = scheduler.initializeDevicesFromCsv(true);
      return { success: true, data: devices };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : '장비 목록 파일 다시 불러오기 실패',
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.DEVICES_IMPORT_CSV, async (): Promise<IpcResult<DeviceRecord[]>> => {
    const win = getWindow();
    const res = await dialog.showOpenDialog(win ?? undefined!, {
      title: '장비 목록 파일(CSV) 불러오기',
      properties: ['openFile'],
      filters: [{ name: '장비 목록 파일', extensions: ['csv'] }],
    });
    if (res.canceled || res.filePaths.length === 0) {
      return { success: false };
    }
    try {
      const rows = readDataCsvFile(res.filePaths[0]);
      repo.syncDevicesFromCsvRows(rows, true);
      scheduler.syncDbToCsv();
      return { success: true, data: repo.listAllDevices() };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : '파일 가져오기 실패',
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.DEVICES_EXPORT_CSV, async (): Promise<IpcResult<string>> => {
    const win = getWindow();
    const res = await dialog.showSaveDialog(win ?? undefined!, {
      title: '장비 목록 파일 저장',
      defaultPath: `data_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv`,
      filters: [{ name: 'CSV 파일', extensions: ['csv'] }],
    });
    if (res.canceled || !res.filePath) {
      return { success: false };
    }
    try {
      writeDataCsvFile(res.filePath, repo.listAllDevices());
      return { success: true, data: res.filePath };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : '파일 내보내기 실패',
      };
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.REMOTE_CONNECT_MSTSC,
    (_event, payload: { ip: string; portMS: number }): IpcResult<boolean> => {
      try {
        launchRemoteDesktop(payload.ip, payload.portMS);
        return { success: true, data: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : '원격 데스크톱 실행 실패',
        };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.REMOTE_CONNECT_VNC,
    (_event, payload: { ip: string; portVNC: number }): IpcResult<boolean> => {
      try {
        launchVncViewer(payload.ip, payload.portVNC, activeConfig.paths.vncViewerPath);
        return { success: true, data: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'VNC 뷰어 실행 실패',
        };
      }
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.HISTORY_QUERY,
    (_event, filter: HistoryQueryFilter): IpcResult<HistoryQueryResult> => {
      return { success: true, data: repo.queryHistory(filter) };
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.HISTORY_EXPORT_CSV,
    async (_event, filter: HistoryQueryFilter): Promise<IpcResult<string>> => {
      const win = getWindow();
      const res = await dialog.showSaveDialog(win ?? undefined!, {
        title: '점검 이력 파일 저장',
        defaultPath: `장비점검이력_${new Date().toISOString().slice(0, 10)}.csv`,
        filters: [{ name: 'CSV 파일', extensions: ['csv'] }],
      });
      if (res.canceled || !res.filePath) {
        return { success: false };
      }
      try {
        const result = repo.queryHistory({ ...filter, limit: 10000, offset: 0 });
        const header =
          '점검시각,장비번호,IP주소,원격데스크톱포트,VNC포트,핑상태,원격데스크톱연결,VNC연결,장비상태,응답지연(ms),생존신호전송,생존신호코드';
        const lines = result.items.map((item) =>
          [
            item.checkedAt,
            item.deviceId,
            item.ip,
            item.portMS,
            item.portVNC,
            item.pingOk ? '정상' : '비정상',
            item.msPortOpen ? '성공' : '실패',
            item.vncPortOpen ? '성공' : '실패',
            item.status === 'Up' ? '정상(Up)' : '비정상(Down)',
            item.latencyMs ?? '-',
            item.keepAliveOk ? '성공' : '실패',
            item.keepAliveCode ?? '-',
          ].join(','),
        );
        const fullText = [header, ...lines].join('\r\n') + '\r\n';
        fs.writeFileSync(res.filePath, iconv.encode(fullText, 'cp949'));
        return { success: true, data: res.filePath };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : '점검 이력 내보내기 실패',
        };
      }
    },
  );

  ipcMain.handle(IPC_CHANNELS.RETENTION_CLEAN_NOW, (): IpcResult<CleanupSummary> => {
    try {
      const summary = retentionCleaner.runCleanupNow();
      return { success: true, data: summary };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : '정리 작업 중 오류가 발생했습니다.',
      };
    }
  });
}
