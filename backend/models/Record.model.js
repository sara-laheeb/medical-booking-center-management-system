'use strict';

/**
 * RecordModel
 * --------------------------------------------
 * Data Access Layer (DAL) for the medical_records table.
 *
 * Responsibilities:
 * - Execute parameterized SQL queries only
 * - Join patient + doctor (via user) info for read operations
 * - Serialize/deserialize the JSON columns (vital_signs, specialty_data)
 * - No business logic (handled in Service layer)
 *
 * Security rules:
 * - No string interpolation with user input
 * - Dynamic updates use whitelist only
 */

const db = require('../config/database');

/** Columns shared by findAll / findById / findByAppointmentId */
const BASE_SELECT = `
  SELECT
    r.id,
    r.appointment_id,
    r.patient_id,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    r.doctor_id,
    du.name          AS doctor_name,
    r.visit_date,
    r.diagnosis,
    r.treatment_plan,
    r.vital_signs,
    r.specialty_data,
    r.follow_up_date,
    r.follow_up_notes,
    r.created_at,
    r.updated_at
  FROM medical_records r
  INNER JOIN patients p ON p.id = r.patient_id
  INNER JOIN doctors d  ON d.id = r.doctor_id
  INNER JOIN users du   ON du.id = d.user_id
`;

/** Allowed columns for dynamic updates. */
const UPDATABLE_COLUMNS = Object.freeze([
  'diagnosis',
  'treatment_plan',
  'vital_signs',
  'specialty_data',
  'follow_up_date',
  'follow_up_notes'
]);

/** Columns stored as JSON and requiring (de)serialization. */
const JSON_COLUMNS = Object.freeze(['vital_signs', 'specialty_data']);

const jsonOrNull = (value) =>
  value === undefined || value === null ? null : JSON.stringify(value);

/**
 * Parse the JSON columns of a row returned from the database
 * back into plain objects for the rest of the app to consume.
 */
const parseJsonColumns = (row) => {

  if (!row) {
    return row;
  }

  for (const column of JSON_COLUMNS) {

    if (typeof row[column] === 'string') {
      try {
        row[column] = JSON.parse(row[column]);
      } catch {
        // Leave the raw string as-is if it isn't valid JSON.
      }
    }
  }

  return row;
};

class RecordModel {

  /**
   * Get paginated medical records list.
   *
   * Supports filtering by patient and doctor.
   */
  static async findAll({ limit, offset, patientId, doctorId }) {

    const params = [];

    let where = 'WHERE r.deleted_at IS NULL';

    if (patientId) {
      where += ' AND r.patient_id = ?';
      params.push(patientId);
    }

    if (doctorId) {
      where += ' AND r.doctor_id = ?';
      params.push(doctorId);
    }

  const sql = `
  ${BASE_SELECT}
  ${where}
  ORDER BY r.visit_date DESC, r.created_at DESC
  LIMIT ${Number(limit)} OFFSET ${Number(offset)}
`;

const [rows] = await db.execute(sql, params);

return rows.map(parseJsonColumns);
  }

  /**
   * Count medical records for pagination metadata.
   */
  static async countAll({ patientId, doctorId }) {

    const params = [];

    let where = 'WHERE r.deleted_at IS NULL';

    if (patientId) {
      where += ' AND r.patient_id = ?';
      params.push(patientId);
    }

    if (doctorId) {
      where += ' AND r.doctor_id = ?';
      params.push(doctorId);
    }

    const [result] = await db.execute(
      `SELECT COUNT(*) AS total FROM medical_records r ${where}`,
      params
    );

    return result[0].total;
  }

  /**
   * Find medical record by ID.
   */
  static async findById(id) {

    const [rows] = await db.execute(
      `
      ${BASE_SELECT}
      WHERE r.id = ?
        AND r.deleted_at IS NULL
      LIMIT 1
      `,
      [id]
    );
    return rows.length ? parseJsonColumns(rows[0]) : null;
  }

  /**
   * Find the medical record linked to a specific appointment.
   *
   * Used to enforce the "one record per appointment" rule.
   */
  static async findByAppointmentId(appointmentId) {

    const [rows] = await db.execute(
      `${BASE_SELECT} WHERE r.appointment_id = ?
        AND r.deleted_at IS NULL
        LIMIT 1`,
      [appointmentId]
    );

    return rows.length ? parseJsonColumns(rows[0]) : null;
  }

  /**
   * Retrieve full medical history for a patient (most recent first).
   */
  static async findByPatientId(patientId) {

    const [rows] = await db.execute(
      `
      ${BASE_SELECT}
      WHERE r.patient_id = ?
      AND r.deleted_at IS NULL
      ORDER BY r.visit_date DESC, r.created_at DESC
      `,
      [patientId]
    );

    return rows.map(parseJsonColumns);
  }

  /**
   * Create a new medical record.
   */
  static async create(data) {

    const [result] = await db.execute(
      `
      INSERT INTO medical_records (
        appointment_id,
        patient_id,
        doctor_id,
        visit_date,
        diagnosis,
        treatment_plan,
        vital_signs,
        specialty_data,
        follow_up_date,
        follow_up_notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.appointment_id,
        data.patient_id,
        data.doctor_id,
        data.visit_date,
        data.diagnosis || null,
        data.treatment_plan || null,
        jsonOrNull(data.vital_signs),
        jsonOrNull(data.specialty_data),
        data.follow_up_date || null,
        data.follow_up_notes || null
      ]
    );

    return result.insertId;
  }

  /**
   * Update medical record fields dynamically.
   *
   * Only whitelisted columns are allowed. JSON columns are
   * serialized automatically.
   */
  static async update(id, data) {

    const set = [];
    const params = [];

    for (const column of UPDATABLE_COLUMNS) {

      if (data[column] !== undefined) {
        set.push(`${column} = ?`);
        params.push(
          JSON_COLUMNS.includes(column) ? jsonOrNull(data[column]) : data[column]
        );
      }
    }

    if (!set.length) {
      return false;
    }

    params.push(id);

    const [result] = await db.execute(
      `
      UPDATE medical_records
      SET ${set.join(', ')},
          updated_at = NOW()
      WHERE id = ?
      `,
      params
    );

    return result.affectedRows > 0;
  }
  static async softDelete(id) {

    const [result] = await db.execute(
      `
      UPDATE medical_records
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

module.exports = RecordModel;