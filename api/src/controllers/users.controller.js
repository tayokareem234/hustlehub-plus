const User = require("../models/user.model");

const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile retrieved successfully",
            user: user
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred"
        });
    }
};

module.exports = {
    getMyProfile
};