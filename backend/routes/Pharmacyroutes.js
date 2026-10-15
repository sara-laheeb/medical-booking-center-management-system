'use strict';

const { Router } = require('express');

const pharmacyController = require('../controllers/Pharmacycontroller');

const {
  authenticate,
  authorize
} = require('../middleware/authMiddleware');

const validate = require('../middleware/validate');
const validateId = require('../middleware/validateId');

const {
  createPrescriptionSchema,
  prescriptionQuerySchema
} = require('../validations/Pharmacy.validation');
const router = Router();


// Medication catalog endpoints now live under /medications
// (see routes/medicationRoutes.js). This router only covers prescriptions.
router.use(authenticate);

/**
 * @swagger
 * /pharmacy/prescriptions:
 *   get:
 *     summary: Retrieve pharmacy prescriptions queue
 *     description: 'Returns prescriptions for pharmacy review. Supports filtering by patient, doctor, and status.'
 *     tags: [Pharmacy]
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
 *         description: Filter by prescribing doctor ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, dispensed, cancelled]
 *         description: Filter by prescription status
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
 *   post:
 *     summary: Issue a new prescription with medications
 *     description: 'Doctor prescribes one or more medications linked to an appointment. Requires role: doctor.'
 *     tags: [Pharmacy]
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
 *               - items
 *             properties:
 *               appointment_id: { type: integer, example: 10 }
 *               patient_id: { type: integer, example: 1 }
 *               doctor_id: { type: integer, example: 2 }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - medication_id
 *                   properties:
 *                     medication_id: { type: integer, example: 1 }
 *                     quantity: { type: integer, default: 1, example: 2 }
 *                     dosage: { type: string, example: '500mg twice daily' }
 *                     duration: { type: string, example: '7 days' }
 *                     instructions: { type: string, example: 'Take after meals' }
 *               notes: { type: string, example: 'Complete the antibiotic course' }
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
  .route('/prescriptions')
  .get(
    validate(prescriptionQuerySchema, 'query'),
    pharmacyController.getAllPrescriptions
  )
  .post(
    authorize('doctor'),
    validate(createPrescriptionSchema),
    pharmacyController.createPrescription
  );

/**
 * @swagger
 * /pharmacy/prescriptions/{id}:
 *   get:
 *     summary: Retrieve single prescription details with item list
 *     tags: [Pharmacy]
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
 *         description: Prescription details retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/prescriptions/:id',
  validateId(),
  pharmacyController.getPrescriptionById
);

/**
 * @swagger
 * /pharmacy/prescriptions/{id}/dispense:
 *   patch:
 *     summary: Dispense prescription and deduct medications from stock
 *     description: 'Dispenses prescription items and updates inventory levels. Requires role: admin.'
 *     tags: [Pharmacy]
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
 *         description: Prescription dispensed successfully
 *       400:
 *         description: Insufficient stock or invalid state
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch(
  '/prescriptions/:id/dispense',
  authorize('admin'),
  validateId(),
  pharmacyController.dispense
);

/**
 * @swagger
 * /pharmacy/prescriptions/{id}/cancel:
 *   patch:
 *     summary: Cancel a pending prescription
 *     description: 'Cancels a pending prescription. Requires role: admin.'
 *     tags: [Pharmacy]
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
  '/prescriptions/:id/cancel',
  authorize('admin'),
  validateId(),
  pharmacyController.cancelPrescription
);

module.exports = router;