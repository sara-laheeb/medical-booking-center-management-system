const AppError = require("../errors/AppError");

// Validate YYYY-MM-DD date format
const isValidDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00`);

    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

// Validate HH:MM or HH:MM:SS time format
const isValidTime = (value) => {
    return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value);
};

// Validate email format when provided
const isValidEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

// Normalize and validate customer name
const sanitizeName = (name) => {
    if (typeof name !== "string") {
        return "";
    }

    return name.trim();
};

// Parse pagination query parameters with safe defaults
const parsePagination = (query) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);

    return { page, limit, offset: (page - 1) * limit };
};

// Normalize time value to HH:MM:SS
const normalizeTime = (time) => {
    if (/^\d{2}:\d{2}$/.test(time)) {
        return `${time}:00`;
    }

    return time;
};

// Validate booking create payload
const validateCreateBookingPayload = (body) => {
    const name = sanitizeName(body.name);
    const { booking_date, resource_id, email, start_time, end_time, notes } = body;

    if (!name || name.length < 2) {
        throw new AppError("Name must be at least 2 characters", 400);
    }

    if (!booking_date || !isValidDate(booking_date)) {
        throw new AppError("booking_date must be a valid date (YYYY-MM-DD)", 400);
    }

    if (!resource_id || Number.isNaN(parseInt(resource_id, 10)) || parseInt(resource_id, 10) <= 0) {
        throw new AppError("A valid resource_id is required", 400);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDate = new Date(`${booking_date}T00:00:00`);

    if (requestedDate < today) {
        throw new AppError("booking_date cannot be in the past", 400);
    }

    if (email !== undefined && email !== null && email !== "" && !isValidEmail(email)) {
        throw new AppError("Invalid email format", 400);
    }

    const startTime = normalizeTime(start_time || "09:00");
    const endTime = normalizeTime(end_time || "10:00");

    if (!isValidTime(startTime) || !isValidTime(endTime)) {
        throw new AppError("start_time and end_time must be valid (HH:MM)", 400);
    }

    if (startTime >= endTime) {
        throw new AppError("end_time must be after start_time", 400);
    }

    return {
        name,
        booking_date,
        resource_id: parseInt(resource_id, 10),
        email: email || null,
        start_time: startTime,
        end_time: endTime,
        notes: notes || null
    };
};

// Validate booking update payload fields
const validateUpdateBookingPayload = (body, updates) => {
    if (Object.keys(updates).length === 0) {
        throw new AppError("No fields provided for update", 400);
    }

    if (updates.name !== undefined) {
        updates.name = sanitizeName(updates.name);

        if (updates.name.length < 2) {
            throw new AppError("Name must be at least 2 characters", 400);
        }
    }

    if (updates.booking_date !== undefined && !isValidDate(updates.booking_date)) {
        throw new AppError("booking_date must be a valid date (YYYY-MM-DD)", 400);
    }

    if (updates.email !== undefined && updates.email !== null && updates.email !== "" && !isValidEmail(updates.email)) {
        throw new AppError("Invalid email format", 400);
    }

    if (updates.start_time !== undefined) {
        updates.start_time = normalizeTime(updates.start_time);

        if (!isValidTime(updates.start_time)) {
            throw new AppError("start_time must be valid (HH:MM)", 400);
        }
    }

    if (updates.end_time !== undefined) {
        updates.end_time = normalizeTime(updates.end_time);

        if (!isValidTime(updates.end_time)) {
            throw new AppError("end_time must be valid (HH:MM)", 400);
        }
    }

    if (updates.start_time && updates.end_time && updates.start_time >= updates.end_time) {
        throw new AppError("end_time must be after start_time", 400);
    }

    return updates;
};

module.exports = {
    isValidDate,
    isValidTime,
    isValidEmail,
    sanitizeName,
    parsePagination,
    normalizeTime,
    validateCreateBookingPayload,
    validateUpdateBookingPayload
};
