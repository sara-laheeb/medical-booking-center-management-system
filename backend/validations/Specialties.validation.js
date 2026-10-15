'use strict';

const Joi = require('joi');

const TEMPLATE_TYPES = ['general', 'dental', 'cosmetic', 'ophthalmology', 'pediatric', 'other'];

// ── Create Specialty Schema ─────────────────────────────────────────────
const createSpecialtySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  name_ar: Joi.string().trim().min(2).max(100).required(),
  icon: Joi.string().trim().max(10).allow('', null).default(null),
  template_type: Joi.string().valid(...TEMPLATE_TYPES).default('general'),
  is_active: Joi.boolean().default(true)
}).strict();

// ── Update Specialty Schema ─────────────────────────────────────────────
const updateSpecialtySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  name_ar: Joi.string().trim().min(2).max(100),
  icon: Joi.string().trim().max(10).allow('', null),
  template_type: Joi.string().valid(...TEMPLATE_TYPES),
  is_active: Joi.boolean()
})
  .min(1)
  .messages({
    'object.min': 'Request body must contain at least one field to update'
  });

// ── Query Schema ─────────────────────────────────────────────────────────
const specialtyQuerySchema = Joi.object({
    active_only: Joi.boolean().truthy('1').falsy('0').default(true)
  });

module.exports = {
  createSpecialtySchema,
  updateSpecialtySchema,
  specialtyQuerySchema
};