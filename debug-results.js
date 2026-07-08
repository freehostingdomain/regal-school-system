require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  // Parent ke bacche
  const parent = await p.query('SELECT id FROM parents WHERE user_id = $1', [9]);
  if (parent.rows.length) {
    const children = await p.query(`
      SELECT s.id, s.first_name, s.class_id, c.name as class_name 
      FROM students s 
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.parent_id = $1
    `, [parent.rows[0].id]);
    console.log('Parent children:');
    for (const c of children.rows) {
      console.log(`  ${c.first_name} - class_id=${c.class_id} (${c.class_name})`);
    }
  }

  // Exams
  const exams = await p.query(`
    SELECT e.id, e.name, e.class_id, c.name as class_name, e.is_results_live 
    FROM exams e 
    LEFT JOIN classes c ON e.class_id = c.id
    WHERE e.is_active = 1
  `);
  console.log('\nExams:');
  for (const e of exams.rows) {
    console.log(`  #${e.id} ${e.name} - class_id=${e.class_id} (${e.class_name}) results_live=${e.is_results_live}`);
  }

  // Results for exam #2
  const results = await p.query(`
    SELECT r.*, s.first_name, s.class_id 
    FROM results r 
    JOIN students s ON r.student_id = s.id 
    WHERE r.exam_id = 2
  `);
  console.log('\nResults for exam #2:');
  for (const r of results.rows) {
    console.log(`  Student ${r.first_name} (class_id=${r.class_id}): marks=${r.marks_obtained}`);
  }

  await p.end();
})();
