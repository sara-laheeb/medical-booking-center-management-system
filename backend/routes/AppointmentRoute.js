'use strict';

const { Router } = require('express');

const appointmentController = require('../controllers/appointmentController');

const {
  authenticate,
  authorize
} = require('../middleware/authMiddleware');

const validate = require('../middleware/validate');
const validateId = require('../middleware/validateId');

const {
  createAppointmentSchema,
  rescheduleAppointmentSchema,
  updateAppointmentStatusSchema,
  cancelAppointmentSchema,
  appointmentQuerySchema
} = require('../validations/appointments.validation');

const router = Router();

// Protect all appointment endpoints.
router.use(authenticate);

/**
 * @swagger
 * /appointments:
 *   get:
 *     summary: Retrieve paginated appointments list
 *     description: 'Returns filtered appointments list. Accessible by admin, receptionist, doctor, and patient.'
 *     tags: [Appointments]
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
 *         name: patient_id
 *         schema:
 *           type: integer
 *         description: Filter by patient ID
 *       - in: query
 *         name: doctor_id
 *         schema:
 *           type: integer
 *         description: Filter by doctor ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, in_progress, completed, cancelled, no_show]
 *         description: Filter by appointment status
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Appointments retrieved successfully' }
 *                 data:
 *                   type: array
 *                   items: { type: object }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   post:
 *     summary: Book a new appointment
 *     description: 'Schedules a new patient appointment with conflict detection. Requires role: admin, receptionist, or doctor.'
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patient_id
 *               - doctor_id
 *               - appointment_date
 *               - start_time
 *             properties:
 *               patient_id: { type: integer, example: 1 }
 *               doctor_id: { type: integer, example: 2 }
 *               appointment_date: { type: string, format: date, example: '2026-10-20' }
 *               start_time: { type: string, example: '09:30:00' }
 *               visit_type:
 *                 type: string
 *                 enum: [new, follow_up, emergency]
 *                 default: new
 *                 example: new
 *               chief_complaint: { type: string, example: 'Severe headache and fatigue' }
 *               notes: { type: string, example: 'First consultation' }
 *     responses:
 *       201:
 *         description: Appointment booked successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       409:
 *         description: Appointment time slot conflict
 */
router
  .route('/')
  .get(
    authorize('admin', 'receptionist', 'doctor', 'patient'),
    validate(appointmentQuerySchema, 'query'),
    appointmentController.getAll
  )
  .post(
    authorize('admin', 'receptionist', 'doctor'),
    validate(createAppointmentSchema),
    appointmentController.create
  );

/**
 * @swagger
 * /appointments/{id}:
 *   get:
 *     summary: Retrieve appointment details by ID
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment database ID
 *     responses:
 *       200:
 *         description: Appointment retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Soft delete appointment
 *     description: 'Marks appointment as deleted. Requires role: admin or receptionist.'
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment database ID
 *     responses:
 *       200:
 *         description: Appointment deleted successfully
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
    authorize('admin', 'receptionist', 'doctor', 'patient'),
    validateId(),
    appointmentController.getById
  )
  .delete(
    authorize('admin', 'receptionist'),
    validateId(),
    appointmentController.delete
  );

/**
 * @swagger
 * /appointments/{id}/reschedule:
 *   patch:
 *     summary: Reschedule appointment to a new date and time
 *     description: 'Reschedules an active appointment. Requires role: admin or receptionist.'
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - appointment_date
 *               - start_time
 *             properties:
 *               appointment_date: { type: string, format: date, example: '2026-10-25' }
 *               start_time: { type: string, example: '11:00:00' }
 *     responses:
 *       200:
 *         description: Appointment rescheduled successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         description: Selected time slot is already booked
 */
router.patch(
  '/:id/reschedule',
  authorize('admin', 'receptionist'),
  validateId(),
  validate(rescheduleAppointmentSchema),
  appointmentController.reschedule
);

/**
 * @swagger
 * /appointments/{id}/status:
 *   patch:
 *     summary: Update appointment status
 *     description: 'Transitions appointment status (e.g. confirmed, in_progress, completed, no_show). Requires role: admin, receptionist, or doctor.'
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, in_progress, completed, cancelled, no_show]
 *                 example: confirmed
 *     responses:
 *       200:
 *         description: Appointment status updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch(
  '/:id/status',
  authorize('admin', 'receptionist', 'doctor'),
  validateId(),
  validate(updateAppointmentStatusSchema),
  appointmentController.updateStatus
);

/**
 * @swagger
 * /appointments/{id}/cancel:
 *   patch:
 *     summary: Cancel an appointment
 *     description: 'Cancels an appointment with an optional reason. Accessible by admin, receptionist, doctor, or patient.'
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancel_reason:
 *                 type: string
 *                 example: Patient requested cancellation due to personal reasons
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch(
  '/:id/cancel',
  authorize('admin', 'receptionist', 'doctor', 'patient'),
  validateId(),
  validate(cancelAppointmentSchema),
  appointmentController.cancel
);

module.exports = router;