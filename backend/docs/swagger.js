'use strict';

/**
 * Swagger / OpenAPI 3.0 Configuration
 * Configures API metadata, servers, tags, JWT security scheme, reusable components,
 * and cross-platform route scanning.
 */

const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');

// Cross-platform glob paths (POSIX forward slashes required for swagger-jsdoc/fast-glob on Windows)
const routesPath = path.resolve(__dirname, '../routes/*.js').split(path.sep).join('/');
const nestedRoutesPath = path.resolve(__dirname, '../routes/**/*.js').split(path.sep).join('/');
const appPath = path.resolve(__dirname, '../app.js').split(path.sep).join('/');

const options = {
  definition: {
    openapi: '3.0.0',

    info: {
      title: 'Medical Center Management System API',
      version: '1.0.0',
      description:
        'Production REST API documentation for the Medical Booking & Healthcare Center Management System. Supports Role-Based Access Control (Admin, Doctor, Receptionist, Pharmacist, Patient) with JWT authentication.',
      contact: {
        name: 'Medical Center Support Team'
      }
    },

    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development Server (API v1 Base)'
      },
      {
        url: 'http://localhost:3000',
        description: 'Root Server (System & Health Endpoints)'
      }
    ],

    tags: [
      { name: 'Authentication', description: 'User registration, login, and profile verification' },
      { name: 'Patients', description: 'Patient records, search, medical profiles, and history' },
      { name: 'Specialties', description: 'Doctor medical specialties catalog and templates' },
      { name: 'Doctors', description: 'Doctor medical profiles, consultation fees, and working hours' },
      { name: 'Appointments', description: 'Appointment booking, rescheduling, status management, and cancellation' },
      { name: 'Medical Records', description: 'Clinical encounter records, diagnosis, vital signs, and specialty data' },
      { name: 'Medications', description: 'Pharmacy medication catalog and inventory stock control' },
      { name: 'Pharmacy', description: 'Prescription fulfillment and dispensing workflows' },
      { name: 'Prescriptions', description: 'Prescription lifecycle and status management' },
      { name: 'Invoices', description: 'Billing invoices, line items, payment processing, and refunds' },
      { name: 'Billing', description: 'Billing records management and payment status tracking' },
      { name: 'Financial', description: 'Clinic operational expenses and revenue summary reports' },
      { name: 'Dashboard', description: 'Administrative analytics, appointment schedules, and performance metrics' },
      { name: 'System', description: 'System health checks and service monitoring' }
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Provide a valid JWT token. Example: Bearer eyJhbGciOiJIUzI1NiIsIn...'
        }
      },

      responses: {
        UnauthorizedError: {
          description: 'Authentication required or token expired',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: 'Authentication required — please login first'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Access denied due to insufficient role permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: 'Access denied — this action requires: admin or doctor'
              }
            }
          }
        },
        NotFoundError: {
          description: 'The requested resource was not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: 'Resource not found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation failed for request body, query parameters, or URL path parameters',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: 'Validation failed',
                errors: [
                  { field: 'phone', message: 'Phone must be 7–15 digits and can include +' }
                ]
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: 'Internal server error.'
              }
            }
          }
        }
      },

      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Operation failed' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Email is required' }
                }
              }
            }
          }
        },

        PaginationMeta: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 45 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            totalPages: { type: 'integer', example: 5 }
          }
        },

        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Dr. Sarah Connor' },
            email: { type: 'string', format: 'email', example: 'doctor@test.com' },
            role: {
              type: 'string',
              enum: ['admin', 'doctor', 'receptionist', 'pharmacist', 'patient'],
              example: 'doctor'
            },
            phone: { type: 'string', example: '+966501234567' },
            is_active: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  },

  apis: [routesPath, nestedRoutesPath, appPath]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;