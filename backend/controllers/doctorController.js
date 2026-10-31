/**
 * Doctor Controller
 * Handles HTTP requests for listing, querying, creating, and updating doctor profiles and schedules.
 * Delegates business logic to DoctorService.
 */

'use strict';

const doctorService = require('../services/doctorService');
const ApiResponse   = require('../utils/apiResponse');
const asyncHandler  = require('../utils/asyncHandler');

class DoctorController {

  getAll = asyncHandler(async (req, res) => {
    const result = await doctorService.getAllDoctors(req.query);

    return ApiResponse.success(
      res,
      result.data,
      'Doctors retrieved successfully',
      200,
      result.meta
    );
  });

  getDoctorById = asyncHandler(async (req, res) => {
    const doctor = await doctorService.getDoctorById(req.params.id);
  
    return ApiResponse.success(
      res,
      doctor,
      'Doctor retrieved successfully'
    );
  });

  createDoctor = asyncHandler(async (req, res) => {
    const doctor = await doctorService.createDoctor(req.body);
  
    return ApiResponse.success(
      res,
      doctor,
      'Doctor created successfully',
      201
    );
  });

  updateDoctor = asyncHandler(async (req, res) => {
    const doctor = await doctorService.updateDoctor(
      req.params.id,
      req.body,
      req.user
    );
  
    return ApiResponse.success(
      res,
      doctor,
      'Doctor updated successfully'
    );
  });

  deleteDoctor = asyncHandler(async (req, res) => {
    const result = await doctorService.deleteDoctor(req.params.id);
  
    return ApiResponse.success(
      res,
      result,
      result.message
    );
  });

  getAvailability = asyncHandler(async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const targetDate = req.query.date || today;

    const availability = await doctorService.getDoctorAvailability(
      req.params.id,
      targetDate
    );

    return ApiResponse.success(
      res,
      availability,
      'Doctor availability retrieved successfully'
    );
  });
}

module.exports = new DoctorController();