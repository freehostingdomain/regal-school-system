require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  // Exams table
  await p.query(`
    CREATE TABLE IF NOT EXISTS exams (
      id SERIAL PRIMARY KEY,
      campus_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'midterm' CHECK(type IN ('midterm','final','quiz','assignment','other')),
      total_marks INTEGER DEFAULT 100,
      passing_marks INTEGER DEFAULT 40,
      start_date DATE,
      end_date DATE,
      status TEXT DEFAULT 'upcoming' CHECK(status IN ('upcoming','ongoing','completed','cancelled')),
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (campus_id) REFERENCES campuses(id),
      FOREIGN KEY (class_id) REFERENCES classes(id)
    );
  `);
  console.log('Table created: exams');

  // Exam subjects
  await p.query(`
    CREATE TABLE IF NOT EXISTS exam_subjects (
      id SERIAL PRIMARY KEY,
      exam_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      max_marks INTEGER DEFAULT 100,
      passing_marks INTEGER DEFAULT 40,
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id)
    );
  `);
  console.log('Table created: exam_subjects');

  // Results / Marks
  await p.query(`
    CREATE TABLE IF NOT EXISTS results (
      id SERIAL PRIMARY KEY,
      exam_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      marks_obtained REAL DEFAULT 0,
      grade TEXT,
      remarks TEXT,
      entered_by INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(exam_id, student_id, subject_id),
      FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      FOREIGN KEY (entered_by) REFERENCES users(id)
    );
  `);
  console.log('Table created: results');

  // Check if subjects exist, if not create some
  const subCount = await p.query('SELECT COUNT(*) as c FROM subjects');
  if (parseInt(subCount.rows[0].c) === 0) {
    await p.query(`
      INSERT INTO subjects (name, code, campus_id) VALUES
      ('English', 'ENG', 1), ('Mathematics', 'MATH', 1), ('Urdu', 'URD', 1),
      ('Science', 'SCI', 1), ('Social Studies', 'SST', 1), ('Islamiat', 'ISL', 1),
      ('Computer', 'COMP', 1), ('Physics', 'PHY', 2), ('Chemistry', 'CHEM', 2),
      ('Biology', 'BIO', 2), ('Mathematics', 'MATH', 2), ('English', 'ENG', 2),
      ('Urdu', 'URD', 2), ('Pakistan Studies', 'PAK', 2)
    `);
    console.log('Seed subjects created');
  } else {
    console.log('Subjects already exist');
  }

  console.log('All exam/results tables created!');
  await p.end();
})();
