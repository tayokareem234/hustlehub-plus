/**
 * Checks whether the authenticated user has one of the
 * roles permitted to access a protected route.
 *
 * This middleware must run after auth.middleware.js.
 */

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required."
            });
        }

        const userRole = String(req.user.role || "")
            .trim()
            .toLowerCase();

        const permittedRoles = allowedRoles.map((role) =>
            String(role).trim().toLowerCase()
        );

        if (!permittedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to perform this action."
            });
        }

        next();
    };
};

module.exports = authorizeRoles;