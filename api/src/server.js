
require("dotenv").config();

const express = require("express");
const https = require("https");
const fs = require("fs");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

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
// HTTPS CONFIGURATION
// ============================================

const sslOptions = {
    key: fs.readFileSync(
        path.join(__dirname, "..", "ssl", "server.key")
    ),
    cert: fs.readFileSync(
        path.join(__dirname, "..", "ssl", "server.crt")
    )
};

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

// Protect booking creation from excessive requests.
const bookingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many booking requests. Please try again later."
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

// Apply booking rate limiting to booking creation.

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
    console.error("API ERROR:", err.message);

    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
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
        await connectDB();

        https.createServer(sslOptions, app).listen(PORT, () => {
            console.log(
                `HustleHub+ API running on https://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error("Failed to start HustleHub+ API:", error.message);
        process.exit(1);
    }
}

startServer();