'use strict';

/**
 * DashboardModel
 * --------------------------------------------
 * Data Access Layer (DAL) for cross-module dashboard statistics.
 *
 * Responsibilities:
 * - Execute parameterized, read-only aggregate SQL queries
 * - Pull lightweight summaries from patients, doctors, appointments,
 *   invoices, expenses and medications
 * - No business logic (handled in Service layer)
 *
 * This model never writes data — it only reads and aggregates
 * data owned by the other modules' tables.
 */

const db = require('../config/database');

class DashboardModel {

  /**
   * Headline counters shown at the top of the dashboard.
   */
  static async getOverviewCounts() {

    const [[patients]] = await db.execute(
      `SELECT COUNT(*) AS total FROM patients WHERE deleted_at IS NULL`
    );

    const [[doctors]] = await db.execute(
      `SELECT COUNT(*) AS total FROM doctors WHERE is_active = 1`
    );

    const [[appointmentsToday]] = await db.execute(
      `
      SELECT COUNT(*) AS total
      FROM appointments
      WHERE appointment_date = CURDATE()
      AND deleted_at IS NULL
      `
    );

    const [[pendingAppointments]] = await db.execute(
      `
      SELECT COUNT(*) AS total
      FROM appointments
      WHERE status = 'pending'
      AND deleted_at IS NULL
      `
    );

    return {
      totalPatients: patients.total,
      activeDoctors: doctors.total,
      appointmentsToday: appointmentsToday.total,
      pendingAppointments: pendingAppointments.total
    };
  }

  /**
   * Appointment counts grouped by status (used for a status
   * breakdown chart, e.g. pending / confirmed / completed / cancelled).
   */
  static async getAppointmentStatusBreakdown() {

    const [rows] = await db.execute(
      `
      SELECT status, COUNT(*) AS total
      FROM appointments
      WHERE deleted_at IS NULL
      GROUP BY status
      `
    );

    return rows;
  }

  /**
   * Today's appointment schedule, ordered by start time.
   */
  static async getTodaySchedule(limit) {

    const [rows] = await db.execute(
      `
      SELECT
        a.id,
        a.appointment_code,
        a.start_time,
        a.end_time,
        a.status,
        a.visit_type,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        du.name AS doctor_name
      FROM appointments a
      INNER JOIN patients p ON p.id = a.patient_id
      INNER JOIN doctors d ON d.id = a.doctor_id
      INNER JOIN users du ON du.id = d.user_id
      WHERE a.appointment_date = CURDATE()
        AND a.deleted_at IS NULL
      ORDER BY a.start_time ASC
      LIMIT ${Number(limit)}
      `
    );
  
    return rows;
  }

  /**
   * Most recently registered patients.
   */
  static async getRecentPatients(limit) {

    const [rows] = await db.execute(`
      SELECT
        id,
        patient_code,
        CONCAT(first_name, ' ', last_name) AS full_name,
        phone,
        created_at
      FROM patients
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT ${Number(limit)}
    `);
  
    return rows;
  
  }

  /**
   * Medications at or below their minimum stock threshold.
   */
  static async getLowStockMedications(limit) {

    const [rows] = await db.execute(
      `
      SELECT id, name, name_ar, unit, stock_quantity, minimum_stock
      FROM medications
      WHERE is_active = 1
      AND stock_quantity <= minimum_stock
      ORDER BY (stock_quantity - minimum_stock) ASC
      LIMIT ${Number(limit)}
      `,
      [limit]
    );

    return rows;
  }

  /**
   * Revenue collected today and this month, plus total outstanding
   * balance across all non-refunded invoices.
   */
  static async getRevenueSnapshot() {

    const [[today]] = await db.execute(
      `
      SELECT COALESCE(SUM(paid_amount), 0) AS total
      FROM invoices
      WHERE DATE(created_at) = CURDATE()
      AND status != 'refunded'
      `
    );

    const [[month]] = await db.execute(
      `
      SELECT COALESCE(SUM(paid_amount), 0) AS total
      FROM invoices
      WHERE YEAR(created_at) = YEAR(CURDATE())
      AND MONTH(created_at) = MONTH(CURDATE())
      AND status != 'refunded'
      `
    );

    const [[outstanding]] = await db.execute(
      `
      SELECT COALESCE(SUM(total - paid_amount), 0) AS total
      FROM invoices
      WHERE status IN ('unpaid', 'partial')
      `
    );

    return {
      collectedToday: Number(today.total),
      collectedThisMonth: Number(month.total),
      totalOutstanding: Number(outstanding.total)
    };
  }

  /**
   * Daily revenue collected within a date range — used to draw a
   * revenue trend chart on the dashboard.
   */
  static async getRevenueTrend({ dateFrom, dateTo }) {

    const params = [];
    let where = "WHERE status != 'refunded'";

    if (dateFrom) {
      where += ' AND DATE(created_at) >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      where += ' AND DATE(created_at) <= ?';
      params.push(dateTo);
    }

    const [rows] = await db.execute(
      `
      SELECT
        DATE(created_at) AS date,
        COALESCE(SUM(paid_amount), 0) AS collected
      FROM invoices
      ${where}
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
      `,
      params
    );

    return rows.map((row) => ({
      date: row.date,
      collected: Number(row.collected)
    }));
  }

  /**
   * Doctors ranked by number of appointments within a date range —
   * used for a "busiest doctors" widget.
   */
  static async getTopDoctorsByAppointments({ dateFrom, dateTo, limit }) {

    const params = [];
    let where = 'WHERE a.deleted_at IS NULL';

    if (dateFrom) {
      where += ' AND a.appointment_date >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      where += ' AND a.appointment_date <= ?';
      params.push(dateTo);
    }

    params.push(limit);

    const [rows] = await db.execute(
      `
      SELECT
        d.id            AS doctor_id,
        du.name         AS doctor_name,
        COUNT(a.id)     AS appointment_count
      FROM appointments a
      INNER JOIN doctors d ON d.id = a.doctor_id
      INNER JOIN users du  ON du.id = d.user_id
      ${where}
      GROUP BY d.id, du.name
      ORDER BY appointment_count DESC
      LIMIT ${Number(limit)}
      `,
      params
    );

    return rows;
  }
}

module.exports = DashboardModel;