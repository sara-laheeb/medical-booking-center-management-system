'use strict';

const billingService = require('../services/Billing.service');
const ApiResponse  = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * BillingController — Clean version (production style)
 *
 * • No business logic
 * • Only request → validate input → service → response
 */
class BillingController {

  getAll = asyncHandler(async (req, res) => {
    const result = await billingService.getAllBilling(
      req.query,
      req.user
    );

    return ApiResponse.success(
      res,
      result.data,
      'Invoices retrieved successfully',
      200,
      result.meta
    );
  });

  getById = asyncHandler(async (req, res) => {
    const billing = await billingService.getBillingById(
      req.params.id,
      req.user
    );
    return ApiResponse.success(
      res,
      billing,
      'Invoice retrieved successfully'
    );
  });

  create = asyncHandler(async (req, res) => {

    const billing = await billingService.createBilling(
      req.body,
      req.user
    );

    return ApiResponse.success(
      res,
      billing,
      'Invoice created successfully',
      201
    );
  });

  update = asyncHandler(async (req, res) => {

    const billing = await billingService.updateBilling(
      req.params.id,
      req.body,
      req.user
    );

    return ApiResponse.success(
      res,
      billing,
      'Invoice updated successfully'
    );
  });

  updateStatus = asyncHandler(async (req, res) => {

    const billing = await billingService.updateStatus(
      req.params.id,
      req.body.status,
      req.user
    );

    return ApiResponse.success(
      res,
      billing,
      'Invoice status updated successfully'
    );
  });

  cancel = asyncHandler(async (req, res) => {

    const billing = await billingService.cancelBilling(
      req.params.id,
      req.body.notes,
      req.user
    );

    return ApiResponse.success(
      res,
      billing,
      'Invoice cancelled successfully'
    );
  });

  delete = asyncHandler(async (req, res) => {

    const result = await billingService.deleteBilling(
      req.params.id,
      req.user
    );

    return ApiResponse.success(
      res,
      result,
      result.message
    );
  });
}

module.exports = new BillingController();