'use strict';

const Joi = require('joi');

// ── Allowed values (single source of truth) ─────────────────────────────
const STATUSES = ['pending', 'dispensed', 'cancelled'];

const datePattern = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .messages({
    'string.pattern.base': 'Date must be in YYYY-MM-DD format'
  });

// ── Create Prescription Schema ───────────────────────────────────────────
const createPrescriptionSchema = Joi.object({
  appointment_id: Joi.number().integer().positive().required(),
  patient_id: Joi.number().integer().positive().required(),
  doctor_id: Joi.number().integer().positive().required(),

  notes: Joi.string().trim().max(1000).allow('', null).default(null)
}).strict();

// ── Update Prescription Schema (notes only) ──────────────────────────────
const updatePrescriptionSchema = Joi.object({
  notes: Joi.string().trim().max(1000).allow('', null).required()
}).strict();

// ── Update Status Schema ──────────────────────────────────────────────────
const updatePrescriptionStatusSchema = Joi.object({
  status: Joi.string().valid('dispensed').required()
}).strict();

// ── Cancel Schema ──────────────────────────────────────────────────────────
const cancelPrescriptionSchema = Joi.object({
  notes: Joi.string().trim().max(1000).allow('', null).default(null)
}).strict();

// ── Query Schema ─────────────────────────────────────────────────────────
const prescriptionQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  patient_id: Joi.number().integer().positive().optional(),
  doctor_id: Joi.number().integer().positive().optional(),
  appointment_id: Joi.number().integer().positive().optional(),
  status: Joi.string().valid(...STATUSES).optional(),
  date_from: datePattern.optional(),
  date_to: datePattern.optional()
});

module.exports = {
  createPrescriptionSchema,
  updatePrescriptionSchema,
  updatePrescriptionStatusSchema,
  cancelPrescriptionSchema,
  prescriptionQuerySchema
};