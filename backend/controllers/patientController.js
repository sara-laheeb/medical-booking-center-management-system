/**
 * Patient Controller
 * Handles HTTP requests for patient registration, search, details, updates, and soft deletion.
 * Delegates business logic to PatientService.
 */

'use strict';

const patientService = require('../services/patientService');
const ApiResponse    = require('../utils/apiResponse');
const asyncHandler   = require('../utils/asyncHandler');

class PatientController {

  getAll = asyncHandler(async (req, res) => {
    const result = await patientService.getAllPatients(req.query, req.user);

    return ApiResponse.success(
      res,
      result.data,
      'Patients retrieved successfully',
      200,
      result.meta
    );
  });

  getById = asyncHandler(async (req, res) => {
    const patient = await patientService.getPatientById(req.params.id, req.user);

    return ApiResponse.success(
      res,
      patient,
      'Patient retrieved successfully'
    );
  });

  create = asyncHandler(async (req, res) => {
    const patient = await patientService.createPatient(req.body, req.user.id);

    return ApiResponse.success(
      res,
      patient,
      'Patient created successfully',
      201
    );
  });

 // getHistory = asyncHandler(async (req, res) => {
   // const history = await patientService.getPatientHistory(req.params.id);

    //return ApiResponse.success(
      //res,
      //history,
      //'Patient history retrieved successfully'
    //);
  //});

  update = asyncHandler(async (req, res) => {
    const patient = await patientService.updatePatient(
      req.params.id,
      req.body,
      req.user
    );

    return ApiResponse.success(
      res,
      patient,
      'Patient updated successfully'
    );
  });

  delete = asyncHandler(async (req, res) => {
    const result = await patientService.deletePatient(
      req.params.id
    );
    
    return ApiResponse.success(
      res,
      result,
      result.message
    );
  });
}

module.exports = new PatientController();