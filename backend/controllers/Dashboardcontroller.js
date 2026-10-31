'use strict';

const dashboardService = require('../services/Dashboardservice');
const ApiResponse  = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * DashboardController — Clean version (production style)
 *
 * • No try/catch
 * • No business logic
 * • Read-only: every route maps to a single service call
 * • Only request → service → response
 */
class DashboardController {

  getOverview = asyncHandler(async (req, res) => {
    const overview = await dashboardService.getOverview();

    return ApiResponse.success(
      res,
      overview,
      'Dashboard overview retrieved successfully'
    );
  });

  getTodaySchedule = asyncHandler(async (req, res) => {
    const schedule = await dashboardService.getTodaySchedule(req.query);

    return ApiResponse.success(
      res,
      schedule,
      "Today's schedule retrieved successfully"
    );
  });

  getRecentPatients = asyncHandler(async (req, res) => {
    const patients = await dashboardService.getRecentPatients(req.query);

    return ApiResponse.success(
      res,
      patients,
      'Recent patients retrieved successfully'
    );
  });

  getLowStockAlerts = asyncHandler(async (req, res) => {
    const medications = await dashboardService.getLowStockAlerts(req.query);

    return ApiResponse.success(
      res,
      medications,
      'Low stock medications retrieved successfully'
    );
  });

  getRevenueTrend = asyncHandler(async (req, res) => {
    const trend = await dashboardService.getRevenueTrend(req.query);

    return ApiResponse.success(
      res,
      trend,
      'Revenue trend retrieved successfully'
    );
  });

  getTopDoctors = asyncHandler(async (req, res) => {
    const doctors = await dashboardService.getTopDoctors(req.query);

    return ApiResponse.success(
      res,
      doctors,
      'Top doctors retrieved successfully'
    );
  });

  getDoctorSummary = asyncHandler(async (req, res) => {
    const summary = await dashboardService.getDoctorSummary(req.user.id);

    if (!summary) {
      return ApiResponse.error(res, 'Doctor profile not found', 404);
    }

    return ApiResponse.success(
      res,
      summary,
      'Doctor dashboard summary retrieved successfully'
    );
  });
}

module.exports = new DashboardController();