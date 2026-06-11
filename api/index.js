let dbConnected = false;
const app = require("../src/app");
const { connectDB } = require("../src/config/database");

module.exports = async (req, res) => {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
  }
  app(req, res);
};
