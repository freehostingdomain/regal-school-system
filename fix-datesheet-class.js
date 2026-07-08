require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  // Add class_id column
  await p.query(`ALTER TABLE exam_datesheets ADD COLUMN IF NOT EXISTS class_id INTEGER REFERENCES classes(id)`);
  console.log('Added class_id column');

  // Drop old UNIQUE constraint and add new one with class_id
  await p.query(`ALTER TABLE exam_datesheets DROP CONSTRAINT IF EXISTS exam_datesheets_exam_id_subject_id_key`);
  await p.query(`ALTER TABLE exam_datesheets ADD CONSTRAINT exam_datesheets_exam_subject_class UNIQUE(exam_id, subject_id, class_id)`);
  console.log('Updated UNIQUE constraint');

  await p.end();
})();
