'use strict';

/**
 * BillingModel
 * --------------------------------------------
 * Data Access Layer (DAL) for the billing table.
 *
 * Table columns:
 * id, invoice_number, appointment_id, patient_id, subtotal,
 * discount, tax, total, status, notes, created_at, updated_at,
 * deleted_at
 *
 * Responsibilities:
 * - Execute parameterized SQL queries only
 * - Join patient + appointment (+ doctor via appointment) info
 *   for read operations
 * - No business logic (handled in Service layer)
 *
 * Security rules:
 * - No string interpolation with user input
 * - Dynamic updates use whitelist only
 */

const db = require('../config/database');

/** Columns shared by findAll / findById */
const BASE_SELECT = `
  SELECT
    b.id,
    b.invoice_number,
    b.appointment_id,
    a.appointment_code,
    a.appointment_date,
    a.doctor_id AS appointment_doctor_id,
    du.name AS doctor_name,
    b.patient_id,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    p.phone AS patient_phone,
    b.subtotal,
    b.discount,
    b.tax,
    b.total,
    b.status,
    b.notes,
    b.created_at,
    b.updated_at
  FROM billing b
  INNER JOIN patients p ON p.id = b.patient_id
  INNER JOIN appointments a ON a.id = b.appointment_id
  LEFT JOIN doctors d ON d.id = a.doctor_id
  LEFT JOIN users du ON du.id = d.user_id
`;

class BillingModel {

  /**
   * Get paginated billing list.
   *
   * Supports filtering by patient, doctor (via appointment),
   * appointment, status and created_at date range.
   */
  static async findAll({ limit, offset, patientId, doctorId, appointmentId, status, dateFrom, dateTo }) {

    const params = [];

    let where = 'WHERE b.deleted_at IS NULL';

    if (patientId) {
      where += ' AND b.patient_id = ?';
      params.push(patientId);
    }

    if (doctorId) {
      where += ' AND a.doctor_id = ?';
      params.push(doctorId);
    }

    if (appointmentId) {
      where += ' AND b.appointment_id = ?';
      params.push(appointmentId);
    }

    if (status) {
      where += ' AND b.status = ?';
      params.push(status);
    }

    if (dateFrom) {
      where += ' AND DATE(b.created_at) >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      where += ' AND DATE(b.created_at) <= ?';
      params.push(dateTo);
    }

    const sql = `
    ${BASE_SELECT}
    ${where}
    ORDER BY b.created_at DESC
    LIMIT ${Number(limit)}
    OFFSET ${Number(offset)}
  `;
  
  const [rows] = await db.execute(sql, params);
  
  return rows;
  }

  /**
   * Count billing records for pagination metadata.
   */
  static async countAll({ patientId, doctorId, appointmentId, status, dateFrom, dateTo }) {

    const params = [];

    let where = 'WHERE b.deleted_at IS NULL';

    if (patientId) {
      where += ' AND b.patient_id = ?';
      params.push(patientId);
    }

    if (doctorId) {
      where += ' AND a.doctor_id = ?';
      params.push(doctorId);
    }

    if (appointmentId) {
      where += ' AND b.appointment_id = ?';
      params.push(appointmentId);
    }

    if (status) {
      where += ' AND b.status = ?';
      params.push(status);
    }

    if (dateFrom) {
      where += ' AND DATE(b.created_at) >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      where += ' AND DATE(b.created_at) <= ?';
      params.push(dateTo);
    }

    const [result] = await db.execute(
      `
      SELECT COUNT(*) AS total
      FROM billing b
      INNER JOIN appointments a ON a.id = b.appointment_id
      ${where}
      `,
      params
    );

    return result[0].total;
  }

  /**
   * Find billing record by ID (excludes soft-deleted rows).
   */
  static async findById(id) {

    const [rows] = await db.execute(
      `${BASE_SELECT} WHERE b.id = ? AND b.deleted_at IS NULL LIMIT 1`,
      [id]
    );

    return rows[0] || null;
  }

  /**
   * Find an active (non-cancelled) billing record for an appointment.
   * Optionally excludes one billing ID (used when updating).
   */
  static async findActiveByAppointment(appointmentId, excludeId = null) {

    let sql = `
      SELECT id
      FROM billing
      WHERE appointment_id = ?
        AND status != 'cancelled'
        AND deleted_at IS NULL
    `;

    const params = [appointmentId];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await db.execute(sql, params);

    return rows[0] || null;
  }

  /**
   * Create a new billing record. Status is left to the database's
   * column default (no status supplied here).
   */
  static async create(data) {

    const [result] = await db.execute(
      `
      INSERT INTO billing (
        invoice_number,
        appointment_id,
        patient_id,
        subtotal,
        discount,
        tax,
        total,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.invoice_number,
        data.appointment_id,
        data.patient_id,
        data.subtotal,
        data.discount,
        data.tax,
        data.total,
        data.notes ?? null
      ]
    );

    return result.insertId;
  }

  static async updateInvoiceNumber(id, invoiceNumber) {

    const [result] = await db.execute(
      `
      UPDATE billing
      SET invoice_number = ?,
          updated_at = NOW()
      WHERE id = ?
      AND deleted_at IS NULL
      `,
      [invoiceNumber, id]
    );

    return result.affectedRows > 0;
  }

  /**
   * Update billing fields.
   *
   * Only whitelisted, updatable columns are applied; any other
   * keys on `data` are ignored.
   */
  static async update(id, data) {

    const updatable = ['subtotal', 'discount', 'tax', 'total', 'notes'];

    const fields = [];
    const params = [];

    for (const key of updatable) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    }

    if (fields.length === 0) {
      return false;
    }

    params.push(id);

    const [result] = await db.execute(
      `
      UPDATE billing
      SET ${fields.join(', ')},
          updated_at = NOW()
      WHERE id = ?
        AND deleted_at IS NULL
      `,
      params
    );

    return result.affectedRows > 0;
  }

  /**
   * Mark a billing record as paid.
   */
  static async markPaid(id) {

    const [result] = await db.execute(
      `
      UPDATE billing
      SET status = 'paid',
          updated_at = NOW()
      WHERE id = ?
        AND deleted_at IS NULL
      `,
      [id]
    );

    return result.affectedRows > 0;
  }

  /**
   * Cancel a billing record. Notes are only overwritten when provided.
   */
  static async cancel(id, notes = null) {

    const params = ['cancelled'];
    let sql = `
      UPDATE billing
      SET status = ?
    `;

    if (notes !== null) {
      sql += ', notes = ?';
      params.push(notes);
    }

    sql += `,
        updated_at = NOW()
      WHERE id = ?
        AND deleted_at IS NULL
    `;
    params.push(id);

    const [result] = await db.execute(sql, params);

    return result.affectedRows > 0;
  }

  /**
   * Soft delete a billing record.
   */
  static async softDelete(id) {

    const [result] = await db.execute(
      `
      UPDATE billing
      SET deleted_at = NOW(),
          updated_at = NOW()
      WHERE id = ?
      AND deleted_at IS NULL
      `,
      [id]
    );

    return result.affectedRows > 0;
  }
}

module.exports = BillingModel;