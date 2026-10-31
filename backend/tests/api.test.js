'use strict';

/**
 * Medical Booking & Center Management System - API Integration Tests
 * Tests core server endpoints, OpenAPI specification, authentication validation,
 * and protected route authorization guards.
 */

const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const path = require('path');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const db = require('../config/database');
const app = require('../app');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';
const makeToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
const adminToken = makeToken({ id: 1, email: 'admin@medicare.com', role: 'admin' });
const doctorToken = makeToken({ id: 2, email: 'doctor@medicare.com', role: 'doctor' });
const receptionistToken = makeToken({ id: 3, email: 'receptionist@medicare.com', role: 'receptionist' });
const patientToken = makeToken({ id: 4, email: 'patient@medicare.com', role: 'patient' });
const pharmacistToken = makeToken({ id: 24, email: 'pharmacist@medicare.local', role: 'pharmacist' });

after(async () => {
  try {
    await db.end();
  } catch {
    // Ignore pool shutdown error
  }
});

describe('System & Health API', () => {
  test('GET /api/health returns ok status', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'ok');
    assert.ok(res.body.data.timestamp);
  });

  test('GET /api-docs.json returns valid OpenAPI specification', async () => {
    const res = await request(app).get('/api-docs.json');
    assert.equal(res.status, 200);
    assert.equal(res.body.openapi, '3.0.0');
    assert.ok(res.body.info);
    assert.ok(res.body.paths);
    assert.ok(Object.keys(res.body.paths).length >= 40);
  });

  test('GET /api/v1/non-existent-route returns 404 JSON', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });
});

describe('Authentication & Validation API', () => {
  test('POST /api/v1/auth/login validates required fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: '' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  test('POST /api/v1/auth/login rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'wrongpassword123'
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('POST /api/v1/auth/register validates required password length', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test',
        email: 'test@example.com',
        password: '123'
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  test('POST /api/v1/auth/login verifies role & JWT payload for all five roles', async () => {
    const roleAccounts = [
      { email: 'admin@test.com', password: 'sara1234', expectedRole: 'admin' },
      { email: 'doctor.radiology@medicare.local', password: 'sara1234', expectedRole: 'doctor' },
      { email: 'receptionist.test@medicare.local', password: 'sara1234', expectedRole: 'receptionist' },
      { email: 'pharmacist@medicare.local', password: 'sara1234', expectedRole: 'pharmacist' },
      { email: 'patient.test@medicare.local', password: 'sara1234', expectedRole: 'patient' }
    ];

    for (const acc of roleAccounts) {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: acc.email, password: acc.password });

      assert.equal(res.status, 200, `Login failed for ${acc.email}`);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.user.role, acc.expectedRole, `user.role mismatch for ${acc.email}`);
      assert.ok(res.body.data.token);

      const decoded = jwt.decode(res.body.data.token);
      assert.equal(decoded.role, acc.expectedRole, `JWT decoded role mismatch for ${acc.email}`);
      assert.equal(decoded.email, acc.email);
    }
  });
});

describe('Security & Protected Routes Authorization', () => {
  test('GET /api/v1/patients rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/patients');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('GET /api/v1/appointments rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/appointments');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('GET /api/v1/records rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/records');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('GET /api/v1/medications rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/medications');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('GET /api/v1/invoices rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/invoices');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('GET /api/v1/dashboard/overview rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/dashboard/overview');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('GET /api/v1/dashboard/my-summary rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/dashboard/my-summary');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('GET /api/v1/users rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/users');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('GET /api/v1/financial/expenses rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/financial/expenses');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('GET /api/v1/financial/summary rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/financial/summary');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });
});

