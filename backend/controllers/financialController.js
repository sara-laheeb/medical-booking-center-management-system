'use strict';

const financialService = require('../services/financialService');
const ApiResponse  = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * FinancialController — Clean version (production style)
 *
 * Invoice endpoints have moved to invoiceController/invoiceRoutes.
 * This controller now only covers expenses and the summary report.
 */
class FinancialController {

  // ── Expenses ─────────────────────────────────────────────────────────

  getAllExpenses = asyncHandler(async (req, res) => {
    const result = await financialService.getAllExpenses(req.query);

    return ApiResponse.success(
      res,
      result.data,
      'Expenses retrieved successfully',
      200,
      result.meta
    );
  });

  createExpense = asyncHandler(async (req, res) => {

    const expense = await financialService.createExpense(req.body, req.user.id);

    return ApiResponse.success(res, expense, 'Expense recorded successfully', 201);
  });

  // ── Reports ──────────────────────────────────────────────────────────

  getSummary = asyncHandler(async (req, res) => {
    const summary = await financialService.getSummary(req.query);

    return ApiResponse.success(res, summary, 'Financial summary retrieved successfully');
  });
}

module.exports = new FinancialController();