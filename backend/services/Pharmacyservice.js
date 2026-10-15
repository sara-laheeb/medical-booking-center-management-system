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

    const [rows] = await db.execute(
      `
      SELECT rx.id,
             rx.prescription_code,
             rx.patient_id,
             rx.doctor_id,
             rx.status,
             rx.created_at
      FROM prescriptions rx
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
   * - Stock is decremented for every dispensed item
   */
  async dispensePrescription(id, dispensedBy) {

    const prescription = await this._getPrescriptionOrFail(id);

    if (prescription.status !== 'pending') {
      throw new AppError(
        `Cannot dispense a prescription with status "${prescription.status}"`,
        422
      );
    }

    for (const item of prescription.items) {

      const medication = await MedicationModel.findById(item.medication_id);

      if (medication.stock_quantity < item.quantity) {
        throw new AppError(
          `Insufficient stock for "${medication.name}" (available: ${medication.stock_quantity}, needed: ${item.quantity})`,
          422
        );
      }
    }

    for (const item of prescription.items) {
      await MedicationModel.adjustStock(item.medication_id, -item.quantity);
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
}

module.exports = new PharmacyService();