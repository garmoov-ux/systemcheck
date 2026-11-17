import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { SCHEMA_DDL } from './schema';
import { resolveAppPath } from '../config/app-paths';

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
  return db;
}
