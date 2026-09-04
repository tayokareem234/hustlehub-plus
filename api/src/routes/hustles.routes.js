const express = require("express");
const router = express.Router();

const hustlesController = require("../controllers/hustles.controller");
const authenticate = require("../middleware/auth.middleware");

router.post("/", authenticate, hustlesController.createHustle);

router.get("/", hustlesController.getHustles);

router.get("/:id", hustlesController.getHustleById);

router.put("/:id", authenticate, hustlesController.updateHustle);

router.delete("/:id", authenticate, hustlesController.deleteHustle);


module.exports = router;