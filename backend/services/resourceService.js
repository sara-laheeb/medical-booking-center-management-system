const db = require("../config/db");
const AppError = require("../errors/AppError");
const { isValidDate } = require("../utils/validation");

// Fetch all bookable resources
const getAllResources = async (activeOnly = true) => {
    let sql = "SELECT id, name, type, description, is_active, created_at FROM resources";
    const params = [];

    if (activeOnly) {
        sql += " WHERE is_active = 1";
    }

    sql += " ORDER BY name ASC";

    const [rows] = await db.query(sql, params);

    return rows;
};

// Fetch a single resource by ID
const getResourceById = async (resourceId) => {
    const [rows] = await db.query(
        "SELECT id, name, type, description, is_active, created_at FROM resources WHERE id = ?",
        [resourceId]
    );

    return rows[0] || null;
};

// Return booked time slots for a resource on a specific date
const getResourceAvailability = async (resourceId, date) => {
    if (!isValidDate(date)) {
        throw new AppError("date must be a valid date (YYYY-MM-DD)", 400);
    }

    const resource = await getResourceById(resourceId);

    if (!resource || !resource.is_active) {
        throw new AppError("Resource not found or inactive", 404);
    }

    const [bookings] = await db.query(
        `SELECT id, name, start_time, end_time, status
         FROM bookings
         WHERE resource_id = ?
         AND booking_date = ?
         AND deleted_at IS NULL
         AND status != 'cancelled'
         ORDER BY start_time ASC`,
        [resourceId, date]
    );

    return {
        resource,
        date,
        booked_slots: bookings
    };
};

module.exports = {
    getAllResources,
    getResourceById,
    getResourceAvailability
};
