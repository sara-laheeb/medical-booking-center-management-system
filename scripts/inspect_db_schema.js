'use strict';

require('dotenv').config();
const db = require('../backend/config/database');

async function main() {
  try {
    const [tables] = await db.query('SHOW TABLES');
    console.log('Tables:', tables.map(t => Object.values(t)[0]));

    for (const t of ['appointments', 'doctors', 'patients', 'notifications', 'specialties']) {
      try {
        const [cols] = await db.query(`DESCRIBE ${t}`);
        console.log(`\nColumns for ${t}:`);
        console.table(cols.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null, Key: c.Key, Default: c.Default })));
      } catch (err) {
        console.log(`\nTable ${t} does not exist or error:`, err.message);
      }
    }
  } catch (err) {
    console.error('Inspection error:', err);
  } finally {
    await db.end();
  }
}

main();
