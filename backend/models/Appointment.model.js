'use strict';

/**
 * AppointmentModel
 * --------------------------------------------
 * Data Access Layer (DAL) for the appointments table.
 *
 * Responsibilities:
 * - Execute parameterized SQL queries only
 * - Join patient + doctor (via user) info for read operations
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
    a.id,
    a.appointment_code,
    a.patient_id,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    p.phone AS patient_phone,
    a.doctor_id,
    du.name AS doctor_name,
    a.appointment_date,
    a.start_time,
    a.end_time,
    a.status,
    a.visit_type,
    a.chief_complaint,
    a.cancel_reason,
    a.notes,
    a.booked_by,
    a.created_at,
    a.updated_at
  FROM appointments a
  INNER JOIN patients p ON p.id = a.patient_id
  INNER JOIN doctors d ON d.id = a.doctor_id
  INNER JOIN users du ON du.id = d.user_id
`;

class AppointmentModel {

  /**
   * Get paginated appointments list.
   *
   * Supports filtering by patient, doctor, status and date range.
   */
  static async findAll({ limit, offset, patientId, doctorId, status, dateFrom, dateTo }) {

    const params = [];

    let where = 'WHERE a.deleted_at IS NULL';

    if (patientId) {
      where += ' AND a.patient_id = ?';
      params.push(patientId);
    }

    if (doctorId) {
      where += ' AND a.doctor_id = ?';
      params.push(doctorId);
    }

    if (status) {
      where += ' AND a.status = ?';
      params.push(status);
    }

    if (dateFrom) {
      where += ' AND a.appointment_date >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      where += ' AND a.appointment_date <= ?';
      params.push(dateTo);
    }

    const safeLimit = Number(limit);
    const safeOffset = Number(offset);

const sql = `
  ${BASE_SELECT}
  ${where}
  ORDER BY a.appointment_date DESC, a.start_time DESC
  LIMIT ${safeLimit} OFFSET ${safeOffset}
`;

const [rows] = await db.execute(
  sql,
  params
);
    return rows;
  }

  /**
   * Count appointments for pagination metadata.
   */
  static async countAll({ patientId, doctorId, status, dateFrom, dateTo }) {

    const params = [];

    let where = 'WHERE a.deleted_at IS NULL';

    if (patientId) {
      where += ' AND a.patient_id = ?';
      params.push(patientId);
    }

    if (doctorId) {
      where += ' AND a.doctor_id = ?';
      params.push(doctorId);
    }

    if (status) {
      where += ' AND a.status = ?';
      params.push(status);
    }

    if (dateFrom) {
      where += ' AND a.appointment_date >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      where += ' AND a.appointment_date <= ?';
      params.push(dateTo);
    }

    const [result] = await db.execute(
      `SELECT COUNT(*) AS total FROM appointments a ${where}`,
      params
    );

    return result[0].total;
  }

  /**
   * Find appointment by ID (excludes soft-deleted rows).
   */
  static async findById(id) {

    const [rows] = await db.execute(
      `${BASE_SELECT} WHERE a.id = ? AND a.deleted_at IS NULL LIMIT 1`,
      [id]
    );

    return rows[0] || null;
  }

  /**
   * Find a non-cancelled appointment for a doctor that overlaps
   * the given time range. Optionally excludes one appointment ID
   * (used when rescheduling an existing appointment).
   */
  static async findOverlapping({ doctorId, date, startTime, endTime, excludeId = null }) {

    let sql = `
      SELECT id
      FROM appointments
      WHERE doctor_id = ?
        AND appointment_date = ?
        AND status NOT IN ('cancelled', 'no_show')
        AND deleted_at IS NULL
        AND start_time < ?
        AND end_time > ?
    `;

    const params = [doctorId, date, endTime, startTime];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await db.execute(sql, params);

    return rows[0] || null;
  }

  /**
   * Create a new appointment.
   */
  static async create(data) {

    const [result] = await db.execute(
      `
      INSERT INTO appointments (
        appointment_code,
        patient_id,
        doctor_id,
        appointment_date,
        start_time,
        end_time,
        status,
        visit_type,
        chief_complaint,
        notes,
        booked_by
      )
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
      `,
      [
        data.appointment_code,
        data.patient_id,
        data.doctor_id,
        data.appointment_date,
        data.start_time,
        data.end_time,
        data.visit_type ?? 'new',
        data.chief_complaint ?? null,
        data.notes ?? null,
        data.booked_by
      ]
    );
  
    return result.insertId;
  }
  
  static async updateAppointmentCode(id, appointmentCode) {
  
    const [result] = await db.execute(
      `
      UPDATE appointments
      SET appointment_code = ?,
          updated_at = NOW()
      WHERE id = ?
      `,
      [appointmentCode, id]
    );
  
    return result.affectedRows > 0;
  }
  /**
   * Reschedule an appointment to a new date/time and reset it to pending.
   */
  static async reschedule(id, { appointmentDate, startTime, endTime }) {

    const [result] = await db.execute(
      `
      UPDATE appointments
      SET appointment_date = ?,
          start_time = ?,
          end_time = ?,
          status = 'pending',
          updated_at = NOW()
      WHERE id = ?
        AND deleted_at IS NULL
      `,
      [appointmentDate, startTime, endTime, id]
    );
  
    return result.affectedRows > 0;
  }

  /**
   * Update appointment status only.
   */
  static async updateStatus(id, status) {

    const [result] = await db.execute(
      `
      UPDATE appointments
      SET status = ?,
          updated_at = NOW()
      WHERE id = ?
        AND deleted_at IS NULL
      `,
      [status, id]
    );
  
    return result.affectedRows > 0;
  }

  /**
   * Cancel an appointment with an optional reason.
   */
  static async cancel(id, reason) {

    const [result] = await db.execute(
      `
      UPDATE appointments
      SET status = 'cancelled',
          cancel_reason = ?,
          updated_at = NOW()
      WHERE id = ?
        AND deleted_at IS NULL
      `,
      [reason || null, id]
    );
  
    return result.affectedRows > 0;
  }

  /**
   * Soft delete an appointment.
   */
  static async softDelete(id) {

    const [result] = await db.execute(
      `
      UPDATE appointments
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

module.exports = AppointmentModel;