'use strict';

const { Router } = require('express');

const dashboardController = require('../controllers/Dashboardcontroller');

const {
  authenticate,
  authorize
} = require('../middleware/authMiddleware');

const validate = require('../middleware/validate');

const {
  listQuerySchema,
  revenueTrendQuerySchema,
  topDoctorsQuerySchema
} = require('../validations/Dashboard.validation');

const router = Router();

// All dashboard endpoints are read-only and require authentication.
router.use(authenticate);

/**
 * @swagger
 * /dashboard/overview:
 *   get:
 *     summary: Get administrative dashboard overview metrics
 *     description: 'Fetch counts of patients, doctors, appointments, revenue, and appointment status breakdown. Requires role: admin.'
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Dashboard overview retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalPatients:
 *                       type: integer
 *                       example: 120
 *                     totalDoctors:
 *                       type: integer
 *                       example: 15
 *                     todayAppointments:
 *                       type: integer
 *                       example: 24
 *                     appointmentsByStatus:
 *                       type: object
 *                       example: { scheduled: 10, confirmed: 5, completed: 8, cancelled: 1 }
 *                     revenue:
 *                       type: object
 *                       properties:
 *                         todayRevenue:
 *                           type: number
 *                           example: 1250.00
 *                         monthRevenue:
 *                           type: number
 *                           example: 34200.00
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *
 * /dashboard/today-schedule:
 *   get:
 *     summary: Get today's appointment schedule
 *     description: 'Fetch scheduled appointments for today with doctor and patient details. Requires roles: admin, doctor, receptionist.'
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Maximum number of appointments to return
 *     responses:
 *       200:
 *         description: Today's schedule retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Today's schedule retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 12
 *                       appointment_date:
 *                         type: string
 *                         format: date
 *                         example: '2026-03-20'
 *                       appointment_time:
 *                         type: string
 *                         example: '10:30:00'
 *                       status:
 *                         type: string
 *                         example: scheduled
 *                       patient_name:
 *                         type: string
 *                         example: John Doe
 *                       doctor_name:
 *                         type: string
 *                         example: Dr. Sarah Connor
 *                       specialty_name:
 *                         type: string
 *                         example: Cardiology
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *
 * /dashboard/recent-patients:
 *   get:
 *     summary: Get recently registered patients
 *     description: 'Fetch recently registered patients list. Requires roles: admin, receptionist.'
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Maximum number of patients to return
 *     responses:
 *       200:
 *         description: Recent patients retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Recent patients retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 45
 *                       name:
 *                         type: string
 *                         example: Alice Smith
 *                       phone:
 *                         type: string
 *                         example: '+966501234567'
 *                       gender:
 *                         type: string
 *                         example: female
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *
 * /dashboard/low-stock:
 *   get:
 *     summary: Get low stock medication alerts
 *     description: 'Fetch medications that are currently below their minimum stock alert threshold. Requires role: admin.'
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Maximum number of low stock items to return
 *     responses:
 *       200:
 *         description: Low stock medications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Low stock medications retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 3
 *                       name:
 *                         type: string
 *                         example: Amoxicillin 500mg
 *                       stock_quantity:
 *                         type: integer
 *                         example: 4
 *                       reorder_level:
 *                         type: integer
 *                         example: 20
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *
 * /dashboard/revenue-trend:
 *   get:
 *     summary: Get daily revenue trend
 *     description: 'Fetch historical daily revenue data within an optional date range. Requires role: admin.'
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         example: '2026-03-01'
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         example: '2026-03-31'
 *         description: End date filter (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Revenue trend retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Revenue trend retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: '2026-03-15'
 *                       revenue:
 *                         type: number
 *                         example: 2450.00
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *
 * /dashboard/top-doctors:
 *   get:
 *     summary: Get top performing doctors
 *     description: 'Fetch busiest doctors ranked by completed/scheduled appointments count within an optional date range. Requires role: admin.'
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         example: '2026-01-01'
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         example: '2026-12-31'
 *         description: End date filter (YYYY-MM-DD)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 5
 *         description: Maximum number of doctors to return
 *     responses:
 *       200:
 *         description: Top doctors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Top doctors retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       doctor_id:
 *                         type: integer
 *                         example: 2
 *                       doctor_name:
 *                         type: string
 *                         example: Dr. Sarah Connor
 *                       specialty_name:
 *                         type: string
 *                         example: Cardiology
 *                       total_appointments:
 *                         type: integer
 *                         example: 48
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */

// Full snapshot (counts + revenue) — management only.
router.get(
  '/overview',
  authorize('admin'),
  dashboardController.getOverview
);

// Today's schedule is useful to front-desk and clinical staff too.
router.get(
  '/today-schedule',
  authorize('admin', 'doctor', 'receptionist'),
  validate(listQuerySchema, 'query'),
  dashboardController.getTodaySchedule
);

router.get(
  '/recent-patients',
  authorize('admin', 'receptionist'),
  validate(listQuerySchema, 'query'),
  dashboardController.getRecentPatients
);

router.get(
  '/low-stock',
  authorize('admin'),
  validate(listQuerySchema, 'query'),
  dashboardController.getLowStockAlerts
);

router.get(
  '/revenue-trend',
  authorize('admin'),
  validate(revenueTrendQuerySchema, 'query'),
  dashboardController.getRevenueTrend
);

router.get(
  '/top-doctors',
  authorize('admin'),
  validate(topDoctorsQuerySchema, 'query'),
  dashboardController.getTopDoctors
);

module.exports = router;