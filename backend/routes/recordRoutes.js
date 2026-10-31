'use strict';

const { Router } = require('express');

const recordController = require('../controllers/recordController');

const {
  authenticate,
  authorize
} = require('../middleware/authMiddleware');

const validate = require('../middleware/validate');
const validateId = require('../middleware/validateId');

const {
  createRecordSchema,
  updateRecordSchema,
  recordQuerySchema
} = require('../validations/Records.validation');

const router = Router();

// Protect all medical record endpoints.
router.use(authenticate);

/**
 * @swagger
 * /records:
 *   get:
 *     summary: Retrieve clinical medical records list
 *     description: 'Returns clinical encounter records. Accessible by admin and doctor roles.'
 *     tags: [Medical Records]
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
 *     responses:
 *       200:
 *         description: Medical records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Medical records retrieved successfully' }
 *                 data:
 *                   type: array
 *                   items: { type: object }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   post:
 *     summary: Create a medical record for a completed consultation
 *     description: 'Attaches diagnosis, treatment plan, vital signs, and specialty data to an appointment. Requires role: doctor.'
 *     tags: [Medical Records]
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
 *               - visit_date
 *             properties:
 *               appointment_id: { type: integer, example: 10 }
 *               patient_id: { type: integer, example: 1 }
 *               doctor_id: { type: integer, example: 2 }
 *               visit_date: { type: string, format: date, example: '2026-10-15' }
 *               diagnosis: { type: string, example: 'Acute seasonal allergic rhinitis' }
 *               treatment_plan: { type: string, example: 'Antihistamines and nasal corticosteroid spray for 14 days' }
 *               vital_signs:
 *                 type: object
 *                 example: { bp: '120/80', pulse: 72, temp: '36.8', weight: 75, height: 178 }
 *               specialty_data:
 *                 type: object
 *                 example: { nasal_congestion_score: 4, throat_redness: 'mild' }
 *               follow_up_date: { type: string, format: date, example: '2026-10-29' }
 *               follow_up_notes: { type: string, example: 'Review symptoms if no improvement' }
 *     responses:
 *       201:
 *         description: Medical record created successfully
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
    authorize('admin', 'doctor', 'patient'),
    validate(recordQuerySchema, 'query'),
    recordController.getAll
  )
  .post(
    authorize('doctor'),
    validate(createRecordSchema),
    recordController.create
  );

/**
 * @swagger
 * /records/patient/{patientId}:
 *   get:
 *     summary: Retrieve patient complete medical history
 *     description: 'Fetches all medical records and consultation history for a given patient. Requires role: admin, doctor, or patient.'
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient medical history retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/patient/:patientId',
  authorize('admin', 'doctor', 'patient'),
  validateId('patientId'),
  recordController.getPatientHistory
);

/**
 * @swagger
 * /records/{id}:
 *   get:
 *     summary: Retrieve single medical record by ID
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Medical record ID
 *     responses:
 *       200:
 *         description: Medical record retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   patch:
 *     summary: Update an existing medical record
 *     description: 'Updates diagnosis, treatment plan, or follow-up details. Requires role: doctor or admin.'
 *     tags: [Medical Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Medical record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               diagnosis: { type: string }
 *               treatment_plan: { type: string }
 *               vital_signs: { type: object }
 *               specialty_data: { type: object }
 *               follow_up_date: { type: string, format: date }
 *               follow_up_notes: { type: string }
 *     responses:
 *       200:
 *         description: Medical record updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
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
    authorize('admin', 'doctor', 'patient'),
    validateId(),
    recordController.getById
  )
  .patch(
    authorize('doctor', 'admin'),
    validateId(),
    validate(updateRecordSchema),
    recordController.update
  );

module.exports = router;