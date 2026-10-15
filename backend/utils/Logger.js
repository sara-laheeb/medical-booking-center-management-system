'use strict';

/**
 * Winston Logger Configuration
 * --------------------------------------------
 * Central logging system for the entire backend.
 * Provides:
 *  - Console logging (development & production)
 *  - Error file logging (error.log)
 *  - Combined logs (combined.log)
 *  - Structured JSON logs for production
 */

const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');

// Define logs directory
const LOG_DIR = path.resolve(process.cwd(), 'logs');

// Ensure logs directory exists (prevents runtime crash)
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

// Log level from environment or default to "info"
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Environment flag (clean & reusable)
const isProduction = process.env.NODE_ENV === 'production';

/**
 * File format (used in production files)
 * - Adds timestamp
 * - Captures stack traces
 * - Outputs structured JSON logs
 */
const fileFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.json()
);

/**
 * Console format (developer-friendly)
 * - Colored output for development
 * - Clean readable format
 */
const consoleFormat = format.combine(
  format.colorize({ all: true }),
  format.timestamp({ format: 'HH:mm:ss' }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const extras = Object.keys(meta).length
      ? ` | meta: ${JSON.stringify(meta)}`
      : '';
    return `[${timestamp}] ${level}: ${message}${extras}`;
  })
);

/**
 * Main Logger Instance
 * --------------------------------------------
 * Configures all transports:
 *  1. Console output (dev/prod aware)
 *  2. Error-only file logs
 *  3. Combined logs for full traceability
 */
const logger = createLogger({
  level: LOG_LEVEL,

  transports: [
    /**
     * Console Transport
     * - Used for development debugging
     * - Uses different format in production vs development
     */
    new transports.Console({
      format: isProduction ? fileFormat : consoleFormat
    }),

    /**
     * Error Log File
     * - Stores only error-level logs
     * - Useful for debugging production issues
     */
    new transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 5MB per file
      maxFiles: 5,
      tailable: true
    }),

    /**
     * Combined Log File
     * - Stores all logs (info, warn, error, etc.)
     * - Used for audit and full system tracking
     */
    new transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      format: fileFormat,
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      tailable: true
    })
  ]
});

module.exports = logger;