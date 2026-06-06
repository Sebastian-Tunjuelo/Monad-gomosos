import sqlite3 from "sqlite3";
import { open } from "sqlite";
import dotenv from "dotenv";

dotenv.config();

const dbPath = process.env.RELAYER_DATABASE_URL?.replace("file:", "") || "./db/relayer.sqlite";

export async function initDb() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      sessionId TEXT PRIMARY KEY,
      owner TEXT,
      sessionKey TEXT,
      validUntil INTEGER,
      gameContract TEXT,
      revoked INTEGER DEFAULT 0,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as int))
    );
    CREATE TABLE IF NOT EXISTS actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT,
      nonce INTEGER,
      actionId INTEGER,
      txHash TEXT,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as int))
    );
  `);
  
  return db;
}

export let db: Awaited<ReturnType<typeof initDb>>;

export async function connectDb() {
  db = await initDb();
}
