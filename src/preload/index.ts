import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@shared/ipc-channels';
import type {
  CheckerSummary,
  DeviceRecord,
  DeviceUpsertInput,
  HistoryQueryFilter,
  HistoryQueryResult,
  IpcResult,
  SystemCheckAppConfig,
} from '@shared/types/domain';

export const systemCheckApi = {
  getConfig: (): Promise<IpcResult<SystemCheckAppConfig>> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET),

  saveConfig: (config: SystemCheckAppConfig): Promise<IpcResult<SystemCheckAppConfig>> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SAVE, config),

  selectDirectory: (): Promise<IpcResult<string>> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SELECT_DIR),

  selectFile: (): Promise<IpcResult<string>> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SELECT_FILE),

  getCheckerSummary: (): Promise<IpcResult<CheckerSummary>> =>
    ipcRenderer.invoke(IPC_CHANNELS.CHECKER_GET_SUMMARY),

  startChecker: (): Promise<IpcResult<CheckerSummary>> =>
    ipcRenderer.invoke(IPC_CHANNELS.CHECKER_START),

  stopChecker: (): Promise<IpcResult<CheckerSummary>> =>
    ipcRenderer.invoke(IPC_CHANNELS.CHECKER_STOP),

  runAllNow: (): Promise<IpcResult<CheckerSummary>> =>
    ipcRenderer.invoke(IPC_CHANNELS.CHECKER_RUN_ALL_NOW),

  runSingleDevice: (deviceId: string): Promise<IpcResult<DeviceRecord>> =>
    ipcRenderer.invoke(IPC_CHANNELS.CHECKER_RUN_SINGLE, deviceId),

  listDevices: (): Promise<IpcResult<DeviceRecord[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.DEVICES_LIST),

  upsertDevice: (input: DeviceUpsertInput): Promise<IpcResult<DeviceRecord[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.DEVICES_UPSERT, input),

  deleteDevice: (deviceId: string): Promise<IpcResult<DeviceRecord[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.DEVICES_DELETE, deviceId),

  reloadDevicesCsv: (): Promise<IpcResult<DeviceRecord[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.DEVICES_RELOAD_CSV),

  importDevicesCsv: (): Promise<IpcResult<DeviceRecord[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.DEVICES_IMPORT_CSV),

  exportDevicesCsv: (): Promise<IpcResult<string>> =>
    ipcRenderer.invoke(IPC_CHANNELS.DEVICES_EXPORT_CSV),

  connectMstsc: (ip: string, portMS: number): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.REMOTE_CONNECT_MSTSC, { ip, portMS }),

  connectVnc: (ip: string, portVNC: number): Promise<IpcResult<boolean>> =>
    ipcRenderer.invoke(IPC_CHANNELS.REMOTE_CONNECT_VNC, { ip, portVNC }),

  queryHistory: (filter: HistoryQueryFilter): Promise<IpcResult<HistoryQueryResult>> =>
    ipcRenderer.invoke(IPC_CHANNELS.HISTORY_QUERY, filter),

  exportHistoryCsv: (filter: HistoryQueryFilter): Promise<IpcResult<string>> =>
    ipcRenderer.invoke(IPC_CHANNELS.HISTORY_EXPORT_CSV, filter),

  runRetentionCleanupNow: (): Promise<
    IpcResult<{ deletedLogFiles: number; deletedDbRows: number }>
  > => ipcRenderer.invoke(IPC_CHANNELS.RETENTION_CLEAN_NOW),

  onSummaryUpdated: (callback: (summary: CheckerSummary) => void): (() => void) => {
    const listener = (_e: Electron.IpcRendererEvent, summary: CheckerSummary) => callback(summary);
    ipcRenderer.on(IPC_CHANNELS.EVENT_SUMMARY_UPDATED, listener);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.EVENT_SUMMARY_UPDATED, listener);
  },

  onDeviceUpdated: (callback: (device: DeviceRecord) => void): (() => void) => {
    const listener = (_e: Electron.IpcRendererEvent, device: DeviceRecord) => callback(device);
    ipcRenderer.on(IPC_CHANNELS.EVENT_DEVICE_UPDATED, listener);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.EVENT_DEVICE_UPDATED, listener);
  },
};

contextBridge.exposeInMainWorld('systemCheckApi', systemCheckApi);
