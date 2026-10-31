'use strict';

const { Router } = require('express');

const invoiceController = require('../controllers/Invoicecontroller');

const {
  authenticate,
  authorize
} = require('../middleware/authMiddleware');

const validate = require('../middleware/validate');
const validateId = require('../middleware/validateId');

const {
  createInvoiceSchema,
  recordPaymentSchema,
  invoiceQuerySchema
} = require('../validations/Invoices.validation');  

const router = Router();

// Authenticate all invoice endpoints. Role checks are applied per endpoint.
router.use(authenticate);

/**
 * @swagger
 * /invoices:
 *   get:
 *     summary: Retrieve clinic patient invoices list
 *     description: 'Returns patient billing invoices. Requires role: admin or receptionist.'
 *     tags: [Invoices]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [unpaid, partial, paid, refunded]
 *         description: Filter by invoice payment status
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
 *         description: Invoices retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Invoices retrieved successfully' }
 *                 data:
 *                   type: array
 *                   items: { type: object }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   post:
 *     summary: Create an invoice with itemized services
 *     description: 'Creates a patient invoice with line items (consultations, medications, procedures). Requires role: admin or receptionist.'
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patient_id
 *               - items
 *             properties:
 *               patient_id: { type: integer, example: 1 }
 *               appointment_id: { type: integer, example: 10 }
 *               doctor_id: { type: integer, example: 2 }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - description
 *                     - unit_price
 *                   properties:
 *                     description: { type: string, example: 'Doctor Consultation' }
 *                     item_type:
 *                       type: string
 *                       enum: [consultation, procedure, medication, other]
 *                       default: other
 *                       example: consultation
 *                     quantity: { type: integer, default: 1, example: 1 }
 *                     unit_price: { type: number, format: float, example: 150.00 }
 *               discount: { type: number, format: float, default: 0, example: 10.00 }
 *               tax: { type: number, format: float, default: 0, example: 21.00 }
 *               payment_method:
 *                 type: string
 *                 enum: [cash, card, insurance, other]
 *                 example: card
 *               notes: { type: string, example: 'Insurance co-pay collected' }
 *     responses:
 *       201:
 *         description: Invoice created successfully
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
    validate(invoiceQuerySchema, 'query'),
    invoiceController.getAll
  )
  .post(
    authorize('admin', 'receptionist'),
    validate(createInvoiceSchema),
    invoiceController.create
  );

/**
 * @swagger
 * /invoices/{id}:
 *   get:
 *     summary: Retrieve single invoice details with line items
 *     description: 'Fetches full invoice breakdown. Requires role: admin or receptionist.'
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:id',
  authorize('admin', 'receptionist', 'doctor', 'patient'),
  validateId(),
  invoiceController.getById
);

/**
 * @swagger
 * /invoices/{id}/pay:
 *   patch:
 *     summary: Record a payment against an invoice
 *     description: 'Records partial or full payment on an invoice. Requires role: admin or receptionist.'
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Invoice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount: { type: number, format: float, example: 161.00 }
 *               payment_method:
 *                 type: string
 *                 enum: [cash, card, insurance, other]
 *                 example: card
 *     responses:
 *       200:
 *         description: Payment recorded successfully
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
  '/:id/pay',
  authorize('admin', 'receptionist'),
  validateId(),
  validate(recordPaymentSchema),
  invoiceController.recordPayment
);

/**
 * @swagger
 * /invoices/{id}/refund:
 *   patch:
 *     summary: Refund an invoice
 *     description: 'Issues a full refund on a paid invoice. Requires role: admin.'
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice refunded successfully
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
  '/:id/refund',
  authorize('admin'),
  validateId(),
  invoiceController.refund
);

module.exports = router;