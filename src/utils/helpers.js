const net = require("net");
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

function isValidURL(url) {
  if (!validator.isURL(url, {
    require_protocol: true,
    require_valid_protocol: true,
    protocols: ["http", "https"],
    require_tld: false,
  })) {
    return false;
  }

  const hostname = new URL(url).hostname.replace(/^\[|\]$/g, "");

  if (net.isIP(hostname)) return true;
  if (hostname === "localhost") return true;

  return hostname.includes(".");
}

function requestBaseURL(req) {
  const proto = req.get("x-forwarded-proto") || req.protocol;
  return `${proto}://${req.get("host")}`;
}

module.exports = { encode, isValidURL, requestBaseURL };
