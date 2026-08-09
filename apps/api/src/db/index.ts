import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH ?? join(__dirname, '../../billforge.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

migrateIdempotencyKeys();

function migrateIdempotencyKeys() {
  const row = db.prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'idempotency_keys'`).get() as
    | { sql: string }
    | undefined;
  if (!row?.sql) return;
  if (/PRIMARY KEY\s*\(\s*merchant_id\s*,\s*key\s*\)/i.test(row.sql)) return;

  db.exec(`
    CREATE TABLE idempotency_keys_new (
      key TEXT NOT NULL,
      merchant_id TEXT NOT NULL,
      response TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (merchant_id, key)
    );
    INSERT OR IGNORE INTO idempotency_keys_new (key, merchant_id, response, created_at)
      SELECT key, merchant_id, response, created_at FROM idempotency_keys;
    DROP TABLE idempotency_keys;
    ALTER TABLE idempotency_keys_new RENAME TO idempotency_keys;
  `);
}

export function boolToInt(value: boolean): number {
  return value ? 1 : 0;
}

export function intToBool(value: number): boolean {
  return value === 1;
}
