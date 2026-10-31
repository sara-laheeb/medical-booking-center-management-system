'use strict';

require('dotenv').config();

const db = require('../backend/config/database');
const bcrypt = require('bcryptjs');

function getRequiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getRequiredNumber(name) {
  const value = Number(getRequiredEnv(name));

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return value;
}

async function main() {
  try {
    // Load test account configuration from environment variables.
    const primaryEmail = getRequiredEnv('TEST_PATIENT_EMAIL');
    const primaryPassword = getRequiredEnv('TEST_PATIENT_PASSWORD');
    const primaryPhone = getRequiredEnv('TEST_PRIMARY_PATIENT_PHONE');
    const primaryPatientId = getRequiredNumber(
      'TEST_PRIMARY_PATIENT_RECORD_ID'
    );

    const secondEmail = getRequiredEnv('TEST_SECOND_PATIENT_EMAIL');
    const secondPassword = getRequiredEnv('TEST_SECOND_PATIENT_PASSWORD');
    const secondPhone = getRequiredEnv('TEST_SECOND_PATIENT_PHONE');

    const secondPatientCode = getRequiredEnv('TEST_SECOND_PATIENT_CODE');
    const doctorId = getRequiredNumber('TEST_APPOINTMENT_DOCTOR_ID');

    const appointmentDate = getRequiredEnv('TEST_APPOINTMENT_DATE');
    const appointmentCode = getRequiredEnv('TEST_APPOINTMENT_CODE');

    // Hash each test account password separately.
    const primaryHash = await bcrypt.hash(primaryPassword, 12);
    const secondHash = await bcrypt.hash(secondPassword, 12);

    // 1. Update the primary test patient account.
    const [primaryUser] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [primaryEmail]
    );

    if (primaryUser.length === 0) {
      throw new Error(
        `Primary test user not found: ${primaryEmail}`
      );
    }

    await db.query(
      `UPDATE users
       SET phone = ?, password = ?
       WHERE email = ?`,
      [primaryPhone, primaryHash, primaryEmail]
    );

    await db.query(
      `UPDATE patients
       SET first_name = 'Test',
           last_name = 'Patient',
           email = ?,
           phone = ?,
           status = 'active'
       WHERE id = ?`,
      [primaryEmail, primaryPhone, primaryPatientId]
    );

    console.log('Updated primary test patient account.');

    // 2. Find or create the second test user.
    const [existingUser] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [secondEmail]
    );

    let secondUserId;

    if (existingUser.length > 0) {
      secondUserId = existingUser[0].id;

      await db.query(
        `UPDATE users
         SET name = ?,
             phone = ?,
             password = ?,
             role = 'patient',
             is_active = 1
         WHERE id = ?`,
        [
          'Test Patient',
          secondPhone,
          secondHash,
          secondUserId
        ]
      );

      console.log('Updated existing second test user.');
    } else {
      const [result] = await db.query(
        `INSERT INTO users
         (name, email, phone, password, role, is_active)
         VALUES (?, ?, ?, ?, 'patient', 1)`,
        [
          'Test Patient',
          secondEmail,
          secondPhone,
          secondHash
        ]
      );

      secondUserId = result.insertId;

      console.log('Created second test user.');
    }

    // 3. Find or create the second patient record.
    const [existingPatient] = await db.query(
      `SELECT id
       FROM patients
       WHERE user_id = ? OR email = ?
       LIMIT 1`,
      [secondUserId, secondEmail]
    );

    let secondPatientId;

    if (existingPatient.length > 0) {
      secondPatientId = existingPatient[0].id;

      await db.query(
        `UPDATE patients
         SET first_name = ?,
             last_name = ?,
             email = ?,
             phone = ?,
             status = 'active',
             user_id = ?
         WHERE id = ?`,
        [
          'Test',
          'Patient',
          secondEmail,
          secondPhone,
          secondUserId,
          secondPatientId
        ]
      );

      console.log('Updated second patient record.');
    } else {
      const [result] = await db.query(
        `INSERT INTO patients
         (
           first_name,
           last_name,
           patient_code,
           phone,
           email,
           date_of_birth,
           gender,
           blood_type,
           status,
           user_id,
           created_by
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        [
          'Test',
          'Patient',
          secondPatientCode,
          secondPhone,
          secondEmail,
          '1995-06-15',
          'female',
          'A+',
          secondUserId,
          secondUserId
        ]
      );

      secondPatientId = result.insertId;

      console.log('Created second patient record.');
    }

    // 4. Ensure the second patient has at least one appointment.
    const [appointments] = await db.query(
      'SELECT id FROM appointments WHERE patient_id = ?',
      [secondPatientId]
    );

    if (appointments.length === 0) {
      await db.query(
        `INSERT INTO appointments
         (
           appointment_code,
           patient_id,
           doctor_id,
           booked_by,
           appointment_date,
           start_time,
           end_time,
           status,
           visit_type,
           chief_complaint
         )
         VALUES (?, ?, ?, ?, ?, '10:00:00', '10:30:00',
                 'confirmed', 'new', ?)`,
        [
          appointmentCode,
          secondPatientId,
          doctorId,
          secondUserId,
          appointmentDate,
          'Routine test appointment'
        ]
      );

      console.log('Created sample patient appointment.');
    }

    console.log('ALL TEST PATIENTS CONFIGURED SUCCESSFULLY');
  } catch (err) {
    console.error('Error configuring test patients:', err.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

main();