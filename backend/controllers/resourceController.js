const resourceService = require("../services/resourceService");
const { sendSuccess, sendError } = require("../utils/apiResponse");

// GET /api/v1/resources — list all active bookable resources
const getResources = async (req, res) => {
    const resources = await resourceService.getAllResources(true);

    return sendSuccess(res, 200, "Resources fetched successfully", resources);
};

// GET /api/v1/resources/:id — return a single resource
const getResourceById = async (req, res) => {
    const resource = await resourceService.getResourceById(req.resourceId);

    if (!resource) {
        return sendError(res, 404, "Resource not found");
    }

    return sendSuccess(res, 200, "Resource fetched successfully", resource);
};

// GET /api/v1/resources/:id/availability — show booked slots for a date
const getResourceAvailability = async (req, res) => {
    const availability = await resourceService.getResourceAvailability(
        req.resourceId,
        req.query.date
    );

    return sendSuccess(res, 200, "Availability fetched successfully", availability);
};

module.exports = {
    getResources,
    getResourceById,
    getResourceAvailability
};
