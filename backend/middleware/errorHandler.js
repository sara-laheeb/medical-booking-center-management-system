/**
 * Global Error Handling Middleware
 * Intercepts operational AppErrors, MySQL database exceptions, Joi validation failures,
 * malformed JSON payloads, and unhandled errors into standardized JSON responses.
 */

'use strict';

const AppError = require('../errors/AppError');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/Logger');


/**
 * Database error mapping.
 * Converts MySQL errors into safe API responses.
 */
const MYSQL_ERROR_MAP = {
  ER_DUP_ENTRY: {
    status: 409,
    message: 'Duplicate record already exists.'
  },
  ER_NO_REFERENCED_ROW_2: {
    status: 400,
    message: 'Referenced resource does not exist.'
  },
  ER_ROW_IS_REFERENCED_2: {
    status: 409,
    message: 'Cannot delete this record because it is in use.'
  },
  ER_DATA_TOO_LONG: {
    status: 422,
    message: 'Provided data exceeds allowed length.'
  }
};


/**
 * Global Express error handler.
 *
 * Handles:
 * - Application errors
 * - Database errors
 * - Validation errors
 * - Unknown server errors
 */
const errorHandler = (err, req, res, next) => {

  if (err instanceof AppError && err.isOperational) {
    return ApiResponse.error(
      res,
      err.message,
      err.statusCode,
      err.errors
    );
  }


  if (err.code && MYSQL_ERROR_MAP[err.code]) {
    const { status, message } = MYSQL_ERROR_MAP[err.code];

    logger.warn(`Database error: ${err.code}`, {
      details: err.message
    });

    return ApiResponse.error(
      res,
      message,
      status
    );
  }


  if (err.name === 'ValidationError' && err.details) {

    const errors = err.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message.replace(/['"]/g, '')
    }));

    return ApiResponse.error(
      res,
      'Validation failed',
      422,
      errors
    );
  }


  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return ApiResponse.error(
      res,
      'Invalid JSON payload in request body',
      400
    );
  }


  logger.error('Unhandled server error', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl
  });


  return ApiResponse.error(
    res,
    process.env.NODE_ENV === 'production'
      ? 'Internal server error.'
      : err.message,
    500
  );
};


module.exports = errorHandler;