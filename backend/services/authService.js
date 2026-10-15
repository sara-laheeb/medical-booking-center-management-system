/**
 * Authentication Service
 * Manages user credential verification, password hashing, JWT token lifecycle,
 * and user profile queries.
 */

const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const db       = require("../config/database");
const AppError = require("../errors/AppError");

const JWT_SECRET     = process.env.JWT_SECRET     || "dev_secret_change_in_production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// ── Helpers ────────────────────────────────────────────────────────────────

// Sign a JWT token containing the user's id, email and role
const generateToken = (user) =>
    jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );

// Fetch a user by id without exposing the password field
const getSafeUser = async (id) => {
    const [rows] = await db.query(
        "SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?",
        [id]
    );
    return rows[0] || null;
};

// ── Register ───────────────────────────────────────────────────────────────

const register = async ({ name, email, password, role = "patient" }) => {
    // Reject duplicate emails before hitting the database unique constraint
    const [existing] = await db.query(
        "SELECT id FROM users WHERE email = ?",
        [email.toLowerCase().trim()]
    );

    if (existing.length > 0) {
        throw new AppError("This email is already registered", 409);
    }

    // Hash the password before storing — never save plain text
    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await db.query(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name.trim(), email.toLowerCase().trim(), hashedPassword, role]
    );

    const user  = await getSafeUser(result.insertId);
    const token = generateToken(user);

    return { user, token };
};

// ── Login ──────────────────────────────────────────────────────────────────

const login = async ({ email, password }) => {
    const [rows] = await db.query(
        "SELECT id, name, email, password, role, is_active FROM users WHERE email = ?",
        [email.toLowerCase().trim()]
    );

    // Use the same error message for wrong email or wrong password
    // to avoid leaking which one is incorrect
    if (rows.length === 0) {
        throw new AppError("Invalid email or password", 401);
    }

    const user = rows[0];

    if (!user.is_active) {
        throw new AppError("Your account has been deactivated", 403);
    }

    // Compare the plain password against the stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new AppError("Invalid email or password", 401);
    }

    // Strip the password hash before returning the user object
    const { password: _removed, ...safeUser } = user;
    const token = generateToken(safeUser);

    return { user: safeUser, token };
};

// ── Get current user ───────────────────────────────────────────────────────

const getMe = async (userId) => {
    return getSafeUser(userId);
};

module.exports = { register, login, getMe };