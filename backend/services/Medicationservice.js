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
const pharmacyStore = require('./pharmacyStore');

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
   * Retrieve all medications with extended pharmaceutical metadata.
   *
   * Supports pagination, search, category, active status and low-stock filters.
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

    // Enrich database records with persistent pharmaceutical store metadata
    const enrichedData = pharmacyStore.enrichMedications(data);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: enrichedData,
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
   * Retrieve one medication by ID enriched with pharmaceutical metadata.
   */
  async getMedicationById(id) {
    const medication = await this._findOrFail(id);
    return pharmacyStore.enrichMedication(medication);
  }

  /**
   * Create a new medication with metadata and initial stock logging.
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

    // Save extended pharmaceutical metadata (batch, expiry, manufacturer, etc.)
    pharmacyStore.setMedicationDetails(newId, data);

    // Record initial stock receipt transaction if quantity > 0
    if (Number(data.stock_quantity) > 0) {
      pharmacyStore.logTransaction({
        medication_id: newId,
        medication_name: data.name,
        transaction_type: 'received',
        quantity: Number(data.stock_quantity),
        previous_stock: 0,
        new_stock: Number(data.stock_quantity),
        unit_cost: Number(data.cost_price) || 0,
        total_cost: Number(data.stock_quantity) * (Number(data.cost_price) || 0),
        reason: 'Initial stock intake upon catalog registration',
        performed_by: data.performed_by || 1,
        performer_name: data.performer_name || 'Pharmacist'
      });
    }

    const created = await MedicationModel.findById(newId);
    return pharmacyStore.enrichMedication(created);
  }

  /**
   * Update an existing medication and synchronize pharmaceutical metadata.
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

    await MedicationModel.update(id, data);

    // Update extended pharmaceutical metadata
    pharmacyStore.setMedicationDetails(id, data);

    const updated = await MedicationModel.findById(id);
    return pharmacyStore.enrichMedication(updated);
  }

  /**
   * Manually adjust a medication's stock quantity with immutable audit logging.
   *
   * Business rules:
   * - delta can be positive (restock) or negative (correction/write-off)
   * - stock quantity can never go below zero
   */
  async adjustStock(id, { delta, quantity, type, reason = '', performed_by = 1, performer_name = 'Pharmacist', unit_cost = 0 }) {

    const current = await this._findOrFail(id);

    // Compute effective signed delta
    let effectiveDelta = delta;
    if (effectiveDelta === undefined && quantity !== undefined) {
      effectiveDelta = (type === 'subtract' || type === 'remove') ? -Math.abs(Number(quantity)) : Math.abs(Number(quantity));
    }
    effectiveDelta = Number(effectiveDelta);

    const newStock = Number(current.stock_quantity) + effectiveDelta;
    if (newStock < 0) {
      throw new AppError(
        'Cannot apply this adjustment — it would take stock below zero',
        422
      );
    }

    const adjusted = await MedicationModel.adjustStock(id, effectiveDelta);

    if (!adjusted) {
      throw new AppError(
        'Cannot apply this adjustment — it would take stock below zero',
        422
      );
    }

    // Determine transaction type and log immutable audit entry
    const txType = effectiveDelta >= 0 ? 'received' : 'adjusted';
    pharmacyStore.logTransaction({
      medication_id: id,
      medication_name: current.name,
      transaction_type: txType,
      quantity: Math.abs(effectiveDelta),
      previous_stock: Number(current.stock_quantity),
      new_stock: newStock,
      unit_cost: Number(unit_cost) || Number(current.cost_price) || 0,
      total_cost: Math.abs(effectiveDelta) * (Number(unit_cost) || Number(current.cost_price) || 0),
      reason: reason || (effectiveDelta >= 0 ? 'Manual restock inventory intake' : 'Manual stock deduction adjustment'),
      performed_by,
      performer_name
    });

    const updated = await MedicationModel.findById(id);
    return pharmacyStore.enrichMedication(updated);
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