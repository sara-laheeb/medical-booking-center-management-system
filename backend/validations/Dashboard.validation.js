'use strict';

const Joi = require('joi');

// ── Allowed values (single source of truth) ─────────────────────────────
const datePattern = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .messages({
    'string.pattern.base': 'Date must be in YYYY-MM-DD format'
  });

// ── List Query Schema ──────────────────────────────────────────────────────
// Shared by endpoints that just return a capped list (today's schedule,
// recent patients, low stock medications).
const listQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(10)
});

// ── Revenue Trend Query Schema ───────────────────────────────────────────
const revenueTrendQuerySchema = Joi.object({
  date_from: datePattern.allow('').default(''),
  date_to: datePattern.allow('').default('')
});

// ── Top Doctors Query Schema ─────────────────────────────────────────────
const topDoctorsQuerySchema = Joi.object({
  date_from: datePattern.allow('').default(''),
  date_to: datePattern.allow('').default(''),
  limit: Joi.number().integer().min(1).max(50).default(5)
});

module.exports = {
  listQuerySchema,
  revenueTrendQuerySchema,
  topDoctorsQuerySchema
};