const express = require("express");

const app = express();

const PORT = 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "HustleHub+ API is running"
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`HustleHub+ API running on http://localhost:${PORT}`);
});