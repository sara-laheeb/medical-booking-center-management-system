const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const validateResourceId = require("../middleware/validateResourceId");
const {
    getResources,
    getResourceById,
    getResourceAvailability
} = require("../controllers/resourceController");

const router = express.Router();

// Resource and availability routes
router.get("/resources", asyncHandler(getResources));
router.get("/resources/:id/availability", validateResourceId, asyncHandler(getResourceAvailability));
router.get("/resources/:id", validateResourceId, asyncHandler(getResourceById));

module.exports = router;
