require("dotenv").config();
const express = require("express");
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
  res.send(`
    <h1>URL Shortener</h1>
    <input type="text" id="longUrl" placeholder="Enter long URL here" style="width: 300px;">
    <button onclick="shorten()">Shorten</button>
    <p id="result"></p>
    <button onclick="showDB()">Show DB</button>
    <button onclick="resetDB()">Reset</button>
    <pre id="dbDisplay"></pre>

    <script>
      async function shorten() {
        const longUrl = document.getElementById('longUrl').value;
        const res = await fetch('/shorten', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ longUrl })
        });
        const data = await res.json();
        if (data.shortUrl) {
          document.getElementById('result').innerHTML = 'Short URL: <a href="' + data.shortUrl + '" target="_blank">' + data.shortUrl + '</a>';
        } else {
          alert('Error shortening URL');
        }
      }

      async function showDB() {
        const res = await fetch('/urls');
        const data = await res.json();
        document.getElementById('dbDisplay').textContent = JSON.stringify(data, null, 2);
      }

      async function resetDB() {
        if (!confirm('Reset the database?')) return;
        await fetch('/urls', { method: 'DELETE' });
        document.getElementById('dbDisplay').textContent = '';
        alert('Database reset');
      }
    </script>
  `);
});

// Shortens a long URL and returns a short code
app.post("/shorten", async (req, res) => {
  const { longUrl } = req.body;

  if (!longUrl) {
    return res.status(400).json({ error: "longUrl is required" });
  } else if (!isValidURL(longUrl)) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  const existing = await findByLongUrl(longUrl);
  if (existing) {
    return res.json({
      shortUrl: `${BASE_URL}/${existing.code}`,
      code: existing.code,
    });
  }

  const nextId = await getNextCounter();
  const code = encode(nextId);

  await createUrl(code, longUrl);

  return res.json({
    shortUrl: `${BASE_URL}/${code}`,
    code: code,
  });
});

// Returns all stored URLs
app.get("/urls", (req, res) => {
  res.json(listAllUrls());
});

// Deletes all stored URLs and resets the counter
app.delete("/urls", (req, res) => {
  resetDatabase();
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

connectDB();
app.listen(PORT, HOST, () => console.log(`Listening on ${BASE_URL}`));
