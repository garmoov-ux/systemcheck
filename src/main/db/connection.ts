import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { SCHEMA_DDL } from './schema';
import { resolveAppPath } from '../config/app-paths';

function ensureDeviceNameColumn(db: Database.Database, tableName: 'devices' | 'check_history'): void {
  const cols = db.prepare(`PRAGMA table_info(${tableName})`).all() as { name: string }[];
  const hasDeviceName = cols.some((c) => c.name === 'device_name');
  if (!hasDeviceName) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN device_name TEXT NOT NULL DEFAULT ''`);
  }
}

export function createDatabaseConnection(customDbPath?: string): Database.Database {
  const dbPath =
    customDbPath ?? resolveAppPath(process.env.SYSTEMCHECK_DB_PATH ?? './data/app.db');

  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');

  db.exec(SCHEMA_DDL);
  ensureDeviceNameColumn(db, 'devices');
  ensureDeviceNameColumn(db, 'check_history');
  return db;
}
