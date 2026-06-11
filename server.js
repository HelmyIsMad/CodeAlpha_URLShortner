require("dotenv").config();
const express = require("express");
const path = require("path");
const { connectDB, findByCode, findByLongUrl, createUrl, getNextCounter, listAllUrls, resetDatabase } = require("./database");
const app = express();
app.use(express.json());

const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || 3000;
const BASE_URL = `http://${HOST}:${PORT}`;

const ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const BASE = ALPHABET.length;

// Encodes a numeric ID into a 7-char base62 short code
function encode(num) {
  let encoded = "";
  while (num > 0) {
    encoded = ALPHABET[num % BASE] + encoded;
    num = Math.floor(num / BASE);
  }
  return encoded.padStart(7, ALPHABET[0]);
}

// Validates URL syntax using the URL constructor
function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Serves the HTML UI
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "templates", "index.html"));
});

// Serves the admin UI
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "templates", "admin.html"));
});

function requestBaseURL(req) {
  const proto = req.get("x-forwarded-proto") || req.protocol;
  return `${proto}://${req.get("host")}`;
}

// Shortens a long URL and returns a short code
app.post("/shorten", async (req, res) => {
  const { longUrl } = req.body;
  const baseURL = requestBaseURL(req);

  if (!longUrl) {
    return res.status(400).json({ error: "longUrl is required" });
  } else if (!isValidURL(longUrl)) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  const existing = await findByLongUrl(longUrl);
  if (existing) {
    return res.json({
      shortUrl: `${baseURL}/${existing.code}`,
      code: existing.code,
    });
  }

  const nextId = await getNextCounter();
  const code = encode(nextId);

  await createUrl(code, longUrl);

  return res.json({
    shortUrl: `${baseURL}/${code}`,
    code: code,
  });
});

// Returns all stored URLs
app.get("/urls", async (req, res) => {
  const urls = await listAllUrls();
  res.json(urls);
});

// Deletes all stored URLs and resets the counter
app.delete("/urls", async (req, res) => {
  await resetDatabase();
  res.json({ message: "Database reset" });
});

// Redirects a short code to the original URL
app.get("/:code", async (req, res) => {
  const { code } = req.params;

  const entry = await findByCode(code);

  if (entry) {
    return res.redirect(302, entry.longUrl);
  } else {
    return res.status(404).send("URL not found");
  }
});

if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, HOST, () => console.log(`Listening on ${BASE_URL}`));
  });
}

module.exports = app;
