require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  const all = await p.query('SELECT id, name, code, campus_id FROM subjects ORDER BY campus_id, id');
  console.log('All subjects:');
  for (const s of all.rows) {
    console.log(`  #${s.id} ${s.name} (${s.code}) campus=${s.campus_id}`);
  }

  // Check constraints on subjects
  const cons = await p.query(`
    SELECT conname, contype, pg_get_constraintdef(oid) as def
    FROM pg_constraint WHERE conrelid = 'subjects'::regclass
  `);
  console.log('\nConstraints:', JSON.stringify(cons.rows, null, 2));

  await p.end();
})();
