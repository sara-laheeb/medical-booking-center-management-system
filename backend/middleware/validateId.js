'use strict';

const AppError = require('../errors/AppError');

/**
 * validateId — Validates :id (or any named) numeric route parameter.
 * Usage: router.get('/:id', validateId(), controller.getById)
 *        router.get('/:patientId/x', validateId('patientId'), ...)
 */
const validateId = (paramName = 'id') => (req, res, next) => {
  const raw = req.params[paramName];
  const parsed = parseInt(raw, 10);

  if (Number.isNaN(parsed) || parsed <= 0 || String(parsed) !== String(raw).trim()) {
    return next(new AppError(`Invalid ${paramName}: must be a positive integer`, 400));
  }

  req.params[paramName] = parsed;
  next();
};

module.exports = validateId;