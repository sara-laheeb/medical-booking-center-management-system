const { test, before } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const db = require("../config/database");
const app = require("../app");

let schemaReady = false;

// Skip DB-dependent tests when migrations have not been applied
before(async () => {
    try {
        const [tables] = await db.query("SHOW TABLES LIKE 'resources'");
        const [columns] = await db.query("SHOW COLUMNS FROM bookings LIKE 'resource_id'");
        schemaReady = tables.length > 0 && columns.length > 0;
    } catch {
        schemaReady = false;
    }
});

const dbTest = (name, fn) => {
    test(name, async (t) => {
        if (!schemaReady) {
            t.skip("Database upgrade required — run database/ADMIN_upgrade.sql");
            return;
        }

        await fn(t);
    });
};

// API integration tests
test("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
});

dbTest("GET /api/v1/resources returns list", async () => {
    const res = await request(app).get("/api/v1/resources");

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
});

test("POST /api/v1/bookings validates required fields", async () => {
    const res = await request(app)
        .post("/api/v1/bookings")
        .send({ name: "X" });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
});

dbTest("booking CRUD flow", async () => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    const booking_date = future.toISOString().substring(0, 10);

    const createRes = await request(app)
        .post("/api/v1/bookings")
        .send({
            name: "Test User",
            email: "test@example.com",
            resource_id: 1,
            booking_date,
            start_time: "08:00",
            end_time: "09:00",
            notes: "Automated test"
        });

    assert.equal(createRes.status, 201);
    const bookingId = createRes.body.data.id;

    const getRes = await request(app).get(`/api/v1/bookings/${bookingId}`);
    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.data.id, bookingId);

    const updateRes = await request(app)
        .put(`/api/v1/bookings/${bookingId}`)
        .send({ status: "confirmed" });

    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.status, "confirmed");

    const deleteRes = await request(app).delete(`/api/v1/bookings/${bookingId}`);
    assert.equal(deleteRes.status, 200);

    const goneRes = await request(app).get(`/api/v1/bookings/${bookingId}`);
    assert.equal(goneRes.status, 404);
});

test("GET unknown API route returns 404 JSON", async () => {
    const res = await request(app).get("/api/v1/unknown-route");

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
});
