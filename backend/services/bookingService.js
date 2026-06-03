const db = require("../config/db");
const AppError = require("../errors/AppError");
const { VALID_STATUSES, DEFAULT_STATUS } = require("../constants/bookingStatus");
const {
    parsePagination,
    validateCreateBookingPayload,
    validateUpdateBookingPayload
} = require("../utils/validation");

const BOOKING_FIELDS = `
        b.id,
        b.resource_id,
        r.name AS resource_name,
        r.type AS resource_type,
        b.name,
        b.email,
        b.booking_date,
        b.start_time,
        b.end_time,
        b.status,
        b.notes,
        b.created_at,
        b.updated_at
`;

const BOOKING_FROM = `
    FROM bookings b
    INNER JOIN resources r ON b.resource_id = r.id
`;

// Convert MySQL TIME value to HH:MM:SS string
const formatTime = (value) => {
    if (typeof value === "string") {
        return value.length === 5 ? `${value}:00` : value;
    }

    if (value instanceof Date) {
        return value.toISOString().substring(11, 19);
    }

    return String(value);
};

// Check whether a resource exists and is active
const assertResourceIsBookable = async (resourceId) => {
    const [rows] = await db.query(
        "SELECT id FROM resources WHERE id = ? AND is_active = 1",
        [resourceId]
    );

    if (rows.length === 0) {
        throw new AppError("Resource not found or inactive", 404);
    }
};

// Detect overlapping bookings for the same resource and date
const hasBookingConflict = async ({ resourceId, bookingDate, startTime, endTime, excludeId = null }) => {
    let sql = `
        SELECT id FROM bookings
        WHERE resource_id = ?
        AND booking_date = ?
        AND deleted_at IS NULL
        AND status != 'cancelled'
        AND start_time < ?
        AND end_time > ?
    `;
    const params = [resourceId, bookingDate, endTime, startTime];

    if (excludeId) {
        sql += " AND id != ?";
        params.push(excludeId);
    }

    const [rows] = await db.query(sql, params);

    return rows.length > 0;
};

// Fetch bookings with optional filters and pagination
const getBookings = async (query = {}) => {
    const { page, limit, offset } = parsePagination(query);
    const conditions = ["b.deleted_at IS NULL"];
    const params = [];

    if (query.status) {
        conditions.push("b.status = ?");
        params.push(query.status);
    }

    if (query.date) {
        conditions.push("b.booking_date = ?");
        params.push(query.date);
    }

    if (query.resource_id) {
        conditions.push("b.resource_id = ?");
        params.push(parseInt(query.resource_id, 10));
    }

    if (query.search) {
        conditions.push("(b.name LIKE ? OR b.email LIKE ?)");
        const term = `%${query.search.trim()}%`;
        params.push(term, term);
    }

    const whereClause = conditions.join(" AND ");

    const [countRows] = await db.query(
        `SELECT COUNT(*) AS total FROM bookings b WHERE ${whereClause}`,
        params
    );

    const total = countRows[0].total;

    const [rows] = await db.query(
        `SELECT ${BOOKING_FIELDS} ${BOOKING_FROM}
         WHERE ${whereClause}
         ORDER BY b.booking_date ASC, b.start_time ASC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    return {
        bookings: rows,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1
        }
    };
};

// Fetch a single booking by ID
const getBookingById = async (bookingId) => {
    const [rows] = await db.query(
        `SELECT ${BOOKING_FIELDS} ${BOOKING_FROM}
         WHERE b.deleted_at IS NULL AND b.id = ?`,
        [bookingId]
    );

    return rows[0] || null;
};

// Create a new booking with conflict prevention
const createBooking = async (body) => {
    const payload = validateCreateBookingPayload(body);

    await assertResourceIsBookable(payload.resource_id);

    const conflict = await hasBookingConflict({
        resourceId: payload.resource_id,
        bookingDate: payload.booking_date,
        startTime: payload.start_time,
        endTime: payload.end_time
    });

    if (conflict) {
        throw new AppError("This time slot is already booked for the selected resource", 409);
    }

    const [result] = await db.query(
        `INSERT INTO bookings
        (resource_id, name, email, booking_date, start_time, end_time, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            payload.resource_id,
            payload.name,
            payload.email,
            payload.booking_date,
            payload.start_time,
            payload.end_time,
            DEFAULT_STATUS,
            payload.notes
        ]
    );

    return getBookingById(result.insertId);
};

// Build a safe partial update payload from allowed fields only
const buildUpdatePayload = (body) => {
    const allowedFields = [
        "name", "email", "booking_date", "start_time", "end_time",
        "status", "resource_id", "notes"
    ];
    const updates = {};

    for (const key of allowedFields) {
        if (body[key] !== undefined) {
            updates[key] = body[key];
        }
    }

    return updates;
};

// Update a booking by ID and return the updated record
const updateBookingById = async (bookingId, body) => {
    const existing = await getBookingById(bookingId);

    if (!existing) {
        return null;
    }

    let updates = buildUpdatePayload(body);

    if (updates.status !== undefined && !VALID_STATUSES.includes(updates.status)) {
        throw new AppError("Invalid status value", 400);
    }

    updates = validateUpdateBookingPayload(body, updates);

    const merged = {
        resource_id: updates.resource_id ?? existing.resource_id,
        booking_date: updates.booking_date ?? existing.booking_date,
        start_time: formatTime(updates.start_time ?? existing.start_time),
        end_time: formatTime(updates.end_time ?? existing.end_time)
    };

    if (updates.resource_id !== undefined) {
        await assertResourceIsBookable(merged.resource_id);
    }

    const conflict = await hasBookingConflict({
        resourceId: merged.resource_id,
        bookingDate: merged.booking_date,
        startTime: merged.start_time,
        endTime: merged.end_time,
        excludeId: bookingId
    });

    if (conflict) {
        throw new AppError("This time slot is already booked for the selected resource", 409);
    }

    const setClause = Object.keys(updates)
        .map((field) => `${field} = ?`)
        .join(", ");

    const values = Object.values(updates);

    await db.query(
        `UPDATE bookings SET ${setClause} WHERE id = ? AND deleted_at IS NULL`,
        [...values, bookingId]
    );

    return getBookingById(bookingId);
};

// Soft-delete a booking (sets deleted_at and cancels status)
const softDeleteBookingById = async (bookingId) => {
    const [result] = await db.query(
        `UPDATE bookings
         SET deleted_at = CURRENT_TIMESTAMP, status = 'cancelled'
         WHERE id = ? AND deleted_at IS NULL`,
        [bookingId]
    );

    return result.affectedRows > 0;
};

module.exports = {
    getBookings,
    getBookingById,
    createBooking,
    updateBookingById,
    softDeleteBookingById
};
