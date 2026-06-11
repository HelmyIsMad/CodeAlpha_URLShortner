const { Router } = require("express");
const controller = require("../controllers/urlController");

const router = Router();

router.get("/", controller.getHome);
router.get("/admin", controller.getAdmin);
router.post("/shorten", controller.shortenUrl);
router.get("/urls", controller.listUrls);
router.delete("/urls", controller.resetUrls);
router.get("/:code", controller.redirectUrl);

module.exports = router;
