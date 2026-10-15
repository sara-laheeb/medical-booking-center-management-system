/**
 * Authentication & Authorization Middleware
 * Verifies incoming JSON Web Tokens (Bearer) and enforces role-based route access controls.
 */

const jwt = require("jsonwebtoken");
const AppError = require("../errors/AppError");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_in_production";

// Verify the JWT token and attach the decoded user to req.user
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new AppError("Authentication required — please login first", 401));
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return next(new AppError("Invalid or expired token — please login again", 401));
    }
};

// Check if the authenticated user has one of the allowed roles
// Usage: authorize("admin") or authorize("admin", "doctor")
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    `Access denied — this action requires: ${roles.join(" or ")}`,
                    403
                )
            );
        }
        next();
    };
};

module.exports = { authenticate, authorize };