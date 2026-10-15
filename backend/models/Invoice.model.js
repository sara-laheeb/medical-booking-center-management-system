'use strict';

/**
 * InvoiceModel
 * --------------------------------------------
 * Data Access Layer (DAL) for the invoices + invoice_items tables.
 *
 * Responsibilities:
 * - Execute parameterized SQL queries only
 * - Join patient info for read operations
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
    i.id,
    i.invoice_code,
    i.patient_id,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    p.phone        AS patient_phone,
    i.appointment_id,
    i.doctor_id,
    i.subtotal,
    i.discount,
    i.tax,
    i.total,
    i.paid_amount,
    i.status,
    i.payment_method,
    i.notes,
    i.issued_by,
    i.created_at,
    i.updated_at
  FROM invoices i
  INNER JOIN patients p ON p.id = i.patient_id
`;

class InvoiceModel {

  /**
   * Get paginated invoices list.
   *
   * Supports filtering by patient, status and creation date range.
   */
  static async findAll({ limit, offset, patientId, status, dateFrom, dateTo }) {

    const params = [];

    let where = 'WHERE 1 = 1';

    if (patientId) {
      where += ' AND i.patient_id = ?';
      params.push(patientId);
    }

    if (status) {
      where += ' AND i.status = ?';
      params.push(status);
    }

    if (dateFrom) {
      where += ' AND DATE(i.created_at) >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      where += ' AND DATE(i.created_at) <= ?';
      params.push(dateTo);
    }

    const sql = `
      ${BASE_SELECT}
      ${where}
      ORDER BY i.created_at DESC
     LIMIT ${Number(limit)}
     OFFSET ${Number(offset)}
    `;

    const safeLimit = Number(limit);
    const safeOffset = Number(offset);

    const [rows] = await db.execute(
    sql,
    [...params, safeLimit, safeOffset]
    );

return rows;
  }

  /**
   * Count invoices for pagination metadata.
   */
  static async countAll({ patientId, status, dateFrom, dateTo }) {

    const params = [];

    let where = 'WHERE 1 = 1';

    if (patientId) {
      where += ' AND i.patient_id = ?';
      params.push(patientId);
    }

    if (status) {
      where += ' AND i.status = ?';
      params.push(status);
    }

    if (dateFrom) {
      where += ' AND DATE(i.created_at) >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      where += ' AND DATE(i.created_at) <= ?';
      params.push(dateTo);
    }

    const [result] = await db.execute(
      `SELECT COUNT(*) AS total FROM invoices i ${where}`,
      params
    );

    return result[0].total;
  }

  /**
   * Find invoice by ID.
   */
  static async findById(id) {

    const [rows] = await db.execute(
      `${BASE_SELECT} WHERE i.id = ? LIMIT 1`,
      [id]
    );

    return rows[0] || null;
  }

  /**
   * Retrieve the line items that belong to an invoice.
   */
  static async findItemsByInvoiceId(invoiceId) {

    const [rows] = await db.execute(
      `
      SELECT id, description, item_type, quantity, unit_price, total_price
      FROM invoice_items
      WHERE invoice_id = ?
      `,
      [invoiceId]
    );

    return rows;
  }

  /**
   * Highest existing invoice ID — used by the service layer
   * to generate the next human-readable invoice_code.
   */
  static async getMaxId() {

    const [rows] = await db.execute('SELECT MAX(id) AS maxId FROM invoices');

    return rows[0].maxId || 0;
  }

  /**
   * Create a new invoice header row.
   */
  static async create(data) {

    const [result] = await db.execute(
      `
      INSERT INTO invoices (
        invoice_code,
        patient_id,
        appointment_id,
        doctor_id,
        subtotal,
        discount,
        tax,
        total,
        paid_amount,
        status,
        payment_method,
        notes,
        issued_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'unpaid', ?, ?, ?)
      `,
      [
        data.invoice_code,
        data.patient_id,
        data.appointment_id || null,
        data.doctor_id || null,
        data.subtotal,
        data.discount,
        data.tax,
        data.total,
        data.payment_method || null,
        data.notes || null,
        data.issued_by
      ]
    );

    return result.insertId;
  }

  /**
   * Bulk-insert invoice line items for a given invoice.
   */
  static async addItems(invoiceId, items) {

    for (const item of items) {
      await db.execute(
        `
        INSERT INTO invoice_items (invoice_id, description, item_type, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          invoiceId,
          item.description,
          item.item_type || 'other',
          item.quantity || 1,
          item.unit_price,
          item.total_price
        ]
      );
    }
  }

  /**
   * Record a payment against an invoice: updates paid_amount and status.
   */
  static async recordPayment(id, { paidAmount, status, paymentMethod }) {

    const [result] = await db.execute(
      `
      UPDATE invoices
      SET paid_amount = ?,
          status = ?,
          payment_method = COALESCE(?, payment_method),
          updated_at = NOW()
      WHERE id = ?
      `,
      [paidAmount, status, paymentMethod || null, id]
    );

    return result.affectedRows > 0;
  }

  /**
   * Aggregate revenue totals for a date range.
   *
   * Used by the Financial module's summary report — kept here
   * since it belongs to the invoices table.
   */
  static async getFinancialTotals({ dateFrom, dateTo }) {

    const params = [];
    let dateFilter = '';

    if (dateFrom) {
      dateFilter += ' AND DATE(created_at) >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      dateFilter += ' AND DATE(created_at) <= ?';
      params.push(dateTo);
    }

    const [[row]] = await db.execute(
      `
      SELECT
        COALESCE(SUM(paid_amount), 0)         AS totalCollected,
        COALESCE(SUM(total - paid_amount), 0) AS totalOutstanding,
        COUNT(*)                              AS invoiceCount
      FROM invoices
      WHERE status != 'refunded' ${dateFilter}
      `,
      params
    );

    return {
      totalCollected: Number(row.totalCollected),
      totalOutstanding: Number(row.totalOutstanding),
      invoiceCount: row.invoiceCount
    };
  }

  /**
   * Mark an invoice as refunded.
   */
  static async refund(id) {

    const [result] = await db.execute(
      `UPDATE invoices SET status = 'refunded', updated_at = NOW() WHERE id = ?`,
      [id]
    );

    return result.affectedRows > 0;
  }
}

module.exports = InvoiceModel;