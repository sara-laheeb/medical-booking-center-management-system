'use strict';

/**
 * InvoiceService
 * --------------------------------------------------
 * Business Logic Layer
 *
 * Flow:
 * Controller → Service → Model → Database
 *
 * Responsibilities:
 * - Apply business rules
 * - Compute totals server-side (never trust client-provided totals)
 * - Coordinate database operations
 * - Throw structured AppError exceptions
 */

const InvoiceModel = require('../models/Invoice.model');
const PatientModel = require('../models/patient.model');
const db = require('../config/database');
const AppError = require('../errors/AppError');

const round2 = (n) => Math.round(Number(n) * 100) / 100;

class InvoiceService {

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

  async _findOrFail(id) {

    const invoice = await InvoiceModel.findById(id);

    if (!invoice) {
      throw new AppError(`Invoice with ID ${id} not found`, 404);
    }

    return invoice;
  }

  async _withItems(invoice) {

    const items = await InvoiceModel.findItemsByInvoiceId(invoice.id);

    return { ...invoice, items };
  }

  async _generateInvoiceCode() {

    const maxId = await InvoiceModel.getMaxId();

    return `INV-${String(maxId + 1).padStart(6, '0')}`;
  }

  /**
   * Retrieve all invoices (list view — no line items attached).
   *
   * Supports pagination, patient/status filters and a creation
   * date range.
   */
  async getAllInvoices(query = {}, user = null) {

    const { page, limit, offset } = this._parsePagination(query);

    const filters = {
      patientId: query.patient_id || null,
      doctorId: query.doctor_id || null,
      status: query.status || null,
      dateFrom: query.date_from || null,
      dateTo: query.date_to || null
    };

    if (user && user.role === 'doctor') {
      const [docRows] = await db.execute('SELECT id FROM doctors WHERE user_id = ? LIMIT 1', [user.id]);
      if (docRows[0]) {
        filters.doctorId = docRows[0].id;
      } else {
        return {
          data: [],
          meta: { total: 0, page: 1, limit, totalPages: 1, hasNextPage: false, hasPrevPage: false }
        };
      }
    } else if (user && user.role === 'patient') {
      const [patRows] = await db.execute(
        'SELECT id FROM patients WHERE user_id = ? OR email = ? LIMIT 1',
        [user.id, user.email]
      );
      if (patRows[0]) {
        filters.patientId = patRows[0].id;
      } else {
        return {
          data: [],
          meta: { total: 0, page: 1, limit, totalPages: 1, hasNextPage: false, hasPrevPage: false }
        };
      }
    }

    const [data, total] = await Promise.all([
      InvoiceModel.findAll({ limit, offset, ...filters }),
      InvoiceModel.countAll(filters)
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
   * Retrieve one invoice with its line items, enforcing role access.
   */
  async getInvoiceById(id, user = null) {

    const invoice = await this._findOrFail(id);

    if (user && user.role === 'doctor') {
      const [docRows] = await db.execute('SELECT id FROM doctors WHERE user_id = ? LIMIT 1', [user.id]);
      if (!docRows[0] || invoice.doctor_id !== docRows[0].id) {
        throw new AppError('Doctors can only access invoices associated with their appointments', 403);
      }
    } else if (user && user.role === 'patient') {
      const [patRows] = await db.execute(
        'SELECT id FROM patients WHERE user_id = ? OR email = ? LIMIT 1',
        [user.id, user.email]
      );
      if (!patRows[0] || invoice.patient_id !== patRows[0].id) {
        throw new AppError('Patients can only access their own invoices', 403);
      }
    }

    return this._withItems(invoice);
  }

  /**
   * Create an invoice with one or more line items.
   *
   * Business rules:
   * - Patient must exist
   * - subtotal/total are computed server-side from the items,
   *   never trusted from the client
   */
  async createInvoice(data, issuedBy) {

    const patient = await PatientModel.findById(data.patient_id);

    if (!patient) {
      throw new AppError(`Patient with ID ${data.patient_id} not found`, 404);
    }
    if (!Array.isArray(data.items) || data.items.length === 0) {
        throw new AppError(
            'Invoice must contain at least one item',
            422
        );
    }
    const items = data.items.map((item) => ({
      ...item,
      quantity: item.quantity || 1,
      total_price: round2((item.quantity || 1) * item.unit_price)
    }));

    const subtotal = round2(items.reduce((sum, item) => sum + item.total_price, 0));
    const discount = round2(data.discount || 0);
    const tax = round2(data.tax || 0);
    const total = round2(subtotal - discount + tax);

    if (total < 0) {
      throw new AppError('Invoice total cannot be negative — check the discount amount', 422);
    }

    const invoiceCode = await this._generateInvoiceCode();

    const invoiceId = await InvoiceModel.create({
      invoice_code: invoiceCode,
      patient_id: data.patient_id,
      appointment_id: data.appointment_id,
      doctor_id: data.doctor_id,
      subtotal,
      discount,
      tax,
      total,
      payment_method: data.payment_method,
      notes: data.notes,
      issued_by: issuedBy
    });

    await InvoiceModel.addItems(invoiceId, items);

    return this.getInvoiceById(invoiceId);
  }

  /**
   * Register a payment against an invoice.
   *
   * Business rules:
   * - Cannot pay an already-paid or refunded invoice
   * - Cannot pay more than the outstanding balance
   * - Status becomes "partial" or "paid" depending on paid_amount vs total
   */
  async recordPayment(id, { amount, payment_method }) {

    const invoice = await this._findOrFail(id);

    if (invoice.status === 'paid') {
      throw new AppError('This invoice is already fully paid', 422);
    }

    if (invoice.status === 'refunded') {
      throw new AppError('Cannot pay a refunded invoice', 422);
    }

    const outstanding = round2(invoice.total - invoice.paid_amount);
    if (amount <= 0) {
        throw new AppError(
            'Payment amount must be greater than zero',
            422
        );
    }
    if (amount > outstanding) {
      throw new AppError(
        `Payment amount exceeds outstanding balance of ${outstanding}`,
        422
      );
    }

    const newPaidAmount = round2(invoice.paid_amount + amount);
    const newStatus = newPaidAmount >= invoice.total ? 'paid' : 'partial';

    const updated = await InvoiceModel.recordPayment(id, {
      paidAmount: newPaidAmount,
      status: newStatus,
      paymentMethod: payment_method
    });

    if (!updated) {
      throw new AppError('Failed to record payment', 500);
    }

    return this.getInvoiceById(id);
  }

  /**
   * Refund an invoice.
   *
   * Business rule: cannot refund an invoice with no payments.
   */
  async refundInvoice(id) {

    const invoice = await this._findOrFail(id);

    if (invoice.paid_amount <= 0) {
      throw new AppError('Cannot refund an invoice with no payments', 422);
    }

    if (invoice.status === 'refunded') {
      throw new AppError('This invoice has already been refunded', 422);
    }

    const refunded = await InvoiceModel.refund(id);

    if (!refunded) {
      throw new AppError('Failed to refund invoice', 500);
    }

    return this.getInvoiceById(id);
  }
}

module.exports = new InvoiceService();