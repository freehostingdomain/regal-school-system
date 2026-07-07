require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  // Add live toggle columns
  const cols = await p.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'exams' AND column_name IN ('is_datesheet_live', 'is_results_live')
  `);
  
  for (const col of ['is_datesheet_live', 'is_results_live']) {
    const exists = cols.rows.find(c => c.column_name === col);
    if (!exists) {
      await p.query(`ALTER TABLE exams ADD COLUMN ${col} INTEGER DEFAULT 0`);
      console.log(`Added column: ${col}`);
    } else {
      console.log(`Column exists: ${col}`);
    }
  }

  // Set existing exam as live datesheet and results for testing
  await p.query('UPDATE exams SET is_datesheet_live = 1, is_results_live = 1 WHERE is_active = 1');
  console.log('Updated existing exams to live');

  await p.end();
})();
