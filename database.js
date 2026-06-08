// Connects to SQLite and exports CRUD functions for URLs
const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "data.db");

let db;

function connectDB() {
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS urls (
      code TEXT PRIMARY KEY,
      longUrl TEXT NOT NULL
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS counter (
      name TEXT PRIMARY KEY,
      value INTEGER NOT NULL DEFAULT 0
    )
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_longUrl ON urls(longUrl)
  `);
  console.log("Connected to SQLite");
}

function findByCode(code) {
  return db.prepare("SELECT * FROM urls WHERE code = ?").get(code) || null;
}

function findByLongUrl(longUrl) {
  return db.prepare("SELECT * FROM urls WHERE longUrl = ?").get(longUrl) || null;
}

function createUrl(code, longUrl) {
  db.prepare("INSERT INTO urls (code, longUrl) VALUES (?, ?)").run(code, longUrl);
}

function listAllUrls() {
  return db.prepare("SELECT * FROM urls ORDER BY code").all();
}

function resetDatabase() {
  db.exec("DELETE FROM urls");
  db.exec("DELETE FROM counter");
}

function getNextCounter() {
  db.prepare("INSERT OR IGNORE INTO counter (name, value) VALUES ('urlCounter', 0)").run();
  const row = db.prepare("SELECT value FROM counter WHERE name = 'urlCounter'").get();
  db.prepare("UPDATE counter SET value = value + 1 WHERE name = 'urlCounter'").run();
  return row.value;
}

module.exports = { connectDB, findByCode, findByLongUrl, createUrl, getNextCounter, listAllUrls, resetDatabase };
