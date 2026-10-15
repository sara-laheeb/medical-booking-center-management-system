'use strict';

/**
 * RecordService
 * --------------------------------------------------
 * Business Logic Layer
 *
 * Flow:
 * Controller → Service → Model → Database
 *
 * Responsibilities:
 * - Apply business rules
 * - Validate business conditions
 * - Coordinate database operations
 * - Throw structured AppError exceptions
 */

const RecordModel = require('../models/Record.model');
const db = require('../config/database');
const AppError = require('../errors/AppError');

class RecordService {

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
   * Find medical record or throw 404 error.
   */
  async _findOrFail(id) {

    const record = await RecordModel.findById(id);

    if (!record) {
      throw new AppError(`Medical record with ID ${id} not found`, 404);
    }

    return record;
  }

  /**
   * Ensure the appointment exists and hasn't been soft-deleted.
   *
   * There is no dedicated helper exposed by AppointmentModel for
   * this narrow lookup, so it's read directly here — the same
   * approach AppointmentService itself uses for cross-module checks.
   */
  async _getAppointmentOrFail(appointmentId) {

    const [rows] = await db.execute(
      `
      SELECT id, patient_id, doctor_id, status
      FROM appointments
      WHERE id = ?
      AND deleted_at IS NULL
      `,
      [appointmentId]
    );

    if (!rows[0]) {
      throw new AppError(`Appointment with ID ${appointmentId} not found`, 404);
    }

    return rows[0];
  }

  /**
   * Retrieve all medical records.
   *
   * Supports pagination and patient/doctor filters.
   */
  async getAllRecords(query = {}) {

    const { page, limit, offset } = this._parsePagination(query);

    const filters = {
      patientId: query.patient_id || null,
      doctorId: query.doctor_id || null
    };

    const [data, total] = await Promise.all([
      RecordModel.findAll({ limit, offset, ...filters }),
      RecordModel.countAll(filters)
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

  /**
   * Retrieve one medical record by ID.
   */
  async getRecordById(id) {
    return this._findOrFail(id);
  }

  /**
   * Retrieve full medical history for a patient (most recent first).
   */
  async getPatientHistory(patientId) {
    return RecordModel.findByPatientId(patientId);
  }

  /**
   * Create a medical record for a completed appointment.
   *
   * Business rules:
   * - Appointment must exist
   * - patient_id/doctor_id must match the ones on the appointment
   * - Only one record is allowed per appointment
   * - The appointment is marked "completed" once its record is written
   */
  async createRecord(data) {

    const appointment = await this._getAppointmentOrFail(data.appointment_id);

    if (appointment.patient_id !== Number(data.patient_id)) {
      throw new AppError(
        'patient_id does not match the patient on this appointment',
        422
      );
    }

    if (appointment.doctor_id !== Number(data.doctor_id)) {
      throw new AppError(
        'doctor_id does not match the doctor on this appointment',
        422
      );
    }

    const existing = await RecordModel.findByAppointmentId(data.appointment_id);

    if (existing) {
      throw new AppError(
        'A medical record already exists for this appointment',
        409
      );
    }

    const newId = await RecordModel.create(data);

    // Appointment is considered finished once its medical record is written.
    await db.execute(
        `
        UPDATE appointments
        SET status = 'completed',
            updated_at = NOW()
        WHERE id = ?
        AND deleted_at IS NULL
        `,
        [data.appointment_id]
      );

    return RecordModel.findById(newId);
  }

  /**
   * Update an existing medical record.
   */
  async updateRecord(id, data) {

    await this._findOrFail(id);

    const updated = await RecordModel.update(id, data);

    if (!updated) {
      throw new AppError('Failed to update medical record', 500);
    }

    return RecordModel.findById(id);
  }
}

module.exports = new RecordService();