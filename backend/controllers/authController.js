/**
 * Authentication Controller
 * Handles user registration, credentials authentication (login), and session verification (/me).
 */

'use strict';

const authService = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Register a new user.
 * POST /api/v1/auth/register
 */
const register = async (req, res) => {
    const { name, email, password } = req.body;

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

   
    const result = await authService.register({
        name,
        email,
        password    
    });

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