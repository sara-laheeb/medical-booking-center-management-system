'use strict';

/**
 * SpecialtyService
 * --------------------------------------------------
 * Business Logic Layer
 *
 * Flow:
 * Controller → Service → Model → Database
 *
 * Specialties are simple reference data used by the
 * Doctors module (each doctor belongs to one specialty).
 */

const SpecialtyModel = require('../models/specialty.model');
const AppError = require('../errors/AppError');

class SpecialtyService {

  /**
   * Find specialty or throw 404 error.
   */
  async _findOrFail(id) {

    const specialty = await SpecialtyModel.findById(id);

    if (!specialty) {
      throw new AppError(`Specialty with ID ${id} not found`, 404);
    }

    return specialty;
  }

  /**
   * Retrieve all specialties.
   *
   * By default only active specialties are returned.
   */
  async getAllSpecialties(activeOnly = true) {
    return SpecialtyModel.findAll(activeOnly);
  }

  /**
   * Retrieve one specialty by ID.
   */
  async getSpecialtyById(id) {
    return this._findOrFail(id);
  }

  /**
   * Create a new specialty.
   *
   * Business rule:
   * - English name must be unique
   * - Arabic name must be unique
   */
  async createSpecialty(data) {

    const duplicate = await SpecialtyModel.findByName(
      data.name,
      data.name_ar
    );

    if (duplicate) {
      throw new AppError(
        'A specialty with this Arabic or English name already exists',
        409
      );
    }

    const newId = await SpecialtyModel.create(data);

    return SpecialtyModel.findById(newId);
  }

  /**
   * Update an existing specialty.
   *
   * If only one name is provided, use the existing
   * value of the other name when checking duplicates.
   */
  async updateSpecialty(id, data) {

    const specialty = await this._findOrFail(id);

    if (data.name !== undefined || data.name_ar !== undefined) {

      const name = data.name ?? specialty.name_en;
      const nameAr = data.name_ar ?? specialty.name_ar;

      const duplicate = await SpecialtyModel.findByName(
        name,
        nameAr,
        id
      );

      if (duplicate) {
        throw new AppError(
          'A specialty with this Arabic or English name already exists',
          409
        );
      }
    }

    const updated = await SpecialtyModel.update(id, data);

    if (!updated) {
      throw new AppError('Failed to update specialty', 500);
    }

    return SpecialtyModel.findById(id);
  }

  /**
   * Deactivate a specialty.
   *
   * Business rule:
   * - Cannot deactivate a specialty that has active doctors.
   */
  async deleteSpecialty(id) {

    await this._findOrFail(id);

    const hasDoctors = await SpecialtyModel.hasLinkedDoctors(id);

    if (hasDoctors) {
      throw new AppError(
        'Cannot deactivate a specialty that still has doctors assigned to it',
        409
      );
    }

    const deactivated = await SpecialtyModel.deactivate(id);

    if (!deactivated) {
      throw new AppError('Failed to deactivate specialty', 500);
    }

    return {
      message: 'Specialty deactivated successfully'
    };
  }
}

module.exports = new SpecialtyService();