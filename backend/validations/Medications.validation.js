'use strict';

const Joi = require('joi');

// ── Create Medication Schema ─────────────────────────────────────────────
const createMedicationSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  name_ar: Joi.string().trim().min(2).max(150).allow('', null).default(null),

  category: Joi.string().trim().max(100).allow('', null).default(null),
  unit: Joi.string().trim().max(50).default('tablet'),

  stock_quantity: Joi.number().integer().min(0).default(0),
  minimum_stock: Joi.number().integer().min(0).default(10),

  cost_price: Joi.number().min(0).precision(2).default(0),
  selling_price: Joi.number().min(0).precision(2).default(0),

  is_active: Joi.boolean().default(true),

  // Extended pharmaceutical metadata
  generic_name: Joi.string().trim().max(150).allow('', null),
  strength: Joi.string().trim().max(100).allow('', null),
  dosage_form: Joi.string().trim().max(100).allow('', null),
  manufacturer: Joi.string().trim().max(150).allow('', null),
  barcode: Joi.string().trim().max(100).allow('', null),
  batch_number: Joi.string().trim().max(100).allow('', null),
  expiry_date: Joi.string().trim().max(50).allow('', null),
  supplier: Joi.string().trim().max(150).allow('', null)
}).strict();

// ── Update Medication Schema ─────────────────────────────────────────────
const updateMedicationSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150),
  name_ar: Joi.string().trim().min(2).max(150).allow('', null),

  category: Joi.string().trim().max(100).allow('', null),
  unit: Joi.string().trim().max(50),

  stock_quantity: Joi.number().integer().min(0),
  minimum_stock: Joi.number().integer().min(0),

  cost_price: Joi.number().min(0).precision(2),
  selling_price: Joi.number().min(0).precision(2),

  is_active: Joi.boolean(),

  // Extended pharmaceutical metadata
  generic_name: Joi.string().trim().max(150).allow('', null),
  strength: Joi.string().trim().max(100).allow('', null),
  dosage_form: Joi.string().trim().max(100).allow('', null),
  manufacturer: Joi.string().trim().max(150).allow('', null),
  barcode: Joi.string().trim().max(100).allow('', null),
  batch_number: Joi.string().trim().max(100).allow('', null),
  expiry_date: Joi.string().trim().max(50).allow('', null),
  supplier: Joi.string().trim().max(150).allow('', null)
})
  .min(1)
  .messages({
    'object.min': 'Request body must contain at least one field to update'
  });

// ── Adjust Stock Schema ───────────────────────────────────────────────────
// Positive delta restocks, negative delta consumes. Supports delta or quantity + type.
const adjustStockSchema = Joi.object({
  delta: Joi.number().integer().invalid(0),
  quantity: Joi.number().integer().min(1),
  type: Joi.string().valid('add', 'subtract', 'remove'),
  reason: Joi.string().trim().max(255).allow('', null).default(null),
  unit_cost: Joi.number().min(0).precision(2).optional()
}).or('delta', 'quantity');

// ── Query Schema ─────────────────────────────────────────────────────────
const medicationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(100).allow('').default(''),
  category: Joi.string().trim().max(100).allow('').default(''),
  is_active: Joi.string().valid('0', '1', '').default(''),
  low_stock: Joi.string().valid('true', 'false', '').default('')
});

module.exports = {
  createMedicationSchema,
  updateMedicationSchema,
  adjustStockSchema,
  medicationQuerySchema
};