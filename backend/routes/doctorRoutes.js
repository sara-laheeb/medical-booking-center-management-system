'use strict';

const { Router } = require('express');

const doctorController = require('../controllers/doctorController');

const validate = require('../middleware/validate');
const validateId = require('../middleware/validateId');

const {
  authenticate,
  authorize,
  optionalAuth
} = require('../middleware/authMiddleware');

const {
  createDoctorSchema,
  updateDoctorSchema,
  doctorQuerySchema
} = require('../validations/doctors.validation');

const router = Router();

// Allow public browsing and availability check with optional authentication
router.use(optionalAuth);

/**
 * @swagger
 * /doctors:
 *   get:
 *     summary: Retrieve paginated doctors directory
 *     description: 'Returns a list of doctors with their specialties and user profile details. Supports filtering by specialty and active status.'
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page (max 100)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by doctor name or license number
 *       - in: query
 *         name: specialty_id
 *         schema:
 *           type: integer
 *         description: Filter by medical specialty ID
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: string
 *           enum: ['0', '1']
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Doctors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Doctors retrieved successfully' }
 *                 data:
 *                   type: array
 *                   items: { type: object }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   post:
 *     summary: Create a doctor profile for an existing user account
 *     description: 'Attaches clinical profile, specialty, license number, and scheduling parameters to a user with role=doctor. Requires role: admin.'
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - specialty_id
 *               - license_number
 *             properties:
 *               user_id: { type: integer, example: 5 }
 *               specialty_id: { type: integer, example: 1 }
 *               license_number: { type: string, example: 'DOC-12345' }
 *               consultation_fee: { type: number, format: float, example: 150.00 }
 *               bio: { type: string, example: 'Senior Cardiologist with 10+ years experience.' }
 *               work_days:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [sat, sun, mon, tue, wed, thu, fri]
 *                 example: ['sun', 'mon', 'tue', 'wed', 'thu']
 *               work_start: { type: string, example: '08:00:00' }
 *               work_end: { type: string, example: '16:00:00' }
 *               appointment_duration: { type: integer, example: 30 }
 *               is_active: { type: boolean, default: true }
 *     responses:
 *       201:
 *         description: Doctor created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router
  .route('/')
  .get(
    validate(doctorQuerySchema, 'query'),
    doctorController.getAll
  )
  .post(
    authenticate,
    authorize('admin'),
    validate(createDoctorSchema),
    doctorController.createDoctor
  );

/**
 * @swagger
 * /doctors/{id}/availability:
 *   get:
 *     summary: Retrieve doctor availability and real time slots for a given date
 *     description: 'Returns real working schedule slots and booked statuses for a specific date (YYYY-MM-DD).'
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Doctor ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Target date in YYYY-MM-DD
 *     responses:
 *       200:
 *         description: Doctor schedule and slots computed successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:id/availability',
  validateId(),
  doctorController.getAvailability
);

/**
 * @swagger
 * /doctors/{id}:
 *   get:
 *     summary: Retrieve doctor profile by ID
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: Doctor retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update doctor profile or schedule
 *     description: 'Updates doctor clinical details, fees, working days, or shift times. Requires role: admin or doctor.'
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Doctor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               specialty_id: { type: integer }
 *               license_number: { type: string }
 *               consultation_fee: { type: number, format: float }
 *               bio: { type: string }
 *               work_days:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [sat, sun, mon, tue, wed, thu, fri]
 *               work_start: { type: string }
 *               work_end: { type: string }
 *               appointment_duration: { type: integer }
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: Doctor updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Deactivate or delete doctor profile
 *     description: 'Removes doctor profile. Requires role: admin.'
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Doctor ID
 *     responses:
 *       200:
 *         description: Doctor deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router
  .route('/:id')
  .get(
    validateId(),
    doctorController.getDoctorById
  )
  .put(
    authenticate,
    authorize('admin', 'doctor'),
    validateId(),
    validate(updateDoctorSchema),
    doctorController.updateDoctor
  )
  .delete(
    authenticate,
    authorize('admin'),
    validateId(),
    doctorController.deleteDoctor
  );

module.exports = router;