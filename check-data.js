require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
(async () => {
  // Test dashboard queries as campus_admin (campus_id=1)
  const campusId = 1;
  console.log('--- Testing as campus_id=' + campusId + ' ---');
  
  // Students count
  const r1 = await p.query(`SELECT COUNT(*) as count FROM students s WHERE s.is_active = 1 AND s.campus_id = $1`, [campusId]);
  console.log('Students:', r1.rows[0].count);
  
  // Classes count
  const r2 = await p.query(`SELECT COUNT(*) as count FROM classes c WHERE c.is_active = 1 AND c.campus_id = $1`, [campusId]);
  console.log('Classes:', r2.rows[0].count);
  
  // Teachers count
  const r3 = await p.query(`SELECT COUNT(*) as count FROM users u WHERE u.role = 'teacher' AND u.is_active = 1 AND u.campus_id = $1`, [campusId]);
  console.log('Teachers:', r3.rows[0].count);

  // Test as campus_id=2
  console.log('\n--- Testing as campus_id=2 ---');
  const r4 = await p.query(`SELECT COUNT(*) as count FROM students s WHERE s.is_active = 1 AND s.campus_id = $1`, [2]);
  console.log('Students:', r4.rows[0].count);
  const r5 = await p.query(`SELECT COUNT(*) as count FROM classes c WHERE c.is_active = 1 AND c.campus_id = $1`, [2]);
  console.log('Classes:', r5.rows[0].count);

  // Test attendance
  const today = new Date().toISOString().split('T')[0];
  console.log('\n--- Attendance for campus 1 ---');
  const r6 = await p.query(`SELECT a.status, COUNT(*) as count FROM attendance a JOIN students s ON a.student_id = s.id WHERE a.date = $1 AND s.campus_id = $2 GROUP BY a.status`, [today, campusId]);
  console.log('Attendance:', JSON.stringify(r6.rows));

  // Test feeSummary
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  console.log('\n--- FeeSummary for campus 1, month=' + month + ' year=' + year + ' ---');
  const r7 = await p.query(`SELECT COUNT(*) as total FROM fee_vouchers fv JOIN students s ON fv.student_id = s.id WHERE fv.month = $1 AND fv.year = $2 AND s.campus_id = $3`, [month, year, campusId]);
  console.log('Fee vouchers:', JSON.stringify(r7.rows));

  await p.end();
})();
