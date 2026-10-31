'use strict';

/**
 * PharmacyService
 * --------------------------------------------------
 * Business Logic Layer for prescriptions.
 *
 * Medication catalog management (CRUD, stock) now lives in its
 * own module (models/medication.model.js, services/medicationService.js).
 * This service only owns prescriptions, and reads/adjusts medications
 * through MedicationModel.
 *
 * There is no dedicated PrescriptionModel: the prescriptions +
 * prescription_items queries live directly in the service, following
 * the same pattern already used by AuthService for the users table.
 *
 * Flow:
 * Controller → Service → Database / Model
 */

const db = require('../config/database');
const MedicationModel = require('../models/medication.model');
const AppError = require('../errors/AppError');
const pharmacyStore = require('./pharmacyStore');

const parsePagination = ({ page = 1, limit = 10 }) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

  return {
    page: parsedPage,
    limit: parsedLimit,
    offset: (parsedPage - 1) * parsedLimit
  };
};

const generatePrescriptionCode = async () => {
  const [rows] = await db.execute('SELECT MAX(id) AS maxId FROM prescriptions');
  const next = (rows[0].maxId || 0) + 1;
  return `RX-${String(next).padStart(6, '0')}`;
};

class PharmacyService {

  async _getPrescriptionOrFail(id) {

    const [rows] = await db.execute(
      `
      SELECT
        rx.id, rx.prescription_code, rx.appointment_id, rx.patient_id,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name, rx.doctor_id, du.name AS doctor_name,
        rx.status, rx.notes, rx.dispensed_by, rx.dispensed_at, rx.created_at
      FROM prescriptions rx
      INNER JOIN patients p ON p.id = rx.patient_id
      INNER JOIN doctors d  ON d.id = rx.doctor_id
      INNER JOIN users du   ON du.id = d.user_id
      WHERE rx.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!rows[0]) {
      throw new AppError(`Prescription with ID ${id} not found`, 404);
    }

    const [items] = await db.execute(
      `
      SELECT
        pi.id, pi.medication_id, m.name AS medication_name,
        pi.quantity, pi.dosage, pi.duration, pi.instructions
      FROM prescription_items pi
      INNER JOIN medications m ON m.id = pi.medication_id
      WHERE pi.prescription_id = ?
      `,
      [id]
    );

    return { ...rows[0], items };
  }

  async getAllPrescriptions(query = {}) {

    const { page, limit, offset } = parsePagination(query);
    const params = [];
    let where = 'WHERE 1 = 1';

    if (query.patient_id) {
      where += ' AND rx.patient_id = ?';
      params.push(query.patient_id);
    }

    if (query.doctor_id) {
      where += ' AND rx.doctor_id = ?';
      params.push(query.doctor_id);
    }

    if (query.status) {
      where += ' AND rx.status = ?';
      params.push(query.status);
    }

    // Join patient and doctor details so pharmacy queue displays names directly
    const [rows] = await db.execute(
      `
      SELECT rx.id,
             rx.prescription_code,
             rx.appointment_id,
             rx.patient_id,
             CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
             p.phone AS patient_phone,
             rx.doctor_id,
             du.name AS doctor_name,
             rx.status,
             rx.notes,
             rx.dispensed_by,
             rx.dispensed_at,
             rx.created_at
      FROM prescriptions rx
      LEFT JOIN patients p ON p.id = rx.patient_id
      LEFT JOIN doctors d  ON d.id = rx.doctor_id
      LEFT JOIN users du   ON du.id = d.user_id
      ${where}
      ORDER BY rx.created_at DESC
      LIMIT ${Number(limit)}
      OFFSET ${Number(offset)}
      `,
      params
    );

    const [countResult] = await db.execute(
      `SELECT COUNT(*) AS total FROM prescriptions rx ${where}`,
      params
    );

    const total = countResult[0].total;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: rows,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 }
    };
  }

  async getPrescriptionById(id) {
    return this._getPrescriptionOrFail(id);
  }

  /**
   * Create a prescription with one or more medication items.
   *
   * Business rules:
   * - Appointment must exist
   * - Every medication_id must exist and be active
   */
  async createPrescription(data) {

    const [aptRows] = await db.execute(
      'SELECT id FROM appointments WHERE id = ? AND deleted_at IS NULL',
      [data.appointment_id]
    );

    if (!aptRows[0]) {
      throw new AppError(`Appointment with ID ${data.appointment_id} not found`, 404);
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new AppError('At least one medication item is required', 400);
    }

    for (const item of data.items) {

      const medication = await MedicationModel.findById(item.medication_id);

      if (!medication) {
        throw new AppError(`Medication with ID ${item.medication_id} not found`, 404);
      }

      if (!medication.is_active) {
        throw new AppError(`Medication with ID ${item.medication_id} is not active`, 422);
      }
    }

    const code = await generatePrescriptionCode();

    const [result] = await db.execute(
      `
      INSERT INTO prescriptions (prescription_code, appointment_id, patient_id, doctor_id, status, notes)
      VALUES (?, ?, ?, ?, 'pending', ?)
      `,
      [code, data.appointment_id, data.patient_id, data.doctor_id, data.notes || null]
    );

    const prescriptionId = result.insertId;

    for (const item of data.items) {
      await db.execute(
        `
        INSERT INTO prescription_items (prescription_id, medication_id, quantity, dosage, duration, instructions)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          prescriptionId,
          item.medication_id,
          item.quantity || 1,
          item.dosage || null,
          item.duration || null,
          item.instructions || null
        ]
      );
    }

    return this._getPrescriptionOrFail(prescriptionId);
  }

  /**
   * Dispense a pending prescription.
   *
   * Business rules:
   * - Prescription must still be pending
   * - Every item must have enough stock available
   * - Medicine cannot be expired or deactivated
   * - Stock is decremented for every dispensed item and recorded in audit log
   */
  async dispensePrescription(id, dispensedBy) {

    const prescription = await this._getPrescriptionOrFail(id);

    if (prescription.status !== 'pending') {
      throw new AppError(
        `Cannot dispense a prescription with status "${prescription.status}"`,
        422
      );
    }

    // Safety check: verify each medication is active, non-expired, and has sufficient stock
    for (const item of prescription.items) {

      const medication = await MedicationModel.findById(item.medication_id);
      if (!medication) {
        throw new AppError(`Medication #${item.medication_id} not found in inventory`, 404);
      }

      if (!medication.is_active) {
        throw new AppError(`Medication "${medication.name}" is deactivated/unavailable`, 422);
      }

      const enriched = pharmacyStore.enrichMedication(medication);
      if (enriched.is_expired) {
        throw new AppError(
          `Cannot dispense expired medication "${medication.name}" (Expired on ${enriched.expiry_date})`,
          422
        );
      }

      if (Number(medication.stock_quantity) < Number(item.quantity)) {
        throw new AppError(
          `Insufficient stock for "${medication.name}" (available: ${medication.stock_quantity}, needed: ${item.quantity})`,
          422
        );
      }
    }

    // Deduct stock and log audit transaction
    for (const item of prescription.items) {
      const medication = await MedicationModel.findById(item.medication_id);
      await MedicationModel.adjustStock(item.medication_id, -item.quantity);

      pharmacyStore.logTransaction({
        medication_id: item.medication_id,
        medication_name: medication.name,
        transaction_type: 'dispensed',
        quantity: item.quantity,
        previous_stock: Number(medication.stock_quantity),
        new_stock: Number(medication.stock_quantity) - item.quantity,
        unit_cost: Number(medication.cost_price) || 0,
        total_cost: (Number(medication.cost_price) || 0) * item.quantity,
        reference_id: prescription.prescription_code,
        reason: `Dispensed against prescription ${prescription.prescription_code} for ${prescription.patient_name || 'patient'}`,
        performed_by: dispensedBy,
        performer_name: 'Pharmacist'
      });
    }

    await db.execute(
      `
      UPDATE prescriptions
      SET status = 'dispensed', dispensed_by = ?, dispensed_at = NOW()
      WHERE id = ?
      `,
      [dispensedBy, id]
    );

    return this._getPrescriptionOrFail(id);
  }

  async cancelPrescription(id) {

    const prescription = await this._getPrescriptionOrFail(id);

    if (prescription.status !== 'pending') {
      throw new AppError(
        `Cannot cancel a prescription with status "${prescription.status}"`,
        422
      );
    }

    await db.execute(
      `UPDATE prescriptions SET status = 'cancelled' WHERE id = ?`,
      [id]
    );

    return this._getPrescriptionOrFail(id);
  }

  /**
   * Pharmacy overview statistics: medicines count, low stock, out of stock,
   * expiring count, prescription queue counts, and inventory valuation.
   */
  async getPharmacyStats() {
    // 1. Fetch active medicines and calculate live inventory status
    const [allMeds] = await db.execute('SELECT * FROM medications WHERE is_active = 1');
    const enriched = pharmacyStore.enrichMedications(allMeds);

    const totalMedicines = enriched.length;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;
    let totalInventoryValue = 0;

    enriched.forEach((m) => {
      if (m.is_out_of_stock) {
        outOfStockCount++;
      } else if (m.is_low_stock) {
        lowStockCount++;
      }

      if (m.is_expired) {
        expiredCount++;
      } else if (m.is_expiring_soon) {
        expiringCount++;
      }

      totalInventoryValue += (Number(m.stock_quantity) || 0) * (Number(m.cost_price) || 0);
    });

    // 2. Fetch pending and dispensed prescription counts
    const [[pendingRx]] = await db.execute(
      "SELECT COUNT(*) AS total FROM prescriptions WHERE status = 'pending'"
    );
    const [[dispensedRx]] = await db.execute(
      "SELECT COUNT(*) AS total FROM prescriptions WHERE status = 'dispensed'"
    );

    // 3. Fetch recent audit stock transactions
    const recentTransactions = pharmacyStore.getTransactions({ limit: 10 }).data;

    return {
      totalMedicines,
      lowStockCount,
      outOfStockCount,
      expiringCount,
      expiredCount,
      totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
      pendingPrescriptionsCount: pendingRx?.total || 0,
      dispensedPrescriptionsCount: dispensedRx?.total || 0,
      recentTransactions
    };
  }

  /**
   * Stock operations: receive wholesale batch, process returns, or adjust quantities.
   */
  async stockOperation(payload, user = {}) {
    const {
      medication_id,
      operation_type, // 'receive' | 'adjust' | 'return'
      quantity,
      unit_cost,
      reason,
      supplier,
      batch_number,
      expiry_date
    } = payload;

    const med = await MedicationModel.findById(medication_id);
    if (!med) {
      throw new AppError(`Medication #${medication_id} not found`, 404);
    }

    const qty = Math.abs(Number(quantity));
    if (isNaN(qty) || qty <= 0) {
      throw new AppError('Quantity must be a positive number', 400);
    }

    let delta = 0;
    let txType = 'received';

    if (operation_type === 'receive') {
      delta = qty;
      txType = 'received';
      if (batch_number || expiry_date || supplier) {
        pharmacyStore.setMedicationDetails(medication_id, {
          batch_number,
          expiry_date,
          supplier
        });
      }
    } else if (operation_type === 'return') {
      const isSupplierReturn = payload.return_direction === 'supplier' || payload.direction === 'supplier';
      delta = isSupplierReturn ? -qty : qty;
      txType = 'returned';
    } else if (operation_type === 'adjust') {
      const isNegative = payload.adjustment_type === 'deduct' || payload.adjustment_type === 'damage' || Number(quantity) < 0;
      delta = isNegative ? -qty : qty;
      txType = 'adjusted';
    } else {
      throw new AppError(`Invalid operation type "${operation_type}"`, 400);
    }

    const newStock = Number(med.stock_quantity) + delta;
    if (newStock < 0) {
      throw new AppError(
        `Insufficient stock for "${med.name}" to deduct ${qty}. Current stock: ${med.stock_quantity}`,
        422
      );
    }

    const updated = await MedicationModel.adjustStock(medication_id, delta);
    if (!updated) {
      throw new AppError('Failed to adjust stock', 500);
    }

    const tx = pharmacyStore.logTransaction({
      medication_id,
      medication_name: med.name,
      transaction_type: txType,
      quantity: qty,
      previous_stock: Number(med.stock_quantity),
      new_stock: newStock,
      unit_cost: Number(unit_cost) || Number(med.cost_price) || 0,
      total_cost: qty * (Number(unit_cost) || Number(med.cost_price) || 0),
      reference_id: payload.reference_id || `STK-${Date.now().toString().slice(-6)}`,
      reason: reason || `Pharmacy ${operation_type} stock operation`,
      performed_by: user.id || 1,
      performer_name: user.name || 'Pharmacist'
    });

    const refreshedMed = await MedicationModel.findById(medication_id);
    return {
      medication: pharmacyStore.enrichMedication(refreshedMed),
      transaction: tx
    };
  }

  /**
   * Get paginated audit stock transactions.
   */
  getStockTransactions(query = {}) {
    return pharmacyStore.getTransactions(query);
  }

  /**
   * Get supplier directory.
   */
  getSuppliers() {
    return pharmacyStore.getSuppliers();
  }

  /**
   * Add or update supplier.
   */
  saveSupplier(payload) {
    return pharmacyStore.saveSupplier(payload);
  }
}

module.exports = new PharmacyService();