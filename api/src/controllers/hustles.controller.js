const Hustle = require("../models/hustle.model");

const createHustle = async (req, res) => {
    try {
        const { title, description, category, price, location } = req.body;

        // Check required fields
        if (!title || !description || !category || price === undefined || !location) {
            return res.status(400).json({
                success: false,
                message: "Title, description, category, price and location are required"
            });
        }

        const hustle = await Hustle.create({
            title,
            description,
            category,
            price,
            location,
            createdBy: req.user.id
        });

        return res.status(201).json({
            success: true,
            message: "Hustle created successfully",
            hustle
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred"
        });
    }
};

const getHustles = async (req, res) => {
    try {
        const hustles = await Hustle.find()
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Hustles retrieved successfully",
            hustles: hustles
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred"
        });
    }
};

const getHustleById = async (req, res) => {
    try {
        const hustle = await Hustle.findById(req.params.id)
            .populate("createdBy", "name email");

        if (!hustle) {
            return res.status(404).json({
                success: false,
                message: "Hustle not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Hustle retrieved successfully",
            hustle: hustle
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred"
        });
    }
};

const updateHustle = async (req, res) => {
    try {
        const { title, description, category, price, location } = req.body;

        const hustle = await Hustle.findById(req.params.id);

        if (!hustle) {
            return res.status(404).json({
                success: false,
                message: "Hustle not found"
            });
        }

        // Check ownership
        if (hustle.createdBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to update this hustle"
            });
        }

        // Update only fields that were provided
        if (title !== undefined) hustle.title = title;
        if (description !== undefined) hustle.description = description;
        if (category !== undefined) hustle.category = category;
        if (price !== undefined) hustle.price = price;
        if (location !== undefined) hustle.location = location;

        await hustle.save();

        return res.status(200).json({
            success: true,
            message: "Hustle updated successfully",
            hustle: hustle
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred"
        });
    }
};

module.exports = {
    createHustle,
    getHustles,
    getHustleById,
    updateHustle
};
