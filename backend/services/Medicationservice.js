'use strict';

/**
 * MedicationService
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

const MedicationModel = require('../models/medication.model');
const AppError = require('../errors/AppError');

class MedicationService {

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
   * Find medication or throw 404 error.
   */
  async _findOrFail(id) {

    const medication = await MedicationModel.findById(id);

    if (!medication) {
      throw new AppError(`Medication with ID ${id} not found`, 404);
    }

    return medication;
  }

  /**
   * Retrieve all medications.
   *
   * Supports pagination, search, category, active status and
   * low-stock filters.
   */
  async getAllMedications(query = {}) {

    const { page, limit, offset } = this._parsePagination(query);

    const filters = {
      search: (query.search || '').trim(),
      category: query.category || null,
      isActive: query.is_active === '' || query.is_active === undefined
        ? undefined
        : query.is_active === '1' || query.is_active === true,
      lowStockOnly: query.low_stock === 'true'
    };

    const [data, total] = await Promise.all([
      MedicationModel.findAll({ limit, offset, ...filters }),
      MedicationModel.countAll(filters)
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data,
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
   * Retrieve one medication by ID.
   */
  async getMedicationById(id) {
    return this._findOrFail(id);
  }

  /**
   * Create a new medication.
   *
   * Business rule: name (English or Arabic) must be unique.
   */
  async createMedication(data) {

    const duplicate = await MedicationModel.findByName(data.name);

    const duplicateAr = data.name_ar
      ? await MedicationModel.findByName(data.name_ar)
      : null;

    if (duplicate || duplicateAr) {
      throw new AppError('A medication with this name already exists', 409);
    }

    const newId = await MedicationModel.create(data);

    return MedicationModel.findById(newId);
  }

  /**
   * Update an existing medication.
   */
  async updateMedication(id, data) {

    const duplicateName = data.name
    ? await MedicationModel.findByName(data.name, id)
    : null;
  
  const duplicateNameAr = data.name_ar
    ? await MedicationModel.findByName(data.name_ar, id)
    : null;
  
  if (duplicateName || duplicateNameAr) {
    throw new AppError('A medication with this name already exists', 409);
  }

    const updated = await MedicationModel.update(id, data);

    if (!updated) {
      throw new AppError('Failed to update medication', 500);
    }

    return MedicationModel.findById(id);
  }

  /**
   * Manually adjust a medication's stock quantity.
   *
   * Business rules:
   * - delta can be positive (restock) or negative (correction/write-off)
   * - stock quantity can never go below zero
   */
  async adjustStock(id, { delta }) {

    await this._findOrFail(id);

    const adjusted = await MedicationModel.adjustStock(id, delta);

    if (!adjusted) {
      throw new AppError(
        'Cannot apply this adjustment — it would take stock below zero',
        422
      );
    }

    return MedicationModel.findById(id);
  }

  /**
   * Deactivate a medication.
   *
   * Medications are never hard-deleted since past prescriptions keep
   * a foreign key reference (medication_id) — deactivating just hides
   * it from new prescriptions/dispensing while preserving history.
   */
  async deactivateMedication(id) {

    await this._findOrFail(id);

    const deactivated = await MedicationModel.deactivate(id);

    if (!deactivated) {
      throw new AppError('Failed to deactivate medication', 500);
    }

    return { message: 'Medication deactivated successfully' };
  }
}

module.exports = new MedicationService();