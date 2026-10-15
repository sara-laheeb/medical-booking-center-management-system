'use strict';

/**
 * ApiResponse
 *
 * Centralized API response handler.
 * Provides a consistent response structure across all endpoints.
 *
 * Supported usage:
 * ApiResponse.success(res, data, message, statusCode, meta)
 * ApiResponse.error(res, message, statusCode, errors)
 *
 * Also exports helper functions:
 * sendSuccess()
 * sendError()
 */

class ApiResponse {
  /**
   * Send successful API response.
   */
  static success(
    res,
    data = null,
    message = 'Success',
    statusCode = 200,
    meta = null
  ) {
    const response = {
      success: true,
      message,
      data
    };

    if (meta) {
      response.meta = meta;
    }

    return res.status(statusCode).json(response);
  }


  /**
   * Send failed API response.
   */
  static error(
    res,
    message = 'Internal Server Error',
    statusCode = 500,
    errors = null
  ) {
    const response = {
      success: false,
      message
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }
}


/**
 * Helper function for successful responses.
 */
const sendSuccess = (
  res,
  data = null,
  message = 'Success',
  statusCode = 200,
  meta = null
) => {
  return ApiResponse.success(
    res,
    data,
    message,
    statusCode,
    meta
  );
};


/**
 * Helper function for error responses.
 */
const sendError = (
  res,
  message = 'Internal Server Error',
  statusCode = 500,
  errors = null
) => {
  return ApiResponse.error(
    res,
    message,
    statusCode,
    errors
  );
};


module.exports = ApiResponse;
module.exports.sendSuccess = sendSuccess;
module.exports.sendError = sendError;
module.exports.success = ApiResponse.success;
module.exports.error = ApiResponse.error;