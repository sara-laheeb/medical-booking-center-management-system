'use strict';

const Joi = require('joi');

// ── Allowed values (single source of truth) ─────────────────────────────
const datePattern = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .messages({
    'string.pattern.base': 'Date must be in YYYY-MM-DD format'
  });

// vital_signs / specialty_data are free-form clinical data stored as JSON.
// We only constrain their overall shape (plain object) here; the specific
// keys depend on the doctor's specialty template.
const jsonObjectSchema = Joi.object().unknown(true).allow(null).default(null);

// ── Create Record Schema ──────────────────────────────────────────────────
const createRecordSchema = Joi.object({
  appointment_id: Joi.number().integer().positive().required(),
  patient_id: Joi.number().integer().positive().required(),
  doctor_id: Joi.number().integer().positive().required(),

  visit_date: datePattern.required(),

  diagnosis: Joi.string().trim().max(2000).allow('', null).default(null),
  treatment_plan: Joi.string().trim().max(2000).allow('', null).default(null),

  vital_signs: jsonObjectSchema.default(null),
  specialty_data: jsonObjectSchema.default(null),

  follow_up_date: datePattern.allow('', null).default(null),
  follow_up_notes: Joi.string().trim().max(1000).allow('', null).default(null)
}).strict();

// ── Update Record Schema ──────────────────────────────────────────────────
const updateRecordSchema = Joi.object({
  diagnosis: Joi.string().trim().max(2000).allow('', null),
  treatment_plan: Joi.string().trim().max(2000).allow('', null),

  vital_signs: jsonObjectSchema,
  specialty_data: jsonObjectSchema,

  follow_up_date: datePattern.allow('', null),
  follow_up_notes: Joi.string().trim().max(1000).allow('', null)
})
  .min(1)
  .messages({
    'object.min': 'Request body must contain at least one field to update'
  });

// ── Query Schema ─────────────────────────────────────────────────────────
const recordQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  patient_id: Joi.number().integer().positive().allow('').default(''),
  doctor_id: Joi.number().integer().positive().allow('').default('')
});

module.exports = {
  createRecordSchema,
  updateRecordSchema,
  recordQuerySchema
};