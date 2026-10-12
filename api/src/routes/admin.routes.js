const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const adminController = require("../controllers/admin.controller");

/**
 * GET /api/admin/users
 *
 * Only authenticated administrators can retrieve the user list.
 */
router.get(
    "/users",
    authenticate,
    authorizeRoles("admin"),
    adminController.getUsers
);

module.exports = router;