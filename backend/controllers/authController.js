/**
 * Authentication Controller
 * Handles user registration, credentials authentication (login), and session verification (/me).
 */

'use strict';

const authService = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Register a new user (Patient with immediate access or Doctor pending administrative approval).
 * POST /api/v1/auth/register
 */
const register = async (req, res) => {
    const {
        name,
        email,
        phone,
        password,
        role = 'patient',
        specialty_id,
        license_number,
        verification_documents,
        notes
    } = req.body;

    // Validate fundamental identity attributes
    if (!name || !email || !password) {
        return sendError(
            res,
            'Name, email and password are required',
            400
        );
    }

    if (password.length < 6) {
        return sendError(
            res,
            'Password must be at least 6 characters',
            400
        );
    }

    // Guard against unauthorized registration of privileged administration roles
    if (['admin', 'receptionist', 'pharmacist'].includes(role)) {
        return sendError(
            res,
            'Public registration is restricted to patients and doctors only',
            403
        );
    }

    // Role-specific field validation
    if (role === 'doctor') {
        if (!specialty_id) {
            return sendError(res, 'Medical specialty is required for doctor registration', 400);
        }
        if (!license_number) {
            return sendError(res, 'Medical license number is required for doctor registration', 400);
        }
    }

    // Forward registration payload to authentication service
    const result = await authService.register({
        name,
        email,
        phone,
        password,
        role,
        specialty_id,
        license_number,
        verification_documents,
        notes
    });

    if (result.pending) {
        return sendSuccess(
            res,
            result,
            'Doctor registration request submitted successfully. Account is pending administrator approval.',
            201
        );
    }

    return sendSuccess(
        res,
        result,
        'Registration successful',
        201
    );
};

/**
 * Authenticate user.
 * POST /api/v1/auth/login
 */
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return sendError(
            res,
            'Email and password are required',
            400
        );
    }

    const result = await authService.login({
        email,
        password
    });

    return sendSuccess(
        res,
        result,
        'Login successful',
        200
    );
};

/**
 * Get authenticated user profile.
 * GET /api/v1/auth/me
 */
const getMe = async (req, res) => {
    const user = await authService.getMe(req.user.id);

    if (!user) {
        return sendError(
            res,
            'User not found',
            404
        );
    }

    return sendSuccess(
        res,
        user,
        'Profile fetched successfully',
        200
    );
};

module.exports = {
    register,
    login,
    getMe
};