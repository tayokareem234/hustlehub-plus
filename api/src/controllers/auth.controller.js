const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user.model");
const logger = require("../utils/logger");

// ============================================
// REGISTER
// ============================================

const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body || {};

        // Validate required fields.
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        // Validate name.
        if (
            typeof name !== "string" ||
            name.trim().length < 2 ||
            name.trim().length > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Name must contain between 2 and 100 characters"
            });
        }

        // Validate email format.
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            typeof email !== "string" ||
            email.length > 254 ||
            !emailRegex.test(email.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address"
            });
        }

        // Validate password length.
        if (
            typeof password !== "string" ||
            password.length < 8 ||
            password.length > 128
        ) {
            return res.status(400).json({
                success: false,
                message: "Password must contain between 8 and 128 characters"
            });
        }

        // Public registration only permits clients and freelancers.
        const allowedRoles = ["client", "freelancer"];
        const requestedRole = role || "client";

        if (
            typeof requestedRole !== "string" ||
            !allowedRoles.includes(requestedRole)
        ) {
            return res.status(400).json({
                success: false,
                message: "Role must be either client or freelancer"
            });
        }

        // Normalise user input.
        const normalisedEmail = email.trim().toLowerCase();
        const normalisedName = name.trim();

        // Check whether the account already exists.
        const existingUser = await User.findOne({
            email: normalisedEmail
        });

        if (existingUser) {
            logger.warn("auth.registration_rejected", {
                requestId: req.requestId,
                reason: "account_already_exists"
            });

            return res.status(409).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        // Hash the password before storing it.
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the account.
        const user = new User({
            name: normalisedName,
            email: normalisedEmail,
            password: hashedPassword,
            role: requestedRole
        });

        await user.save();

        // Record successful registration.
        logger.info("auth.registration_succeeded", {
            requestId: req.requestId,
            userId: user._id.toString(),
            role: user.role
        });

        // Never return the password or password hash.
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        logger.error("auth.registration_failed", {
            requestId: req.requestId,
            errorName: error.name,
            errorMessage: error.message
        });

        // Handle duplicate email errors.
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred"
        });
    }
};

// ============================================
// LOGIN
// ============================================

const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        // Validate required fields.
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Validate email format.
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            typeof email !== "string" ||
            email.length > 254 ||
            !emailRegex.test(email.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address"
            });
        }

        // Validate password input.
        if (
            typeof password !== "string" ||
            password.length < 8 ||
            password.length > 128
        ) {
            logger.warn("auth.login_failed", {
                requestId: req.requestId,
                reason: "invalid_password_input"
            });

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Ensure JWT configuration exists before authenticating.
        if (!process.env.JWT_SECRET) {

            logger.error("auth.configuration_error", {
                requestId: req.requestId,
                reason: "jwt_secret_not_configured"
            });

            return res.status(500).json({
                success: false,
                message: "Authentication service is not configured"
            });
        }

        // Find the account.
        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {

            logger.warn("auth.login_failed", {
                requestId: req.requestId,
                reason: "account_not_found"
            });

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Compare the submitted password with its stored hash.
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {

            logger.warn("auth.login_failed", {
                requestId: req.requestId,
                reason: "password_mismatch"
            });

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Create a JWT containing the authenticated user's ID and role.
        const token = jwt.sign(
            {
                id: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h",
                algorithm: "HS256"
            }
        );

        // Only record successful login after password verification
        // and successful token generation.
        logger.info("auth.login_succeeded", {
            requestId: req.requestId,
            userId: user._id.toString(),
            role: user.role
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        logger.error("auth.login_error", {
            requestId: req.requestId,
            errorName: error.name,
            errorMessage: error.message
        });

        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred"
        });
    }
};

// ============================================
// EXPORT CONTROLLERS
// ============================================

module.exports = {
    register,
    login
};