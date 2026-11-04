const mongoose = require("mongoose");

// ============================================
// API LIVENESS CHECK
// ============================================

// Confirms that the API process is running.
const healthCheck = (req, res) => {
    return res.status(200).json({
        success: true,
        message: "HustleHub+ API is running"
    });
};

// ============================================
// API READINESS CHECK
// ============================================

// Confirms that the API is running and MongoDB
// is successfully connected.
const readinessCheck = (req, res) => {

    const databaseConnected =
        mongoose.connection.readyState === 1;

    if (!databaseConnected) {
        return res.status(503).json({
            success: false,
            status: "not_ready",
            service: "hustlehub-api",

            checks: {
                database: {
                    status: "disconnected"
                }
            }
        });
    }

    return res.status(200).json({
        success: true,
        status: "ready",
        service: "hustlehub-api",

        checks: {
            database: {
                status: "connected"
            }
        }
    });
};

// ============================================
// EXPORT CONTROLLERS
// ============================================

module.exports = {
    healthCheck,
    readinessCheck
};