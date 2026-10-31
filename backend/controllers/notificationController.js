/**
 * Notification Controller
 * ----------------------------------------------------
 * Handles HTTP requests for retrieving, reading, and clearing in-app notifications.
 */

'use strict';

const notificationStore = require('../services/notificationStore');
const reminderService = require('../services/reminderService');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

class NotificationController {
  getAll = asyncHandler(async (req, res) => {
    // Non-blocking trigger of reminder check
    reminderService.checkAndSend48hReminders().catch(() => {});

    const result = notificationStore.getNotifications(req.user.id, {
      unreadOnly: req.query.unread === 'true' || req.query.unread === '1',
      limit: req.query.limit || 50,
    });

    return ApiResponse.success(
      res,
      result.data,
      'Notifications retrieved successfully',
      200,
      {
        unread_count: result.unread_count,
        total: result.total,
      }
    );
  });

  markAsRead = asyncHandler(async (req, res) => {
    const updated = notificationStore.markAsRead(req.params.id, req.user.id);

    if (!updated) {
      return ApiResponse.error(res, 'Notification not found', 404);
    }

    return ApiResponse.success(res, updated, 'Notification marked as read');
  });

  markAllAsRead = asyncHandler(async (req, res) => {
    const result = notificationStore.markAllAsRead(req.user.id);

    return ApiResponse.success(
      res,
      result,
      'All notifications marked as read successfully'
    );
  });

  triggerReminders = asyncHandler(async (req, res) => {
    const result = await reminderService.checkAndSend48hReminders();

    return ApiResponse.success(
      res,
      result,
      'Reminder scan completed successfully'
    );
  });
}

module.exports = new NotificationController();
