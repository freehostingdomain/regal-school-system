require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  // Add gender and designation columns
  await p.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT`);
  await p.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS designation TEXT`);
  console.log('Added gender and designation columns');

  // Update teachers with proper names, gender, designation
  const updates = [
    { id: 2, name: 'Ayesha Khan', gender: 'female', designation: 'Campus Admin' },
    { id: 3, name: 'Hassan Ali', gender: 'male', designation: 'Campus Admin' },
    { id: 4, name: 'Ahmed Raza', gender: 'male', designation: 'Teacher' },
    { id: 5, name: 'Fatima Noor', gender: 'female', designation: 'Teacher' },
    { id: 6, name: 'Imran Shah', gender: 'male', designation: 'Teacher' },
    { id: 7, name: 'Ali Hassan', gender: 'male', designation: 'Accountant' },
    { id: 8, name: 'Tuba Malik', gender: 'female', designation: 'Teacher' },
  ];

  for (const u of updates) {
    await p.query('UPDATE users SET name = $1, gender = $2, designation = $3 WHERE id = $4', [u.name, u.gender, u.designation, u.id]);
    console.log(`Updated user ${u.id}: ${u.name} (${u.gender}, ${u.designation})`);
  }

  await p.end();
})();
