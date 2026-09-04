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

module.exports = {
    createHustle,
    getHustles,
    getHustleById
};