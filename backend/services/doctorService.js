'use strict';

/**
 * DoctorService
 * --------------------------------------------------
 * Business Logic Layer
 *
 * Flow:
 * Controller → Service → Model → Database
 *
 * Responsibilities:
 * - Apply business rules
 * - Validate business conditions
 * - Coordinate database operations
 * - Throw structured AppError exceptions
 */

const db = require('../config/database');
const DoctorModel = require('../models/doctor.model');
const AppError = require('../errors/AppError');

class DoctorService {

  /**
   * Normalize pagination parameters.
   */
  _parsePagination({ page = 1, limit = 10 }) {

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);

    const parsedLimit = Math.min(
      100,
      Math.max(1, parseInt(limit, 10) || 10)
    );

    return {
      page: parsedPage,
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit
    };
  }

  /**
   * Find doctor or throw 404 error.
   */
  async _findOrFail(id) {

    const doctor = await DoctorModel.findById(id);

    if (!doctor) {
      throw new AppError(`Doctor with ID ${id} not found`, 404);
    }

    return doctor;
  }

  /**
   * Ensure the linked user account exists and has the doctor role.
   */
  async _assertUserIsDoctor(userId) {

    const [rows] = await db.execute(
      `
      SELECT
        id,
        role,
        is_active
      FROM users
      WHERE id = ?
      `,
      [userId]
    );
  
    const user = rows[0];
  
    if (!user) {
      throw new AppError(
        `User with ID ${userId} not found`,
        404
      );
    }
  
    if (!user.is_active) {
      throw new AppError(
        'User account is inactive',
        403
      );
    }
  
    if (user.role !== 'doctor') {
      throw new AppError(
        'Linked user account must have the "doctor" role',
        422
      );
    }
  
    return user;
  }
  
  async _assertSpecialtyExists(specialtyId) {

    const [rows] = await db.execute(
      `
      SELECT id
      FROM specialties
      WHERE id = ?
        AND is_active = 1
      `,
      [specialtyId]
    );

    if (!rows[0]) {
      throw new AppError(
        `Specialty with ID ${specialtyId} not found or inactive`,
        404
      );
    }

    return rows[0];
  }


  /**
   * Retrieve all doctors.
   *
   * Supports pagination, search, specialty and status filters.
   */
  async getAllDoctors(query = {}) {

    const { page, limit, offset } = this._parsePagination(query);

    const filters = {
      search: (query.search || '').trim(),
      specialtyId: query.specialty_id || null,
      isActive: query.is_active === '' || query.is_active === undefined
        ? undefined
        : query.is_active === '1' || query.is_active === true
    };

    const [doctors, total] = await Promise.all([
      DoctorModel.findAll({ limit, offset, ...filters }),
      DoctorModel.countAll(filters)
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: doctors,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Retrieve one doctor by ID.
   */
  async getDoctorById(id) {
    return this._findOrFail(id);
  }

  /**
   * Create a doctor profile linked to an existing user account.
   *
   * Business rules:
   * - Linked user must exist and have role = 'doctor'
   * - A user can only have one doctor profile
   * - License number must be unique
   */
  async createDoctor(data) {

    await this._assertUserIsDoctor(data.user_id);
    await this._assertSpecialtyExists(data.specialty_id);

    const existingProfile = await DoctorModel.findByUserId(data.user_id);

    if (existingProfile) {
      throw new AppError(
        'This user already has a doctor profile',
        409
      );
    }

    const existingLicense = await DoctorModel.findByLicenseNumber(
      data.license_number
    );

    if (existingLicense) {
      throw new AppError(
        'A doctor with this license number already exists',
        409
      );
    }

    const newId = await DoctorModel.create(data);

    return await DoctorModel.findById(newId);
  }

  /**
   * Update existing doctor profile.
   */
  async updateDoctor(id, data, currentUser) {

    const doctor = await this._findOrFail(id);
  
    // Doctor can update only their own profile
    if (
      currentUser.role === 'doctor' &&
      doctor.user_id !== currentUser.id
    ) {
      throw new AppError(
        'Doctors can only update their own profile',
        403
      );
    }
  
    if (data.specialty_id !== undefined) {
      await this._assertSpecialtyExists(data.specialty_id);
    }
  
    if (data.license_number) {
  
      const duplicate = await DoctorModel.findByLicenseNumber(
        data.license_number,
        id
      );
  
      if (duplicate) {
        throw new AppError(
          'A doctor with this license number already exists',
          409
        );
      }
    }
  
    const updated = await DoctorModel.update(id, data);
  
    if (!updated) {
      throw new AppError('Failed to update doctor', 500);
    }
  
    return await DoctorModel.findById(id);
  }

  /**
   * Deactivate a doctor profile.
   *
   * Doctors are never hard-deleted since appointments
   * and medical records keep a foreign key reference.
   */
  async deleteDoctor(id) {

    await this._findOrFail(id);

    const deactivated = await DoctorModel.deactivate(id);

    if (!deactivated) {
      throw new AppError('Failed to deactivate doctor', 500);
    }

    return { message: 'Doctor deactivated successfully' };
  }
}

module.exports = new DoctorService();