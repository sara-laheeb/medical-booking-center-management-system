'use strict';

const { Router } = require('express');

const specialtyController = require('../controllers/Specialtycontroller');

const {
  authenticate,
  authorize,
  optionalAuth
} = require('../middleware/authMiddleware');

const validate = require('../middleware/validate');
const validateId = require('../middleware/validateId');

const {
  createSpecialtySchema,
  updateSpecialtySchema,
  specialtyQuerySchema
} = require('../validations/Specialties.validation');

const router = Router();

// Allow public browsing with optional authentication
router.use(optionalAuth);

/**
 * @swagger
 * /specialties:
 *   get:
 *     summary: Retrieve doctor specialties catalog
 *     description: 'Returns all doctor specialties. By default returns only active specialties unless active_only=0.'
 *     tags: [Specialties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active_only
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Set to false or 0 to include inactive specialties
 *     responses:
 *       200:
 *         description: Specialties retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Specialties retrieved successfully' }
 *                 data:
 *                   type: array
 *                   items: { type: object }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   post:
 *     summary: Create a new specialty
 *     description: 'Creates a new specialty category with clinical template type. Requires role: admin.'
 *     tags: [Specialties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - name_ar
 *             properties:
 *               name: { type: string, example: 'Cardiology' }
 *               name_ar: { type: string, example: 'طب وجراحة القلب' }
 *               icon: { type: string, example: 'heart' }
 *               template_type:
 *                 type: string
 *                 enum: [general, dental, cosmetic, ophthalmology, pediatric, other]
 *                 default: general
 *                 example: general
 *               is_active: { type: boolean, default: true }
 *     responses:
 *       201:
 *         description: Specialty created successfully
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
    validate(specialtyQuerySchema, 'query'),
    specialtyController.getAll
  )
  .post(
    authenticate,
    authorize('admin'),
    validate(createSpecialtySchema),
    specialtyController.create
  );

/**
 * @swagger
 * /specialties/{id}:
 *   get:
 *     summary: Retrieve specialty by ID
 *     tags: [Specialties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Specialty ID
 *     responses:
 *       200:
 *         description: Specialty retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update an existing specialty
 *     description: 'Updates specialty details, names, or active status. Requires role: admin.'
 *     tags: [Specialties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Specialty ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               name_ar: { type: string }
 *               icon: { type: string }
 *               template_type:
 *                 type: string
 *                 enum: [general, dental, cosmetic, ophthalmology, pediatric, other]
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: Specialty updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   delete:
 *     summary: Delete a specialty
 *     description: 'Deletes a specialty record. Requires role: admin.'
 *     tags: [Specialties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Specialty ID
 *     responses:
 *       200:
 *         description: Specialty deleted successfully
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
    specialtyController.getById
  )
  .put(
    authenticate,
    authorize('admin'),
    validateId(),
    validate(updateSpecialtySchema),
    specialtyController.update
  )
  .delete(
    authenticate,
    authorize('admin'),
    validateId(),
    specialtyController.delete
  );

module.exports = router;