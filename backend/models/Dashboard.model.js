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

  /**
   * Get a doctor's own dashboard summary, scoped by user_id from JWT.
   * Enforces data isolation — a doctor can only see their own data.
   */
  static async getDoctorSummary(userId) {
    // 1. Get doctor profile with specialty
    const [[doctor]] = await db.execute(
      `SELECT d.id AS doctor_id, d.specialty_id, d.license_number, d.consultation_fee,
              d.work_days, d.work_start, d.work_end, d.appointment_duration,
              s.name AS specialty_name, s.name_ar AS specialty_name_ar,
              s.template_type, s.icon AS specialty_icon
       FROM doctors d
       JOIN specialties s ON d.specialty_id = s.id
       WHERE d.user_id = ?`,
      [userId]
    );
    if (!doctor) return null;

    const doctorId = doctor.doctor_id;

    // 2. Today's appointment count
    const [[todayCounts]] = await db.execute(
      `SELECT COUNT(*) AS total FROM appointments
       WHERE doctor_id = ? AND appointment_date = CURDATE() AND deleted_at IS NULL`,
      [doctorId]
    );

    // 3. Total unique patients
    const [[patientCount]] = await db.execute(
      `SELECT COUNT(DISTINCT patient_id) AS total FROM appointments
       WHERE doctor_id = ? AND deleted_at IS NULL`,
      [doctorId]
    );

    // 4. This week's appointments
    const [[weekCounts]] = await db.execute(
      `SELECT COUNT(*) AS total FROM appointments
       WHERE doctor_id = ? AND deleted_at IS NULL
         AND YEARWEEK(appointment_date, 1) = YEARWEEK(CURDATE(), 1)`,
      [doctorId]
    );

    // 5. Status breakdown
    const [statusRows] = await db.execute(
      `SELECT status, COUNT(*) AS total FROM appointments
       WHERE doctor_id = ? AND deleted_at IS NULL
       GROUP BY status`,
      [doctorId]
    );

    // 6. Recent appointments (last 10) including appointment_id and patient_id for clinical recording
    const [recentAppts] = await db.execute(
      `SELECT a.id, a.patient_id, a.appointment_code, a.appointment_date, a.start_time, a.end_time,
              a.status, a.visit_type, a.chief_complaint,
              CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
              p.phone AS patient_phone
       FROM appointments a
       INNER JOIN patients p ON p.id = a.patient_id
       WHERE a.doctor_id = ? AND a.deleted_at IS NULL
       ORDER BY a.appointment_date DESC, a.start_time DESC
       LIMIT 10`,
      [doctorId]
    );

    // 7. Completed appointments count
    const [[completedCounts]] = await db.execute(
      `SELECT COUNT(*) AS total FROM appointments
       WHERE doctor_id = ? AND status = 'completed' AND deleted_at IS NULL`,
      [doctorId]
    );

    // 8. Doctor's Financial Entitlements & Billing metrics
    const [[finTotals]] = await db.execute(
      `SELECT COALESCE(SUM(total), 0) AS totalInvoiced,
              COALESCE(SUM(paid_amount), 0) AS totalCollected,
              COALESCE(SUM(total - paid_amount), 0) AS totalPending
       FROM invoices
       WHERE doctor_id = ?`,
      [doctorId]
    );

    // 9. Recent invoices associated with this doctor (last 5)
    const [recentInvoices] = await db.execute(
      `SELECT i.id, i.invoice_code, i.total, i.paid_amount, i.status, i.created_at,
              CONCAT(p.first_name, ' ', p.last_name) AS patient_name
       FROM invoices i
       INNER JOIN patients p ON p.id = i.patient_id
       WHERE i.doctor_id = ?
       ORDER BY i.created_at DESC
       LIMIT 5`,
      [doctorId]
    );

    return {
      doctor,
      appointmentsToday: todayCounts.total,
      totalPatients: patientCount.total,
      appointmentsThisWeek: weekCounts.total,
      appointmentsByStatus: statusRows.reduce((acc, row) => {
        acc[row.status] = row.total;
        return acc;
      }, {}),
      recentAppointments: recentAppts,
      financialEntitlements: {
        consultationFee: Number(doctor.consultation_fee) || 0,
        completedConsultations: completedCounts.total,
        totalInvoiced: Number(finTotals.totalInvoiced),
        totalCollected: Number(finTotals.totalCollected),
        totalPending: Number(finTotals.totalPending),
        recentInvoices
      }
    };
  }
}

module.exports = DashboardModel;