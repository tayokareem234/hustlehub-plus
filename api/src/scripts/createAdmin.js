require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

async function createAdmin() {
    const name = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

 if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from the environment.");
}

    if (!name || !email || !password) {
        throw new Error(
            "Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD before running this script."
        );
    }

    if (password.length < 12) {
        throw new Error(
            "The administrator password must contain at least 12 characters."
        );
    }

    const normalizedEmail = email.trim().toLowerCase();

    await mongoose.connect(process.env.MONGODB_URI);

    const existingUser = await User.findOne({
        email: normalizedEmail
    });

    if (existingUser) {
        throw new Error(
            "An account with this email already exists. " +
            "The script will not change an existing account's role."
        );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: passwordHash,
        role: "admin"
    });

    console.log("Administrator account created successfully.");
    console.log(`Administrator email: ${normalizedEmail}`);
}

createAdmin()
    .catch((error) => {
        console.error("Administrator creation failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });