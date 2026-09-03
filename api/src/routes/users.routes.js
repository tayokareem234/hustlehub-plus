const express = require("express");
const router = express.Router();

const usersController = require("../controllers/users.controller");
const authenticate = require("../middleware/auth.middleware");

router.get("/me", authenticate, usersController.getMyProfile);

router.put("/me", authenticate, usersController.updateMyProfile);

module.exports = router;