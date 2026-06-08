let dbConnected = false;
const app = require("../server");
const { connectDB } = require("../database");

module.exports = async (req, res) => {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
  }
  app(req, res);
};
