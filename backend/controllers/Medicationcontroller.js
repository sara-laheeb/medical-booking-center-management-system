'use strict';

const medicationService = require('../services/Medicationservice');
const ApiResponse  = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * MedicationController — Clean version (production style)
 *
 * • No try/catch
 * • No business logic
 * • Input shape/format is validated by Joi (validations/medications.validation.js)
 * • Only request → service → response
 */
class MedicationController {

  getAll = asyncHandler(async (req, res) => {
    const result = await medicationService.getAllMedications(req.query);

    return ApiResponse.success(
      res,
      result.data,
      'Medications retrieved successfully',
      200,
      result.meta
    );
  });

  getById = asyncHandler(async (req, res) => {
    const medication = await medicationService.getMedicationById(req.params.id);

    return ApiResponse.success(
      res,
      medication,
      'Medication retrieved successfully'
    );
  });

  create = asyncHandler(async (req, res) => {
    const medication = await medicationService.createMedication(req.body);

    return ApiResponse.success(
      res,
      medication,
      'Medication created successfully',
      201
    );
  });

  update = asyncHandler(async (req, res) => {
    const medication = await medicationService.updateMedication(
      req.params.id,
      req.body
    );

    return ApiResponse.success(
      res,
      medication,
      'Medication updated successfully'
    );
  });

  adjustStock = asyncHandler(async (req, res) => {
    const medication = await medicationService.adjustStock(
      req.params.id,
      req.body
    );

    return ApiResponse.success(
      res,
      medication,
      'Stock adjusted successfully'
    );
  });

  delete = asyncHandler(async (req, res) => {
    const result = await medicationService.deactivateMedication(req.params.id);

    return ApiResponse.success(
      res,
      result,
      result.message
    );
  });
}

module.exports = new MedicationController();