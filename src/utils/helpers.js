const net = require("net");
const dns = require("dns");
const validator = require("validator");

const ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const BASE = ALPHABET.length;

function encode(num) {
  let encoded = "";
  while (num > 0) {
    encoded = ALPHABET[num % BASE] + encoded;
    num = Math.floor(num / BASE);
  }
  return encoded.padStart(7, ALPHABET[0]);
}

const MOD = 62n ** 7n;
const KEY = 2798536472823n;
const ADD = 1578946321753n;

function generateCode(counter) {
  const n = (BigInt(counter) * KEY + ADD) % MOD;
  return encode(Number(n));
}

async function isValidURL(url) {
  if (typeof url !== "string" || url.length < 5 || url.length > 2048) {
    return false;
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return false;
  }

  if (parsed.username || parsed.password) {
    return false;
  }

  if (parsed.hash) {
    return false;
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");

  if (!hostname) return false;

  if (net.isIP(hostname)) {
    if (net.isIPv6(hostname)) return false;
    const parts = hostname.split(".").map(Number);
    if (parts.length !== 4) return false;
    if (parts[0] === 127) return false;
    if (parts[0] === 10) return false;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return false;
    if (parts[0] === 192 && parts[1] === 168) return false;
    if (parts[0] === 169 && parts[1] === 254) return false;
    if (parts[0] === 0) return false;
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return false;
    if (parts[0] === 198 && parts[1] >= 18 && parts[1] <= 19) return false;
    if (parts[0] >= 240) return false;
    return true;
  }

  if (hostname === "localhost") return true;

  if (!hostname.includes(".")) {
    return false;
  }

  if (!validator.isURL(url, {
    require_protocol: true,
    require_valid_protocol: true,
    protocols: ["http", "https"],
    require_tld: true,
  })) {
    return false;
  }

  for (const char of hostname) {
    if (char > '\u007e') return false;
  }

  if (/[<>"'{}|\\^`\x00-\x1f\x7f]/.test(url)) {
    return false;
  }

  const decoded = decodeURIComponent(url);
  if (/\b(javascript|data|vbscript|file):/i.test(decoded)) {
    return false;
  }

  if (/\x00/.test(url)) {
    return false;
  }

  try {
    await dns.promises.lookup(hostname);
  } catch {
    return false;
  }

  return true;
}

function requestBaseURL(req) {
  const proto = req.get("x-forwarded-proto") || req.protocol;
  return `${proto}://${req.get("host")}`;
}

module.exports = { encode, generateCode, isValidURL, requestBaseURL };
