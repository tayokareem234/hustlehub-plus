const express = require("express");

const router = express.Router();

const bookingsController = require("../controllers/bookings.controller");
const authenticate = require("../middleware/auth.middleware");
const rateLimit = require("express-rate-limit");

// ============================================
// RATE LIMITING
// ============================================

const bookingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many booking requests. Please try again later."
    }
});

// ============================================
// CLIENT BOOKING ROUTES
// ============================================

// Only clients can create bookings.
router.post(
    "/",
    authenticate,
    (req, res, next) => {
        if (req.user.role !== "client") {
            return res.status(403).json({
                success: false,
                message: "Only clients can book services"
            });
        }

        next();
    },
    bookingLimiter,
    bookingsController.createBooking
);

// Only the authenticated client who owns the booking
// can cancel it. The controller verifies ownership.
router.patch(
    "/:id/cancel",
    authenticate,
    bookingLimiter,
    bookingsController.cancelBooking
);

// Retrieve bookings belonging to the logged-in client.
router.get(
    "/client",
    authenticate,
    (req, res, next) => {
        if (req.user.role !== "client") {
            return res.status(403).json({
                success: false,
                message: "Only clients can access client bookings"
            });
        }

        next();
    },
    bookingsController.getClientBookings
);

// ============================================
// FREELANCER BOOKING AND INCOME ROUTES
// ============================================

// Retrieve bookings for the logged-in freelancer.
router.get(
    "/freelancer",
    authenticate,
    (req, res, next) => {
        if (req.user.role !== "freelancer") {
            return res.status(403).json({
                success: false,
                message: "Only freelancers can access freelancer bookings"
            });
        }

        next();
    },
    bookingsController.getFreelancerBookings
);

// Retrieve income belonging to the logged-in freelancer.
router.get(
    "/freelancer/income",
    authenticate,
    (req, res, next) => {
        if (req.user.role !== "freelancer") {
            return res.status(403).json({
                success: false,
                message: "Only freelancers can access freelancer income"
            });
        }

        next();
    },
    bookingsController.getFreelancerIncome
);

module.exports = router;