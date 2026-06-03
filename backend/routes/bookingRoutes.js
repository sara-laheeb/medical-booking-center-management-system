const express = require("express");
const asyncHandler = require("../middleware/asyncHandler");
const validateId = require("../middleware/validateId");
const {
    getBookings,
    getBookingById,
    createBooking,
    updateBooking,
    deleteBooking
} = require("../controllers/bookingController");

const router = express.Router();

// Unified REST booking routes
router.get("/bookings", asyncHandler(getBookings));
router.get("/bookings/:id", validateId, asyncHandler(getBookingById));
router.post("/bookings", asyncHandler(createBooking));
router.put("/bookings/:id", validateId, asyncHandler(updateBooking));
router.delete("/bookings/:id", validateId, asyncHandler(deleteBooking));

module.exports = router;