describe('Role-Based Access Control & Security Guards', () => {
  test('Doctor token cannot access manager expenses endpoint (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/financial/expenses')
      .set('Authorization', `Bearer ${doctorToken}`);
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  test('Doctor token cannot access manager financial summary endpoint (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/financial/summary')
      .set('Authorization', `Bearer ${doctorToken}`);
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  test('Doctor token cannot access user account permissions endpoint (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${doctorToken}`);
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  test('Receptionist token cannot access manager expenses endpoint (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/financial/expenses')
      .set('Authorization', `Bearer ${receptionistToken}`);
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  test('Receptionist token cannot access manager financial summary endpoint (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/financial/summary')
      .set('Authorization', `Bearer ${receptionistToken}`);
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  test('Receptionist token cannot access user permissions endpoint (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${receptionistToken}`);
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  test('Receptionist token cannot access doctor personal summary endpoint (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/my-summary')
      .set('Authorization', `Bearer ${receptionistToken}`);
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  test('Patient token cannot access doctor personal summary endpoint (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/my-summary')
      .set('Authorization', `Bearer ${patientToken}`);
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  test('Admin manager token can access users management endpoint (200 OK)', async () => {
    const res = await request(app)
      .get('/api/v1/users?limit=5')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  test('Pharmacist token cannot access manager expenses endpoint (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/financial/expenses')
      .set('Authorization', `Bearer ${pharmacistToken}`);
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  test('Pharmacist token cannot access doctor personal summary endpoint (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/my-summary')
      .set('Authorization', `Bearer ${pharmacistToken}`);
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  test('Pharmacist token cannot access user permissions endpoint (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${pharmacistToken}`);
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  test('Patient token cannot access pharmacy stats endpoint (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/pharmacy/stats')
      .set('Authorization', `Bearer ${patientToken}`);
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  test('Patient token cannot access manager expenses endpoint (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/financial/expenses')
      .set('Authorization', `Bearer ${patientToken}`);
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  test('Patient token cannot access user management endpoint (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${patientToken}`);
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  test('Doctor token cannot access pharmacy stats endpoint (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/pharmacy/stats')
      .set('Authorization', `Bearer ${doctorToken}`);
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  test('Receptionist token cannot access pharmacy stats endpoint (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/pharmacy/stats')
      .set('Authorization', `Bearer ${receptionistToken}`);
    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });
});

describe('Pharmacy Management & Dispensary Module', () => {
  test('POST /api/v1/auth/login authenticates test pharmacist account successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'pharmacist@medicare.local',
        password: 'sara1234'
      });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.role, 'pharmacist');
    assert.ok(res.body.data.token);
  });

  test('GET /api/v1/medications returns medications enriched with pharmaceutical metadata', async () => {
    const res = await request(app)
      .get('/api/v1/medications?limit=10')
      .set('Authorization', `Bearer ${pharmacistToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    if (res.body.data.length > 0) {
      const item = res.body.data[0];
      assert.ok('generic_name' in item);
      assert.ok('strength' in item);
      assert.ok('dosage_form' in item);
      assert.ok('batch_number' in item);
      assert.ok('expiry_date' in item);
      assert.ok('supplier' in item);
    }
  });

  test('GET /api/v1/pharmacy/stats returns live pharmacy statistics and KPIs', async () => {
    const res = await request(app)
      .get('/api/v1/pharmacy/stats')
      .set('Authorization', `Bearer ${pharmacistToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok('totalMedicines' in res.body.data);
    assert.ok('lowStockCount' in res.body.data);
    assert.ok('outOfStockCount' in res.body.data);
    assert.ok('expiringCount' in res.body.data);
    assert.ok('totalInventoryValue' in res.body.data);
  });

  test('GET /api/v1/pharmacy/transactions returns stock audit transaction history', async () => {
    const res = await request(app)
      .get('/api/v1/pharmacy/transactions?limit=5')
      .set('Authorization', `Bearer ${pharmacistToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  test('GET /api/v1/pharmacy/suppliers returns registered pharmaceutical suppliers', async () => {
    const res = await request(app)
      .get('/api/v1/pharmacy/suppliers')
      .set('Authorization', `Bearer ${pharmacistToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 1);
  });
});
