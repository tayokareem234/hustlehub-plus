require("dotenv").config();

const express = require("express");

const connectDB = require("./utils/db");

const healthRoutes = require("./routes/health.routes");

const authRoutes = require("./routes/auth.routes");

const usersRoutes = require("./routes/users.routes");

const hustlesRoutes = require("./routes/hustles.routes");

const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use("/api/health", healthRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/users", usersRoutes);

app.use("/api/hustles", hustlesRoutes);



// Start the server
connectDB();

app.listen(PORT, () => {
    console.log(`HustleHub+ API running on http://localhost:${PORT}`);
});