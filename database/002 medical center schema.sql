-- Migration 009: Medical Center Full Schema
-- Run after 008_drop_old_tables.sql
-- Requires: users table from 007

USE booking_db;

-- ─────────────────────────────────────────────
-- 1. USERS (already created in 007 — skip if exists)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       ENUM('patient','doctor','pharmacist','receptionist','admin') NOT NULL DEFAULT 'patient',
    phone      VARCHAR(20)  NULL,
    is_active  TINYINT(1)   NOT NULL DEFAULT 1,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- 2. SPECIALTIES — doctor categories with template type
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS specialties (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    name_ar       VARCHAR(100) NOT NULL,
    template_type ENUM('general','dental','cosmetic','ophthalmology','pediatric','other') NOT NULL DEFAULT 'general',
    icon          VARCHAR(10)  NULL,
    is_active     TINYINT(1)   NOT NULL DEFAULT 1,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- 3. DOCTORS — links a user account to medical profile
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    user_id              INT           NOT NULL UNIQUE,
    specialty_id         INT           NOT NULL,
    license_number       VARCHAR(50)   NOT NULL UNIQUE,
    consultation_fee     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    bio                  TEXT          NULL,
    work_days            SET('sat','sun','mon','tue','wed','thu','fri') NULL,
    work_start           TIME          NOT NULL DEFAULT '08:00:00',
    work_end             TIME          NOT NULL DEFAULT '16:00:00',
    appointment_duration INT           NOT NULL DEFAULT 30,
    is_active            TINYINT(1)    NOT NULL DEFAULT 1,
    created_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_doctor_user      FOREIGN KEY (user_id)      REFERENCES users(id),
    CONSTRAINT fk_doctor_specialty FOREIGN KEY (specialty_id) REFERENCES specialties(id)
);

-- ─────────────────────────────────────────────
-- 4. PATIENTS — full medical profile
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    patient_code            VARCHAR(20)  NOT NULL UNIQUE,
    full_name               VARCHAR(100) NOT NULL,
    phone                   VARCHAR(20)  NOT NULL,
    email                   VARCHAR(150) NULL,
    date_of_birth           DATE         NULL,
    gender                  ENUM('male','female')                            NULL,
    blood_type              ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NULL,
    chronic_conditions      TEXT         NULL,
    allergies               TEXT         NULL,
    emergency_contact_name  VARCHAR(100) NULL,
    emergency_contact_phone VARCHAR(20)  NULL,
    notes                   TEXT         NULL,
    user_id                 INT          NULL,
    created_by              INT          NOT NULL,
    created_at              TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_patient_user       FOREIGN KEY (user_id)    REFERENCES users(id),
    CONSTRAINT fk_patient_created_by FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ─────────────────────────────────────────────
-- 5. APPOINTMENTS — replaces old bookings table
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    appointment_code  VARCHAR(20) NOT NULL UNIQUE,
    patient_id        INT         NOT NULL,
    doctor_id         INT         NOT NULL,
    appointment_date  DATE        NOT NULL,
    start_time        TIME        NOT NULL,
    end_time          TIME        NOT NULL,
    status            ENUM('pending','confirmed','in_progress','completed','cancelled','no_show') NOT NULL DEFAULT 'pending',
    visit_type        ENUM('new','follow_up','emergency')  NOT NULL DEFAULT 'new',
    chief_complaint   TEXT        NULL,
    cancel_reason     TEXT        NULL,
    notes             TEXT        NULL,
    booked_by         INT         NOT NULL,
    deleted_at        TIMESTAMP   NULL,
    created_at        TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_apt_patient   FOREIGN KEY (patient_id) REFERENCES patients(id),
    CONSTRAINT fk_apt_doctor    FOREIGN KEY (doctor_id)  REFERENCES doctors(id),
    CONSTRAINT fk_apt_booked_by FOREIGN KEY (booked_by)  REFERENCES users(id)
);

-- Prevent double-booking: same doctor, same date, overlapping time, not cancelled
CREATE INDEX idx_apt_conflict ON appointments (doctor_id, appointment_date, status);

