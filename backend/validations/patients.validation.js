'use strict';

const Joi = require('joi');

// ── Allowed values (single source of truth) ─────────────────────────────
const ALLOWED_GENDERS = ['male', 'female'];
const ALLOWED_BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ALLOWED_STATUS = ['active', 'inactive', 'deceased'];

// ── Reusable validations ────────────────────────────────────────────────
const phonePattern = Joi.string()
  .trim()
  .pattern(/^\+?[0-9]{7,15}$/)
  .messages({
    'string.pattern.base': 'Phone must be 7–15 digits and can include +'
  });

const nameField = (label) =>
  Joi.string().trim().min(2).max(50).label(label);

// ── Create Patient Schema ───────────────────────────────────────────────
const createPatientSchema = Joi.object({
  first_name: nameField('First name').required(),
  last_name: nameField('Last name').required(),

  date_of_birth: Joi.date()
    .iso()
    .max('now')
    .required()
    .messages({
      'date.max': 'Date of birth cannot be in the future'
    }),

  gender: Joi.string().valid(...ALLOWED_GENDERS).required(),
  national_id: Joi.string().trim().min(5).max(20).allow('', null).default(null),
  phone: phonePattern.required(),

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .trim()
    .allow(null)
    .default(null),

    address: Joi.string().trim().max(255).allow('', null).default(null),
    blood_type: Joi.string()
    .valid(...ALLOWED_BLOOD_TYPES)
    .allow(null)
    .default(null),

  chronic_conditions: Joi.string().trim().max(1000).allow('', null).default(null),
  allergies: Joi.string().trim().max(1000).allow('', null).default(null),
  notes: Joi.string().trim().max(1000).allow('', null).default(null),

  emergency_contact_name: nameField('Emergency contact name')
  .max(100)
  .allow('', null)
  .default(null),

 emergency_contact_phone: phonePattern
  .allow('', null)
  .default(null),

  status: Joi.string().valid(...ALLOWED_STATUS).default('active')
});

// ── Update Patient Schema ───────────────────────────────────────────────
const updatePatientSchema = Joi.object({
  first_name: nameField('First name'),
  last_name: nameField('Last name'),

  date_of_birth: Joi.date()
    .iso()
    .max('now')
    .messages({
      'date.max': 'Date of birth cannot be in the future'
    }),

  gender: Joi.string().valid(...ALLOWED_GENDERS),
  national_id: Joi.string().trim().min(5).max(20),
  phone: phonePattern,

  email: Joi.string()
    .email({ tlds: { allow: false } })
    .trim()
    .allow(null),

  address: Joi.string().trim().min(5).max(255),

  blood_type: Joi.string().valid(...ALLOWED_BLOOD_TYPES).allow(null),
  chronic_conditions: Joi.string().trim().max(1000).allow('', null),
  allergies: Joi.string().trim().max(1000).allow('', null),
  notes: Joi.string().trim().max(1000).allow('', null),
  emergency_contact_name: nameField('Emergency contact name').max(100),
  emergency_contact_phone: phonePattern,

  status: Joi.string().valid(...ALLOWED_STATUS)
})
.min(1)
.messages({
  'object.min': 'Request body must contain at least one field to update'
});

// ── Query Schema ────────────────────────────────────────────────────────
const patientQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(100).allow('').default(''),
  status: Joi.string().valid(...ALLOWED_STATUS).allow('').default('')
});

module.exports = {
  createPatientSchema,
  updatePatientSchema,
  patientQuerySchema
};