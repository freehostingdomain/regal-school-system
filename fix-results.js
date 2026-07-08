require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  // Check constraints on results table
  const cons = await p.query(`
    SELECT conname, pg_get_constraintdef(oid) as def
    FROM pg_constraint WHERE conrelid = 'results'::regclass
  `);
  console.log('Results constraints:', JSON.stringify(cons.rows, null, 2));

  // Add unique constraint if missing
  const hasUnique = cons.rows.find(c => c.def.includes('exam_id') && c.def.includes('student_id') && c.def.includes('subject_id'));
  if (!hasUnique) {
    await p.query('ALTER TABLE results ADD CONSTRAINT results_exam_student_subject_unique UNIQUE (exam_id, student_id, subject_id)');
    console.log('Added UNIQUE constraint on (exam_id, student_id, subject_id)');
  } else {
    console.log('UNIQUE constraint already exists');
  }

  await p.end();
})();
