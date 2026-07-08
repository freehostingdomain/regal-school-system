require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  // Staff Attendance table
  await p.query(`
    CREATE TABLE IF NOT EXISTS staff_attendance (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      date DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','late','leave')),
      check_in_time TEXT,
      check_out_time TEXT,
      notes TEXT,
      marked_by INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, date)
    )
  `);
  console.log('Created staff_attendance table');

  // Staff Leaves table
  await p.query(`
    CREATE TABLE IF NOT EXISTS staff_leaves (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      leave_type TEXT NOT NULL DEFAULT 'casual' CHECK (leave_type IN ('casual','sick','earned','maternity','paternity','unpaid','other')),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
      approved_by INTEGER REFERENCES users(id),
      admin_remarks TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('Created staff_leaves table');

  // Add leave_balance column to users
  await p.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS casual_leaves INTEGER DEFAULT 12`);
  await p.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS sick_leaves INTEGER DEFAULT 8`);
  await p.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS earned_leaves INTEGER DEFAULT 0`);
  console.log('Added leave balance columns to users');

  await p.end();
})();
