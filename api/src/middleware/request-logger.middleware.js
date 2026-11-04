const crypto = require("crypto");
const logger = require("../utils/logger");

// ============================================
// HTTP REQUEST LOGGER
// ============================================

const requestLogger = (req, res, next) => {

    // Generate a unique ID for each request.
    const requestId = crypto.randomUUID();

    req.requestId = requestId;

    // Return the request ID in the response header.
    res.setHeader("X-Request-ID", requestId);

    // Record when the request started.
    const startTime = process.hrtime.bigint();

    // Log when the response has finished.
    res.on("finish", () => {

        const endTime = process.hrtime.bigint();

        const durationMs = Number(
            endTime - startTime
        ) / 1_000_000;

        const details = {
            requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            durationMs: Number(durationMs.toFixed(2))
        };

        if (res.statusCode >= 500) {

            logger.error(
                "http.request.failed",
                details
            );

        } else if (res.statusCode >= 400) {

            logger.warn(
                "http.request.rejected",
                details
            );

        } else {

            logger.info(
                "http.request.completed",
                details
            );

        }

    });

    next();
};

module.exports = requestLogger;