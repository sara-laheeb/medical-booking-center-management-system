const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const MIGRATIONS_DIR = path.join(__dirname, "../../database");

// Active database schema and migration files in execution order
const MIGRATION_FILES = [
    "002 medical center schema.sql",
    "migrations.sql"
];

/**
 * Execute SQL migration files sequentially against the configured database.
 */
async function runMigrations() {
    require("dotenv").config({ path: path.join(__dirname, "../../.env") });

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    console.log("Running migrations...\n");

    for (const file of MIGRATION_FILES) {
        const filePath = path.join(MIGRATIONS_DIR, file);

        if (!fs.existsSync(filePath)) {
            console.warn(`  ⚠ File not found, skipping: ${file}\n`);
            continue;
        }

        const sql = fs.readFileSync(filePath, "utf8");

        console.log(`→ ${file}`);

        try {
            await connection.query(sql);
            console.log(`  ✓ Done\n`);
        } catch (err) {
            if (
                err.code === "ER_DUP_FIELDNAME" ||
                err.code === "ER_TABLE_EXISTS_ERROR" ||
                err.code === "ER_DUP_ENTRY" ||
                err.code === "ER_DUP_KEYNAME"
            ) {
                console.log(`  ⚠ Skipped (already applied)\n`);
                continue;
            }

            console.error(`  ✗ Failed: ${err.message}\n`);
            throw err;
        }
    }

    await connection.end();
    console.log("All migrations completed.");
}

runMigrations().catch((err) => {
    console.error("Migration failed:", err.message);
    process.exit(1);
});
