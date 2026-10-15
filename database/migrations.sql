USE booking_db;


/* ============================================================
   1. Patients Table Updates
   Purpose:
   Add structured patient information, patient status,
   soft-delete support, and separate first/last names.
   ============================================================ */

ALTER TABLE patients
    ADD COLUMN first_name VARCHAR(50) NULL AFTER patient_code,
    ADD COLUMN last_name VARCHAR(50) NULL AFTER first_name,
    ADD COLUMN national_id VARCHAR(20) NULL AFTER gender,
    ADD COLUMN address VARCHAR(255) NULL AFTER email,
    ADD COLUMN chronic_conditions TEXT NULL AFTER blood_type,
    ADD COLUMN allergies TEXT NULL AFTER chronic_conditions,
    ADD COLUMN status ENUM('active', 'inactive', 'deceased')
        NOT NULL DEFAULT 'active' AFTER notes,
    ADD COLUMN deleted_at DATETIME NULL AFTER status;


/* ============================================================
   2. Patients Name Migration
   Purpose:
   Populate the new first_name and last_name columns
   from the existing full_name column.
   ============================================================ */

UPDATE patients
SET
    first_name = SUBSTRING_INDEX(full_name, ' ', 1),
    last_name = SUBSTRING_INDEX(full_name, ' ', -1)
WHERE full_name IS NOT NULL;


/* ============================================================
   3. Specialties Table Update
   Purpose:
   Add automatic update tracking for specialty records.
   ============================================================ */

ALTER TABLE specialties
    ADD COLUMN updated_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP;


/* ============================================================
   4. Users Role Update
   Purpose:
   Ensure all active medical center roles are supported.
   ============================================================ */

ALTER TABLE users
    MODIFY COLUMN role
    ENUM('patient', 'doctor', 'pharmacist', 'receptionist', 'admin')
    NOT NULL DEFAULT 'patient';


/* ============================================================
   5. Appointments Soft Delete
   Purpose:
   Allow appointments to be deleted logically without
   permanently removing their database records.
   ============================================================ */

ALTER TABLE appointments
    ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;