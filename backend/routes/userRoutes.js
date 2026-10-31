'use strict';

/**
 * User Management Routes (Manager / Admin Only)
 * Allows the authorized manager to inspect user permissions, activate/deactivate accounts,
 * and reassign roles.
 */

const { Router } = require('express');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const validateId = require('../middleware/validateId');

const router = Router();

// Only the authorized manager (admin) can access user management
router.use(authenticate);
router.use(authorize('admin'));

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Retrieve system users list with permissions
 *     description: 'Returns all system users for manager permissions review. Requires role: admin.'
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name or email
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [patient, doctor, admin, receptionist, pharmacist] }
 *         description: Filter by user role
 *       - in: query
 *         name: is_active
 *         schema: { type: string, enum: ['0', '1'] }
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/', userController.getAll);

/**
 * @swagger
 * /users/{id}/status:
 *   patch:
 *     summary: Toggle user account active status
 *     description: 'Activates or deactivates a user account. Requires role: admin.'
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [is_active]
 *             properties:
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.patch('/:id/status', validateId(), userController.updateStatus);

/**
 * @swagger
 * /users/{id}/role:
 *   patch:
 *     summary: Update user role permission
 *     description: 'Changes a user role. Requires role: admin.'
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [patient, doctor, admin, receptionist, pharmacist] }
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.patch('/:id/role', validateId(), userController.updateRole);

/**
 * Doctor Registration Requests (Admin review)
 */
// Retrieve all pending doctor registration requests
router.get('/pending-doctors', userController.getPendingDoctors);

// Approve a doctor's registration request
router.patch('/doctors/:id/approve', validateId(), userController.approveDoctor);

// Reject a doctor's registration request
router.patch('/doctors/:id/reject', validateId(), userController.rejectDoctor);

module.exports = router;
