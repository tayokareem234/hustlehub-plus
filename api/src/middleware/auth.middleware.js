const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
    try {
        // 1. Check whether the Authorization header exists.
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        // 2. Validate the Bearer token format.
        const parts = authHeader.trim().split(/\s+/);

        if (
            parts.length !== 2 ||
            parts[0] !== "Bearer" ||
            !parts[1]
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format. Use Bearer <token>."
            });
        }

        const token = parts[1];

        // 3. Ensure the JWT secret is configured.
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not configured.");

            return res.status(500).json({
                success: false,
                message: "Authentication service is not configured"
            });
        }

        // 4. Verify the token's signature and expiration.
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            {
                algorithms: ["HS256"]
            }
        );

        // 5. Validate the user ID contained in the token.
        if (
            !decoded ||
            typeof decoded.id !== "string" ||
            !decoded.id.trim()
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token"
            });
        }

        // 6. Attach the authenticated user to the request.
        req.user = {
            id: decoded.id,
            role: decoded.role
        };

        // 7. Continue to the protected route.
        return next();

    } catch (error) {
        if (
            error.name === "TokenExpiredError" ||
            error.name === "JsonWebTokenError" ||
            error.name === "NotBeforeError"
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token"
            });
        }

        console.error("AUTHENTICATION ERROR:", error.message);

        return res.status(500).json({
            success: false,
            message: "An authentication error occurred"
        });
    }
};

module.exports = authenticate;