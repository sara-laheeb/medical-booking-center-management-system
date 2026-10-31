'use strict';

const { Router } = require('express');

const financialController = require('../controllers/financialController');

const {
  authenticate,
  authorize
} = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const {
  createExpenseSchema,
  financialQuerySchema
} = require('../validations/Financial.validation');

const router = Router();

// Expenses and financial summary reports are restricted exclusively to management (admin).
router.use(authenticate);
router.use(authorize('admin'));

/**
 * @swagger
 * /financial/expenses:
 *   get:
 *     summary: Get paginated list of clinic expenses
 *     description: 'Fetch operational expenses with optional category and date range filters. Requires role: admin.'
 *     tags: [Financial]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of expenses per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [rent, salary, medical_supply, equipment, utility, other]
 *         description: Filter by expense category
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         example: '2026-01-01'
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         example: '2026-12-31'
 *         description: End date filter (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Expenses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Expenses retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       title:
 *                         type: string
 *                         example: Monthly Clinic Rent
 *                       category:
 *                         type: string
 *                         example: rent
 *                       amount:
 *                         type: number
 *                         example: 3500.00
 *                       expense_date:
 *                         type: string
 *                         format: date
 *                         example: '2026-03-01'
 *                       notes:
 *                         type: string
 *                         nullable: true
 *                         example: Main facility lease
 *                       recorded_by:
 *                         type: integer
 *                         example: 1
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *   post:
 *     summary: Record a new clinic expense
 *     description: 'Create a new operational expense entry. Requires role: admin.'
 *     tags: [Financial]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - amount
 *               - expense_date
 *             properties:
 *               title:
 *                 type: string
 *                 example: Medical Supply Restock
 *               category:
 *                 type: string
 *                 enum: [rent, salary, medical_supply, equipment, utility, other]
 *                 example: medical_supply
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 850.50
 *               expense_date:
 *                 type: string
 *                 format: date
 *                 example: '2026-03-15'
 *               notes:
 *                 type: string
 *                 nullable: true
 *                 example: Syringes and antiseptic solutions
 *     responses:
 *       201:
 *         description: Expense recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Expense recorded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 5
 *                     title:
 *                       type: string
 *                       example: Medical Supply Restock
 *                     category:
 *                       type: string
 *                       example: medical_supply
 *                     amount:
 *                       type: number
 *                       example: 850.50
 *                     expense_date:
 *                       type: string
 *                       format: date
 *                       example: '2026-03-15'
 *                     notes:
 *                       type: string
 *                       nullable: true
 *                       example: Syringes and antiseptic solutions
 *                     recorded_by:
 *                       type: integer
 *                       example: 1
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *
 * /financial/summary:
 *   get:
 *     summary: Get cross-module financial summary
 *     description: 'Retrieve financial summary including total invoiced, collected, outstanding balance, expenses, and net profit. Requires roles: admin, receptionist.'
 *     tags: [Financial]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         example: '2026-01-01'
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         example: '2026-12-31'
 *         description: End date filter (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Financial summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Financial summary retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalInvoiced:
 *                       type: number
 *                       example: 25400.00
 *                     totalCollected:
 *                       type: number
 *                       example: 21850.00
 *                     totalOutstanding:
 *                       type: number
 *                       example: 3550.00
 *                     totalExpenses:
 *                       type: number
 *                       example: 8400.00
 *                     netIncome:
 *                       type: number
 *                       example: 13450.00
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

// ── Expenses ─────────────────────────────────────────────────────────────
router
  .route('/expenses')
  .get(
    validate(financialQuerySchema, 'query'),
    financialController.getAllExpenses
  )
  .post(
    validate(createExpenseSchema),
    financialController.createExpense
  );

// ── Reports ──────────────────────────────────────────────────────────────
router.get('/summary', financialController.getSummary);

module.exports = router;