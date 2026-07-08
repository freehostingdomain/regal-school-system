require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  // Check parent user
  const parent = await p.query('SELECT id, user_id FROM parents WHERE user_id = $1', [9]);
  console.log('Parent:', parent.rows);
  
  if (parent.rows.length) {
    // Check children
    const children = await p.query('SELECT id, parent_id, first_name, last_name, class_id FROM students WHERE parent_id = $1', [parent.rows[0].id]);
    console.log('Children:', children.rows);

    // Check attendance for first child
    if (children.rows.length) {
      const childId = children.rows[0].id;
      const attendance = await p.query('SELECT COUNT(*) as cnt FROM attendance WHERE student_id = $1', [childId]);
      console.log(`Attendance for child ${childId}:`, attendance.rows[0].cnt, 'records');
      
      const fees = await p.query('SELECT COUNT(*) as cnt FROM fee_vouchers WHERE student_id = $1', [childId]);
      console.log(`Fees for child ${childId}:`, fees.rows[0].cnt, 'records');
    }
  }

  await p.end();
})();
