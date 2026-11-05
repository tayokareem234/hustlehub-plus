const mongoose = require("mongoose");
const Hustle = require("../models/hustle.model");
const logger = require("../utils/logger");

// ============================================
// VALIDATION HELPERS
// ============================================

const ALLOWED_FIELDS = [
    "title",
    "description",
    "category",
    "price",
    "location"
];

const TEXT_RULES = {
    title: {
        min: 3,
        max: 100
    },
    description: {
        min: 10,
        max: 2000
    },
    category: {
        min: 2,
        max: 50
    },
    location: {
        min: 2,
        max: 100
    }
};

// ============================================
// VALIDATE HUSTLE INPUT
// Supports both creation and partial updates
// ============================================

const validateHustleInput = (body, partial = false) => {

    // Check request body.
    if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body)
    ) {
        return {
            valid: false,
            message: "Invalid request body"
        };
    }

    // Prevent mass assignment of protected fields.
    const unexpectedFields = Object.keys(body).filter(
        (field) => !ALLOWED_FIELDS.includes(field)
    );

    if (unexpectedFields.length > 0) {
        return {
            valid: false,
            message: "Request contains unsupported fields"
        };
    }

    // Updates must contain at least one field.
    if (partial && Object.keys(body).length === 0) {
        return {
            valid: false,
            message: "At least one field must be provided"
        };
    }

    // Required fields for new hustles.
    const requiredFields = [
        "title",
        "description",
        "category",
        "price",
        "location"
    ];

    if (!partial) {

        const missingFields = requiredFields.filter(
            (field) =>
                body[field] === undefined ||
                body[field] === null ||
                body[field] === ""
        );

        if (missingFields.length > 0) {
            return {
                valid: false,
                message: "Title, description, category, price and location are required"
            };
        }
    }

    const data = {};

    // Validate and normalise text fields.
    for (const [field, rules] of Object.entries(TEXT_RULES)) {

        if (body[field] === undefined) {
            continue;
        }

        if (typeof body[field] !== "string") {
            return {
                valid: false,
                message: `${field} must be a text value`
            };
        }

        const value = body[field].trim();

        if (
            value.length < rules.min ||
            value.length > rules.max
        ) {
            return {
                valid: false,
                message: `${field} must contain between ${rules.min} and ${rules.max} characters`
            };
        }

        data[field] = value;
    }

    // Validate price separately.
    if (body.price !== undefined) {

        // HTML form values can arrive as strings.
        // Convert valid numeric strings into numbers.
        const price = typeof body.price === "string"
            ? Number(body.price.trim())
            : body.price;

        if (
            typeof price !== "number" ||
            !Number.isFinite(price) ||
            price < 0.01
        ) {
            return {
                valid: false,
                message: "Price must be a valid number of at least 0.01"
            };
        }

        data.price = price;
    }

    return {
        valid: true,
        data
    };
};

// ============================================
// STRUCTURED ERROR LOGGING
// ============================================

const logHustleError = (event, error, details = {}) => {

    logger.error(event, {
        ...details,
        errorName: error?.name || "Error",
        errorCode: error?.code
    });
};

// ============================================
// CREATE HUSTLE
// Freelancers only
// ============================================

const createHustle = async (req, res) => {

    try {

        const validation = validateHustleInput(req.body);

        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        const hustle = await Hustle.create({
            ...validation.data,
            createdBy: req.user.id
        });

        // Record successful service creation.
        logger.info("hustle.created", {
            hustleId: hustle._id.toString(),
            userId: req.user.id
        });

        return res.status(201).json({
            success: true,
            message: "Hustle created successfully",
            hustle
        });

    } catch (error) {

        logHustleError("hustle.create.failed", error, {
            userId: req.user?.id
        });

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Invalid hustle data"
            });
        }

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid hustle information"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to create hustle"
        });
    }
};

// ============================================
// GET ALL HUSTLES
// Public marketplace
// ============================================

const getHustles = async (req, res) => {

    try {

        const hustles = await Hustle.find()
            .populate("createdBy", "name")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Hustles retrieved successfully",
            hustles
        });

    } catch (error) {

        logHustleError("hustle.list.failed", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve hustles"
        });
    }
};

// ============================================
// GET HUSTLE BY ID
// Public route
// ============================================

const getHustleById = async (req, res) => {

    try {

        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid hustle ID"
            });
        }

        const hustle = await Hustle.findById(id)
            .populate("createdBy", "name");

        if (!hustle) {
            return res.status(404).json({
                success: false,
                message: "Hustle not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Hustle retrieved successfully",
            hustle
        });

    } catch (error) {

        logHustleError("hustle.get.failed", error, {
            hustleId: req.params.id
        });

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve hustle"
        });
    }
};

// ============================================
// UPDATE HUSTLE
// Owner only
// ============================================

const updateHustle = async (req, res) => {

    try {

        const { id } = req.params;

        // Validate the hustle ID.
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid hustle ID"
            });
        }

        // Validate only the fields being updated.
        const validation = validateHustleInput(
            req.body,
            true
        );

        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        const hustle = await Hustle.findById(id);

        if (!hustle) {
            return res.status(404).json({
                success: false,
                message: "Hustle not found"
            });
        }

        // Verify resource ownership.
        if (
            String(hustle.createdBy) !==
            String(req.user.id)
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to update this hustle"
            });
        }

        // Apply only validated fields.
        Object.assign(hustle, validation.data);

        await hustle.save();

        // Record successful update.
        logger.info("hustle.updated", {
            hustleId: hustle._id.toString(),
            userId: req.user.id
        });

        return res.status(200).json({
            success: true,
            message: "Hustle updated successfully",
            hustle
        });

    } catch (error) {

        logHustleError("hustle.update.failed", error, {
            userId: req.user?.id,
            hustleId: req.params.id
        });

        if (
            error.name === "ValidationError" ||
            error.name === "CastError"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid hustle information"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to update hustle"
        });
    }
};

// ============================================
// DELETE HUSTLE
// Owner only
// ============================================

const deleteHustle = async (req, res) => {

    try {

        const { id } = req.params;

        // Validate the hustle ID.
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid hustle ID"
            });
        }

        const hustle = await Hustle.findById(id);

        if (!hustle) {
            return res.status(404).json({
                success: false,
                message: "Hustle not found"
            });
        }

        // Verify resource ownership.
        if (
            String(hustle.createdBy) !==
            String(req.user.id)
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to delete this hustle"
            });
        }

        await hustle.deleteOne();

        // Record successful deletion.
        logger.info("hustle.deleted", {
            hustleId: id,
            userId: req.user.id
        });

        return res.status(200).json({
            success: true,
            message: "Hustle deleted successfully"
        });

    } catch (error) {

        logHustleError("hustle.delete.failed", error, {
            userId: req.user?.id,
            hustleId: req.params.id
        });

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid hustle ID"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to delete hustle"
        });
    }
};

// ============================================
// EXPORT CONTROLLERS
// ============================================

module.exports = {
    createHustle,
    getHustles,
    getHustleById,
    updateHustle,
    deleteHustle
};