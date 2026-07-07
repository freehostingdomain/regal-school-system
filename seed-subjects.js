require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  // Drop the unique constraint on code so we can have same subject per campus
  await p.query('ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_code_key');
  console.log('Dropped unique constraint on code');

  // Clear existing and re-seed
  await p.query('DELETE FROM subjects');
  await p.query('ALTER SEQUENCE subjects_id_seq RESTART WITH 1');

  const subjects = [
    { name: 'English', code: 'ENG' },
    { name: 'Mathematics', code: 'MATH' },
    { name: 'Urdu', code: 'URD' },
    { name: 'Science', code: 'SCI' },
    { name: 'Social Studies', code: 'SST' },
    { name: 'Islamiat', code: 'ISL' },
    { name: 'Computer', code: 'COMP' },
    { name: 'Physics', code: 'PHY' },
    { name: 'Chemistry', code: 'CHEM' },
    { name: 'Biology', code: 'BIO' },
    { name: 'Pakistan Studies', code: 'PST' },
  ];

  for (const sub of subjects) {
    await p.query('INSERT INTO subjects (name, code, campus_id, type) VALUES ($1, $2, 1, $3)', [sub.name, sub.code, 'compulsory']);
    await p.query('INSERT INTO subjects (name, code, campus_id, type) VALUES ($1, $2, 2, $3)', [sub.name, sub.code, 'compulsory']);
  }

  const count = await p.query('SELECT COUNT(*) FROM subjects');
  console.log('Total subjects:', count.rows[0].count);

  // Add campus 2 subjects to exam #2
  const campus2Subs = await p.query('SELECT id, name FROM subjects WHERE campus_id = 2 ORDER BY id');
  for (const sub of campus2Subs.rows) {
    await p.query(`
      INSERT INTO exam_subjects (exam_id, subject_id, max_marks, passing_marks)
      VALUES (2, $1, 100, 40) ON CONFLICT DO NOTHING
    `, [sub.id]);
  }

  const esCount = await p.query('SELECT COUNT(*) FROM exam_subjects WHERE exam_id = 2');
  console.log('Exam #2 subjects:', esCount.rows[0].count);

  await p.end();
})();
