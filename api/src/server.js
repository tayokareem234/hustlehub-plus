require("dotenv").config();

const express = require("express");
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const logger = require("./utils/logger");
const requestLogger = require("./middleware/request-logger.middleware");

const connectDB = require("./utils/db");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const hustlesRoutes = require("./routes/hustles.routes");
const bookingsRoutes = require("./routes/bookings.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

const PORT = process.env.PORT || 3000;

// ============================================
// SECURITY HEADERS
// ============================================

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                baseUri: ["'self'"],
                objectSrc: ["'none'"],
                frameAncestors: ["'none'"],
                formAction: ["'self'"],
                upgradeInsecureRequests: null
            }
        }
    })
);

// ============================================
// STRUCTURED REQUEST LOGGING
// ============================================

app.use(requestLogger);

// ============================================
// REQUEST BODY PARSING
// ============================================

app.use(
    express.json({
        limit: "10kb"
    })
);

// ============================================
// RATE LIMITING
// ============================================

// Protect registration and login from excessive requests.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many authentication requests. Please try again later."
    }
});

// ============================================
// ROUTES
// ============================================

app.use("/api/health", healthRoutes);

// Apply authentication rate limiting to register and login.
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/login", authLimiter);

app.use("/api/auth", authRoutes);

app.use("/api/users", usersRoutes);

app.use("/api/hustles", hustlesRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/bookings", bookingsRoutes);

// ============================================
// NOT FOUND HANDLER
// ============================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found"
    });
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
    logger.error("api.unhandled_error", {
    requestId: req.requestId,
    errorName: err.name,
    errorMessage: err.message
});

    if (res.headersSent) {
        return next(err);
    }

    if (
        err instanceof SyntaxError &&
        err.status === 400 &&
        "body" in err
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON request body"
        });
    }

    return res.status(500).json({
        success: false,
        message: "An unexpected server error occurred"
    });
});

// ============================================
// DATABASE CONNECTION AND SERVER STARTUP
// ============================================

async function startServer() {
    try {
        // Connect to MongoDB before starting the API.
        await connectDB();

        // Local development uses HTTPS.
        // Docker uses HTTP internally.
        const useHttps = process.env.HTTPS_ENABLED !== "false";

        let server;
        let protocol;

        if (useHttps) {
            const sslOptions = {
                key: fs.readFileSync(
                    path.join(__dirname, "..", "ssl", "server.key")
                ),
                cert: fs.readFileSync(
                    path.join(__dirname, "..", "ssl", "server.crt")
                )
            };

            server = https.createServer(sslOptions, app);
            protocol = "https";
        } else {
            server = http.createServer(app);
            protocol = "http";
        }

        // Handle server startup errors.
        server.on("error", (error) => {
            console.error("HustleHub+ server error:", error.message);
            process.exit(1);
        });

        // Start the API exactly once.
        server.listen(PORT, "0.0.0.0", () => {
           logger.info("server.started", {
    protocol,
    host: "0.0.0.0",
    port: Number(PORT)
});
        });

        return server;

    } catch (error) {
       logger.error("server.start_failed", {
    errorMessage: error.message
});

        process.exit(1);
    }
}

// ============================================
// EXPORT EXPRESS APPLICATION
// ============================================

// Jest and Supertest can import the app without
// starting another server or database connection.

module.exports = app;

// ============================================
// START SERVER ONLY WHEN RUN DIRECTLY
// ============================================

// This block must only appear ONCE in this file.

if (require.main === module) {
    startServer();
}