const path = require("path");
const { findByCode, findByLongUrl, createUrl, getNextCounter, listAllUrls, resetDatabase } = require("../config/database");
const { generateCode, isValidURL, requestBaseURL } = require("../utils/helpers");

exports.getHome = (req, res) => {
  res.sendFile(path.join(__dirname, "..", "..", "templates", "index.html"));
};

exports.getAdmin = (req, res) => {
  res.sendFile(path.join(__dirname, "..", "..", "templates", "admin.html"));
};

exports.shortenUrl = async (req, res) => {
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
  let code = generateCode(nextId);
  let attempt = 0;
  while (await findByCode(code) && attempt < 10) {
    code = generateCode(nextId, ++attempt);
  }

  await createUrl(code, longUrl);

  return res.json({
    shortUrl: `${baseURL}/${code}`,
    code: code,
  });
};

exports.listUrls = async (req, res) => {
  const urls = await listAllUrls();
  res.json(urls);
};

exports.resetUrls = async (req, res) => {
  await resetDatabase();
  res.json({ message: "Database reset" });
};

exports.redirectUrl = async (req, res) => {
  const { code } = req.params;
  const entry = await findByCode(code);
  if (entry) {
    return res.redirect(302, entry.longUrl);
  } else {
    return res.status(404).send("URL not found");
  }
};
