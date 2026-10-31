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

  getStats = asyncHandler(async (req, res) => {
    const stats = await pharmacyService.getPharmacyStats();

    return ApiResponse.success(res, stats, 'Pharmacy statistics retrieved successfully');
  });

  getTransactions = asyncHandler(async (req, res) => {
    const result = await pharmacyService.getStockTransactions(req.query);

    return ApiResponse.success(
      res,
      result.data,
      'Stock transactions retrieved successfully',
      200,
      result.meta
    );
  });

  stockOperation = asyncHandler(async (req, res) => {
    const result = await pharmacyService.stockOperation(req.body, req.user);

    return ApiResponse.success(
      res,
      result,
      'Stock operation executed successfully',
      200
    );
  });

  getSuppliers = asyncHandler(async (req, res) => {
    const suppliers = pharmacyService.getSuppliers();

    return ApiResponse.success(res, suppliers, 'Suppliers retrieved successfully');
  });

  saveSupplier = asyncHandler(async (req, res) => {
    const supplier = pharmacyService.saveSupplier(req.body);

    return ApiResponse.success(res, supplier, 'Supplier saved successfully', 201);
  });
}

module.exports = new PharmacyController();