const path = require("path");

// Load environment variables before starting the server
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const db = require("./config/db");
const app = require("./app");

const PORT = process.env.PORT || 3000;

// Verify that the database schema has been upgraded
async function verifySchema() {
    try {
        const [resourceTable] = await db.query("SHOW TABLES LIKE 'resources'");
        const [resourceColumn] = await db.query("SHOW COLUMNS FROM bookings LIKE 'resource_id'");

        if (resourceTable.length === 0 || resourceColumn.length === 0) {
            console.warn("\n⚠  Database upgrade required!");
            console.warn("   Run database/ADMIN_upgrade.sql as MySQL admin, then restart.\n");
        }
    } catch (err) {
        console.error("Schema check failed:", err.message);
    }
}

// Start HTTP server
verifySchema().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} 🚀`);
        console.log(`Frontend: http://localhost:${PORT}`);
        console.log(`API:      http://localhost:${PORT}/api/v1/bookings`);
    });
});
