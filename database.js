const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

async function connectDB() {
  await sql`CREATE TABLE IF NOT EXISTS urls (code TEXT PRIMARY KEY, "longUrl" TEXT NOT NULL)`;
  await sql`CREATE TABLE IF NOT EXISTS counter (name TEXT PRIMARY KEY, value INTEGER NOT NULL DEFAULT 0)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_longUrl ON urls("longUrl")`;
  console.log("Connected to Neon Postgres");
}

async function findByCode(code) {
  const rows = await sql`SELECT * FROM urls WHERE code = ${code}`;
  return rows.length ? rows[0] : null;
}

async function findByLongUrl(longUrl) {
  const rows = await sql`SELECT * FROM urls WHERE "longUrl" = ${longUrl}`;
  return rows.length ? rows[0] : null;
}

async function createUrl(code, longUrl) {
  await sql`INSERT INTO urls (code, "longUrl") VALUES (${code}, ${longUrl})`;
}

async function listAllUrls() {
  const rows = await sql`SELECT * FROM urls ORDER BY code`;
  return rows;
}

async function resetDatabase() {
  await sql`DELETE FROM urls`;
  await sql`DELETE FROM counter`;
}

async function getNextCounter() {
  const rows = await sql`SELECT value FROM counter WHERE name = 'urlCounter'`;
  if (rows.length === 0) {
    await sql`INSERT INTO counter (name, value) VALUES ('urlCounter', 0)`;
    return 0;
  }
  const value = rows[0].value;
  await sql`UPDATE counter SET value = value + 1 WHERE name = 'urlCounter'`;
  return value;
}

module.exports = { connectDB, findByCode, findByLongUrl, createUrl, getNextCounter, listAllUrls, resetDatabase };
