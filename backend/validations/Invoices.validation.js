'use strict';

const Joi = require('joi');

// ── Allowed values (single source of truth) ─────────────────────────────
const ITEM_TYPES = ['consultation', 'procedure', 'medication', 'other'];
const PAYMENT_METHODS = ['cash', 'card', 'insurance', 'other'];
const STATUSES = ['unpaid', 'partial', 'paid', 'refunded'];

const datePattern = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .messages({
    'string.pattern.base': 'Date must be in YYYY-MM-DD format'
  });

// ── Invoice Item Schema (nested) ─────────────────────────────────────────
const invoiceItemSchema = Joi.object({
  description: Joi.string().trim().min(2).max(255).required(),
  item_type: Joi.string().valid(...ITEM_TYPES).default('other'),
  quantity: Joi.number().integer().min(1).default(1),
  unit_price: Joi.number().min(0).precision(2).required()
});

// ── Create Invoice Schema ─────────────────────────────────────────────────
const createInvoiceSchema = Joi.object({
  patient_id: Joi.number().integer().positive().required(),
  appointment_id: Joi.number().integer().positive().allow(null).default(null),
  doctor_id: Joi.number().integer().positive().allow(null).default(null),

  items: Joi.array().items(invoiceItemSchema).min(1).required(),

  discount: Joi.number().min(0).precision(2).default(0),
  tax: Joi.number().min(0).precision(2).default(0),

  payment_method: Joi.string()
  .valid(...PAYMENT_METHODS)
  .allow(null)
  .default(null),
  notes: Joi.string().trim().max(1000).allow('', null).default(null)
}).strict();

// ── Record Payment Schema ─────────────────────────────────────────────────
const recordPaymentSchema = Joi.object({
  amount: Joi.number().greater(0).precision(2).required(),
  payment_method: Joi.string().valid(...PAYMENT_METHODS).default(null)
}).strict();

// ── Query Schema ─────────────────────────────────────────────────────────
const invoiceQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  patient_id: Joi.number().integer().positive().allow('').default(''),
  status: Joi.string().valid(...STATUSES, '').default(''),
  date_from: datePattern.allow('').default(''),
  date_to: datePattern.allow('').default('')
});

module.exports = {
  createInvoiceSchema,
  recordPaymentSchema,
  invoiceQuerySchema
};