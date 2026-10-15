'use strict';

const invoiceService = require('../services/InvoiceService');
const ApiResponse  = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * InvoiceController — Clean version (production style)
 *
 * • No try/catch
 * • No business logic
 * • Input shape/format is validated by Joi (validations/invoices.validation.js)
 * • Only request → service → response
 */
class InvoiceController {

  getAll = asyncHandler(async (req, res) => {
    const result = await invoiceService.getAllInvoices(req.query);

    return ApiResponse.success(
      res,
      result.data,
      'Invoices retrieved successfully',
      200,
      result.meta
    );
  });

  getById = asyncHandler(async (req, res) => {
    const invoice = await invoiceService.getInvoiceById(req.params.id);

    return ApiResponse.success(
      res,
      invoice,
      'Invoice retrieved successfully'
    );
  });

  create = asyncHandler(async (req, res) => {
    const invoice = await invoiceService.createInvoice(req.body, req.user.id);

    return ApiResponse.success(
      res,
      invoice,
      'Invoice created successfully',
      201
    );
  });

  recordPayment = asyncHandler(async (req, res) => {
    const invoice = await invoiceService.recordPayment(req.params.id, req.body);

    return ApiResponse.success(
      res,
      invoice,
      'Payment recorded successfully'
    );
  });

  refund = asyncHandler(async (req, res) => {
    const invoice = await invoiceService.refundInvoice(req.params.id);

    return ApiResponse.success(
      res,
      invoice,
      'Invoice refunded successfully'
    );
  });
}

module.exports = new InvoiceController();