const mongoose = require("mongoose");
const logger = require("./logger");

// ============================================
// DATABASE CONNECTION
// ============================================

const connectDB = async () => {

    try {

        await mongoose.connect(process.env.MONGODB_URI);

        logger.info("database.connected", {
            database: "mongodb"
        });

    } catch (error) {

        logger.error("database.connection_failed", {
            database: "mongodb",
            errorMessage: error.message
        });

        process.exit(1);

    }

};

module.exports = connectDB;