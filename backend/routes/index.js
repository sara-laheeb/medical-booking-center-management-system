const express = require("express");
const bookingRoutes = require("./bookingRoutes");
const resourceRoutes = require("./resourceRoutes");

const router = express.Router();

// Mount versioned API modules
router.use("/", bookingRoutes);
router.use("/", resourceRoutes);

module.exports = router;
