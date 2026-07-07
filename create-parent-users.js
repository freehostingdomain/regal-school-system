require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  const hash = await bcrypt.hash('parent123', 10);

  // Get parents with their linked students
  const parents = await p.query(`
    SELECT p.id as parent_id, p.name, p.email, p.phone_primary, 
           s.id as student_id, s.first_name, s.last_name, s.student_id as student_code
    FROM parents p
    LEFT JOIN students s ON s.parent_id = p.id
    ORDER BY p.id, s.id
  `);

  console.log('Parents and their students:');
  const parentMap = {};
  for (const row of parents.rows) {
    if (!parentMap[row.parent_id]) {
      parentMap[row.parent_id] = { name: row.name, email: row.email, children: [] };
    }
    if (row.student_id) {
      parentMap[row.parent_id].children.push(`${row.first_name} ${row.last_name} (${row.student_code})`);
    }
  }
  for (const [pid, info] of Object.entries(parentMap)) {
    console.log(`  Parent #${pid} ${info.name} (${info.email}) - Children: ${info.children.join(', ') || 'none'}`);
  }

  // Create user accounts for parents who don't have one
  for (const row of parents.rows) {
    if (!row.email) {
      console.log(`Skipping parent ${row.name} - no email`);
      continue;
    }

    const existing = await p.query('SELECT id FROM users WHERE email = $1', [row.email]);
    if (existing.rows.length > 0) {
      console.log(`User already exists for ${row.name} (${row.email})`);
      continue;
    }

    const result = await p.query(`
      INSERT INTO users (email, password, name, role, campus_id, is_active)
      VALUES ($1, $2, $3, 'parent', 1, 1) RETURNING id
    `, [row.email, hash, row.name]);

    const userId = result.rows[0].id;
    await p.query('UPDATE parents SET user_id = $1 WHERE id = $2', [userId, row.parent_id]);
    console.log(`Created user for ${row.name} (${row.email}) - user_id=${userId}`);
  }

  console.log('\nLogin credentials for all parents:');
  console.log('Password: parent123');
  
  await p.end();
})();
