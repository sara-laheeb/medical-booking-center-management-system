'use strict';

const Joi = require('joi');

// ── Allowed values (single source of truth) ─────────────────────────────
const STATUSES = ['pending', 'paid', 'cancelled'];

const datePattern = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .messages({
    'string.pattern.base': 'Date must be in YYYY-MM-DD format'
  });

const moneyField = Joi.number().precision(2).min(0);

// ── Create Billing Schema ────────────────────────────────────────────────
const createBillingSchema = Joi.object({
  appointment_id: Joi.number().integer().positive().required(),
  patient_id: Joi.number().integer().positive().required(),

  subtotal: moneyField.optional(),
  discount: moneyField.optional(),
  tax: moneyField.optional(),

  notes: Joi.string().trim().max(1000).allow('', null).default(null)
}).strict();

// ── Update Billing Schema (amounts + notes only) ─────────────────────────
const updateBillingSchema = Joi.object({
  subtotal: moneyField.required(),
  discount: moneyField.default(0),
  tax: moneyField.default(0),

  notes: Joi.string().trim().max(1000).allow('', null).default(null)
}).strict();

// ── Update Status Schema ──────────────────────────────────────────────────
const updateBillingStatusSchema = Joi.object({
  status: Joi.string().valid('paid').required()
}).strict();

// ── Cancel Schema ──────────────────────────────────────────────────────────
const cancelBillingSchema = Joi.object({
  notes: Joi.string().trim().max(1000).allow('', null).default(null)
}).strict();

// ── Query Schema ─────────────────────────────────────────────────────────
const billingQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  patient_id: Joi.number().integer().positive().optional(),
  doctor_id: Joi.number().integer().positive().optional(),
  appointment_id: Joi.number().integer().positive().optional(),
  status: Joi.string().valid(...STATUSES).optional(),
  date_from: datePattern.optional(),
  date_to: datePattern.optional()
}).unknown(false);

module.exports = {
  createBillingSchema,
  updateBillingSchema,
  updateBillingStatusSchema,
  cancelBillingSchema,
  billingQuerySchema
};