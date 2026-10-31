/**
 * Server Entry Point
 * Initializes environment variables, verifies database schema readiness,
 * and launches the Express HTTP server.
 */

const path = require("path");

// Load environment variables before starting the server
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const db = require("./config/database");
const app = require("./app");

const PORT = process.env.PORT || 3000;

// Verify that the main medical schema exists
async function verifySchema() {
    try {
        const [patientsTable] = await db.query("SHOW TABLES LIKE 'patients'");
        const [appointmentsTable] = await db.query("SHOW TABLES LIKE 'appointments'");

        if (patientsTable.length === 0 || appointmentsTable.length === 0) {
            console.warn("\n⚠ Database schema is incomplete!");
            console.warn("Please run the Medical Center schema before starting the server.\n");
        }
    } catch (err) {
        console.error("Schema check failed:", err.message);
    }
}

const reminderService = require("./services/reminderService");

let server = null;
let initialReminderTimer = null;
let recurringReminderTimer = null;

// Start HTTP server
verifySchema().then(() => {
    server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} 🚀`);
        console.log(`Frontend: http://localhost:${PORT}`);
        console.log(`API Base: http://localhost:${PORT}/api/v1`);

        // Initialize 48-hour automated reminder background scheduler
        initialReminderTimer = setTimeout(() => {
            reminderService.checkAndSend48hReminders().catch((err) => {
                console.error("[ReminderScheduler] Initial scan error:", err.message);
            });
        }, 5000);

        recurringReminderTimer = setInterval(() => {
            reminderService.checkAndSend48hReminders().catch((err) => {
                console.error("[ReminderScheduler] Recurring scan error:", err.message);
            });
        }, 6 * 60 * 60 * 1000);
    });
});

// Graceful shutdown handling
function handleGracefulShutdown(signal) {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    if (initialReminderTimer) clearTimeout(initialReminderTimer);
    if (recurringReminderTimer) clearInterval(recurringReminderTimer);

    if (server) {
        server.close(() => {
            console.log("HTTP server closed.");
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
}

process.on("SIGINT", () => handleGracefulShutdown("SIGINT"));
process.on("SIGTERM", () => handleGracefulShutdown("SIGTERM"));