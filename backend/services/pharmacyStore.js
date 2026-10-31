/**
 * Pharmacy Data Store & Audit Service
 * ----------------------------------------------------
 * Manages pharmaceutical metadata enrichment, supplier management,
 * and immutable stock transaction audit logs (receiving, dispensing,
 * adjustments, returns).
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const STORE_FILE = path.join(DATA_DIR, 'pharmacy_store.json');

// Initial seed data for suppliers and standard medications
const DEFAULT_STORE = {
  suppliers: [
    {
      id: 1,
      name: 'Al-Amal Pharmaceuticals Ltd.',
      contact_person: 'Dr. Hassan Ali',
      phone: '+964 770 123 4567',
      email: 'orders@alamal-pharma.com',
      address: 'Karrada District, Baghdad, Iraq',
      tax_number: 'TAX-IQ-8821',
      is_active: true,
      created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
    },
    {
      id: 2,
      name: 'Babylon Medical & Biotech Imports',
      contact_person: 'Zahra Kareem',
      phone: '+964 780 987 6543',
      email: 'sales@babylonmed.iq',
      address: 'Mansour Trade Tower, Baghdad, Iraq',
      tax_number: 'TAX-IQ-4491',
      is_active: true,
      created_at: new Date('2026-02-10T11:30:00Z').toISOString(),
    },
    {
      id: 3,
      name: 'Swiss Pharma Regional Distribution',
      contact_person: 'Marc Keller',
      phone: '+964 750 555 1212',
      email: 'middleeast@swisspharma.ch',
      address: 'Erbil Free Zone, Iraq',
      tax_number: 'TAX-CH-9912',
      is_active: true,
      created_at: new Date('2026-03-01T14:15:00Z').toISOString(),
    },
  ],
  transactions: [
    {
      id: 1,
      transaction_code: 'TX-20260601-001',
      medication_id: 1,
      medication_name: 'Paracetamol 500mg',
      transaction_type: 'received',
      quantity: 500,
      previous_stock: 0,
      new_stock: 500,
      unit_cost: 500,
      total_cost: 250000,
      reference_id: 'PO-2026-0881',
      reason: 'Initial wholesale pharmaceutical intake batch',
      performed_by: 14,
      performer_name: 'Pharmacy Admin',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 2,
      transaction_code: 'TX-20260610-002',
      medication_id: 1,
      medication_name: 'Paracetamol 500mg',
      transaction_type: 'dispensed',
      quantity: 20,
      previous_stock: 500,
      new_stock: 480,
      unit_cost: 500,
      total_cost: 10000,
      reference_id: 'RX-000001',
      reason: 'Dispensed per physician prescription',
      performed_by: 24,
      performer_name: 'Dr. Zaid Pharmacist',
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
  ],
  medication_details: {
    1: {
      generic_name: 'Paracetamol (Acetaminophen)',
      strength: '500mg',
      dosage_form: 'Tablet',
      manufacturer: 'Samarra Drugs Industry (SDI)',
      barcode: '628100100101',
      batch_number: 'BAT-2026-A1',
      expiry_date: '2027-12-31',
      supplier: 'Al-Amal Pharmaceuticals Ltd.',
    },
    2: {
      generic_name: 'Amoxicillin Trihydrate',
      strength: '500mg',
      dosage_form: 'Capsule',
      manufacturer: 'GlaxoSmithKline (GSK)',
      barcode: '628100100102',
      batch_number: 'BAT-2026-B4',
      expiry_date: '2027-08-31',
      supplier: 'Babylon Medical & Biotech Imports',
    },
    3: {
      generic_name: 'Ibuprofen',
      strength: '400mg',
      dosage_form: 'Film-coated Tablet',
      manufacturer: 'Abbott Laboratories',
      barcode: '628100100103',
      batch_number: 'BAT-2026-C2',
      expiry_date: '2027-10-15',
      supplier: 'Swiss Pharma Regional Distribution',
    },
    4: {
      generic_name: 'Omeprazole Magnesium',
      strength: '20mg',
      dosage_form: 'Delayed-Release Capsule',
      manufacturer: 'AstraZeneca',
      barcode: '628100100104',
      batch_number: 'BAT-2026-D9',
      expiry_date: '2027-06-30',
      supplier: 'Al-Amal Pharmaceuticals Ltd.',
    },
    5: {
      generic_name: 'Metformin Hydrochloride',
      strength: '850mg',
      dosage_form: 'Extended-Release Tablet',
      manufacturer: 'Merck Healthcare',
      barcode: '628100100105',
      batch_number: 'BAT-2026-E5',
      expiry_date: '2027-09-30',
      supplier: 'Babylon Medical & Biotech Imports',
    },
    6: {
      generic_name: 'Salbutamol Sulfate',
      strength: '100mcg/dose',
      dosage_form: 'Metered Dose Inhaler',
      manufacturer: 'Cipla Respiratory',
      barcode: '628100100106',
      batch_number: 'BAT-2026-F1',
      expiry_date: '2027-05-31',
      supplier: 'Swiss Pharma Regional Distribution',
    },
  },
};

/**
 * Read data safely from JSON file, initializing if missing.
 */
function readStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_FILE)) {
      fs.writeFileSync(STORE_FILE, JSON.stringify(DEFAULT_STORE, null, 2), 'utf8');
      return JSON.parse(JSON.stringify(DEFAULT_STORE));
    }
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[PharmacyStore] Read error, fallback to defaults:', err.message);
    return JSON.parse(JSON.stringify(DEFAULT_STORE));
  }
}

/**
 * Write updated data atomically to JSON file.
 */
function writeStore(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${STORE_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, STORE_FILE);
  } catch (err) {
    console.error('[PharmacyStore] Write error:', err.message);
  }
}

class PharmacyStore {
  /**
   * Enriches a raw database medication row with pharmaceutical metadata.
   */
  enrichMedication(med) {
    if (!med) return null;
    const store = readStore();
    const details = store.medication_details?.[med.id] || {};

    const expiryDate = details.expiry_date || '2027-12-31';
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    const isExpired = daysUntilExpiry <= 0;
    const isExpiringSoon = !isExpired && daysUntilExpiry <= 90;
    const isOutOfStock = Number(med.stock_quantity) <= 0;
    const isLowStock = Number(med.stock_quantity) > 0 && Number(med.stock_quantity) <= Number(med.minimum_stock);

    return {
      ...med,
      generic_name: details.generic_name || med.name,
      strength: details.strength || 'Standard',
      dosage_form: details.dosage_form || 'Tablet',
      manufacturer: details.manufacturer || 'Standard Pharmaceutical',
      barcode: details.barcode || `628100100${med.id}`,
      batch_number: details.batch_number || `BAT-2026-${String(med.id).padStart(2, '0')}`,
      expiry_date: expiryDate,
      supplier: details.supplier || 'Vita Medical Primary Supplier',
      days_until_expiry: daysUntilExpiry,
      is_expired: isExpired,
      is_expiring_soon: isExpiringSoon,
      is_out_of_stock: isOutOfStock,
      is_low_stock: isLowStock,
    };
  }

  /**
   * Enriches an array of medication rows.
   */
  enrichMedications(meds = []) {
    return meds.map((m) => this.enrichMedication(m));
  }

  /**
   * Updates or saves extended pharmaceutical metadata for a medication.
   */
  setMedicationDetails(id, details) {
    const store = readStore();
    if (!store.medication_details) store.medication_details = {};
    store.medication_details[id] = {
      ...(store.medication_details[id] || {}),
      generic_name: details.generic_name || details.name,
      strength: details.strength || 'Standard',
      dosage_form: details.dosage_form || 'Tablet',
      manufacturer: details.manufacturer || 'Standard Pharmaceutical',
      barcode: details.barcode || `628100100${id}`,
      batch_number: details.batch_number || `BAT-2026-${String(id).padStart(2, '0')}`,
      expiry_date: details.expiry_date || '2027-12-31',
      supplier: details.supplier || 'Vita Medical Primary Supplier',
    };
    writeStore(store);
  }

