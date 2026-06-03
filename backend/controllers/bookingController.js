const bookingService = require("../services/bookingService");
const { sendSuccess, sendError } = require("../utils/apiResponse");

// GET /api/v1/bookings — list bookings with filters and pagination
const getBookings = async (req, res) => {
    const result = await bookingService.getBookings(req.query);

    return sendSuccess(res, 200, "Bookings fetched successfully", result);
};

// GET /api/v1/bookings/:id — return a single booking
const getBookingById = async (req, res) => {
    const booking = await bookingService.getBookingById(req.bookingId);

    if (!booking) {
        return sendError(res, 404, "Booking not found");
    }

    return sendSuccess(res, 200, "Booking fetched successfully", booking);
};

// POST /api/v1/bookings — create a new booking
const createBooking = async (req, res) => {
    const newBooking = await bookingService.createBooking(req.body);

    return sendSuccess(res, 201, "Booking created successfully", newBooking);
};

// PUT /api/v1/bookings/:id — partially update a booking
const updateBooking = async (req, res) => {
    const updatedBooking = await bookingService.updateBookingById(req.bookingId, req.body);

    if (!updatedBooking) {
        return sendError(res, 404, "Booking not found");
    }

    return sendSuccess(res, 200, "Booking updated successfully", updatedBooking);
};

// DELETE /api/v1/bookings/:id — soft-delete a booking
const deleteBooking = async (req, res) => {
    const deleted = await bookingService.softDeleteBookingById(req.bookingId);

    if (!deleted) {
        return sendError(res, 404, "Booking not found");
    }

    return sendSuccess(res, 200, "Booking deleted successfully");
};

module.exports = {
    getBookings,
    getBookingById,
    createBooking,
    updateBooking,
    deleteBooking
};
