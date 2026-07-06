require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  // Create owner_commissions table
  await p.query(`
    CREATE TABLE IF NOT EXISTS owner_commissions (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL,
      campus_id INTEGER NOT NULL,
      student_name TEXT NOT NULL,
      student_code TEXT,
      class_name TEXT,
      admission_fee REAL DEFAULT 0,
      monthly_fee REAL DEFAULT 0,
      commission_rate REAL DEFAULT 15,
      commission_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid','cancelled')),
      paid_date DATE,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (campus_id) REFERENCES campuses(id)
    );
  `);
  console.log('Table created: owner_commissions');

  // Generate commissions for existing students (backfill)
  const students = await p.query(`
    SELECT s.id, s.campus_id, s.first_name, s.last_name, s.student_id as student_code,
           c.name as class_name, c.admission_fee, c.monthly_fee
    FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE s.is_active = 1
  `);

  let created = 0;
  for (const s of students.rows) {
    const exists = await p.query('SELECT id FROM owner_commissions WHERE student_id = $1', [s.id]);
    if (exists.rows.length === 0) {
      const admissionFee = s.admission_fee || 0;
      const commission = Math.round(admissionFee * 0.15 * 100) / 100;
      await p.query(`
        INSERT INTO owner_commissions (student_id, campus_id, student_name, student_code, class_name, admission_fee, monthly_fee, commission_rate, commission_amount)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 15, $8)
      `, [s.id, s.campus_id, `${s.first_name} ${s.last_name}`, s.student_code, s.class_name, admissionFee, s.monthly_fee || 0, commission]);
      created++;
    }
  }
  console.log(`Backfilled ${created} commission records`);

  // Summary
  const summary = await p.query(`
    SELECT 
      COUNT(*) as total,
      COALESCE(SUM(commission_amount), 0) as total_commission,
      COALESCE(SUM(CASE WHEN status='paid' THEN commission_amount ELSE 0 END), 0) as paid,
      COALESCE(SUM(CASE WHEN status='pending' THEN commission_amount ELSE 0 END), 0) as pending
    FROM owner_commissions
  `);
  console.log('Summary:', JSON.stringify(summary.rows[0]));

  await p.end();
})();
