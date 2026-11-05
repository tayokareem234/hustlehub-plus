const User = require("../models/user.model");

// Email validation pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================
// GET MY PROFILE
// ============================================

const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile retrieved successfully",
            user
        });

    } catch (error) {
        console.error(
            "GET PROFILE ERROR:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve profile"
        });
    }
};


// ============================================
// UPDATE MY PROFILE
// ============================================

const updateMyProfile = async (req, res) => {
    try {
        const body = req.body;

        // Validate request body
        if (
            !body ||
            typeof body !== "object" ||
            Array.isArray(body)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid request body"
            });
        }

        // Only allow name and email updates.
        // Prevent mass assignment of protected fields.
        const allowedFields = ["name", "email"];

        const unexpectedFields = Object.keys(body).filter(
            (field) => !allowedFields.includes(field)
        );

        if (unexpectedFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Only name and email can be updated"
            });
        }

        const { name, email } = body;

        if (name === undefined && email === undefined) {
            return res.status(400).json({
                success: false,
                message: "Name or email is required"
            });
        }

        // Validate name
        if (name !== undefined) {
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
        }

        // Validate email
        let normalisedEmail;

        if (email !== undefined) {
            if (typeof email !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Email must be a valid string"
                });
            }

            normalisedEmail = email.trim().toLowerCase();

            if (
                normalisedEmail.length > 254 ||
                !EMAIL_REGEX.test(normalisedEmail)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide a valid email address"
                });
            }
        }

        // Retrieve authenticated user
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check whether another account already uses this email.
        if (normalisedEmail) {
            const existingUser = await User.findOne({
                email: normalisedEmail,
                _id: { $ne: user._id }
            }).select("_id");

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "Email address is already registered"
                });
            }

            user.email = normalisedEmail;
        }

        // Apply validated name
        if (name !== undefined) {
            user.name = name.trim();
        }

        await user.save();

        // Return only safe account information
        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });

    } catch (error) {
        console.error(
            "UPDATE PROFILE ERROR:",
            error.message
        );

        // Handle duplicate email database errors
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email address is already registered"
            });
        }

        // Handle database validation errors
        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Invalid profile information"
            });
        }

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid profile information"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to update profile"
        });
    }
};


// ============================================
// EXPORT CONTROLLERS
// ============================================

module.exports = {
    getMyProfile,
    updateMyProfile
};