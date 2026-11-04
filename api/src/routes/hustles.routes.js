const express = require("express");
const router = express.Router();

const hustlesController = require("../controllers/hustles.controller");
const authenticate = require("../middleware/auth.middleware");

// ============================================
// ROLE-BASED ACCESS CONTROL
// ============================================

const requireFreelancer = (req, res, next) => {
    if (!req.user || req.user.role !== "freelancer") {
        return res.status(403).json({
            success: false,
            message: "Only freelancers can manage services"
        });
    }

    next();
};

// ============================================
// CREATE A SERVICE
// Only authenticated freelancers can create services.
// ============================================

router.post(
    "/",
    authenticate,
    requireFreelancer,
    hustlesController.createHustle
);

// ============================================
// PUBLIC MARKETPLACE ROUTES
// Anyone can view available services.
// ============================================

router.get(
    "/",
    hustlesController.getHustles
);

router.get(
    "/:id",
    hustlesController.getHustleById
);

// ============================================
// UPDATE A SERVICE
// Only freelancers can update services.
// Ownership is verified by the controller.
// ============================================

router.put(
    "/:id",
    authenticate,
    requireFreelancer,
    hustlesController.updateHustle
);

// ============================================
// DELETE A SERVICE
// Only freelancers can delete services.
// Ownership is verified by the controller.
// ============================================

router.delete(
    "/:id",
    authenticate,
    requireFreelancer,
    hustlesController.deleteHustle
);

module.exports = router;