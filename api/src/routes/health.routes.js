const express = require("express");

const {
    healthCheck,
    readinessCheck
} = require("../controllers/health.controller");

const router = express.Router();

// ============================================
// HEALTH CHECK ROUTES
// ============================================

// API liveness check.
router.get("/", healthCheck);

// Explicit API liveness endpoint.
router.get("/live", healthCheck);

// API and MongoDB readiness check.
router.get("/ready", readinessCheck);

module.exports = router;