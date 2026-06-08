const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = process.env.VERCEL
  ? "/tmp/data.db"
  : path.join(__dirname, "data.db");

let db;
let SQL;

async function connectDB() {
  SQL = await initSqlJs({
    locateFile: file => `https://sql.js.org/dist/${file}`,
  });
  try {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } catch {
    db = new SQL.Database();
  }
  db.run("CREATE TABLE IF NOT EXISTS urls (code TEXT PRIMARY KEY, longUrl TEXT NOT NULL)");
  db.run("CREATE TABLE IF NOT EXISTS counter (name TEXT PRIMARY KEY, value INTEGER NOT NULL DEFAULT 0)");
  db.run("CREATE INDEX IF NOT EXISTS idx_longUrl ON urls(longUrl)");
  saveDB();
  console.log("Connected to SQLite");
}

function saveDB() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function exec(stmt) {
  const result = [];
  while (stmt.step()) {
    result.push(stmt.getAsObject());
  }
  stmt.free();
  return result;
}

function get(stmt) {
  const rows = exec(stmt);
  return rows.length ? rows[0] : null;
}

function findByCode(code) {
  const stmt = db.prepare("SELECT * FROM urls WHERE code = ?");
  stmt.bind([code]);
  return get(stmt);
}

function findByLongUrl(longUrl) {
  const stmt = db.prepare("SELECT * FROM urls WHERE longUrl = ?");
  stmt.bind([longUrl]);
  return get(stmt);
}

function createUrl(code, longUrl) {
  const stmt = db.prepare("INSERT INTO urls (code, longUrl) VALUES (?, ?)");
  stmt.bind([code, longUrl]);
  stmt.run();
  stmt.free();
  saveDB();
}

function listAllUrls() {
  const stmt = db.prepare("SELECT * FROM urls ORDER BY code");
  return exec(stmt);
}

function resetDatabase() {
  db.run("DELETE FROM urls");
  db.run("DELETE FROM counter");
  saveDB();
}

function getNextCounter() {
  let row = get(db.prepare("SELECT value FROM counter WHERE name = 'urlCounter'"));
  if (!row) {
    db.run("INSERT INTO counter (name, value) VALUES ('urlCounter', 0)");
    saveDB();
    return 0;
  }
  const value = row.value;
  db.run("UPDATE counter SET value = value + 1 WHERE name = 'urlCounter'");
  saveDB();
  return value;
}

module.exports = { connectDB, findByCode, findByLongUrl, createUrl, getNextCounter, listAllUrls, resetDatabase };
