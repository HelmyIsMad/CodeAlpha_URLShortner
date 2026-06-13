require("dotenv").config();
const express = require("express");
const rateLimit = require("express-rate-limit");
const routes = require("./routes");

const app = express();
app.use(express.json());

const shortenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/shorten", shortenLimiter);

app.use(routes);

module.exports = app;
