require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  // Test create exam
  const result = await p.query(`
    INSERT INTO exams (campus_id, class_id, name, type, total_marks, passing_marks, start_date, end_date)
    VALUES (1, 1, 'Test Exam', 'midterm', 100, 40, '2026-07-10', '2026-07-15') RETURNING *
  `);
  console.log('Created exam:', JSON.stringify(result.rows[0]));
  
  // Delete test exam
  await p.query('DELETE FROM exams WHERE name = $1', ['Test Exam']);
  console.log('Cleaned up test exam');
  
  await p.end();
})();
