'use strict';

const { Router } = require('express');

const prescriptionController = require('../controllers/Prescription.controller');

const {
  authenticate,
  authorize
} = require('../middleware/authMiddleware');

const validate = require('../middleware/validate');
const validateId = require('../middleware/validateId');

const {
  createPrescriptionSchema,
  updatePrescriptionSchema,
  updatePrescriptionStatusSchema,
  cancelPrescriptionSchema,
  prescriptionQuerySchema
} = require('../validations/Prescriptions.validation');

const router = Router();

// Protect all prescription endpoints.
router.use(authenticate);

/**
 * @swagger
 * /prescriptions:
 *   get:
 *     summary: Retrieve paginated prescriptions list
 *     description: 'Returns prescriptions across clinic patients. Accessible by admin, receptionist, doctor, and patient.'
 *     tags: [Prescriptions]
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
 *         name: appointment_id
 *         schema:
 *           type: integer
 *         description: Filter by appointment ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, dispensed, cancelled]
 *         description: Filter by prescription status
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
 *         description: Prescriptions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Prescriptions retrieved successfully' }
 *                 data:
 *                   type: array
 *                   items: { type: object }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   post:
 *     summary: Create a prescription record
 *     description: 'Creates a prescription record linked to patient, doctor, and appointment. Requires role: admin or doctor.'
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - appointment_id
 *               - patient_id
 *               - doctor_id
 *             properties:
 *               appointment_id: { type: integer, example: 10 }
 *               patient_id: { type: integer, example: 1 }
 *               doctor_id: { type: integer, example: 2 }
 *               notes: { type: string, example: 'Antibiotics prescribed for 5 days' }
 *     responses:
 *       201:
 *         description: Prescription created successfully
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
    authorize('admin', 'receptionist', 'doctor', 'patient', 'pharmacist'),
    validate(prescriptionQuerySchema, 'query'),
    prescriptionController.getAll
  )
  .post(
    authorize('admin', 'doctor'),
    validate(createPrescriptionSchema),
    prescriptionController.create
  );

/**
 * @swagger
 * /prescriptions/{id}:
 *   get:
 *     summary: Retrieve single prescription by ID
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Prescription ID
 *     responses:
 *       200:
 *         description: Prescription retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   patch:
 *     summary: Update prescription clinical notes
 *     description: 'Updates notes on an existing prescription. Requires role: admin or doctor.'
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Prescription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notes
 *             properties:
 *               notes: { type: string, example: 'Updated dosage instructions: take 1 tab daily' }
 *     responses:
 *       200:
 *         description: Prescription updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Delete a prescription
 *     description: 'Deletes prescription record. Requires role: admin.'
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Prescription ID
 *     responses:
 *       200:
 *         description: Prescription deleted successfully
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
    // Authorize clinical, front-desk, and pharmacy dispensary staff to inspect prescriptions
    authorize('admin', 'receptionist', 'doctor', 'patient', 'pharmacist'),
    validateId(),
    prescriptionController.getById
  )
  .patch(
    authorize('admin', 'doctor'),
    validateId(),
    validate(updatePrescriptionSchema),
    prescriptionController.update
  )
  .delete(
    authorize('admin'),
    validateId(),
    prescriptionController.delete
  );

/**
 * @swagger
 * /prescriptions/{id}/status:
 *   patch:
 *     summary: Update prescription status to dispensed
 *     description: 'Marks prescription as dispensed. Requires role: admin or receptionist.'
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Prescription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status: { type: string, enum: [dispensed], example: 'dispensed' }
 *     responses:
 *       200:
 *         description: Prescription status updated successfully
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
  authorize('admin', 'receptionist', 'pharmacist'),
  validateId(),
  validate(updatePrescriptionStatusSchema),
  prescriptionController.updateStatus
);

/**
 * @swagger
 * /prescriptions/{id}/cancel:
 *   patch:
 *     summary: Cancel a prescription
 *     description: 'Cancels a prescription with optional cancellation notes. Requires role: admin, receptionist, or doctor.'
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Prescription ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes: { type: string, example: 'Medication discontinued by doctor' }
 *     responses:
 *       200:
 *         description: Prescription cancelled successfully
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
  authorize('admin', 'receptionist', 'doctor'),
  validateId(),
  validate(cancelPrescriptionSchema),
  prescriptionController.cancel
);

module.exports = router;