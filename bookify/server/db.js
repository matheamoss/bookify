import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const dbPath = process.env.DB_PATH || resolve('data/bookify.sqlite')

mkdirSync(dirname(dbPath), { recursive: true })
export const db = new DatabaseSync(dbPath)
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS libraries (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    payload TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS follows (
    follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followed_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (follower_id, followed_id),
    CHECK (follower_id <> followed_id)
  );
  CREATE INDEX IF NOT EXISTS follows_followed_idx ON follows(followed_id);
`)
if (!db.prepare('PRAGMA table_info(users)').all().some(column => column.name === 'is_public')) {
  db.exec('ALTER TABLE users ADD COLUMN is_public INTEGER NOT NULL DEFAULT 0')
}

