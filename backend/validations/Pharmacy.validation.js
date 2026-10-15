'use strict';

const Joi = require('joi');

// ── Allowed values (single source of truth) ─────────────────────────────
const STATUSES = ['pending', 'dispensed', 'cancelled'];

// ── Prescription Item Schema (nested) ────────────────────────────────────
const prescriptionItemSchema = Joi.object({
  medication_id: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).default(1),
  dosage: Joi.string().trim().max(100).allow('', null).default(null),
  duration: Joi.string().trim().max(100).allow('', null).default(null),
  instructions: Joi.string().trim().max(500).allow('', null).default(null)
});

// ── Create Prescription Schema ───────────────────────────────────────────
const createPrescriptionSchema = Joi.object({
  appointment_id: Joi.number().integer().positive().required(),
  patient_id: Joi.number().integer().positive().required(),
  doctor_id: Joi.number().integer().positive().required(),

  items: Joi.array().items(prescriptionItemSchema).min(1).required(),

  notes: Joi.string().trim().max(1000).allow('', null).default(null)
}).strict();

// ── Query Schema ─────────────────────────────────────────────────────────
const prescriptionQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  patient_id: Joi.number().integer().positive().allow('').default(''),
  doctor_id: Joi.number().integer().positive().allow('').default(''),
  status: Joi.string().valid(...STATUSES, '').default('')
});

module.exports = {
  createPrescriptionSchema,
  prescriptionQuerySchema
};