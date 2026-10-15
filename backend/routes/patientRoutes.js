'use strict';

const { Router } = require('express');

const patientController = require('../controllers/patientController');

const {
  authenticate,
  authorize
} = require('../middleware/authMiddleware');

const validate = require('../middleware/validate');
const validateId = require('../middleware/validateId');

const {
  createPatientSchema,
  updatePatientSchema,
  patientQuerySchema
} = require('../validations/patients.validation');

const router = Router();

// Protect all patient endpoints.
router.use(authenticate);

/**
 * @swagger
 * /patients:
 *   get:
 *     summary: Retrieve paginated patients list with optional filters
 *     description: 'Returns a paginated list of patients. Requires role: admin, receptionist, or doctor.'
 *     tags: [Patients]
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
 *         description: Search by patient name, patient code, phone, or national ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, deceased]
 *         description: Filter by patient status
 *     responses:
 *       200:
 *         description: Patients retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Patients retrieved successfully' }
 *                 data:
 *                   type: array
 *                   items: { type: object }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   post:
 *     summary: Register a new patient
 *     description: 'Creates a new patient profile. Generates a unique patient code. Requires role: admin, receptionist, or doctor.'
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - date_of_birth
 *               - gender
 *               - phone
 *             properties:
 *               first_name: { type: string, example: 'Ahmed' }
 *               last_name: { type: string, example: 'Ali' }
 *               date_of_birth: { type: string, format: date, example: '1990-05-15' }
 *               gender: { type: string, enum: [male, female], example: 'male' }
 *               phone: { type: string, example: '+966501234567' }
 *               email: { type: string, format: email, example: 'ahmed@test.com' }
 *               national_id: { type: string, example: '1098765432' }
 *               address: { type: string, example: 'Riyadh, Saudi Arabia' }
 *               blood_type: { type: string, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], example: 'O+' }
 *               chronic_conditions: { type: string, example: 'Hypertension' }
 *               allergies: { type: string, example: 'Penicillin' }
 *               emergency_contact_name: { type: string, example: 'Fatima Ali' }
 *               emergency_contact_phone: { type: string, example: '+966507654321' }
 *               notes: { type: string, example: 'Routine checkup patient' }
 *               status: { type: string, enum: [active, inactive, deceased], default: active }
 *     responses:
 *       201:
 *         description: Patient created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       409:
 *         description: Duplicate national ID or email
 */
router
  .route('/')
  .get(
    authorize('admin', 'receptionist', 'doctor'),
    validate(patientQuerySchema, 'query'),
    patientController.getAll
  )
  .post(
    authorize('admin', 'receptionist', 'doctor'),
    validate(createPatientSchema),
    patientController.create
  );

/**
 * @swagger
 * /patients/{id}:
 *   get:
 *     summary: Retrieve patient details by ID
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Patient database ID
 *     responses:
 *       200:
 *         description: Patient retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update existing patient profile
 *     description: 'Updates patient demographic and medical details. Requires role: admin, receptionist, or doctor.'
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Patient database ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               date_of_birth: { type: string, format: date }
 *               gender: { type: string, enum: [male, female] }
 *               phone: { type: string }
 *               email: { type: string, format: email }
 *               national_id: { type: string }
 *               address: { type: string }
 *               blood_type: { type: string, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] }
 *               chronic_conditions: { type: string }
 *               allergies: { type: string }
 *               emergency_contact_name: { type: string }
 *               emergency_contact_phone: { type: string }
 *               notes: { type: string }
 *               status: { type: string, enum: [active, inactive, deceased] }
 *     responses:
 *       200:
 *         description: Patient updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Soft delete a patient record
 *     description: 'Marks a patient as deleted without removing database records. Requires role: admin or receptionist.'
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Patient database ID
 *     responses:
 *       200:
 *         description: Patient deleted successfully
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
    authorize('admin', 'receptionist', 'doctor'),
    validateId(),
    patientController.getById
  )
  .put(
    authorize('admin', 'receptionist', 'doctor'),
    validateId(),
    validate(updatePatientSchema),
    patientController.update
  )
  .delete(
    authorize('admin', 'receptionist'),
    validateId(),
    patientController.delete
  );

// Enable after implementing Appointment, MedicalRecord and Invoice modules.
// router.get('/:id/history', validateId(), patientController.getHistory);

module.exports = router;