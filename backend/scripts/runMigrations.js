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
 * Supports running against fresh MySQL installations where the database does not yet exist.
 */
async function runMigrations() {
    require("dotenv").config({ path: path.join(__dirname, "../../.env") });

    const host = process.env.DB_HOST || "localhost";
    const port = parseInt(process.env.DB_PORT || "3306", 10);
    const user = process.env.DB_USER || "root";
    const password = process.env.DB_PASSWORD || "";
    const dbName = process.env.DB_NAME || "booking_db";

    let connection;
    try {
        // Connect to MySQL server without initial database to ensure we can create it if missing
        connection = await mysql.createConnection({
            host,
            port,
            user,
            password,
            multipleStatements: true
        });
    } catch (connErr) {
        console.error(`\n✗ MySQL connection failed (${host}:${port}):`, connErr.message);
        throw connErr;
    }

    console.log(`Connected to MySQL server at ${host}:${port}.`);
    console.log(`Ensuring database '${dbName}' exists...`);

    try {
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
        );
        console.log(`✓ Ensured database '${dbName}' exists.`);
    } catch (createErr) {
        if (createErr.code === "ER_DBACCESS_DENIED_ERROR") {
            console.log(`ℹ Notice: User '${user}' lacks CREATE DATABASE privilege; checking access to '${dbName}'...`);
        } else {
            console.error(`✗ Failed to create database '${dbName}':`, createErr.message);
            await connection.end();
            throw createErr;
        }
    }

    try {
        await connection.query(`USE \`${dbName}\`;`);
        console.log(`✓ Connected to database '${dbName}'.\n`);
    } catch (useErr) {
        if (useErr.code === "ER_BAD_DB_ERROR") {
            console.error(`\n✗ Database '${dbName}' does not exist.`);
            console.error("Please create the database first using MySQL Workbench or an administrator account:");
            console.error(`  CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
            console.error(`  GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${user}'@'localhost';`);
            console.error("  FLUSH PRIVILEGES;\n");
        } else {
            console.error(`✗ Failed to select database '${dbName}':`, useErr.message);
        }
        await connection.end();
        throw useErr;
    }

    console.log("Running migrations...\n");

    for (const file of MIGRATION_FILES) {
        const filePath = path.join(MIGRATIONS_DIR, file);

        if (!fs.existsSync(filePath)) {
            console.warn(`  ⚠ File not found, skipping: ${file}\n`);
            continue;
        }

        let sql = fs.readFileSync(filePath, "utf8");

        // Ensure statements run in the configured database, even if SQL contains hardcoded USE statements
        sql = sql.replace(/^\s*USE\s+[^;]+;/gim, `USE \`${dbName}\`;`);

        console.log(`→ ${file}`);

        if (file === "migrations.sql") {
            // Split migration statements to execute and track each independently
            const rawStatements = sql
                .split(/;\s*[\r\n]+/)
                .map((s) => s.trim());

            for (const rawStmt of rawStatements) {
                const cleaned = rawStmt.replace(/\/\*[\s\S]*?\*\/|--.*$/gm, "").trim();
                if (!cleaned || /^USE\s+/i.test(cleaned)) continue;

                try {
                    await connection.query(cleaned);
                } catch (err) {
                    if (
                        err.code === "ER_DUP_FIELDNAME" ||
                        err.code === "ER_TABLE_EXISTS_ERROR" ||
                        err.code === "ER_DUP_ENTRY" ||
                        err.code === "ER_DUP_KEYNAME" ||
                        (err.code === "ER_BAD_FIELD_ERROR" && cleaned.includes("full_name"))
                    ) {
                        continue;
                    }
                    console.error(`  ✗ Statement failed: ${err.message}\nSQL: ${cleaned}\n`);
                    await connection.end();
                    throw err;
                }
            }
            console.log(`  ✓ Done\n`);
            continue;
        }

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
            await connection.end();
            throw err;
        }
    }

    await connection.end();
    console.log("All migrations completed successfully.");
}

runMigrations().catch((err) => {
    console.error("Migration failed:", err.message);
    process.exit(1);
});
