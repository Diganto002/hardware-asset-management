const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let dbInstance = null;

function getDb(customPath = null) {
  if (dbInstance && !customPath) {
    return dbInstance;
  }

  if (dbInstance && customPath) {
    return dbInstance;
  }

  const isTest = process.env.NODE_ENV === 'test';
  let dbPath = customPath || (isTest ? (process.env.TEST_DB_PATH || ':memory:') : (process.env.DB_PATH || './data/assets.db'));

  if (dbPath !== ':memory:') {
    const dir = path.dirname(path.resolve(dbPath));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');

  // Initialize schema
  initSchema(db);

  dbInstance = db;
  return db;
}

function initSchema(db) {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      asset_tag TEXT UNIQUE NOT NULL,
      serial_number TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('LAPTOP', 'MONITOR', 'PHONE', 'PERIPHERAL')),
      model TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('AVAILABLE', 'ASSIGNED', 'UNDER_REPAIR', 'RETIRED')),
      assigned_to TEXT,
      department TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_assets_asset_tag ON assets(asset_tag);
    CREATE INDEX IF NOT EXISTS idx_assets_serial_number ON assets(serial_number);
    CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
  `;
  db.exec(createTableQuery);
}

function closeDb() {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch (e) {
      // ignore if already closed
    }
    dbInstance = null;
  }
}

module.exports = {
  getDb,
  initSchema,
  closeDb
};
