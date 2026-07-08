require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  const cols = await p.query("SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position");
  console.log('Users columns:', cols.rows.map(x => x.column_name).join(', '));
  
  const r = await p.query(`
    SELECT u.id, u.name, u.email, u.role, u.campus_id, c.name as campus_name
    FROM users u
    LEFT JOIN campuses c ON u.campus_id = c.id
    WHERE u.role IN ('teacher','campus_admin','accountant') AND u.is_active = 1
    ORDER BY u.campus_id, u.name
  `);
  r.rows.forEach(t => console.log(`${t.id} | ${t.name} | ${t.email} | Campus: ${t.campus_id} (${t.campus_name})`));
  console.log('Total staff:', r.rows.length);
  await p.end();
})();
