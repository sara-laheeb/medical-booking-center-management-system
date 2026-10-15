'use strict';

/**
 * MedicationModel
 * --------------------------------------------
 * Data Access Layer (DAL) for the medications table.
 *
 * Responsibilities:
 * - Execute parameterized SQL queries only
 * - No business logic (handled in Service layer)
 *
 * Security rules:
 * - No string interpolation with user input
 * - Dynamic updates use whitelist only
 */

const db = require('../config/database');

/** Allowed columns for dynamic updates. */
const UPDATABLE_COLUMNS = Object.freeze([
  'name',
  'name_ar',
  'category',
  'unit',
  'stock_quantity',
  'minimum_stock',
  'cost_price',
  'selling_price',
  'is_active'
]);

class MedicationModel {

  /**
   * Get paginated medications list.
   *
   * Supports:
   * - Search (English/Arabic name)
   * - Category filtering
   * - Active status filtering
   * - Low stock filtering (stock_quantity <= minimum_stock)
   */
  static async findAll({ limit, offset, search, category, isActive, lowStockOnly }) {

    const params = [];

    let where = 'WHERE 1 = 1';

    if (isActive !== undefined && isActive !== '') {
      where += ' AND is_active = ?';
      params.push(isActive ? 1 : 0);
    }

    if (category) {
      where += ' AND category = ?';
      params.push(category);
    }

    if (lowStockOnly) {
      where += ' AND stock_quantity <= minimum_stock';
    }

    if (search) {

      const like = `%${search}%`;

      where += ' AND (name LIKE ? OR name_ar LIKE ?)';

      params.push(like, like);
    }

    const sql = `
  SELECT *
  FROM medications
  ${where}
  ORDER BY name ASC
  LIMIT ${Number(limit)} OFFSET ${Number(offset)}
`;

const [rows] = await db.execute(sql, params);

return rows;
  }

  /**
   * Count medications for pagination metadata.
   */
  static async countAll({ search, category, isActive, lowStockOnly }) {

    const params = [];

    let where = 'WHERE 1 = 1';

    if (isActive !== undefined && isActive !== '') {
      where += ' AND is_active = ?';
      params.push(isActive ? 1 : 0);
    }

    if (category) {
      where += ' AND category = ?';
      params.push(category);
    }

    if (lowStockOnly) {
      where += ' AND stock_quantity <= minimum_stock';
    }

    if (search) {

      const like = `%${search}%`;

      where += ' AND (name LIKE ? OR name_ar LIKE ?)';

      params.push(like, like);
    }

    const [result] = await db.execute(
      `SELECT COUNT(*) AS total FROM medications ${where}`,
      params
    );

    return result[0].total;
  }

  /**
   * Find medication by ID.
   */
  static async findById(id) {

    const [rows] = await db.execute(
      'SELECT * FROM medications WHERE id = ? LIMIT 1',
      [id]
    );

    return rows[0] || null;
  }

  /**
   * Find medication by name (English or Arabic).
   *
   * Used to prevent duplicate medication entries.
   */
  static async findByName(name, excludeId = null) {

    let sql = `
      SELECT id
      FROM medications
      WHERE (name = ? OR name_ar = ?)
    `;

    const params = [name, name];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await db.execute(sql, params);

    return rows[0] || null;
  }

  /**
   * Check whether any prescription item currently references
   * this medication. Used to protect against deactivating a
   * medication that's still prescribed.
   */
  static async hasPrescriptionItems(id) {

    const [rows] = await db.execute(
      'SELECT id FROM prescription_items WHERE medication_id = ? LIMIT 1',
      [id]
    );

    return rows.length > 0;
  }

  /**
   * Create a new medication.
   */
  static async create(data) {

    const [result] = await db.execute(
      `
      INSERT INTO medications (
        name, name_ar, category, unit, stock_quantity,
        minimum_stock, cost_price, selling_price, is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.name,
        data.name_ar || null,
        data.category || null,
        data.unit || 'tablet',
        data.stock_quantity ?? 0,
        data.minimum_stock ?? 10,
        data.cost_price ?? 0,
        data.selling_price ?? 0,
        data.is_active === undefined ? 1 : data.is_active
      ]
    );

    return result.insertId;
  }

  /**
   * Update medication fields dynamically.
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
      UPDATE medications
      SET ${set.join(', ')},
          updated_at = NOW()
      WHERE id = ?
      `,
      params
    );

    return result.affectedRows > 0;
  }

  /**
   * Adjust stock_quantity by a signed delta (positive to restock,
   * negative to consume). Guards against the update racing below zero.
   */
  static async adjustStock(id, delta) {

    const [result] = await db.execute(
      `
      UPDATE medications
      SET stock_quantity = stock_quantity + ?,
          updated_at = NOW()
      WHERE id = ?
      AND stock_quantity + ? >= 0
      `,
      [delta, id, delta]
    );

    return result.affectedRows > 0;
  }

  /**
   * Deactivate a medication.
   *
   * Medications are never hard-deleted since past prescriptions
   * keep a foreign key reference (medication_id).
   */
  static async deactivate(id) {

    const [result] = await db.execute(
      'UPDATE medications SET is_active = 0, updated_at = NOW() WHERE id = ?',
      [id]
    );

    return result.affectedRows > 0;
  }
}

module.exports = MedicationModel;