'use strict';

/**
 * DoctorModel
 * --------------------------------------------
 * Data Access Layer (DAL) for the doctors table.
 *
 * Responsibilities:
 * - Execute parameterized SQL queries only
 * - Join user account + specialty info for read operations
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
  'specialty_id',
  'license_number',
  'consultation_fee',
  'bio',
  'work_days',
  'work_start',
  'work_end',
  'appointment_duration',
  'is_active'
]);

/** Columns shared by findAll / findById / findByUserId */
const BASE_SELECT = `
  SELECT
    d.id,
    d.user_id,
    u.name              AS full_name,
    u.email,
    u.phone,
    d.specialty_id,
    s.name              AS specialty_name_en,
    s.name_ar           AS specialty_name_ar,
    d.license_number,
    d.consultation_fee,
    d.bio,
    d.work_days,
    d.work_start,
    d.work_end,
    d.appointment_duration,
    d.is_active,
    d.created_at,
    d.updated_at
  FROM doctors d
  INNER JOIN users u       ON u.id = d.user_id
  INNER JOIN specialties s  ON s.id = d.specialty_id
`;

class DoctorModel {

  /**
   * Get paginated doctors list.
   *
   * Supports:
   * - Pagination
   * - Search (name, license number)
   * - Specialty filtering
   * - Active status filtering
   */
  static async findAll({ limit, offset, search, specialtyId, isActive }) {

    const params = [];

    let where = 'WHERE TRUE';

    if (isActive !== undefined && isActive !== '') {
      where += ' AND d.is_active = ?';
      params.push(isActive ? 1 : 0);
    }

    if (specialtyId) {
      where += ' AND d.specialty_id = ?';
      params.push(specialtyId);
    }

    if (search) {

      const like = `%${search}%`;

      where += `
        AND (
          u.name LIKE ? OR
          d.license_number LIKE ? OR
          u.email LIKE ?
        )
      `;

      params.push(like, like, like);
    }

    const safeLimit = Number(limit);
    const safeOffset = Number(offset);

    const sql = `
      ${BASE_SELECT}
      ${where}
      ORDER BY d.created_at DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;

    const [rows] = await db.execute(sql, params);
  return rows;
  }

  /**
   * Count doctors for pagination metadata.
   */
  static async countAll({ search, specialtyId, isActive }) {

    const params = [];

    let where = 'WHERE TRUE';

    if (isActive !== undefined && isActive !== '') {
      where += ' AND d.is_active = ?';
      params.push(isActive ? 1 : 0);
    }

    if (specialtyId) {
      where += ' AND d.specialty_id = ?';
      params.push(specialtyId);
    }

    if (search) {

      const like = `%${search}%`;

      where += `
        AND (
          u.name LIKE ? OR
          d.license_number LIKE ? OR
          u.email LIKE ?
        )
      `;

      params.push(like, like, like);
    }

    const [result] = await db.execute(
      `
      SELECT COUNT(*) AS total
      FROM doctors d
      INNER JOIN users u ON u.id = d.user_id
      ${where}
      `,
      params
    );

    return result[0].total;
  }

  /**
   * Find doctor by ID.
   */
  static async findById(id) {

    const [rows] = await db.execute(
      `${BASE_SELECT} WHERE d.id = ? LIMIT 1`,
      [id]
    );

    return rows[0] || null;
  }

  /**
   * Find doctor profile by linked user account.
   *
   * Used to prevent a single user from having
   * more than one doctor profile, and to let a
   * logged in doctor find their own profile.
   */
  static async findByUserId(userId) {

    const [rows] = await db.execute(
      `${BASE_SELECT} WHERE d.user_id = ? LIMIT 1`,
      [userId]
    );

    return rows[0] || null;
  }

  /**
   * Find doctor by license number.
   *
   * Used to prevent duplicate license records.
   */
  static async findByLicenseNumber(licenseNumber, excludeId = null) {

    let sql = `
      SELECT id
      FROM doctors
      WHERE license_number = ?
    `;
  
    const params = [licenseNumber];
  
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
  
    sql += ' LIMIT 1';
  
    const [rows] = await db.execute(sql, params);
  
    return rows[0] || null;
  }

  /**
   * Create new doctor profile.
   */
  static async create(data) {

    const [result] = await db.execute(
      `
      INSERT INTO doctors (
        user_id,
        specialty_id,
        license_number,
        consultation_fee,
        bio,
        work_days,
        work_start,
        work_end,
        appointment_duration,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.user_id,
        data.specialty_id,
        data.license_number,
        data.consultation_fee ?? 0,
        data.bio ?? null,
        Array.isArray(data.work_days) ? data.work_days.join(',') : (data.work_days ?? null),
        data.work_start ?? '08:00:00',
        data.work_end ?? '16:00:00',
        data.appointment_duration ?? 30,
        data.is_active === undefined ? 1 : data.is_active
      ]
    );

    return result.insertId;
  }

  /**
   * Update doctor fields dynamically.
   *
   * Only whitelisted columns are allowed.
   */
  static async update(id, data) {

    const set = [];
    const params = [];

    for (const column of UPDATABLE_COLUMNS) {

      if (data[column] !== undefined) {
        set.push(`${column} = ?`);
        params.push(
          column === 'work_days' && Array.isArray(data[column])
            ? data[column].join(',')
            : data[column]
        );
      }
    }

    if (!set.length) {
      return false;
    }

    params.push(id);

    const [result] = await db.execute(
      `
      UPDATE doctors
      SET ${set.join(', ')},
          updated_at = NOW()
      WHERE id = ?
      `,
      params
    );

    return result.affectedRows > 0;
  }

  /**
   * Deactivate doctor profile.
   *
   * Doctors don't use soft delete (deleted_at) —
   * instead they are flagged inactive so existing
   * appointments/records keep a valid reference.
   */
  static async deactivate(id) {

    const [result] = await db.execute(
      `
      UPDATE doctors
      SET is_active = 0,
          updated_at = NOW()
      WHERE id = ?
      `,
      [id]
    );

    return result.affectedRows > 0;
  }
}

module.exports = DoctorModel;