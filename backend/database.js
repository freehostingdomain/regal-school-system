const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'regal_school.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDatabase() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS campuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      address TEXT NOT NULL,
      city TEXT DEFAULT 'Taxila',
      phone TEXT,
      opening_time TEXT DEFAULT '08:00',
      closing_time TEXT DEFAULT '13:00',
      friday_closing TEXT DEFAULT '12:30',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campus_id INTEGER,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('super_admin','campus_admin','teacher','accountant','parent','student')),
      is_active INTEGER DEFAULT 1,
      avatar_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (campus_id) REFERENCES campuses(id)
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campus_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      level TEXT CHECK(level IN ('montessori','primary','middle','high','college')),
      monthly_fee REAL DEFAULT 0,
      admission_fee REAL DEFAULT 0,
      exam_fee REAL DEFAULT 0,
      max_students INTEGER DEFAULT 40,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (campus_id) REFERENCES campuses(id)
    );

    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      teacher_id INTEGER,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (teacher_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS parents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      cnic TEXT,
      phone_primary TEXT NOT NULL,
      phone_secondary TEXT,
      email TEXT,
      address TEXT,
      occupation TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT UNIQUE NOT NULL,
      campus_id INTEGER NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      father_name TEXT NOT NULL,
      father_cnic TEXT,
      b_form_number TEXT,
      date_of_birth TEXT,
      gender TEXT CHECK(gender IN ('male','female')),
      blood_group TEXT,
      address TEXT,
      city TEXT DEFAULT 'Taxila',
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      emergency_contact_relation TEXT,
      medical_conditions TEXT,
      admission_date TEXT NOT NULL,
      class_id INTEGER,
      section_id INTEGER,
      parent_id INTEGER,
      previous_school TEXT,
      student_photo_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (campus_id) REFERENCES campuses(id),
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (section_id) REFERENCES sections(id),
      FOREIGN KEY (parent_id) REFERENCES parents(id)
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campus_id INTEGER NOT NULL,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('compulsory','elective','activity')),
      total_marks INTEGER DEFAULT 100,
      passing_marks INTEGER DEFAULT 40,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (campus_id) REFERENCES campuses(id)
    );

    CREATE TABLE IF NOT EXISTS class_subjects (
      class_id INTEGER,
      subject_id INTEGER,
      teacher_id INTEGER,
      PRIMARY KEY (class_id, subject_id),
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      FOREIGN KEY (teacher_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT CHECK(status IN ('present','late','absent','half_day','excused','holiday')),
      check_in_time TEXT,
      remarks TEXT,
      marked_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (marked_by) REFERENCES users(id),
      UNIQUE(student_id, date)
    );

    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campus_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('monthly','midterm','final','board_prep')),
      class_id INTEGER,
      start_date TEXT,
      end_date TEXT,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','published','completed')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (campus_id) REFERENCES campuses(id),
      FOREIGN KEY (class_id) REFERENCES classes(id)
    );

    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      subject_id INTEGER,
      marks_obtained REAL,
      total_marks REAL DEFAULT 100,
      grade TEXT,
      gpa REAL,
      remarks TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (exam_id) REFERENCES exams(id),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id)
    );

    CREATE TABLE IF NOT EXISTS fee_structures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      tuition_fee REAL DEFAULT 0,
      exam_fee REAL DEFAULT 0,
      transport_fee REAL DEFAULT 0,
      lab_fee REAL DEFAULT 0,
      activity_fee REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (class_id) REFERENCES classes(id)
    );

    CREATE TABLE IF NOT EXISTS fee_vouchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      voucher_number TEXT UNIQUE NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      tuition_fee REAL DEFAULT 0,
      exam_fee REAL DEFAULT 0,
      transport_fee REAL DEFAULT 0,
      other_charges REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      fine REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','partial','paid','overdue')),
      due_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS fee_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT CHECK(payment_method IN ('cash','bank_transfer','jazzcash','easypaisa','other')),
      transaction_id TEXT,
      received_by INTEGER,
      payment_date TEXT DEFAULT (date('now')),
      receipt_number TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (voucher_id) REFERENCES fee_vouchers(id),
      FOREIGN KEY (received_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campus_id INTEGER,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT CHECK(type IN ('general','urgent','event','holiday')),
      target_role TEXT DEFAULT 'all',
      created_by INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (campus_id) REFERENCES campuses(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      capacity INTEGER DEFAULT 30,
      driver_name TEXT,
      driver_phone TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transport_routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      vehicle_id INTEGER,
      fare REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS transport_stops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      stop_order INTEGER NOT NULL,
      arrival_time TEXT,
      FOREIGN KEY (route_id) REFERENCES transport_routes(id)
    );

    CREATE TABLE IF NOT EXISTS student_transport (
      student_id INTEGER,
      route_id INTEGER,
      stop_id INTEGER,
      PRIMARY KEY (student_id, route_id),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (route_id) REFERENCES transport_routes(id),
      FOREIGN KEY (stop_id) REFERENCES transport_stops(id)
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      entity_name TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT CHECK(type IN ('activity','alert','info')) DEFAULT 'activity',
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS teacher_salaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      base_salary REAL DEFAULT 0,
      bonus REAL DEFAULT 0,
      deductions REAL DEFAULT 0,
      net_salary REAL DEFAULT 0,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid')),
      paid_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (teacher_id) REFERENCES users(id)
    );
  `);

  seedData(db);
  console.log('Database initialized successfully');
}

function seedData(db) {
  const campusCount = db.prepare('SELECT COUNT(*) as count FROM campuses').get();
  if (campusCount.count > 0) return;

  const hashPassword = (pw) => bcrypt.hashSync(pw, 10);

  db.prepare(`INSERT INTO campuses (name, slug, address, city, phone) VALUES (?, ?, ?, ?, ?)`).run(
    'Regal Montessori - Khanpur Road', 'khanpur-road', 'Khanpur Road, Taxila', 'Taxila', '051-1234567'
  );
  db.prepare(`INSERT INTO campuses (name, slug, address, city, phone) VALUES (?, ?, ?, ?, ?)`).run(
    'Regal School & College - UET Campus', 'uet-campus', 'Near UET Taxila, Gangu Campus', 'Taxila', '051-7654321'
  );

  const insertUser = db.prepare(`INSERT INTO users (campus_id, name, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)`);
  insertUser.run(1, 'Super Admin', 'admin@regal.school', '03001234567', hashPassword('admin123'), 'super_admin');
  insertUser.run(1, 'Khanpur Campus Admin', 'khanpur.admin@regal.school', '03001234568', hashPassword('admin123'), 'campus_admin');
  insertUser.run(2, 'UET Campus Admin', 'uet.admin@regal.school', '03001234569', hashPassword('admin123'), 'campus_admin');
  insertUser.run(1, 'Sir Ahmed', 'ahmed@regal.school', '03001111111', hashPassword('teacher123'), 'teacher');
  insertUser.run(1, 'Miss Fatima', 'fatima@regal.school', '03002222222', hashPassword('teacher123'), 'teacher');
  insertUser.run(2, 'Sir Imran', 'imran@regal.school', '03003333333', hashPassword('teacher123'), 'teacher');
  insertUser.run(1, 'Accountant Ali', 'ali@regal.school', '03004444444', hashPassword('account123'), 'accountant');

  const insertClass = db.prepare(`INSERT INTO classes (campus_id, name, slug, level, monthly_fee, admission_fee, exam_fee) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  insertClass.run(1, 'Montessori 1', 'm1', 'montessori', 5000, 10000, 2000);
  insertClass.run(1, 'Montessori 2', 'm2', 'montessori', 5500, 10000, 2000);
  insertClass.run(1, 'Montessori 3', 'm3', 'montessori', 6000, 10000, 2000);
  insertClass.run(1, 'Class 1', 'c1', 'primary', 7000, 12000, 3000);
  insertClass.run(1, 'Class 2', 'c2', 'primary', 7500, 12000, 3000);
  insertClass.run(1, 'Class 3', 'c3', 'primary', 8000, 12000, 3000);
  insertClass.run(1, 'Class 4', 'c4', 'primary', 8500, 12000, 3000);
  insertClass.run(1, 'Class 5', 'c5', 'primary', 9000, 12000, 3000);
  insertClass.run(2, 'Class 6', 'c6', 'middle', 10000, 15000, 4000);
  insertClass.run(2, 'Class 7', 'c7', 'middle', 10500, 15000, 4000);
  insertClass.run(2, 'Class 8', 'c8', 'middle', 11000, 15000, 4000);
  insertClass.run(2, 'Class 9', 'c9', 'high', 12000, 18000, 5000);
  insertClass.run(2, 'Class 10', 'c10', 'high', 13000, 18000, 5000);
  insertClass.run(2, '1st Year', 'fsc1', 'college', 15000, 20000, 6000);
  insertClass.run(2, '2nd Year', 'fsc2', 'college', 16000, 20000, 6000);

  const insertSection = db.prepare(`INSERT INTO sections (class_id, name) VALUES (?, ?)`);
  for (let i = 1; i <= 15; i++) {
    insertSection.run(i, 'A');
    insertSection.run(i, 'B');
  }

  const insertParent = db.prepare(`INSERT INTO parents (name, phone_primary, email, address) VALUES (?, ?, ?, ?)`);
  insertParent.run('Muhammad Ali Khan', '03001110001', 'ali.khan@gmail.com', 'Sector F-5, Taxila Cantt');
  insertParent.run('Ahmed Raza Shah', '03001110002', 'ahmed.raza@yahoo.com', 'Wah Cantt, Phase 2');
  insertParent.run('Hassan Mehmood', '03001110003', 'hassan@hotmail.com', 'Khanpur Road, Taxila');
  insertParent.run('Usman Ghani', '03001110004', 'usman.ghani@gmail.com', 'Taxila Bypass');
  insertParent.run('Bilal Tariq', '03001110005', 'bilal.tariq@outlook.com', 'Satellite Town, Taxila');
  insertParent.run('Faisal Naveed', '03001110006', 'faisal.naveed@gmail.com', 'Jand, Taxila');
  insertParent.run('Asif Mehmood', '03001110007', 'asif@gmail.com', 'Wah Saddar');
  insertParent.run('Kamran Akmal', '03001110008', 'kamran@gmail.com', 'Taxila Industrial Area');
  insertParent.run('Naeem Butt', '03001110009', 'naeem@gmail.com', 'Gandhian, Taxila');
  insertParent.run('Rashid Ali', '03001110010', 'rashid@gmail.com', 'Chak Beli Khan');
  insertParent.run('Tariq Javed', '03001110011', 'tariq.j@gmail.com', 'Haro River Road');
  insertParent.run('Zahid Mehmood', '03001110012', 'zahid@gmail.com', 'Peshawar Road, Taxila');

  const insertStudent = db.prepare(`INSERT INTO students (student_id, campus_id, first_name, last_name, father_name, date_of_birth, gender, address, city, admission_date, class_id, section_id, parent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const studentNames = [
    ['RMS-2026-001', 1, 'Ahmed', 'Ali', 'Muhammad Ali Khan', '2018-03-15', 'male', 'Sector F-5, Taxila Cantt', 'Taxila', '2026-01-10', 4, 7, 1],
    ['RMS-2026-002', 1, 'Ayesha', 'Khan', 'Ahmed Raza Shah', '2018-07-22', 'female', 'Wah Cantt, Phase 2', 'Wah', '2026-01-10', 4, 7, 2],
    ['RMS-2026-003', 1, 'Hassan', 'Raza', 'Hassan Mehmood', '2019-01-10', 'male', 'Khanpur Road, Taxila', 'Taxila', '2026-01-12', 3, 5, 3],
    ['RMS-2026-004', 1, 'Fatima', 'Noor', 'Usman Ghani', '2017-11-05', 'female', 'Taxila Bypass', 'Taxila', '2025-09-01', 5, 9, 4],
    ['RMS-2026-005', 1, 'Bilal', 'Ahmad', 'Bilal Tariq', '2018-05-18', 'male', 'Satellite Town, Taxila', 'Taxila', '2026-01-10', 4, 8, 5],
    ['RMS-2026-006', 1, 'Sara', 'Malik', 'Faisal Naveed', '2019-09-25', 'female', 'Jand, Taxila', 'Taxila', '2026-01-15', 2, 4, 6],
    ['RMS-2026-007', 1, 'Omar', 'Farooq', 'Asif Mehmood', '2016-12-01', 'male', 'Wah Saddar', 'Wah', '2025-04-01', 8, 15, 7],
    ['RMS-2026-008', 1, 'Zainab', 'Hussain', 'Kamran Akmal', '2017-04-14', 'female', 'Taxila Industrial Area', 'Taxila', '2025-04-01', 6, 11, 8],
    ['RMS-2026-009', 1, 'Hamza', 'Tariq', 'Naeem Butt', '2020-02-20', 'male', 'Gandhian, Taxila', 'Taxila', '2026-01-10', 1, 1, 9],
    ['RMS-2026-010', 1, 'Maryam', 'Bibi', 'Rashid Ali', '2020-06-30', 'female', 'Chak Beli Khan', 'Taxila', '2026-01-10', 1, 2, 10],
    ['RMS-2026-011', 2, 'Saad', 'Ali', 'Tariq Javed', '2015-08-12', 'male', 'Haro River Road', 'Taxila', '2024-09-01', 13, 25, 11],
    ['RMS-2026-012', 2, 'Iqra', 'Yousaf', 'Zahid Mehmood', '2015-03-28', 'female', 'Peshawar Road, Taxila', 'Taxila', '2024-09-01', 13, 26, 12],
    ['RMS-2026-013', 2, 'Daniyal', 'Khan', 'Muhammad Ali Khan', '2014-11-15', 'male', 'Sector F-5, Taxila Cantt', 'Taxila', '2024-04-01', 15, 29, 1],
    ['RMS-2026-014', 2, 'Hira', 'Shah', 'Ahmed Raza Shah', '2014-06-08', 'female', 'Wah Cantt, Phase 2', 'Wah', '2024-04-01', 15, 30, 2],
    ['RMS-2026-015', 2, 'Rehan', 'Butt', 'Bilal Tariq', '2016-01-20', 'male', 'Satellite Town, Taxila', 'Taxila', '2025-09-01', 11, 21, 5],
  ];
  studentNames.forEach(s => insertStudent.run(...s));

  const today = new Date().toISOString().split('T')[0];
  const insertAttendance = db.prepare(`INSERT INTO attendance (student_id, date, status, check_in_time) VALUES (?, ?, ?, ?)`);
  const statuses = ['present', 'present', 'present', 'late', 'present', 'absent', 'present', 'present', 'late', 'present', 'present', 'present'];
  for (let i = 1; i <= 15; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const time = status === 'late' ? '08:15' : status === 'present' ? '07:55' : null;
    insertAttendance.run(i, today, status, time);
  }

  const insertVoucher = db.prepare(`INSERT INTO fee_vouchers (student_id, voucher_number, month, year, tuition_fee, exam_fee, transport_fee, total_amount, status, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const months = [6, 7];
  const voucherStatuses = ['paid', 'pending', 'pending', 'partial'];
  months.forEach((month, mi) => {
    for (let i = 1; i <= 15; i++) {
      const tuition = 7000 + (i * 500);
      const exam = 2000 + (i * 200);
      const transport = i % 3 === 0 ? 3000 : 0;
      const total = tuition + exam + transport;
      const status = mi === 0 ? 'paid' : voucherStatuses[Math.floor(Math.random() * voucherStatuses.length)];
      const voucherNum = `RMS-FV-2026-${String((mi * 15) + i).padStart(4, '0')}`;
      insertVoucher.run(i, voucherNum, month, 2026, tuition, exam, transport, total, status, '2026-07-10');
    }
  });

  db.prepare(`INSERT INTO announcements (campus_id, title, content, type, created_by) VALUES (?, ?, ?, ?, ?)`).run(
    null, 'Independence Day Celebration', 'School will remain closed on 14th August 2026 for Independence Day celebrations.', 'holiday', 1
  );
  db.prepare(`INSERT INTO announcements (campus_id, title, content, type, created_by) VALUES (?, ?, ?, ?, ?)`).run(
    1, 'PTM Scheduled', 'Parent-Teacher Meeting is scheduled for 20th July 2026 (Saturday). All parents are requested to attend.', 'event', 2
  );
  db.prepare(`INSERT INTO announcements (campus_id, title, content, type, created_by) VALUES (?, ?, ?, ?, ?)`).run(
    2, 'Annual Exam Schedule', 'Annual examination for Classes 9-10 will begin from 15th August 2026. Detailed schedule will be shared soon.', 'general', 3
  );

  const insertSalary = db.prepare(`INSERT INTO teacher_salaries (teacher_id, month, year, base_salary, bonus, deductions, net_salary, status, paid_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  insertSalary.run(4, 6, 2026, 45000, 5000, 2000, 48000, 'paid', '2026-07-01');
  insertSalary.run(4, 7, 2026, 45000, 0, 0, 45000, 'pending', null);
  insertSalary.run(5, 6, 2026, 42000, 3000, 1500, 43500, 'paid', '2026-07-01');
  insertSalary.run(5, 7, 2026, 42000, 0, 0, 42000, 'pending', null);
  insertSalary.run(6, 6, 2026, 48000, 4000, 2000, 50000, 'paid', '2026-07-01');
  insertSalary.run(6, 7, 2026, 48000, 0, 0, 48000, 'pending', null);

  console.log('Seed data inserted successfully');
}

module.exports = { getDb, initDatabase };
