'use strict';

const Joi = require('joi');

// ── Allowed values (single source of truth) ─────────────────────────────
const STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];
const VISIT_TYPES = ['new', 'follow_up', 'emergency'];

const datePattern = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .messages({
    'string.pattern.base': 'Date must be in YYYY-MM-DD format'
  });

const timePattern = Joi.string()
  .pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  .messages({
    'string.pattern.base': 'Time must be in HH:MM or HH:MM:SS format'
  });

// ── Create Appointment Schema ────────────────────────────────────────────
const createAppointmentSchema = Joi.object({
  patient_id: Joi.number().integer().positive().required(),
  doctor_id: Joi.number().integer().positive().required(),

  appointment_date: datePattern.required(),
  start_time: timePattern.required(),

  visit_type: Joi.string().valid(...VISIT_TYPES).default('new'),

  chief_complaint: Joi.string().trim().max(500).allow('', null).default(null),
  notes: Joi.string().trim().max(1000).allow('', null).default(null)
}).strict();

// ── Reschedule Schema ─────────────────────────────────────────────────────
const rescheduleAppointmentSchema = Joi.object({
  appointment_date: datePattern.required(),
  start_time: timePattern.required()
}).strict();

// ── Update Status Schema ──────────────────────────────────────────────────
const updateAppointmentStatusSchema = Joi.object({
    status: Joi.string().valid(...STATUSES).required()
}).strict();

// ── Cancel Schema ──────────────────────────────────────────────────────────
const cancelAppointmentSchema = Joi.object({
  cancel_reason: Joi.string().trim().max(500).allow('', null).default(null)
}).strict();

// ── Query Schema ─────────────────────────────────────────────────────────
const appointmentQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  patient_id: Joi.number().integer().positive().optional(),
  doctor_id: Joi.number().integer().positive().optional(),
  status: Joi.string().valid(...STATUSES).optional(),
  date_from: datePattern.optional(),
  date_to: datePattern.optional()
});

module.exports = {
    createAppointmentSchema,
    rescheduleAppointmentSchema,
    updateAppointmentStatusSchema,
    cancelAppointmentSchema,
    appointmentQuerySchema
};