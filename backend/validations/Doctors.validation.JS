'use strict';

const Joi = require('joi');

// ── Allowed values (single source of truth) ─────────────────────────────
const WORK_DAYS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];

const timePattern = Joi.string()
  .pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  .messages({
    'string.pattern.base': 'Time must be in HH:MM or HH:MM:SS format'
  });

// ── Create Doctor Schema ────────────────────────────────────────────────
// A user account (role = doctor) must already exist; this endpoint
// Authentication is handled separately.
// attaches the medical profile to that account.
const createDoctorSchema = Joi.object({
  user_id: Joi.number().integer().positive().required(),
  specialty_id: Joi.number().integer().positive().required(),

  license_number: Joi.string().trim().min(3).max(50).required(),

  consultation_fee: Joi.number().min(0).precision(2).default(0),

  bio: Joi.string().trim().max(2000).allow('', null).default(null),

  work_days: Joi.array()
    .items(Joi.string().valid(...WORK_DAYS))
    .min(1)
    .unique()
    .default(['sat', 'sun', 'mon', 'tue', 'wed']),

  work_start: timePattern.default('08:00:00'),
  work_end: timePattern.default('16:00:00'),

  appointment_duration: Joi.number().integer().min(5).max(240).default(30),

  is_active: Joi.boolean().default(true)
}).prefs({
  abortEarly: false,
  stripUnknown: true
});

// ── Update Doctor Schema ─────────────────────────────────────────────────
const updateDoctorSchema = Joi.object({
  specialty_id: Joi.number().integer().positive(),
  license_number: Joi.string().trim().min(3).max(50),
  consultation_fee: Joi.number().min(0).precision(2),
  bio: Joi.string().trim().max(2000).allow('', null),

  work_days: Joi.array()
    .items(Joi.string().valid(...WORK_DAYS))
    .min(1)
    .unique(),

  work_start: timePattern,
  work_end: timePattern,
  appointment_duration: Joi.number().integer().min(5).max(240),
  is_active: Joi.boolean()
})
  .min(1)
  .messages({
    'object.min': 'Request body must contain at least one field to update'
  });

// ── Query Schema ─────────────────────────────────────────────────────────
const doctorQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(100).allow('').default(''),
  specialty_id: Joi.number().integer().positive().allow('').default(''),
  is_active: Joi.string().valid('0', '1', '').default('')
});

module.exports = {
  createDoctorSchema,
  updateDoctorSchema,
  doctorQuerySchema
};