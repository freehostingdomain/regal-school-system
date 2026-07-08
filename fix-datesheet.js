require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  // Create exam_datesheets table
  await p.query(`
    CREATE TABLE IF NOT EXISTS exam_datesheets (
      id SERIAL PRIMARY KEY,
      exam_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      exam_date DATE NOT NULL,
      start_time TEXT DEFAULT '09:00',
      end_time TEXT DEFAULT '12:00',
      room_number TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      UNIQUE(exam_id, subject_id)
    )
  `);
  console.log('Created exam_datesheets table');

  await p.end();
})();
