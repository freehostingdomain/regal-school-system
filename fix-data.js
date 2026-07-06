require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
(async () => {
  // Set accountant campus_id to NULL so they see all campuses
  await p.query(`UPDATE users SET campus_id = NULL WHERE role = 'accountant'`);
  console.log('Accountant campus_id set to NULL');
  
  // Verify
  const r = await p.query(`SELECT id,name,role,campus_id FROM users WHERE role = 'accountant'`);
  console.log('Accountant:', JSON.stringify(r.rows));
  await p.end();
})();
