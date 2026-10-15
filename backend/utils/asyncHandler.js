'use strict';

/**
 * asyncHandler — wraps async controller methods
 * so we don't need try/catch in every function.
 *
 * Any thrown error automatically goes to Express error middleware.
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;