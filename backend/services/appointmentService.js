'use strict';

/**
 * AppointmentService
 * --------------------------------------------------
 * Business Logic Layer for the appointments module.
 *
 * Flow:
 * Controller → Service → Model → Database
 *
 * Patient/doctor lookups still go through a lightweight
 * db call here since there's no PatientModel.findExists /
 * DoctorModel.findActive helper exposed for cross-module use;
 * everything specific to the appointments table itself goes
 * through AppointmentModel.
 */

const db = require('../config/database');
const AppointmentModel = require('../models/Appointment.model');
const AppError = require('../errors/AppError');

const STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];

class AppointmentService {

    /**
   * Normalize pagination parameters.
   */
  _parsePagination({ page = 1, limit = 10 }) {

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);

    const parsedLimit = Math.min(
      100,
      Math.max(1, parseInt(limit, 10) || 10)
    );

    return {
      page: parsedPage,
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit
    };
  }

  /**
   * Add minutes to a time string.
   *
   * Accepts:
   * HH:MM
   * HH:MM:SS
   *
   * Returns:
   * HH:MM:SS
   */
  _addMinutes(time, minutes) {

    const [h, m, s = 0] = time.split(':').map(Number);

    const total = h * 60 + m + Number(minutes);

    const endH = Math.floor(total / 60) % 24;
    const endM = total % 60;

    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }



  async _findOrFail(id) {

    const appointment = await AppointmentModel.findById(id);

    if (!appointment) {
      throw new AppError(`Appointment with ID ${id} not found`, 404);
    }

    return appointment;
  }
  async _getDoctorProfileByUserId(userId) {

    const [rows] = await db.execute(
      `
      SELECT id, appointment_duration, is_active
      FROM doctors
      WHERE user_id = ?
      LIMIT 1
      `,
      [userId]
    );
  
    const doctor = rows[0];
  
    if (!doctor) {
      throw new AppError('Doctor profile not found', 404);
    }
  
    if (!doctor.is_active) {
      throw new AppError('Your doctor profile is not currently active', 422);
    }
  
    return doctor;
  }

  async _assertAppointmentAccess(appointment, user) {

    if (['admin', 'receptionist'].includes(user.role)) {
      return;
    }
  
    if (user.role === 'doctor') {
  
      const doctor = await this._getDoctorProfileByUserId(user.id);
  
      if (appointment.doctor_id !== doctor.id) {
        throw new AppError(
          'Doctors can only access their own appointments',
          403
        );
      }
  
      return;
    }
  
    if (user.role === 'patient') {
  
      const [rows] = await db.execute(
        `
        SELECT id
        FROM patients
        WHERE user_id = ?
          AND deleted_at IS NULL
        LIMIT 1
        `,
        [user.id]
      );
  
      if (!rows[0] || appointment.patient_id !== rows[0].id) {
        throw new AppError(
          'Patients can only access their own appointments',
          403
        );
      }
  
      return;
    }
  
    throw new AppError('You are not authorized to access appointments', 403);
  }

  async _assertPatientExists(patientId) {

    const [rows] = await db.execute(
      'SELECT id FROM patients WHERE id = ? AND deleted_at IS NULL',
      [patientId]
    );

    if (!rows[0]) {
      throw new AppError(`Patient with ID ${patientId} not found`, 404);
    }
  }

  async _getActiveDoctorOrFail(doctorId) {

    const [rows] = await db.execute(
      'SELECT id, appointment_duration, is_active FROM doctors WHERE id = ?',
      [doctorId]
    );

    const doctor = rows[0];

    if (!doctor) {
      throw new AppError(`Doctor with ID ${doctorId} not found`, 404);
    }

    if (!doctor.is_active) {
      throw new AppError('This doctor is not currently active', 422);
    }

    return doctor;
  }

  /**
   * Ensure the requested slot doesn't overlap an existing,
   * non-cancelled appointment for the same doctor.
   */
  async _assertSlotIsFree({ doctorId, date, startTime, endTime, excludeId = null }) {

    const conflict = await AppointmentModel.findOverlapping({
      doctorId,
      date,
      startTime,
      endTime,
      excludeId
    });

    if (conflict) {
      throw new AppError(
        'This doctor already has an appointment overlapping this time slot',
        409
      );
    }
  }

  async getAllAppointments(query = {}, user) {

    const { page, limit, offset } = this._parsePagination(query);
    const filters = {
      patientId: query.patient_id || null,
      doctorId: query.doctor_id || null,
      status: STATUSES.includes(query.status) ? query.status : null,
      dateFrom: query.date_from || null,
      dateTo: query.date_to || null
    };
    
    if (user.role === 'doctor') {
      const doctor = await this._getDoctorProfileByUserId(user.id);
      filters.doctorId = doctor.id;
    }
    
    if (user.role === 'patient') {
    
      const [rows] = await db.execute(
        `
        SELECT id
        FROM patients
        WHERE user_id = ?
          AND deleted_at IS NULL
        LIMIT 1
        `,
        [user.id]
      );
    
      if (!rows[0]) {
        throw new AppError('Patient profile not found', 404);
      }
    
      filters.patientId = rows[0].id;
    }
    const [data, total] = await Promise.all([
      AppointmentModel.findAll({
        limit,
        offset,
        ...filters
      }),
      AppointmentModel.countAll(filters)
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  async getAppointmentById(id, user) {

    const appointment = await this._findOrFail(id);
  
    await this._assertAppointmentAccess(appointment, user);
  
    return appointment;
  }

  /**
   * Book a new appointment.
   *
   * Business rules:
   * - Patient and doctor must exist, doctor must be active
   * - Appointment cannot be booked in the past
   * - end_time is derived from the doctor's appointment_duration
   * - Slot must not overlap an existing appointment for that doctor
   */
  async createAppointment(data, user){

  await this._assertPatientExists(data.patient_id);
  const doctor = await this._getActiveDoctorOrFail(data.doctor_id);
  if (user.role === 'doctor') {
    const doctorProfile = await this._getDoctorProfileByUserId(user.id);
    
    if (data.doctor_id !== doctorProfile.id) {
    throw new AppError(
    'Doctors can only create appointments for themselves',
    403
    );
    }
    }
    
    if (!doctor.appointment_duration) {
      throw new AppError(
      'Doctor appointment duration is not configured',
      500
     );
}

const requestedDateTime = new Date(
  `${data.appointment_date}T${data.start_time}`
);

    if (Number.isNaN(requestedDateTime.getTime())) {
      throw new AppError('Invalid appointment date or start time', 400);
    }

    if (requestedDateTime <= new Date()) {
      throw new AppError('Cannot book an appointment in the past', 400);
    }

    const endTime = this._addMinutes(
        data.start_time,
        doctor.appointment_duration
      );

    await this._assertSlotIsFree({
      doctorId: data.doctor_id,
      date: data.appointment_date,
      startTime: data.start_time,
      endTime
    });

    const temporaryCode = `TMP-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;
    
    const newId = await AppointmentModel.create({
      appointment_code: temporaryCode,
      patient_id: data.patient_id,
      doctor_id: data.doctor_id,
      appointment_date: data.appointment_date,
      start_time: data.start_time,
      end_time: endTime,
      visit_type: data.visit_type,
      chief_complaint: data.chief_complaint,
      notes: data.notes,
      booked_by: user.id
    });
    
    const appointmentCode = `APT-${String(newId).padStart(6, '0')}`;
    
    await AppointmentModel.updateAppointmentCode(
      newId,
      appointmentCode
    );
    
    return this._findOrFail(newId);
  }

  /**
   * Reschedule an appointment to a new date/time.
   */
  async rescheduleAppointment(id, { appointment_date, start_time }, user) {

    const appointment = await this._findOrFail(id);
    await this._assertAppointmentAccess(appointment, user);
    
    const requestedDateTime = new Date(
      `${appointment_date}T${start_time}`
    );
    
    if (Number.isNaN(requestedDateTime.getTime())) {
      throw new AppError('Invalid appointment date or start time', 400);
    }
    
    if (requestedDateTime <= new Date()) {
      throw new AppError('Cannot reschedule an appointment to the past', 400);
    }

    const doctor = await this._getActiveDoctorOrFail(
      appointment.doctor_id
    );
    
    if (!doctor.appointment_duration) {
      throw new AppError(
        'Doctor appointment duration is not configured',
        500
      );
    }
    
    const endTime = this._addMinutes(
      start_time,
      doctor.appointment_duration
    );

    await this._assertSlotIsFree({
      doctorId: appointment.doctor_id,
      date: appointment_date,
      startTime: start_time,
      endTime,
      excludeId: id
    });

    const rescheduled = await AppointmentModel.reschedule(id, {
      appointmentDate: appointment_date,
      startTime: start_time,
      endTime
    });

    if (!rescheduled) {
      throw new AppError('Failed to reschedule appointment', 500);
    }

    return this._findOrFail(id);
  }

  /**
   * Update appointment status (confirm, start, complete, no-show).
   */
  async updateStatus(id, status, user) {

    if (!STATUSES.includes(status)) {
      throw new AppError(`Invalid status: ${status}`, 400);
    }

    const appointment = await this._findOrFail(id);
    await this._assertAppointmentAccess(appointment, user);

    if (['completed', 'cancelled'].includes(appointment.status)) {
      throw new AppError(
        `Cannot change status of an appointment that is already "${appointment.status}"`,
        422
      );
    }

    const updated = await AppointmentModel.updateStatus(id, status);

    if (!updated) {
      throw new AppError('Failed to update appointment status', 500);
    }

    return this._findOrFail(id);
  }

  /**
   * Cancel an appointment with a reason.
   */
  async cancelAppointment(id, reason, user) {

    const appointment = await this._findOrFail(id);
    await this._assertAppointmentAccess(appointment, user);

    if (['completed', 'cancelled'].includes(appointment.status)) {
      throw new AppError(
        `Cannot cancel an appointment that is already "${appointment.status}"`,
        422
      );
    }

    const cancelled = await AppointmentModel.cancel(id, reason);

    if (!cancelled) {
      throw new AppError('Failed to cancel appointment', 500);
    }

    return this._findOrFail(id);
  }

  /**
   * Soft delete an appointment record.
   */
  async deleteAppointment(id, user) {

    const appointment = await this._findOrFail(id);

    await this._assertAppointmentAccess(appointment, user);

    const deleted = await AppointmentModel.softDelete(id);

    if (!deleted) {
      throw new AppError('Failed to delete appointment', 500);
    }

    return { message: 'Appointment deleted successfully' };
  }
}

module.exports = new AppointmentService();