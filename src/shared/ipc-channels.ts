export const IPC_CHANNELS = {
  CONFIG_GET: 'systemcheck:config:get',
  CONFIG_SAVE: 'systemcheck:config:save',
  CONFIG_SELECT_DIR: 'systemcheck:config:select-dir',
  CONFIG_SELECT_FILE: 'systemcheck:config:select-file',

  CHECKER_GET_SUMMARY: 'systemcheck:checker:get-summary',
  CHECKER_START: 'systemcheck:checker:start',
  CHECKER_STOP: 'systemcheck:checker:stop',
  CHECKER_RUN_ALL_NOW: 'systemcheck:checker:run-all-now',
  CHECKER_RUN_SINGLE: 'systemcheck:checker:run-single',

  DEVICES_LIST: 'systemcheck:devices:list',
  DEVICES_UPSERT: 'systemcheck:devices:upsert',
  DEVICES_DELETE: 'systemcheck:devices:delete',
  DEVICES_RELOAD_CSV: 'systemcheck:devices:reload-csv',
  DEVICES_EXPORT_CSV: 'systemcheck:devices:export-csv',
  DEVICES_IMPORT_CSV: 'systemcheck:devices:import-csv',

  REMOTE_CONNECT_MSTSC: 'systemcheck:remote:mstsc',
  REMOTE_CONNECT_VNC: 'systemcheck:remote:vnc',

  HISTORY_QUERY: 'systemcheck:history:query',
  HISTORY_EXPORT_CSV: 'systemcheck:history:export-csv',
  RETENTION_CLEAN_NOW: 'systemcheck:retention:clean-now',

  EVENT_DEVICE_UPDATED: 'systemcheck:event:device-updated',
  EVENT_SUMMARY_UPDATED: 'systemcheck:event:summary-updated',
} as const;
