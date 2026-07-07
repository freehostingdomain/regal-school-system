require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  const result = await p.query('DELETE FROM owner_commissions');
  console.log(`Deleted ${result.rowCount} old commission records`);
  
  const check = await p.query('SELECT COUNT(*) as count FROM owner_commissions');
  console.log(`Remaining: ${check.rows[0].count}`);
  
  await p.end();
})();
