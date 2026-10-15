'use strict';

const Joi = require('joi');

// ── Allowed values (single source of truth) ─────────────────────────────
const EXPENSE_CATEGORIES = ['rent', 'salary', 'medical_supply', 'equipment', 'utility', 'other'];

const datePattern = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .messages({
    'string.pattern.base': 'Date must be in YYYY-MM-DD format'
  });

// ── Create Expense Schema ─────────────────────────────────────────────────
const createExpenseSchema = Joi.object({
  title: Joi.string().trim().min(2).max(150).required(),
  category: Joi.string().valid(...EXPENSE_CATEGORIES).required(),
  amount: Joi.number().greater(0).precision(2).required(),
  expense_date: datePattern.required(),
  notes: Joi.string().trim().max(1000).allow('', null).default(null)
}).strict();

// ── Expenses Query Schema ─────────────────────────────────────────────────
const financialQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  category: Joi.string().valid(...EXPENSE_CATEGORIES, '').default(''),
  date_from: datePattern.allow('').default(''),
  date_to: datePattern.allow('').default('')
});

// ── Summary Report Query Schema ────────────────────────────────────────────
const summaryQuerySchema = Joi.object({
  date_from: datePattern.allow('').default(''),
  date_to: datePattern.allow('').default('')
});

module.exports = {
    createExpenseSchema,
    financialQuerySchema,
    summaryQuerySchema
  }; 