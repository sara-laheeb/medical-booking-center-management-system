/**
 * 404 Not Found Middleware
 * Catches any request that does not match a registered route and returns a JSON 404 response.
 */

const { sendError } = require("../utils/apiResponse");

const notFoundHandler = (req, res) => {
  return sendError(
    res,
    `Route not found: ${req.method} ${req.originalUrl}`,
    404
  );
};

module.exports = notFoundHandler;