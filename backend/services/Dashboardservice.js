'use strict';

/**
 * DashboardService
 * --------------------------------------------------
 * Business Logic Layer
 *
 * Flow:
 * Controller → Service → Model → Database
 *
 * The dashboard is read-only: it assembles summaries that already
 * live in other modules' tables. There are no create/update/delete
 * operations here, and no cross-record business rules to enforce —
 * this service's job is mostly shaping/combining data for the API.
 */

const DashboardModel = require('../models/Dashboard.model');

class DashboardService {

  /**
   * Normalize a "limit only" query param.
   */
  _parseLimit(limit, fallback = 10, max = 50) {
    return Math.min(max, Math.max(1, parseInt(limit, 10) || fallback));
  }

  /**
   * High-level snapshot: headline counters, today's appointment
   * status breakdown and the revenue snapshot, all in parallel.
   */
  async getOverview() {

    const [counts, statusBreakdown, revenue] = await Promise.all([
      DashboardModel.getOverviewCounts(),
      DashboardModel.getAppointmentStatusBreakdown(),
      DashboardModel.getRevenueSnapshot()
    ]);

    return {
      ...counts,
      appointmentsByStatus: statusBreakdown.reduce((acc, row) => {
        acc[row.status] = row.total;
        return acc;
      }, {}),
      revenue
    };
  }

  /**
   * Today's appointment schedule.
   */
  async getTodaySchedule(query = {}) {

    const limit = this._parseLimit(query.limit, 10);

    return DashboardModel.getTodaySchedule(limit);
  }

  /**
   * Most recently registered patients.
   */
  async getRecentPatients(query = {}) {

    const limit = this._parseLimit(query.limit, 10);

    return DashboardModel.getRecentPatients(limit);
  }

  /**
   * Medications running low on stock.
   */
  async getLowStockAlerts(query = {}) {

    const limit = this._parseLimit(query.limit, 10);

    return DashboardModel.getLowStockMedications(limit);
  }

  /**
   * Daily revenue trend for a date range (defaults to no bound,
   * i.e. the model returns the full history grouped by day).
   */
  async getRevenueTrend(query = {}) {

    return DashboardModel.getRevenueTrend({
      dateFrom: query.date_from || null,
      dateTo: query.date_to || null
    });
  }

  /**
   * Busiest doctors ranked by appointment count within a date range.
   */
  async getTopDoctors(query = {}) {

    const limit = this._parseLimit(query.limit, 5);

    return DashboardModel.getTopDoctorsByAppointments({
      dateFrom: query.date_from || null,
      dateTo: query.date_to || null,
      limit
    });
  }
}

module.exports = new DashboardService();