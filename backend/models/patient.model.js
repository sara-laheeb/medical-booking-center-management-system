'use strict';

/**
 * PatientModel
 * --------------------------------------------
 * Data Access Layer (DAL) for patients table.
 *
 * Responsibilities:
 * - Execute parameterized SQL queries only
 * - Handle soft delete filtering
 * - No business logic (handled in Service layer)
 *
 * Security rules:
 * - No string interpolation with user input
 * - Dynamic updates use whitelist only
 */

const db = require('../config/database');


/**
 * Allowed columns for dynamic updates.
 *
 * Prevents unauthorized column updates
 * and protects against SQL injection.
 */
const UPDATABLE_COLUMNS = Object.freeze([
  'first_name',
  'last_name',
  'date_of_birth',
  'gender',
  'national_id',
  'phone',
  'email',
  'address',
  'blood_type',
  'chronic_conditions',
  'allergies',
  'notes',
  'emergency_contact_name',
  'emergency_contact_phone',
  'status'
]);


class PatientModel {


  /**
   * Get paginated patients list.
   *
   * Supports:
   * - Pagination
   * - Status filtering
   * - Search
   */
  static async findAll({ limit, offset, search, status, doctorId }) {

    const params = [];

    let where = 'WHERE p.deleted_at IS NULL';

    if (search) {

      const like = `%${search}%`;

      where += `
        AND (
          p.first_name LIKE ? OR
          p.last_name LIKE ? OR
          p.patient_code LIKE ? OR
          p.phone LIKE ?
        )
      `;

      params.push(
        like,
        like,
        like,
        like
      );
    }

    if (doctorId) {
      where += ` AND (
        EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = p.id AND a.doctor_id = ? AND a.deleted_at IS NULL)
        OR EXISTS (SELECT 1 FROM medical_records mr WHERE mr.patient_id = p.id AND mr.doctor_id = ? AND mr.deleted_at IS NULL)
      )`;
      params.push(doctorId, doctorId);
    }

    const sql = `
SELECT
  p.id,
  p.patient_code,
  p.first_name,
  p.last_name,
  p.date_of_birth,
  p.gender,
  p.national_id,
  p.phone,
  p.email,
  p.blood_type,
  p.status,
  p.created_at,
  p.updated_at
FROM patients p
${where}
ORDER BY p.created_at DESC
LIMIT ${Number(limit)} OFFSET ${Number(offset)}
`;

    const [rows] = await db.execute(
      sql,
      params
    );

    return rows;
  }



  /**
   * Count patients for pagination metadata.
   */
  static async countAll({ search, doctorId }) {

    const params = [];
  
    let where = 'WHERE p.deleted_at IS NULL';
  
    if (search) {
  
      const like = `%${search}%`;
  
      where += `
        AND (
          p.first_name LIKE ? OR
          p.last_name LIKE ? OR
          p.patient_code LIKE ? OR
          p.phone LIKE ? OR
          p.national_id LIKE ?
        )
      `;
  
      params.push(
        like,
        like,
        like,
        like,
        like
      );
    }

    if (doctorId) {
      where += ` AND (
        EXISTS (SELECT 1 FROM appointments a WHERE a.patient_id = p.id AND a.doctor_id = ? AND a.deleted_at IS NULL)
        OR EXISTS (SELECT 1 FROM medical_records mr WHERE mr.patient_id = p.id AND mr.doctor_id = ? AND mr.deleted_at IS NULL)
      )`;
      params.push(doctorId, doctorId);
    }
  
    const [result] = await db.execute(
      `SELECT COUNT(*) AS total FROM patients p ${where}`,
      params
    );
  
    return result[0].total;
  }


  /**
   * Find patient by email.
   *
   * Used for uniqueness validation.
   */
  static async findByEmail(email, excludeId = null) {

    let sql = `
      SELECT id
      FROM patients
      WHERE email = ?
      AND deleted_at IS NULL
    `;


    const params = [email];


    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }


    const [rows] = await db.execute(
      sql,
      params
    );


    return rows[0] || null;
  }



  /**
   * Find patient by ID.
   *
   * Returns only required patient fields
   * instead of exposing all database columns.
   */
  static async findById(id) {

    const [rows] = await db.execute(
      `
      SELECT
        id,
        patient_code,
        first_name,
        last_name,
        date_of_birth,
        gender,
        national_id,
        phone,
        email,
        address,
        blood_type,
        chronic_conditions,
        allergies,
        notes,
        emergency_contact_name,
        emergency_contact_phone,
        status,
        created_by,
        created_at,
        updated_at,
        deleted_at
      FROM patients
      WHERE id = ?
      AND deleted_at IS NULL
      LIMIT 1
      `,
      [id]
    );


    return rows[0] || null;
  }



  /**
   * Find patient by national ID.
   *
   * Used to prevent duplicate records.
   */
  static async findByNationalId(
    nationalId,
    excludeId = null
  ) {

    let sql = `
      SELECT id
      FROM patients
      WHERE national_id = ?
      AND deleted_at IS NULL
    `;


    const params = [nationalId];


    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }


    const [rows] = await db.execute(
      sql,
      params
    );


    return rows[0] || null;
  }



  /**
   * Create new patient record.
   */
  static async create(data) {

    const [result] = await db.execute(
      `
      INSERT INTO patients (
        patient_code,
        first_name,
        last_name,
        date_of_birth,
        gender,
        national_id,
        phone,
        email,
        address,
        blood_type,
        chronic_conditions,
        allergies,
        notes,
        emergency_contact_name,
        emergency_contact_phone,
        status,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.patient_code,
        data.first_name,
        data.last_name,
        data.date_of_birth,
        data.gender,
        data.national_id,
        data.phone,
        data.email || null,
        data.address || null,
        data.blood_type || null,
        data.chronic_conditions || null,
        data.allergies || null,
        data.notes || null,
        data.emergency_contact_name || null,
        data.emergency_contact_phone || null,
        data.status || 'active',
        data.created_by
      ]
    );


    return result.insertId;
  }



  /**
   * Update patient fields dynamically.
   *
   * Only whitelisted columns are allowed.
   */
  static async update(id, data) {

    const set = [];
    const params = [];


    for (const column of UPDATABLE_COLUMNS) {

      if (data[column] !== undefined) {

        set.push(`${column} = ?`);
        params.push(data[column]);

      }
    }


    if (!set.length) {
      return false;
    }


    params.push(id);


    const [result] = await db.execute(
      `
      UPDATE patients
      SET ${set.join(', ')},
          updated_at = NOW()
      WHERE id = ?
      AND deleted_at IS NULL
      `,
      params
    );


    return result.affectedRows > 0;
  }



  /**
   * Soft delete patient.
   */
  static async softDelete(id) {

    const [result] = await db.execute(
      `
      UPDATE patients
      SET deleted_at = NOW(),
          status = 'inactive',
          updated_at = NOW()
      WHERE id = ?
      AND deleted_at IS NULL
      `,
      [id]
    );
  
    return result.affectedRows > 0;
  
  }



  /**
 * Generate patient code.
 *
 * Current implementation uses incremental ID logic.
 * TODO: Replace with UUID or database sequence
 * when scaling to distributed environments.
 */
  static async generatePatientCode() {

    const [rows] = await db.execute(
      'SELECT MAX(id) AS maxId FROM patients'
    );


    const next =
      (rows[0].maxId || 0) + 1;


    return `PAT-${String(next).padStart(6, '0')}`;
  }

}


module.exports = PatientModel;