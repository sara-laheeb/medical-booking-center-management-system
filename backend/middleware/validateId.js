const { sendError } = require("../utils/apiResponse");

// Validate :id route parameter and attach a numeric bookingId to the request
const validateId = (req, res, next) => {
    const bookingId = parseInt(req.params.id, 10);

    if (Number.isNaN(bookingId) || bookingId <= 0) {
        return sendError(res, 400, "Invalid booking ID");
    }

    req.bookingId = bookingId;
    next();
};

module.exports = validateId;
