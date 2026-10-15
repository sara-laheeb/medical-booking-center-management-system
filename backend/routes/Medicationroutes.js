'use strict';

const { Router } = require('express');

const medicationController = require('../controllers/Medicationcontroller');

const {
  authenticate,
  authorize
} = require('../middleware/authMiddleware');

const validate = require('../middleware/validate');
const validateId = require('../middleware/validateId');

const {
  createMedicationSchema,
  updateMedicationSchema,
  adjustStockSchema,
  medicationQuerySchema
} = require('../validations/Medications.validation');

const router = Router();

// Protect all medication endpoints.
router.use(authenticate);

/**
 * @swagger
 * /medications:
 *   get:
 *     summary: Retrieve pharmacy medications inventory
 *     description: 'Returns medication catalog and stock levels. Supports filtering by category, search, active status, and low stock.'
 *     tags: [Medications]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by medication name or arabic name
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by medication category
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: string
 *           enum: ['0', '1']
 *         description: Filter by active status
 *       - in: query
 *         name: low_stock
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Filter items where stock is below minimum stock threshold
 *     responses:
 *       200:
 *         description: Medications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Medications retrieved successfully' }
 *                 data:
 *                   type: array
 *                   items: { type: object }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   post:
 *     summary: Add a new medication to pharmacy catalog
 *     description: 'Registers a new medication with pricing, stock thresholds, and units. Requires role: admin.'
 *     tags: [Medications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name: { type: string, example: 'Amoxicillin 500mg' }
 *               name_ar: { type: string, example: 'أموكسيسيلين 500 مجم' }
 *               category: { type: string, example: 'Antibiotics' }
 *               unit: { type: string, default: tablet, example: 'capsule' }
 *               stock_quantity: { type: integer, default: 0, example: 100 }
 *               minimum_stock: { type: integer, default: 10, example: 20 }
 *               cost_price: { type: number, format: float, default: 0, example: 12.50 }
 *               selling_price: { type: number, format: float, default: 0, example: 25.00 }
 *               is_active: { type: boolean, default: true }
 *     responses:
 *       201:
 *         description: Medication created successfully
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
    validate(medicationQuerySchema, 'query'),
    medicationController.getAll
  )
  .post(
    authorize('admin'),
    validate(createMedicationSchema),
    medicationController.create
  );

/**
 * @swagger
 * /medications/{id}:
 *   get:
 *     summary: Retrieve single medication details by ID
 *     tags: [Medications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Medication ID
 *     responses:
 *       200:
 *         description: Medication retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update medication details
 *     description: 'Updates medication information, pricing, or stock thresholds. Requires role: admin.'
 *     tags: [Medications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Medication ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               name_ar: { type: string }
 *               category: { type: string }
 *               unit: { type: string }
 *               stock_quantity: { type: integer }
 *               minimum_stock: { type: integer }
 *               cost_price: { type: number, format: float }
 *               selling_price: { type: number, format: float }
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: Medication updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Delete a medication from catalog
 *     description: 'Removes medication from catalog. Requires role: admin.'
 *     tags: [Medications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Medication ID
 *     responses:
 *       200:
 *         description: Medication deleted successfully
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
    validateId(),
    medicationController.getById
  )
  .put(
    authorize('admin'),
    validateId(),
    validate(updateMedicationSchema),
    medicationController.update
  )
  .delete(
    authorize('admin'),
    validateId(),
    medicationController.delete
  );

/**
 * @swagger
 * /medications/{id}/stock:
 *   patch:
 *     summary: Adjust medication stock quantity
 *     description: 'Manually adjusts medication inventory levels (positive delta to restock, negative delta for damage/write-off). Requires role: admin.'
 *     tags: [Medications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Medication ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - delta
 *             properties:
 *               delta: { type: integer, example: 50, description: 'Quantity change (+ for addition, - for reduction)' }
 *               reason: { type: string, example: 'Restock batch delivery #4492' }
 *     responses:
 *       200:
 *         description: Medication stock adjusted successfully
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
  '/:id/stock',
  authorize('admin'),
  validateId(),
  validate(adjustStockSchema),
  medicationController.adjustStock
);

module.exports = router;