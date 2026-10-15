'use strict';

const pharmacyService = require('../services/Pharmacyservice');
const ApiResponse  = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * PharmacyController — Clean version (production style)
 *
 * Medication catalog endpoints have moved to medicationController/
 * medicationRoutes. This controller now only covers prescriptions.
 */
class PharmacyController {

  getAllPrescriptions = asyncHandler(async (req, res) => {
    const result = await pharmacyService.getAllPrescriptions(req.query);

    return ApiResponse.success(
      res,
      result.data,
      'Prescriptions retrieved successfully',
      200,
      result.meta
    );
  });

  getPrescriptionById = asyncHandler(async (req, res) => {
    const prescription = await pharmacyService.getPrescriptionById(req.params.id);

    return ApiResponse.success(res, prescription, 'Prescription retrieved successfully');
  });

  createPrescription = asyncHandler(async (req, res) => {
    const prescription = await pharmacyService.createPrescription(req.body);
  
    return ApiResponse.success(
      res,
      prescription,
      'Prescription created successfully',
      201
    );
  });

  dispense = asyncHandler(async (req, res) => {
    const prescription = await pharmacyService.dispensePrescription(req.params.id, req.user.id);

    return ApiResponse.success(res, prescription, 'Prescription dispensed successfully');
  });

  cancelPrescription = asyncHandler(async (req, res) => {
    const prescription = await pharmacyService.cancelPrescription(req.params.id);

    return ApiResponse.success(res, prescription, 'Prescription cancelled successfully');
  });
}

module.exports = new PharmacyController();