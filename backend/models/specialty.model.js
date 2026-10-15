'use strict';

/**
 * SpecialtyModel
 *
 * Data Access Layer for specialties.
 *
 * Responsibilities:
 * - Handle database operations related to specialties.
 * - Provide specialty data to the service layer.
 *
 * Business rules belong to the service layer.
 */

const db = require('../config/database');

/** Columns shared by findAll / findById */
const BASE_SELECT = `
  SELECT
    id,
    name        AS name_en,
    name_ar,
    icon,
    template_type,
    is_active,
    created_at
  FROM specialties
`;

/** Allowed columns for dynamic updates. */
const UPDATABLE_COLUMNS = Object.freeze([
  'name',
  'name_ar',
  'icon',
  'template_type',
  'is_active'
]);

class SpecialtyModel {

  /**
   * Retrieve specialties list.
   *
   * @param {boolean} activeOnly - Return only active specialties.
   * @returns {Array} specialties
   */
  static async findAll(activeOnly = true) {

    let sql = BASE_SELECT;

    const params = [];

    if (activeOnly) {
      sql += ` WHERE is_active = ?`;
      params.push(1);
    }

    sql += ` ORDER BY name_ar ASC`;

    const [rows] = await db.execute(sql, params);

    return rows;
  }

  /**
   * Retrieve a specialty by its identifier.
   *
   * @param {number} id
   * @returns {Object|null}
   */
  static async findById(id) {

    const [rows] = await db.execute(
      `${BASE_SELECT} WHERE id = ? LIMIT 1`,
      [id]
    );

    return rows[0] || null;
  }

  /**
   * Find a specialty by Arabic or English name.
   *
   * Used to prevent duplicate specialty names.
   *
   * @param {string} name
   * @param {string} nameAr
   * @param {number|null} excludeId
   */
  static async findByName(name, nameAr, excludeId = null) {

    let sql = `
      SELECT id
      FROM specialties
      WHERE (name = ? OR name_ar = ?)
    `;

    const params = [name, nameAr];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await db.execute(sql, params);

    return rows[0] || null;
  }

  /**
   * Check whether any active doctor is linked to a specialty.
   *
   * Used to protect against deactivating/deleting a specialty
   * that is still referenced by an active doctor profile.
   */
  static async hasLinkedDoctors(id) {

    const [rows] = await db.execute(
      `
      SELECT id
      FROM doctors
      WHERE specialty_id = ?
      LIMIT 1
      `,
      [id]
    );

    return rows.length > 0;
  }

  /**
   * Create a new specialty.
   */
  static async create(data) {

    const [result] = await db.execute(
      `
      INSERT INTO specialties (
        name,
        name_ar,
        icon,
        template_type,
        is_active
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        data.name,
        data.name_ar,
        data.icon ?? null,
        data.template_type ?? 'general',
        data.is_active === undefined ? 1 : data.is_active
      ]
    );

    return result.insertId;
  }

  /**
   * Update specialty fields dynamically.
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
      UPDATE specialties
      SET ${set.join(', ')},
          updated_at = NOW()
      WHERE id = ?
      `,
      params
    );

    return result.affectedRows > 0;
  }

  /**
   * Deactivate a specialty.
   *
   * Specialties are reference data — they are never hard-deleted
   * since doctors keep a foreign key reference (specialty_id).
   */
  static async deactivate(id) {

    const [result] = await db.execute(
      `
      UPDATE specialties
      SET is_active = 0,
          updated_at = NOW()
      WHERE id = ?
      `,
      [id]
    );

    return result.affectedRows > 0;
  }
}

module.exports = SpecialtyModel;