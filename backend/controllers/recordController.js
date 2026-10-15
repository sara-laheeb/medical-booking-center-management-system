'use strict';

const recordService = require('../services/recordService');
const ApiResponse  = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * RecordController — Clean version (production style)
 *
 * • No try/catch
 * • No business logic
 * • Input shape/format is validated by Joi (validations/records.validation.js)
 * • Only request → service → response
 */
class RecordController {

  getAll = asyncHandler(async (req, res) => {
    const result = await recordService.getAllRecords(req.query);

    return ApiResponse.success(
      res,
      result.data,
      'Medical records retrieved successfully',
      200,
      result.meta
    );
  });

  getById = asyncHandler(async (req, res) => {
    const record = await recordService.getRecordById(req.params.id);

    return ApiResponse.success(
      res,
      record,
      'Medical record retrieved successfully'
    );
  });

  getPatientHistory = asyncHandler(async (req, res) => {
    const history = await recordService.getPatientHistory(req.params.patientId);

    return ApiResponse.success(
      res,
      history,
      'Patient medical history retrieved successfully'
    );
  });

  create = asyncHandler(async (req, res) => {
    const record = await recordService.createRecord(req.body);

    return ApiResponse.success(
      res,
      record,
      'Medical record created successfully',
      201
    );
  });

  update = asyncHandler(async (req, res) => {
    const record = await recordService.updateRecord(req.params.id, req.body);

    return ApiResponse.success(
      res,
      record,
      'Medical record updated successfully'
    );
  });
}

module.exports = new RecordController();