  /**
   * Records a persistent stock audit transaction (receiving, dispensing, adjusting, returns).
   */
  logTransaction({
    medication_id,
    medication_name,
    transaction_type,
    quantity,
    previous_stock,
    new_stock,
    unit_cost = 0,
    total_cost = 0,
    reference_id = null,
    reason = '',
    performed_by,
    performer_name = 'Staff',
  }) {
    const store = readStore();
    if (!store.transactions) store.transactions = [];

    const nextId = store.transactions.length > 0
      ? Math.max(...store.transactions.map((t) => t.id || 0)) + 1
      : 1;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const code = `TX-${dateStr}-${String(nextId).padStart(4, '0')}`;

    const tx = {
      id: nextId,
      transaction_code: code,
      medication_id: Number(medication_id),
      medication_name: medication_name || `Medication #${medication_id}`,
      transaction_type, // 'received' | 'dispensed' | 'adjusted' | 'returned'
      quantity: Number(quantity),
      previous_stock: Number(previous_stock),
      new_stock: Number(new_stock),
      unit_cost: Number(unit_cost) || 0,
      total_cost: Number(total_cost) || (Number(quantity) * (Number(unit_cost) || 0)),
      reference_id: reference_id || null,
      reason: reason || '',
      performed_by: Number(performed_by) || 1,
      performer_name,
      created_at: new Date().toISOString(),
    };

    store.transactions.unshift(tx);
    // Keep last 1,000 transactions for audit history
    if (store.transactions.length > 1000) {
      store.transactions = store.transactions.slice(0, 1000);
    }
    writeStore(store);
    return tx;
  }

  /**
   * Retrieves paginated stock transactions with optional type/medication filters.
   */
  getTransactions({ type, medication_id, limit = 50, page = 1 } = {}) {
    const store = readStore();
    let list = store.transactions || [];

    if (type && type !== 'all') {
      list = list.filter((t) => t.transaction_type === type);
    }
    if (medication_id) {
      list = list.filter((t) => Number(t.medication_id) === Number(medication_id));
    }

    const total = list.length;
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (parsedPage - 1) * parsedLimit;
    const paginated = list.slice(offset, offset + parsedLimit);

    return {
      data: paginated,
      meta: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.max(1, Math.ceil(total / parsedLimit)),
      },
    };
  }

  /**
   * Retrieves all registered suppliers.
   */
  getSuppliers() {
    const store = readStore();
    return store.suppliers || [];
  }

  /**
   * Adds or updates a supplier in the registry.
   */
  saveSupplier(payload) {
    const store = readStore();
    if (!store.suppliers) store.suppliers = [];

    if (payload.id) {
      const idx = store.suppliers.findIndex((s) => s.id === Number(payload.id));
      if (idx !== -1) {
        store.suppliers[idx] = {
          ...store.suppliers[idx],
          ...payload,
          updated_at: new Date().toISOString(),
        };
        writeStore(store);
        return store.suppliers[idx];
      }
    }

    const nextId = store.suppliers.length > 0
      ? Math.max(...store.suppliers.map((s) => s.id || 0)) + 1
      : 1;

    const newSupplier = {
      id: nextId,
      name: payload.name,
      contact_person: payload.contact_person || '',
      phone: payload.phone || '',
      email: payload.email || '',
      address: payload.address || '',
      tax_number: payload.tax_number || '',
      is_active: payload.is_active !== false,
      created_at: new Date().toISOString(),
    };

    store.suppliers.push(newSupplier);
    writeStore(store);
    return newSupplier;
  }
}

module.exports = new PharmacyStore();
