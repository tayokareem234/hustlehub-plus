require("dotenv").config();

const express = require("express");

const healthRoutes = require("./routes/health.routes");

const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use("/api/health", healthRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`HustleHub+ API running on http://localhost:${PORT}`);
});