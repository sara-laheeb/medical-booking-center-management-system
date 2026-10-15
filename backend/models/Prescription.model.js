'use strict';

/**
 * PrescriptionModel
 * --------------------------------------------
 * Data Access Layer (DAL) for the prescriptions table.
 *
 * Table columns:
 * id, prescription_code, appointment_id, patient_id, doctor_id,
 * status, notes, dispensed_by, dispensed_at, deleted_at,
 * created_at, updated_at
 *
 * Responsibilities:
 * - Execute parameterized SQL queries only
 * - Join patient + doctor (via user) + appointment + dispenser info
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
    pr.id,
    pr.prescription_code,
    pr.appointment_id,
    a.appointment_code,
    pr.patient_id,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    p.phone AS patient_phone,
    pr.doctor_id,
    du.name AS doctor_name,
    pr.status,
    pr.notes,
    pr.dispensed_by,
    disp.name AS dispensed_by_name,
    pr.dispensed_at,
    pr.created_at,
    pr.updated_at
  FROM prescriptions pr
  INNER JOIN patients p ON p.id = pr.patient_id
  INNER JOIN doctors d ON d.id = pr.doctor_id
  INNER JOIN users du ON du.id = d.user_id
  LEFT JOIN appointments a ON a.id = pr.appointment_id
  LEFT JOIN users disp ON disp.id = pr.dispensed_by
`;

class PrescriptionModel {

  /**
   * Get paginated prescriptions list.
   *
   * Supports filtering by patient, doctor, appointment, status
   * and created_at date range.
   */
  static async findAll({ limit, offset, patientId, doctorId, appointmentId, status, dateFrom, dateTo }) {

    const params = [];

    let where = 'WHERE pr.deleted_at IS NULL';

    if (patientId) {
      where += ' AND pr.patient_id = ?';
      params.push(patientId);
    }

    if (doctorId) {
      where += ' AND pr.doctor_id = ?';
      params.push(doctorId);
    }

    if (appointmentId) {
      where += ' AND pr.appointment_id = ?';
      params.push(appointmentId);
    }

    if (status) {
      where += ' AND pr.status = ?';
      params.push(status);
    }

    if (dateFrom) {
      where += ' AND DATE(pr.created_at) >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      where += ' AND DATE(pr.created_at) <= ?';
      params.push(dateTo);
    }

    const safeLimit = Number(limit);
    const safeOffset = Number(offset);
    
    const sql = `
      ${BASE_SELECT}
      ${where}
      ORDER BY pr.created_at DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;
    
    const [rows] = await db.execute(sql, params);

return rows;
  }
  /**
   * Count prescriptions for pagination metadata.
   */
  static async countAll({ patientId, doctorId, appointmentId, status, dateFrom, dateTo }) {

    const params = [];

    let where = 'WHERE pr.deleted_at IS NULL';

    if (patientId) {
      where += ' AND pr.patient_id = ?';
      params.push(patientId);
    }

    if (doctorId) {
      where += ' AND pr.doctor_id = ?';
      params.push(doctorId);
    }

    if (appointmentId) {
      where += ' AND pr.appointment_id = ?';
      params.push(appointmentId);
    }

    if (status) {
      where += ' AND pr.status = ?';
      params.push(status);
    }

    if (dateFrom) {
      where += ' AND DATE(pr.created_at) >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      where += ' AND DATE(pr.created_at) <= ?';
      params.push(dateTo);
    }

    const [result] = await db.execute(
      `SELECT COUNT(*) AS total FROM prescriptions pr ${where}`,
      params
    );

    return result[0].total;
  }

  /**
   * Find prescription by ID (excludes soft-deleted rows).
   */
  static async findById(id) {

    const [rows] = await db.execute(
      `${BASE_SELECT} WHERE pr.id = ? AND pr.deleted_at IS NULL LIMIT 1`,
      [id]
    );

    return rows[0] || null;
  }

  /**
   * Create a new prescription. Status is left to the database's
   * column default (no status supplied here).
   */
  static async create(data) {

    const [result] = await db.execute(
      `
      INSERT INTO prescriptions (
        prescription_code,
        appointment_id,
        patient_id,
        doctor_id,
        notes
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        data.prescription_code,
        data.appointment_id,
        data.patient_id,
        data.doctor_id,
        data.notes ?? null
      ]
    );

    return result.insertId;
  }

  static async updatePrescriptionCode(id, prescriptionCode) {

    const [result] = await db.execute(
      `
      UPDATE prescriptions
      SET prescription_code = ?,
          updated_at = NOW()
      WHERE id = ?
      AND deleted_at IS NULL
      `,
      [prescriptionCode, id]
    );

    return result.affectedRows > 0;
  }

  /**
   * Update prescription fields.
   *
   * Only whitelisted, updatable columns are applied; any other
   * keys on `data` are ignored.
   */
  static async update(id, data) {

    const updatable = ['notes'];

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
      UPDATE prescriptions
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
   * Mark a prescription as dispensed.
   */
  static async dispense(id, dispensedBy) {

    const [result] = await db.execute(
      `
      UPDATE prescriptions
      SET status = 'dispensed',
          dispensed_by = ?,
          dispensed_at = NOW(),
          updated_at = NOW()
      WHERE id = ?
        AND deleted_at IS NULL
      `,
      [dispensedBy, id]
    );

    return result.affectedRows > 0;
  }

  /**
   * Cancel a prescription. Notes are only overwritten when provided.
   */
  static async cancel(id, notes) {

    const [result] = await db.execute(
      `
      UPDATE prescriptions
      SET status = 'cancelled',
          notes = ?,
          updated_at = NOW()
      WHERE id = ?
        AND deleted_at IS NULL
      `,
      [notes ?? null, id]
    );
  
    return result.affectedRows > 0;
  }

  /**
   * Soft delete a prescription.
   */
  static async softDelete(id) {

    const [result] = await db.execute(
      `
      UPDATE prescriptions
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

module.exports = PrescriptionModel;