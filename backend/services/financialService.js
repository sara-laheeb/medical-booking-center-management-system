'use strict';

/**
 * FinancialService
 * --------------------------------------------------
 * Business Logic Layer for expenses and cross-module financial reports.
 *
 * Invoice management now lives in its own module
 * (models/invoice.model.js, services/invoiceService.js) —
 * this service only owns expenses, and reads invoice totals
 * through InvoiceModel for the summary report.
 *
 * Flow:
 * Controller → Service → Database / Model
 */

const db = require('../config/database');
const InvoiceModel = require('../models/Invoice.model');
const AppError = require('../errors/AppError');

const EXPENSE_CATEGORIES = ['rent', 'salary', 'medical_supply', 'equipment', 'utility', 'other'];

const parsePagination = ({ page = 1, limit = 10 }) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

  return {
    page: parsedPage,
    limit: parsedLimit,
    offset: (parsedPage - 1) * parsedLimit
  };
};

const round2 = (n) => Math.round(Number(n) * 100) / 100;

class FinancialService {

  // ── Expenses ─────────────────────────────────────────────────────────

  async getAllExpenses(query = {}) {

    const { page, limit, offset } = parsePagination(query);
    const params = [];
    let where = 'WHERE 1 = 1';

    if (query.category) {
      where += ' AND category = ?';
      params.push(query.category);
    }

    if (query.date_from) {
      where += ' AND expense_date >= ?';
      params.push(query.date_from);
    }

    if (query.date_to) {
      where += ' AND expense_date <= ?';
      params.push(query.date_to);
    }

    const [rows] = await db.execute(
      `SELECT * FROM expenses ${where} ORDER BY expense_date DESC LIMIT ${Number(limit)}
      OFFSET ${Number(offset)}`,
      [...params, limit, offset]
    );

    const [countResult] = await db.execute(
      `SELECT COUNT(*) AS total FROM expenses ${where}`,
      params
    );

    const total = countResult[0].total;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: rows,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 }
    };
  }

  async createExpense(data, recordedBy) {

    if (!EXPENSE_CATEGORIES.includes(data.category)) {
      throw new AppError(`category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`, 400);
    }
    if (data.amount <= 0) {
        throw new AppError(
          'Expense amount must be greater than zero',
          422
        );
      }
    const [result] = await db.execute(
      `
      INSERT INTO expenses (title, category, amount, expense_date, notes, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [data.title, data.category, data.amount, data.expense_date, data.notes || null, recordedBy]
    );

    const [rows] = await db.execute('SELECT * FROM expenses WHERE id = ?', [result.insertId]);

    return rows[0];
  }

  // ── Reports ──────────────────────────────────────────────────────────

  /**
   * Financial summary for a date range: revenue collected,
   * outstanding balance (via InvoiceModel) and total expenses.
   */
  async getSummary({ date_from, date_to }) {

    const revenue = await InvoiceModel.getFinancialTotals({
      dateFrom: date_from,
      dateTo: date_to
    });

    const expenseParams = [];
    let expenseFilter = '';

    if (date_from) {
      expenseFilter += ' AND expense_date >= ?';
      expenseParams.push(date_from);
    }

    if (date_to) {
      expenseFilter += ' AND expense_date <= ?';
      expenseParams.push(date_to);
    }

    const [[expenseRow]] = await db.execute(
      `SELECT COALESCE(SUM(amount), 0) AS totalExpenses FROM expenses WHERE 1 = 1 ${expenseFilter}`,
      expenseParams
    );

    const totalExpenses = round2(expenseRow.totalExpenses);

    return {
      ...revenue,
      totalExpenses,
      netIncome: round2(revenue.totalCollected - totalExpenses)
    };
  }
}

module.exports = new FinancialService();