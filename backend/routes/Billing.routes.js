'use strict';

const { Router } = require('express');

const billingController = require('../controllers/Billing.controller');

const {
  authenticate,
  authorize
} = require('../middleware/authMiddleware');

const validate = require('../middleware/validate');
const validateId = require('../middleware/validateId');

const {
  createBillingSchema,
  updateBillingSchema,
  updateBillingStatusSchema,
  cancelBillingSchema,
  billingQuerySchema
} = require('../validations/Billing.validation');

const router = Router();

// Protect all billing endpoints.
router.use(authenticate);

/**
 * @swagger
 * /billing:
 *   get:
 *     summary: Retrieve paginated billing records list
 *     description: 'Returns clinic billing records. Accessible by admin, receptionist, doctor, and patient.'
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page (max 100)
 *       - in: query
 *         name: patient_id
 *         schema:
 *           type: integer
 *         description: Filter by patient ID
 *       - in: query
 *         name: doctor_id
 *         schema:
 *           type: integer
 *         description: Filter by doctor ID
 *       - in: query
 *         name: appointment_id
 *         schema:
 *           type: integer
 *         description: Filter by appointment ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, paid, cancelled]
 *         description: Filter by payment status
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Billing records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Billing records retrieved successfully' }
 *                 data:
 *                   type: array
 *                   items: { type: object }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   post:
 *     summary: Create a billing entry
 *     description: 'Creates a billing entry for an appointment. Requires role: admin or receptionist.'
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - appointment_id
 *               - patient_id
 *             properties:
 *               appointment_id: { type: integer, example: 10 }
 *               patient_id: { type: integer, example: 1 }
 *               subtotal: { type: number, format: float, example: 200.00 }
 *               discount: { type: number, format: float, default: 0, example: 20.00 }
 *               tax: { type: number, format: float, default: 0, example: 27.00 }
 *               notes: { type: string, example: 'Billing generated at reception' }
 *     responses:
 *       201:
 *         description: Billing record created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router
  .route('/')
  .get(
    authorize('admin', 'receptionist', 'doctor', 'patient'),
    validate(billingQuerySchema, 'query'),
    billingController.getAll
  )
  .post(
    authorize('admin', 'receptionist'),
    validate(createBillingSchema),
    billingController.create
  );

/**
 * @swagger
 * /billing/{id}:
 *   get:
 *     summary: Retrieve single billing record by ID
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Billing record ID
 *     responses:
 *       200:
 *         description: Billing record retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   patch:
 *     summary: Update billing amounts or notes
 *     description: 'Updates subtotal, discount, tax, or notes on a billing entry. Requires role: admin or receptionist.'
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Billing record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subtotal
 *             properties:
 *               subtotal: { type: number, format: float, example: 250.00 }
 *               discount: { type: number, format: float, default: 0, example: 25.00 }
 *               tax: { type: number, format: float, default: 0, example: 33.75 }
 *               notes: { type: string, example: 'Adjusted consultation fee' }
 *     responses:
 *       200:
 *         description: Billing updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Delete a billing entry
 *     description: 'Deletes a billing entry. Requires role: admin.'
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Billing record ID
 *     responses:
 *       200:
 *         description: Billing deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router
  .route('/:id')
  .get(
    authorize('admin', 'receptionist', 'doctor', 'patient'),
    validateId(),
    billingController.getById
  )
  .patch(
    authorize('admin', 'receptionist'),
    validateId(),
    validate(updateBillingSchema),
    billingController.update
  )
  .delete(
    authorize('admin'),
    validateId(),
    billingController.delete
  );

/**
 * @swagger
 * /billing/{id}/status:
 *   patch:
 *     summary: Mark billing as paid
 *     description: 'Updates billing status to paid. Requires role: admin or receptionist.'
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Billing record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status: { type: string, enum: [paid], example: 'paid' }
 *     responses:
 *       200:
 *         description: Billing status updated to paid
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch(
  '/:id/status',
  authorize('admin', 'receptionist'),
  validateId(),
  validate(updateBillingStatusSchema),
  billingController.updateStatus
);

/**
 * @swagger
 * /billing/{id}/cancel:
 *   patch:
 *     summary: Cancel a billing entry
 *     description: 'Cancels a billing record with optional notes. Requires role: admin or receptionist.'
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Billing record ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes: { type: string, example: 'Cancelled due to patient appointment no-show' }
 *     responses:
 *       200:
 *         description: Billing cancelled successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch(
  '/:id/cancel',
  authorize('admin', 'receptionist'),
  validateId(),
  validate(cancelBillingSchema),
  billingController.cancel
);

module.exports = router;