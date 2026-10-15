'use strict';

const prescriptionService = require('../services/Prescription.service');
const ApiResponse  = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * PrescriptionController — Clean version (production style)
 *
 * • No business logic
 * • Only request → validate input → service → response
 */
class PrescriptionController {

  getAll = asyncHandler(async (req, res) => {
    const result = await prescriptionService.getAllPrescriptions(
      req.query,
      req.user
    );

    return ApiResponse.success(
      res,
      result.data,
      'Prescriptions retrieved successfully',
      200,
      result.meta
    );
  });

  getById = asyncHandler(async (req, res) => {
    const prescription = await prescriptionService.getPrescriptionById(
      req.params.id,
      req.user
    );
    return ApiResponse.success(
      res,
      prescription,
      'Prescription retrieved successfully'
    );
  });

  create = asyncHandler(async (req, res) => {

    const prescription = await prescriptionService.createPrescription(
      req.body,
      req.user
    );

    return ApiResponse.success(
      res,
      prescription,
      'Prescription issued successfully',
      201
    );
  });

  update = asyncHandler(async (req, res) => {

    const prescription = await prescriptionService.updatePrescription(
      req.params.id,
      req.body,
      req.user
    );

    return ApiResponse.success(
      res,
      prescription,
      'Prescription updated successfully'
    );
  });

  updateStatus = asyncHandler(async (req, res) => {

    const prescription = await prescriptionService.updateStatus(
      req.params.id,
      req.body.status,
      req.user
    );

    return ApiResponse.success(
      res,
      prescription,
      'Prescription status updated successfully'
    );
  });

  cancel = asyncHandler(async (req, res) => {

    const prescription = await prescriptionService.cancelPrescription(
      req.params.id,
      req.body.notes,
      req.user
    );

    return ApiResponse.success(
      res,
      prescription,
      'Prescription cancelled successfully'
    );
  });

  delete = asyncHandler(async (req, res) => {

    const result = await prescriptionService.deletePrescription(
      req.params.id,
      req.user
    );

    return ApiResponse.success(
        res,
        null,
        result.message
      );
  });
}

module.exports = new PrescriptionController();