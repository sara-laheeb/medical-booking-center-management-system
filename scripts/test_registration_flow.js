'use strict';

require('dotenv').config();

const request = require('supertest');
const app = require('../backend/app');
const db = require('../backend/config/database');

// Read test credentials from environment variables.
const TEST_FLOW_PASSWORD = process.env.TEST_FLOW_PASSWORD;

const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

const TEST_PATIENT_EMAIL = process.env.TEST_PATIENT_EMAIL;
const TEST_PATIENT_PASSWORD = process.env.TEST_PATIENT_PASSWORD;

const TEST_SECOND_PATIENT_EMAIL = process.env.TEST_SECOND_PATIENT_EMAIL;
const TEST_SECOND_PATIENT_PASSWORD = process.env.TEST_SECOND_PATIENT_PASSWORD;

async function runTests() {
  console.log(
    '--- STARTING REGISTRATION & AUTHENTICATION FLOW VERIFICATION ---'
  );

  // Validate required environment variables before running tests.
  const requiredVariables = {
    TEST_FLOW_PASSWORD,
    TEST_ADMIN_EMAIL,
    TEST_ADMIN_PASSWORD,
    TEST_PATIENT_EMAIL,
    TEST_PATIENT_PASSWORD,
    TEST_SECOND_PATIENT_EMAIL,
    TEST_SECOND_PATIENT_PASSWORD
  };

  const missingVariables = Object.entries(requiredVariables)
    .filter(([, value]) => !value || !value.trim())
    .map(([key]) => key);

  if (missingVariables.length > 0) {
    console.error(
      'Missing required environment variables:',
      missingVariables.join(', ')
    );
    console.error('Please configure them in your local .env file.');
    process.exitCode = 1;
    return;
  }

  let testDoctorId = null;
  let testDoctorUserId = null;

  const testPatientEmail = `test.patient.${Date.now()}@medicare.local`;
  const testDoctorEmail = `test.doctor.${Date.now()}@medicare.local`;
  const testDoctorLicense = `LIC-TEST-${Date.now().toString().slice(-5)}`;

  try {
    // 1. Patient Registration
    console.log('\n1. Testing Patient Registration:');

    const patRegRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test Patient',
        email: testPatientEmail,
        phone: '07701234567',
        password: TEST_FLOW_PASSWORD,
        role: 'patient'
      });

    console.log('Patient Registration Status:', patRegRes.status);

    if (patRegRes.status !== 201 || !patRegRes.body.data?.token) {
      throw new Error(
        `Patient registration failed: ${JSON.stringify(patRegRes.body)}`
      );
    }

    const patientUser = patRegRes.body.data.user;

    console.log(
      '✔ Patient registered with token, user ID:',
      patientUser.id,
      'role:',
      patientUser.role,
      'is_active:',
      patientUser.is_active
    );

    // Verify linked patient record in DB.
    const [patDb] = await db.query(
      'SELECT id, first_name, last_name, patient_code, user_id, status FROM patients WHERE user_id = ?',
      [patientUser.id]
    );

    if (!patDb[0] || patDb[0].status !== 'active') {
      throw new Error(
        'Patient record was not created or activated in database'
      );
    }

    console.log(
      '✔ Linked database patient record verified:',
      patDb[0].patient_code,
      patDb[0].first_name,
      patDb[0].last_name
    );

    // 2. Reject Duplicate Email
    console.log('\n2. Testing Duplicate Email Rejection:');

    const dupRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test Patient Again',
        email: testPatientEmail,
        phone: '07709876543',
        password: TEST_FLOW_PASSWORD
      });

    console.log('Duplicate Email Status:', dupRes.status, dupRes.body.message);

    if (dupRes.status !== 409) {
      throw new Error(
        `Expected 409 for duplicate email, got ${dupRes.status}`
      );
    }

    console.log('✔ Duplicate email correctly rejected with 409 Conflict');

    // 3. Reject Privileged Registration Attempt
    console.log('\n3. Testing Privileged Role Registration Blocking:');

    const privRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Fake Admin',
        email: `fake.admin.${Date.now()}@test.com`,
        phone: '07700000000',
        password: TEST_FLOW_PASSWORD,
        role: 'admin'
      });

    console.log(
      'Privileged Registration Status:',
      privRes.status,
      privRes.body.message
    );

    if (privRes.status !== 403) {
      throw new Error(
        `Expected 403 for admin self-registration, got ${privRes.status}`
      );
    }

    console.log(
      '✔ Public registration of admin role correctly blocked with 403 Forbidden'
    );

    // 4. Doctor Registration (Pending Review)
    console.log(
      '\n4. Testing Doctor Registration (Pending Administrator Approval):'
    );

    const docRegRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Dr. Test Dental',
        email: testDoctorEmail,
        phone: '07812345678',
        password: TEST_FLOW_PASSWORD,
        role: 'doctor',
        specialty_id: 2,
        license_number: testDoctorLicense,
        verification_documents: 'Test verification document'
      });

    console.log(
      'Doctor Registration Status:',
      docRegRes.status,
      docRegRes.body.message
    );

    if (docRegRes.status !== 201) {
      throw new Error(
        `Doctor registration failed: ${JSON.stringify(docRegRes.body)}`
      );
    }

    if (docRegRes.body.data?.token) {
      throw new Error(
        'Security violation: Doctor registration should NOT issue a session JWT before administrator approval'
      );
    }

    testDoctorUserId = docRegRes.body.data.user.id;

    console.log(
      '✔ Doctor registration submitted without session token. User ID:',
      testDoctorUserId,
      'Pending:',
      docRegRes.body.data.pending
    );

    // Verify doctor record in DB has is_active = 0.
    const [docDb] = await db.query(
      'SELECT d.id, d.is_active, d.license_number, d.bio, u.is_active AS user_active FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.user_id = ?',
      [testDoctorUserId]
    );

    if (
      !docDb[0] ||
      docDb[0].is_active !== 0 ||
      docDb[0].user_active !== 0
    ) {
      throw new Error(
        'Doctor or user account was not created with is_active = 0'
      );
    }

    testDoctorId = docDb[0].id;

    console.log(
      '✔ Database check confirms doctor ID:',
      testDoctorId,
      'is_active: 0 (Pending Review)'
    );

    // 5. Test Doctor Login While Pending
    console.log('\n5. Testing Doctor Login While Pending:');

    const docLoginPending = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testDoctorEmail,
        password: TEST_FLOW_PASSWORD
      });

    console.log(
      'Doctor Login While Pending Status:',
      docLoginPending.status,
      docLoginPending.body.message
    );

    if (
      docLoginPending.status !== 403 ||
      !docLoginPending.body.message?.includes(
        'pending administrator approval'
      )
    ) {
      throw new Error(
        `Expected 403 with pending approval message, got ${docLoginPending.status} ${JSON.stringify(docLoginPending.body)}`
      );
    }

    console.log(
      '✔ Doctor login blocked with clear pending administrator approval message'
    );

    // 6. Admin Review & Approval
    console.log('\n6. Testing Admin Login and Doctor Approval Workflow:');

    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: TEST_ADMIN_EMAIL,
        password: TEST_ADMIN_PASSWORD
      });

    if (adminLoginRes.status !== 200) {
      throw new Error(
        `Admin login failed: ${JSON.stringify(adminLoginRes.body)}`
      );
    }

    const adminToken = adminLoginRes.body.data.token;

    console.log('✔ Admin logged in successfully');

    // List pending doctors.
    const pendingListRes = await request(app)
      .get('/api/v1/users/pending-doctors')
      .set('Authorization', `Bearer ${adminToken}`);

    console.log(
      'Pending Doctors List Status:',
      pendingListRes.status,
      'Count:',
      pendingListRes.body.data?.length
    );

    const found = pendingListRes.body.data?.find(
      (doctor) => doctor.doctor_id === testDoctorId
    );

    if (!found) {
      throw new Error(
        `Created doctor ID ${testDoctorId} not found in pending list`
      );
    }

    console.log(
      '✔ Doctor found in pending registration list with license:',
      found.license_number,
      'Specialty:',
      found.specialty_name_en
    );

    // Approve doctor.
    const approveRes = await request(app)
      .patch(`/api/v1/users/doctors/${testDoctorId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    console.log(
      'Approve Doctor Status:',
      approveRes.status,
      approveRes.body.message
    );

    if (approveRes.status !== 200 || !approveRes.body.data?.is_active) {
      throw new Error(
        `Failed to approve doctor: ${JSON.stringify(approveRes.body)}`
      );
    }

    console.log('✔ Doctor approved by administrator');

    // 7. Doctor Login After Approval
    console.log(
      '\n7. Testing Doctor Login After Administrator Approval:'
    );

    const docLoginApproved = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testDoctorEmail,
        password: TEST_FLOW_PASSWORD
      });

    console.log('Doctor Login After Approval Status:', docLoginApproved.status);

    if (
      docLoginApproved.status !== 200 ||
      !docLoginApproved.body.data?.token
    ) {
      throw new Error(
        `Doctor login failed after approval: ${JSON.stringify(docLoginApproved.body)}`
      );
    }

    const approvedDocUser = docLoginApproved.body.data.user;

    console.log(
      '✔ Doctor logged in successfully! Role:',
      approvedDocUser.role,
      'Specialty:',
      approvedDocUser.doctor?.specialty_name
    );

    // 8. Test Patient Test Accounts
    console.log('\n8. Testing Patient Test Accounts:');

    const pat1Login = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: TEST_PATIENT_EMAIL,
        password: TEST_PATIENT_PASSWORD
      });

    console.log(
      'First Patient Login Status:',
      pat1Login.status,
      'Role:',
      pat1Login.body.data?.user?.role
    );

    if (pat1Login.status !== 200) {
      throw new Error('Login failed for the first test patient account');
    }

    const pat2Login = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: TEST_SECOND_PATIENT_EMAIL,
        password: TEST_SECOND_PATIENT_PASSWORD
      });

    console.log(
      'Second Patient Login Status:',
      pat2Login.status,
      'Role:',
      pat2Login.body.data?.user?.role
    );

    if (pat2Login.status !== 200) {
      throw new Error('Login failed for the second test patient account');
    }

    const pat2Token = pat2Login.body.data.token;

    // 9. Test Patient Data Isolation
    console.log('\n9. Testing Patient Data Isolation:');

    const patApptsRes = await request(app)
      .get('/api/v1/appointments')
      .set('Authorization', `Bearer ${pat2Token}`);

    console.log(
      'Patient Appointments Status:',
      patApptsRes.status,
      'Total Appointments:',
      patApptsRes.body.data?.length
    );

    if (patApptsRes.status !== 200) {
      throw new Error('Failed to retrieve appointments for patient');
    }

    // Verify each appointment returned belongs to this patient.
    const patient2Id = pat2Login.body.data.user.patient.patient_id;

    for (const appointment of patApptsRes.body.data) {
      if (appointment.patient_id !== patient2Id) {
        throw new Error(
          `Data leak: Patient received appointment for patient_id ${appointment.patient_id} instead of ${patient2Id}`
        );
      }
    }

    console.log(
      '✔ Patient appointments strictly isolated to patient_id:',
      patient2Id
    );

    // Verify patient cannot access another patient's medical history.
    const crossPatientHistory = await request(app)
      .get('/api/v1/records/patient/6')
      .set('Authorization', `Bearer ${pat2Token}`);

    console.log(
      'Cross-Patient Medical History Access Status:',
      crossPatientHistory.status,
      crossPatientHistory.body.message
    );

    if (crossPatientHistory.status !== 403) {
      throw new Error(
        `Expected 403 when accessing another patient medical history, got ${crossPatientHistory.status}`
      );
    }

    console.log(
      '✔ Cross-patient clinical record access forbidden (403)'
    );

    console.log('\n========================================');
    console.log('🎉 ALL REGISTRATION AND AUTHENTICATION TESTS PASSED PERFECTLY!');
    console.log('========================================');
  } catch (err) {
    console.error('\n❌ Test failure:', err.message);
    process.exitCode = 1;
  } finally {
    // Cleanup only records created by this test run.
    try {
      if (testDoctorUserId) {
        await db.query('DELETE FROM doctors WHERE user_id = ?', [
          testDoctorUserId
        ]);

        await db.query('DELETE FROM users WHERE id = ?', [
          testDoctorUserId
        ]);
      }

      const [patU] = await db.query(
        'SELECT id FROM users WHERE email = ?',
        [testPatientEmail]
      );

      if (patU[0]) {
        await db.query('DELETE FROM patients WHERE user_id = ?', [
          patU[0].id
        ]);

        await db.query('DELETE FROM users WHERE id = ?', [
          patU[0].id
        ]);
      }
    } catch (cleanupError) {
      console.error('Test cleanup failed:', cleanupError.message);
      process.exitCode = 1;
    } finally {
      await db.end();
    }
  }
}

runTests();