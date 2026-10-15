'use strict';

/**
 * BillingService
 * --------------------------------------------------
 * Business Logic Layer for the billing module.
 *
 * Flow:
 * Controller → Service → Model → Database
 *
 * Patient/appointment lookups still go through a lightweight
 * db call here since there's no PatientModel.findExists /
 * AppointmentModel.findById exposed for cross-module use;
 * everything specific to the billing table itself goes
 * through BillingModel.
 */

const db = require('../config/database');
const BillingModel = require('../models/Billing.model');
const AppError = require('../errors/AppError');

const STATUSES = ['pending', 'paid', 'cancelled'];

class BillingService {

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
   * Compute the invoice total from subtotal, discount and tax,
   * rounded to 2 decimal places.
   */
  _computeTotal(subtotal, discount, tax) {
    return Math.round((subtotal - discount + tax) * 100) / 100;
  }

  async _findOrFail(id) {

    const billing = await BillingModel.findById(id);

    if (!billing) {
      throw new AppError(`Billing record with ID ${id} not found`, 404);
    }

    return billing;
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

    console.log("userId:", userId);
  
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
  async _assertBillingAccess(billing, user) {

    if (['admin', 'receptionist'].includes(user.role)) {
      return;
    }

    if (user.role === 'doctor') {

      const doctor = await this._getDoctorProfileByUserId(user.id);

      if (billing.appointment_doctor_id !== doctor.id) {
        throw new AppError(
          'Doctors can only access invoices for their own appointments',
          403
        );
      }

      return;
    }

    if (user.role === 'patient') {

      const patient = await this._getPatientProfileByUserId(user.id);

      if (billing.patient_id !== patient.id) {
        throw new AppError(
          'Patients can only access their own invoices',
          403
        );
      }

      return;
    }

    throw new AppError('You are not authorized to access billing records', 403);
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

  /**
   * Ensure the referenced appointment exists and belongs to the
   * given patient.
   */
  async _assertAppointmentMatches(appointmentId, patientId) {

    const [rows] = await db.execute(
      `
      SELECT id, patient_id, doctor_id, status
      FROM appointments
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
      `,
      [appointmentId]
    );

    const appointment = rows[0];

    if (!appointment) {
      throw new AppError(`Appointment with ID ${appointmentId} not found`, 404);
    }

    if (appointment.patient_id !== patientId) {
      throw new AppError(
        'The linked appointment does not match the given patient',
        422
      );
    }

    return appointment;
  }

  /**
   * Ensure there isn't already an active (non-cancelled) invoice
   * for this appointment.
   */
  async _assertNoDuplicateActiveBilling(appointmentId, excludeId = null) {

    const existing = await BillingModel.findActiveByAppointment(appointmentId, excludeId);

    if (existing) {
      throw new AppError(
        'An active invoice already exists for this appointment',
        409
      );
    }
  }

  /**
   * Ensure the discount does not exceed the subtotal.
   */
  _assertValidAmounts(subtotal, discount) {

    if (discount > subtotal) {
      throw new AppError('Discount cannot exceed the subtotal', 422);
    }
  }

  async getAllBilling(query = {}, user) {

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
      BillingModel.findAll({
        limit,
        offset,
        ...filters
      }),
      BillingModel.countAll(filters)
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

  async getBillingById(id, user) {

    const billing = await this._findOrFail(id);

    await this._assertBillingAccess(billing, user);

    return billing;
  }

  /**
   * Create a new invoice.
   *
   * Business rules:
   * - Patient must exist
   * - The linked appointment must exist and belong to the given patient
   * - An appointment may only have one active (non-cancelled) invoice
   * - Discount cannot exceed the subtotal
   * - total is computed from subtotal - discount + tax
   * - Status always starts at the database default ('pending')
   */
  async createBilling(data, user) {

    await this._assertPatientExists(data.patient_id);
    const appointment = await this._assertAppointmentMatches(
        data.appointment_id,
        data.patient_id
      );
      
      if (appointment.status === 'cancelled') {
        throw new AppError(
          'Cannot create invoice for a cancelled appointment',
          422
        );
      }
    await this._assertNoDuplicateActiveBilling(data.appointment_id);

    const subtotal = Number(data.subtotal);
    const discount = Number(data.discount ?? 0);
    const tax = Number(data.tax ?? 0);

    this._assertValidAmounts(subtotal, discount);

    const total = this._computeTotal(subtotal, discount, tax);

    const temporaryNumber = `TMP-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;

    const newId = await BillingModel.create({
      invoice_number: temporaryNumber,
      appointment_id: data.appointment_id,
      patient_id: data.patient_id,
      subtotal,
      discount,
      tax,
      total,
      notes: data.notes
    });

    const invoiceNumber = `INV-${String(newId).padStart(6, '0')}`;

    await BillingModel.updateInvoiceNumber(
      newId,
      invoiceNumber
    );

    return this._findOrFail(newId);
  }

  /**
   * Update invoice amounts/notes. Only allowed while still pending.
   */
  async updateBilling(id, data, user) {

    const billing = await this._findOrFail(id);
    await this._assertBillingAccess(billing, user);

    if (billing.status !== 'pending') {
      throw new AppError(
        `Cannot edit an invoice that is already "${billing.status}"`,
        422
      );
    }

    const subtotal = Number(data.subtotal ?? billing.subtotal);
    const discount = Number(data.discount ?? billing.discount);
    const tax = Number(data.tax ?? billing.tax);

    this._assertValidAmounts(subtotal, discount);

    const total = this._computeTotal(subtotal, discount, tax);

    const updated = await BillingModel.update(id, {
      subtotal,
      discount,
      tax,
      total,
      notes: data.notes
    });

    if (!updated) {
      throw new AppError('Failed to update invoice', 500);
    }

    return this._findOrFail(id);
  }

  /**
   * Update billing status.
   *
   * Only 'paid' is accepted through this endpoint; cancellation
   * has its own dedicated action.
   */
  async updateStatus(id, status, user) {

    if (status !== 'paid') {
      throw new AppError(`Invalid status transition: ${status}`, 400);
    }

    const billing = await this._findOrFail(id);
    await this._assertBillingAccess(billing, user);

    if (billing.status !== 'pending') {
      throw new AppError(
        `Cannot mark an invoice as paid when it is already "${billing.status}"`,
        422
      );
    }

    const updated = await BillingModel.markPaid(id);

    if (!updated) {
      throw new AppError('Failed to update invoice status', 500);
    }

    return this._findOrFail(id);
  }

  /**
   * Cancel an invoice. Notes are optional and, when provided,
   * overwrite the existing notes.
   */
  async cancelBilling(id, notes, user) {

    const billing = await this._findOrFail(id);
    await this._assertBillingAccess(billing, user);

    if (billing.status !== 'pending') {
      throw new AppError(
        `Cannot cancel an invoice that is already "${billing.status}"`,
        422
      );
    }

    const cancelled = await BillingModel.cancel(id, notes ?? null);

    if (!cancelled) {
      throw new AppError('Failed to cancel invoice', 500);
    }

    return this._findOrFail(id);
  }

  /**
   * Soft delete a billing record. Paid invoices cannot be deleted.
   */
  async deleteBilling(id, user) {

    const billing = await this._findOrFail(id);

    await this._assertBillingAccess(billing, user);

    if (billing.status === 'paid') {
      throw new AppError('Cannot delete an invoice that has been paid', 422);
    }
    if (billing.status === 'cancelled') {
        throw new AppError(
            'Cancelled invoices cannot be deleted',
            422
        );
    }
    const deleted = await BillingModel.softDelete(id);

    if (!deleted) {
      throw new AppError('Failed to delete invoice', 500);
    }

    return { message: 'Invoice deleted successfully' };
  }
}

module.exports = new BillingService();