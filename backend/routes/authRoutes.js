'use strict';

const express = require('express');

const asyncHandler = require('../middleware/asyncHandler');
const { authenticate } = require('../middleware/authMiddleware');

const {
  register,
  login,
  getMe
} = require('../controllers/authController');

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: Sara
 *               email:
 *                 type: string
 *                 example: sara@test.com
 *               password:
 *                 type: string
 *                 example: Sara@123
 *               role:
 *                 type: string
 *                 example: patient
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Registration successful' }
 *                 data:
 *                   type: object
 *                   properties:
 *                     token: { type: string, example: 'eyJhbGciOiJIUzI1NiIsIn...' }
 *                     user: { $ref: '#/components/schemas/User' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: 'This email is already registered'
 */
router.post(
  '/register',
  asyncHandler(register)
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user and obtain JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@test.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful with JWT token and user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Login successful' }
 *                 data:
 *                   type: object
 *                   properties:
 *                     token: { type: string, example: 'eyJhbGciOiJIUzI1NiIsIn...' }
 *                     user: { $ref: '#/components/schemas/User' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/login',
  asyncHandler(login)
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'User profile retrieved successfully' }
 *                 data: { $ref: '#/components/schemas/User' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(getMe)
);

module.exports = router;