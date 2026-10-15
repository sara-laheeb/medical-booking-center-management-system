/**
 * Appointment Controller
 * Handles HTTP requests for scheduling, listing, updating, and cancelling appointments.
 * Delegates all business logic to AppointmentService and returns standardized API responses.
 */

'use strict';

const appointmentService = require('../services/appointmentService');
const ApiResponse  = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

class AppointmentController {

  /**
   * Retrieve paginated list of appointments with optional filters
   */
  getAll = asyncHandler(async (req, res) => {
    const result = await appointmentService.getAllAppointments(
      req.query,
      req.user
    );

    return ApiResponse.success(
      res,
      result.data,
      'Appointments retrieved successfully',
      200,
      result.meta
    );
  });

  getById = asyncHandler(async (req, res) => {
    const appointment = await appointmentService.getAppointmentById(
      req.params.id,
      req.user
    );
    return ApiResponse.success(
      res,
      appointment,
      'Appointment retrieved successfully'
    );
  });

  create = asyncHandler(async (req, res) => {

    const appointment = await appointmentService.createAppointment(
      req.body,
      req.user
    );
  
    return ApiResponse.success(
      res,
      appointment,
      'Appointment booked successfully',
      201
    );
  });

  reschedule = asyncHandler(async (req, res) => {

  const appointment = await appointmentService.rescheduleAppointment(
    req.params.id,
    req.body,
    req.user
  );

  return ApiResponse.success(
    res,
    appointment,
    'Appointment rescheduled successfully'
  );
});

updateStatus = asyncHandler(async (req, res) => {

  const appointment = await appointmentService.updateStatus(
  req.params.id,
  req.body.status,
  req.user
  );
  
  return ApiResponse.success(
  res,
  appointment,
  'Appointment status updated successfully'
  );
  });
  

  cancel = asyncHandler(async (req, res) => {

    const appointment = await appointmentService.cancelAppointment(
      req.params.id,
      req.body.cancel_reason,
      req.user
    );

  return ApiResponse.success(
    res,
    appointment,
    'Appointment cancelled successfully'
  );
});

delete = asyncHandler(async (req, res) => {

  const result = await appointmentService.deleteAppointment(
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

module.exports = new AppointmentController();