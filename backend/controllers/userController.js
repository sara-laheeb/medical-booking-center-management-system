/**
 * User Management Controller (Manager / Admin Only)
 * Controls user account activation, deactivation, and role permission assignments.
 */

'use strict';

const db = require('../config/database');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../errors/AppError');

// Whitelist of valid enterprise roles configurable by administrators
const ALLOWED_ROLES = ['patient', 'doctor', 'admin', 'receptionist', 'pharmacist'];

class UserController {
  /**
   * Retrieve list of system users with optional search, role filter, and status
   */
  getAll = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const params = [];
    let where = 'WHERE 1=1';

    if (req.query.search) {
      const search = `%${req.query.search.trim()}%`;
      where += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(search, search);
    }

    if (req.query.role && ALLOWED_ROLES.includes(req.query.role)) {
      where += ' AND role = ?';
      params.push(req.query.role);
    }

    if (req.query.is_active !== undefined && req.query.is_active !== '') {
      where += ' AND is_active = ?';
      params.push(Number(req.query.is_active) ? 1 : 0);
    }

    const [rows] = await db.execute(
      `SELECT id, name, email, role, is_active, created_at, updated_at
       FROM users
       ${where}
       ORDER BY created_at DESC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    );

    const [[countResult]] = await db.execute(
      `SELECT COUNT(*) AS total FROM users ${where}`,
      params
    );

    const total = countResult.total;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return ApiResponse.success(res, rows, 'Users retrieved successfully', 200, {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });
  });

  /**
   * Activate or deactivate a user account
   */
  updateStatus = asyncHandler(async (req, res) => {
    const targetUserId = parseInt(req.params.id, 10);
    const { is_active } = req.body;

    if (is_active === undefined) {
      throw new AppError('is_active boolean flag is required', 400);
    }

    if (req.user.id === targetUserId && !is_active) {
      throw new AppError('You cannot deactivate your own administrative account', 400);
    }

    const [[existing]] = await db.execute('SELECT id, role FROM users WHERE id = ?', [targetUserId]);
    if (!existing) {
      throw new AppError('User not found', 404);
    }

    await db.execute('UPDATE users SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, targetUserId]);

    return ApiResponse.success(
      res,
      { id: targetUserId, is_active: Boolean(is_active) },
      `User account ${is_active ? 'activated' : 'deactivated'} successfully`
    );
  });

  /**
   * Update user role permission
   */
  updateRole = asyncHandler(async (req, res) => {
    const targetUserId = parseInt(req.params.id, 10);
    const { role } = req.body;

    if (!role || !ALLOWED_ROLES.includes(role)) {
      throw new AppError(`Invalid role. Must be one of: ${ALLOWED_ROLES.join(', ')}`, 400);
    }

    if (req.user.id === targetUserId && role !== 'admin') {
      throw new AppError('You cannot demote your own administrative role', 400);
    }

    const [[existing]] = await db.execute('SELECT id FROM users WHERE id = ?', [targetUserId]);
    if (!existing) {
      throw new AppError('User not found', 404);
    }

    await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, targetUserId]);

    return ApiResponse.success(
      res,
      { id: targetUserId, role },
      'User role permission updated successfully'
    );
  });

  /**
   * List pending doctor registrations awaiting administrator credential review
   */
  getPendingDoctors = asyncHandler(async (req, res) => {
    const [rows] = await db.execute(
      `SELECT d.id AS doctor_id, d.user_id, u.name, u.email, u.phone,
              d.specialty_id, s.name AS specialty_name_en, s.name_ar AS specialty_name_ar,
              d.license_number, d.bio, d.is_active AS doctor_active, u.is_active AS user_active,
              d.created_at
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       JOIN specialties s ON d.specialty_id = s.id
       WHERE u.role = 'doctor' AND (d.is_active = 0 OR u.is_active = 0)
       ORDER BY d.created_at DESC`
    );

    // Parse verification metadata safely
    const list = rows.map((r) => {
      let parsedBio = {};
      try {
        parsedBio = JSON.parse(r.bio);
      } catch {
        parsedBio = { verification_documents: r.bio };
      }
      return {
        id: r.doctor_id,
        doctor_id: r.doctor_id,
        user_id: r.user_id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        specialty_id: r.specialty_id,
        specialty_name_en: r.specialty_name_en,
        specialty_name_ar: r.specialty_name_ar,
        license_number: r.license_number,
        status: parsedBio.status || (r.user_active ? 'active' : 'pending'),
        verification_documents: parsedBio.verification_documents || null,
        notes: parsedBio.notes || null,
        rejection_reason: parsedBio.rejection_reason || null,
        submitted_at: parsedBio.submitted_at || r.created_at,
        created_at: r.created_at
      };
    });

    return ApiResponse.success(res, list, 'Pending doctor registrations retrieved successfully');
  });

  /**
   * Approve a doctor registration request and activate doctor credentials
   */
  approveDoctor = asyncHandler(async (req, res) => {
    const doctorId = parseInt(req.params.id, 10);
    const [[doctor]] = await db.execute('SELECT id, user_id, bio FROM doctors WHERE id = ?', [doctorId]);
    if (!doctor) {
      throw new AppError('Doctor record not found', 404);
    }

    let parsedBio = {};
    try {
      parsedBio = JSON.parse(doctor.bio) || {};
    } catch {
      parsedBio = { verification_documents: doctor.bio };
    }
    parsedBio.status = 'approved';
    parsedBio.approved_at = new Date().toISOString();
    parsedBio.approved_by = req.user.id;

    // Activate both doctor profile and user account
    await db.execute('UPDATE doctors SET is_active = 1, bio = ?, updated_at = NOW() WHERE id = ?', [
      JSON.stringify(parsedBio),
      doctorId
    ]);
    await db.execute('UPDATE users SET is_active = 1, updated_at = NOW() WHERE id = ?', [doctor.user_id]);

    return ApiResponse.success(
      res,
      { id: doctorId, user_id: doctor.user_id, status: 'approved', is_active: true },
      'Doctor registration approved successfully. Account is now active.'
    );
  });

  /**
   * Reject a doctor registration request
   */
  rejectDoctor = asyncHandler(async (req, res) => {
    const doctorId = parseInt(req.params.id, 10);
    const { reason } = req.body;
    const [[doctor]] = await db.execute('SELECT id, user_id, bio FROM doctors WHERE id = ?', [doctorId]);
    if (!doctor) {
      throw new AppError('Doctor record not found', 404);
    }

    let parsedBio = {};
    try {
      parsedBio = JSON.parse(doctor.bio) || {};
    } catch {
      parsedBio = { verification_documents: doctor.bio };
    }
    parsedBio.status = 'rejected';
    parsedBio.rejected_at = new Date().toISOString();
    parsedBio.rejected_by = req.user.id;
    parsedBio.rejection_reason = reason || 'Professional credentials could not be verified';

    // Keep accounts inactive and update status metadata
    await db.execute('UPDATE doctors SET is_active = 0, bio = ?, updated_at = NOW() WHERE id = ?', [
      JSON.stringify(parsedBio),
      doctorId
    ]);
    await db.execute('UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?', [doctor.user_id]);

    return ApiResponse.success(
      res,
      { id: doctorId, user_id: doctor.user_id, status: 'rejected', is_active: false },
      'Doctor registration request rejected.'
    );
  });
}

module.exports = new UserController();
