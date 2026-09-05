require("dotenv").config();

const express = require("express");
const https = require("https");
const fs = require("fs");
const path = require("path");

const connectDB = require("./utils/db");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const hustlesRoutes = require("./routes/hustles.routes");

const app = express();

const PORT = process.env.PORT || 3000;

// Load local SSL certificate and private key
const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, "..", "ssl", "server.key")),
cert: fs.readFileSync(path.join(__dirname, "..", "ssl", "server.crt"))
};

// Middleware
app.use(express.json());

// Routes
app.use("/api/health", healthRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/users", usersRoutes);

app.use("/api/hustles", hustlesRoutes);

// Connect to MongoDB
connectDB();

// Start HTTPS server
https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`HustleHub+ API running on https://localhost:${PORT}`);
});