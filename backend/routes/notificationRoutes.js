/**
 * In-App Notifications API Routes
 * ----------------------------------------------------
 * Endpoints for retrieving user notifications, marking items as read,
 * and triggering reminder scans.
 */

'use strict';

const { Router } = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = Router();

// Protect all notification endpoints
router.use(authenticate);

// Retrieve notifications list for current authenticated user
router.get('/', notificationController.getAll);

// Mark all notifications for current user as read
router.patch('/read-all', notificationController.markAllAsRead);

// Mark single notification as read
router.patch('/:id/read', notificationController.markAsRead);

// Manual or scheduler trigger for reminder scans
router.post(
  '/check-reminders',
  authorize('admin', 'receptionist'),
  notificationController.triggerReminders
);

module.exports = router;
