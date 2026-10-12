const User = require("../models/user.model");

/**
 * Return a list of registered users for the administrator dashboard.
 *
 * Passwords and password hashes are deliberately excluded.
 * This endpoint is protected by the administrator route middleware.
 */
const getUsers = async (req, res) => {
    try {
        const users = await User.find({})
            .select("name email role createdAt")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error(
            "Administrator user-list request failed:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve users at this time."
        });
    }
};

module.exports = {
    getUsers
};