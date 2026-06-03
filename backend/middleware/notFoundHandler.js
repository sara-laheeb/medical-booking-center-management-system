const { sendError } = require("../utils/apiResponse");

// Handle requests to undefined routes with a consistent JSON response
const notFoundHandler = (req, res) => {
    return sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};

module.exports = notFoundHandler;
