require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function testDashboard(campusId, label) {
  try {
    const pool = p;
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const effectiveCampusId = campusId || null;

    function campusSql(alias) {
      if (!effectiveCampusId) return { clause: '', params: [] };
      return { clause: ` AND ${alias}.campus_id = $1`, params: [effectiveCampusId] };
    }
    const sc = campusSql('s');
    const cc = campusSql('c');
    const uc = campusSql('u');

    const students = (await pool.query(`SELECT COUNT(*) as count FROM students s WHERE s.is_active = 1${sc.clause}`, sc.params)).rows[0].count;
    const classes = (await pool.query(`SELECT COUNT(*) as count FROM classes c WHERE c.is_active = 1${cc.clause}`, cc.params)).rows[0].count;
    const teachers = (await pool.query(`SELECT COUNT(*) as count FROM users u WHERE u.role = 'teacher' AND u.is_active = 1${uc.clause}`, uc.params)).rows[0].count;

    console.log(`[${label}] Students: ${students}, Classes: ${classes}, Teachers: ${teachers}`);
  } catch (e) {
    console.error(`[${label}] ERROR:`, e.message);
  }
}

(async () => {
  await testDashboard(null, 'Super Admin / Accountant (All)');
  await testDashboard(1, 'Campus 1 (Khanpur)');
  await testDashboard(2, 'Campus 2 (UET)');
  await p.end();
})();
