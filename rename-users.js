require('dotenv').config();
const { Pool } = require('pg');

async function renameUsers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pool.query(`UPDATE users SET name = 'Campus Admin' WHERE email = 'khanpur.admin@regal.school'`);
    console.log('Renamed khanpur.admin@regal.school → Campus Admin');

    await pool.query(`UPDATE users SET name = 'Campus Admin' WHERE email = 'uet.admin@regal.school'`);
    console.log('Renamed uet.admin@regal.school → Campus Admin');

    await pool.query(`UPDATE users SET name = 'Teacher' WHERE email = 'ahmed@regal.school'`);
    console.log('Renamed ahmed@regal.school → Teacher');

    await pool.query(`UPDATE users SET name = 'Teacher' WHERE email = 'fatima@regal.school'`);
    console.log('Renamed fatima@regal.school → Teacher');

    await pool.query(`UPDATE users SET name = 'Teacher' WHERE email = 'imran@regal.school'`);
    console.log('Renamed imran@regal.school → Teacher');

    await pool.query(`UPDATE users SET name = 'Accountant' WHERE email = 'ali@regal.school'`);
    console.log('Renamed ali@regal.school → Accountant');

    console.log('\nAll users renamed successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

renameUsers();
