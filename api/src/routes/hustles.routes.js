const express = require("express");
const router = express.Router();

const hustlesController = require("../controllers/hustles.controller");
const authenticate = require("../middleware/auth.middleware");

router.post("/", authenticate, hustlesController.createHustle);

router.get("/", hustlesController.getHustles);

router.get("/:id", hustlesController.getHustleById);

module.exports = router;