-- ─────────────────────────────────────────────
-- 6. MEDICAL RECORDS — what the doctor writes per visit
-- specialty_data is JSON to support all template types
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medical_records (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id  INT  NOT NULL UNIQUE,
    patient_id      INT  NOT NULL,
    doctor_id       INT  NOT NULL,
    visit_date      DATE NOT NULL,
    -- Common fields across all specialties
    diagnosis       TEXT NULL,
    treatment_plan  TEXT NULL,
    vital_signs     JSON NULL,   -- { bp, pulse, temp, weight, height }
    -- Specialty-specific data: dental chart, cosmetic areas, eye readings, etc.
    specialty_data  JSON NULL,
    follow_up_date  DATE NULL,
    follow_up_notes TEXT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_record_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    CONSTRAINT fk_record_patient     FOREIGN KEY (patient_id)     REFERENCES patients(id),
    CONSTRAINT fk_record_doctor      FOREIGN KEY (doctor_id)      REFERENCES doctors(id)
);

-- ─────────────────────────────────────────────
-- 7. MEDICATIONS — pharmacy inventory
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medications (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(150)  NOT NULL,
    name_ar        VARCHAR(150)  NULL,
    category       VARCHAR(100)  NULL,
    unit           VARCHAR(50)   NOT NULL DEFAULT 'tablet',
    stock_quantity INT           NOT NULL DEFAULT 0,
    minimum_stock  INT           NOT NULL DEFAULT 10,
    cost_price     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    selling_price  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active      TINYINT(1)    NOT NULL DEFAULT 1,
    created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- 8. PRESCRIPTIONS — doctor prescribes, pharmacist dispenses
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prescriptions (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    prescription_code   VARCHAR(20) NOT NULL UNIQUE,
    appointment_id      INT         NOT NULL,
    patient_id          INT         NOT NULL,
    doctor_id           INT         NOT NULL,
    status              ENUM('pending','dispensed','cancelled') NOT NULL DEFAULT 'pending',
    notes               TEXT        NULL,
    dispensed_by        INT         NULL,
    dispensed_at        TIMESTAMP   NULL,
    created_at          TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rx_appointment  FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    CONSTRAINT fk_rx_patient      FOREIGN KEY (patient_id)     REFERENCES patients(id),
    CONSTRAINT fk_rx_doctor       FOREIGN KEY (doctor_id)      REFERENCES doctors(id),
    CONSTRAINT fk_rx_dispensed_by FOREIGN KEY (dispensed_by)   REFERENCES users(id)
);

-- ─────────────────────────────────────────────
-- 9. PRESCRIPTION ITEMS — medicines inside each prescription
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prescription_items (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    prescription_id INT          NOT NULL,
    medication_id   INT          NOT NULL,
    quantity        INT          NOT NULL DEFAULT 1,
    dosage          VARCHAR(150) NULL,
    duration        VARCHAR(100) NULL,
    instructions    TEXT         NULL,
    CONSTRAINT fk_rx_item_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions(id),
    CONSTRAINT fk_rx_item_medication   FOREIGN KEY (medication_id)   REFERENCES medications(id)
);

-- ─────────────────────────────────────────────
-- 10. INVOICES — financial record per visit
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    invoice_code   VARCHAR(20)   NOT NULL UNIQUE,
    patient_id     INT           NOT NULL,
    appointment_id INT           NULL,
    doctor_id      INT           NULL,
    subtotal       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    paid_amount    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status         ENUM('unpaid','partial','paid','refunded') NOT NULL DEFAULT 'unpaid',
    payment_method ENUM('cash','card','insurance','other')    NULL,
    notes          TEXT          NULL,
    issued_by      INT           NOT NULL,
    created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoice_patient   FOREIGN KEY (patient_id)     REFERENCES patients(id),
    CONSTRAINT fk_invoice_issued_by FOREIGN KEY (issued_by)      REFERENCES users(id)
);

-- ─────────────────────────────────────────────
-- 11. INVOICE ITEMS — line items inside each invoice
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_items (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id   INT           NOT NULL,
    description  VARCHAR(255)  NOT NULL,
    item_type    ENUM('consultation','procedure','medication','other') NOT NULL DEFAULT 'consultation',
    quantity     INT           NOT NULL DEFAULT 1,
    unit_price   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_price  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_inv_item_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- ─────────────────────────────────────────────
-- 12. EXPENSES — center outgoing costs
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(200)  NOT NULL,
    category     ENUM('rent','salary','medical_supply','equipment','utility','other') NOT NULL DEFAULT 'other',
    amount       DECIMAL(10,2) NOT NULL,
    expense_date DATE          NOT NULL,
    notes        TEXT          NULL,
    recorded_by  INT           NOT NULL,
    created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_expense_recorded_by FOREIGN KEY (recorded_by) REFERENCES users(id)
);