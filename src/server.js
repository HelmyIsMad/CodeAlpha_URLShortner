const { connectDB } = require("./config/database");
const app = require("./app");

const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || 3000;
const BASE_URL = `http://${HOST}:${PORT}`;

connectDB().then(() => {
  app.listen(PORT, HOST, () => console.log(`Listening on ${BASE_URL}`));
});
