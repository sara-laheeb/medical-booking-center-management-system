const { sendError } = require("../utils/apiResponse");

// Validate :id route parameter and attach a numeric resourceId to the request
const validateResourceId = (req, res, next) => {
    const resourceId = parseInt(req.params.id, 10);

    if (Number.isNaN(resourceId) || resourceId <= 0) {
        return sendError(res, 400, "Invalid resource ID");
    }

    req.resourceId = resourceId;
    next();
};

module.exports = validateResourceId;
