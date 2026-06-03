const { sendError } = require("../utils/apiResponse");

// Global Express error handler for operational and unexpected failures
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === "production";

    if (statusCode >= 500) {
        console.error("Unhandled error ❌", err);
    }

    const message = statusCode >= 500 && isProduction
        ? "Internal server error"
        : err.message || "Internal server error";

    return sendError(res, statusCode, message);
};

module.exports = errorHandler;
