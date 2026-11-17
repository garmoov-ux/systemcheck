export const SCHEMA_DDL = `
CREATE TABLE IF NOT EXISTS devices (
  device_id TEXT PRIMARY KEY,
  device_name TEXT NOT NULL DEFAULT '',
  ip TEXT NOT NULL,
  port_ms INTEGER NOT NULL DEFAULT 3389,
  port_vnc INTEGER NOT NULL DEFAULT 5900,
  check_time TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Down',
  ping_ok INTEGER NOT NULL DEFAULT 0,
  ms_port_open INTEGER NOT NULL DEFAULT 0,
  vnc_port_open INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER,
  keep_alive_ok INTEGER NOT NULL DEFAULT 0,
  keep_alive_code INTEGER,
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS check_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  device_name TEXT NOT NULL DEFAULT '',
  ip TEXT NOT NULL,
  port_ms INTEGER NOT NULL,
  port_vnc INTEGER NOT NULL,
  ping_ok INTEGER NOT NULL,
  ms_port_open INTEGER NOT NULL,
  vnc_port_open INTEGER NOT NULL,
  status TEXT NOT NULL,
  latency_ms INTEGER,
  keep_alive_ok INTEGER NOT NULL,
  keep_alive_code INTEGER,
  checked_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_history_checked_at ON check_history(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_device_id ON check_history(device_id);
CREATE INDEX IF NOT EXISTS idx_history_status ON check_history(status);
`;
