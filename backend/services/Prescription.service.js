'use strict';

/**
 * PrescriptionService
 * --------------------------------------------------
 * Business Logic Layer for the prescriptions module.
 *
 * Flow:
 * Controller → Service → Model → Database
 *
 * Patient/doctor/appointment lookups still go through a lightweight
 * db call here since there's no PatientModel.findExists /
 * DoctorModel.findActive / AppointmentModel.findById exposed for
 * cross-module use; everything specific to the prescriptions table
 * itself goes through PrescriptionModel.
 */

const db = require('../config/database');
const PrescriptionModel = require('../models/Prescription.model');
const AppError = require('../errors/AppError');

const STATUSES = ['pending', 'dispensed', 'cancelled'];

class PrescriptionService {

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

  async _findOrFail(id) {

    const prescription = await PrescriptionModel.findById(id);

    if (!prescription) {
      throw new AppError(`Prescription with ID ${id} not found`, 404);
    }

    return prescription;
  }

  async _getDoctorProfileByUserId(userId) {

    const [rows] = await db.execute(
      `
      SELECT id, is_active
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

  async _getPatientProfileByUserId(userId) {

    const [rows] = await db.execute(
      `
      SELECT id
      FROM patients
      WHERE user_id = ?
        AND deleted_at IS NULL
      LIMIT 1
      `,
      [userId]
    );

    if (!rows[0]) {
      throw new AppError('Patient profile not found', 404);
    }

    return rows[0];
  }

  async _assertPrescriptionAccess(prescription, user) {

    if (['admin', 'receptionist'].includes(user.role)) {
      return;
    }

    if (user.role === 'doctor') {

      const doctor = await this._getDoctorProfileByUserId(user.id);

      if (prescription.doctor_id !== doctor.id) {
        throw new AppError(
          'Doctors can only access their own prescriptions',
          403
        );
      }

      return;
    }

    if (user.role === 'patient') {

      const patient = await this._getPatientProfileByUserId(user.id);

      if (prescription.patient_id !== patient.id) {
        throw new AppError(
          'Patients can only access their own prescriptions',
          403
        );
      }

      return;
    }

    throw new AppError('You are not authorized to access prescriptions', 403);
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
      'SELECT id, is_active FROM doctors WHERE id = ?',
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
   * Ensure the referenced appointment exists and belongs to the
   * same patient/doctor pair as the prescription being issued.
   */
  async _assertAppointmentMatches(appointmentId, patientId, doctorId) {

    const [rows] = await db.execute(
      `
      SELECT id, patient_id, doctor_id, status, deleted_at
      FROM appointments
      WHERE id = ?
      LIMIT 1
      `,
      [appointmentId]
    );

    const appointment = rows[0];
    if (!appointment) {
      throw new AppError(
        `Appointment with ID ${appointmentId} not found`,
        404
      );
    }
    
    if (appointment.deleted_at) {
      throw new AppError(
        'This appointment has been deleted',
        422
      );
    }
    
    if (appointment.status === 'cancelled') {
      throw new AppError(
        'Cannot create prescription for a cancelled appointment',
        422
      );
    }
    
    if (
      appointment.patient_id !== patientId ||
      appointment.doctor_id !== doctorId
    ) {
      throw new AppError(
        'The linked appointment does not match the given patient/doctor',
        422
      );
    }
  }
  async getAllPrescriptions(query = {}, user) {

    const { page, limit, offset } = this._parsePagination(query);
    const filters = {
      patientId: query.patient_id || null,
      doctorId: query.doctor_id || null,
      appointmentId: query.appointment_id || null,
      status: STATUSES.includes(query.status) ? query.status : null,
      dateFrom: query.date_from || null,
      dateTo: query.date_to || null
    };

    if (user.role === 'doctor') {
      const doctor = await this._getDoctorProfileByUserId(user.id);
      filters.doctorId = doctor.id;
    }

    if (user.role === 'patient') {
      const patient = await this._getPatientProfileByUserId(user.id);
      filters.patientId = patient.id;
    }

    const [data, total] = await Promise.all([
      PrescriptionModel.findAll({
        limit,
        offset,
        ...filters
      }),
      PrescriptionModel.countAll(filters)
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

  async getPrescriptionById(id, user) {

    const prescription = await this._findOrFail(id);

    await this._assertPrescriptionAccess(prescription, user);

    return prescription;
  }

  /**
   * Issue a new prescription.
   *
   * Business rules:
   * - Patient and doctor must exist, doctor must be active
   * - The linked appointment must exist and match the given patient/doctor
   * - Doctors may only issue prescriptions for themselves
   * - Status always starts as 'pending'
   */
  async createPrescription(data, user) {

    await this._assertPatientExists(data.patient_id);

    if (user.role === 'doctor') {
      const doctorProfile = await this._getDoctorProfileByUserId(user.id);

      if (data.doctor_id !== doctorProfile.id) {
        throw new AppError(
          'Doctors can only issue prescriptions for themselves',
          403
        );
      }
    } else {
      await this._getActiveDoctorOrFail(data.doctor_id);
    }

    await this._assertAppointmentMatches(
      data.appointment_id,
      data.patient_id,
      data.doctor_id
    );

    const temporaryCode = `TMP-${Date.now()}`;

    const newId = await PrescriptionModel.create({
      prescription_code: temporaryCode,
      appointment_id: data.appointment_id,
      patient_id: data.patient_id,
      doctor_id: data.doctor_id,
      notes: data.notes
    });

    const prescriptionCode = `RX-${String(newId).padStart(6, '0')}`;

    await PrescriptionModel.updatePrescriptionCode(
      newId,
      prescriptionCode
    );

    return this._findOrFail(newId);
  }

  /**
   * Update prescription notes. Only allowed while still pending.
   */
  async updatePrescription(id, data, user) {

    const prescription = await this._findOrFail(id);
    await this._assertPrescriptionAccess(prescription, user);

    if (prescription.status !== 'pending') {
      throw new AppError(
        `Cannot edit a prescription that is already "${prescription.status}"`,
        422
      );
    }

    const updated = await PrescriptionModel.update(id, data);

    if (!updated) {
      throw new AppError('Failed to update prescription', 500);
    }

    return this._findOrFail(id);
  }

  /**
   * Update prescription status.
   *
   * Only 'dispensed' is accepted through this endpoint; cancellation
   * has its own dedicated action.
   */
  async updateStatus(id, status, user) {

    if (status !== 'dispensed') {
      throw new AppError(`Invalid status transition: ${status}`, 400);
    }

    const prescription = await this._findOrFail(id);
    await this._assertPrescriptionAccess(prescription, user);

    if (prescription.status !== 'pending') {
      throw new AppError(
        `Cannot dispense a prescription that is already "${prescription.status}"`,
        422
      );
    }

    const updated = await PrescriptionModel.dispense(id, user.id);

    if (!updated) {
      throw new AppError('Failed to update prescription status', 500);
    }

    return this._findOrFail(id);
  }

  /**
   * Cancel a prescription. Notes are optional and, when provided,
   * overwrite the existing notes.
   */
  async cancelPrescription(id, notes, user) {

    const prescription = await this._findOrFail(id);
    await this._assertPrescriptionAccess(prescription, user);

    if (prescription.status !== 'pending') {
      throw new AppError(
        `Cannot cancel a prescription that is already "${prescription.status}"`,
        422
      );
    }

    const cancelled = await PrescriptionModel.cancel(id, notes ?? null);

    if (!cancelled) {
      throw new AppError('Failed to cancel prescription', 500);
    }

    return this._findOrFail(id);
  }

  /**
   * Soft delete a prescription record.
   */
  async deletePrescription(id, user) {

    const prescription = await this._findOrFail(id);
 
    if (prescription.status !== 'pending') {
        throw new AppError(
          'Only pending prescriptions can be deleted',
          422
        );
      }

    const deleted = await PrescriptionModel.softDelete(id);

    if (!deleted) {
      throw new AppError('Failed to delete prescription', 500);
    }

    return { message: 'Prescription deleted successfully' };
  }
}

module.exports = new PrescriptionService();