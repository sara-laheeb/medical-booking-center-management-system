// Allowed booking status values stored in the database
const VALID_STATUSES = ["pending", "confirmed", "cancelled"];

// Default status assigned when a new booking is created
const DEFAULT_STATUS = "pending";

module.exports = {
    VALID_STATUSES,
    DEFAULT_STATUS
};
