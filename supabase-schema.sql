-- Regal School System - Supabase Schema (Complete)

-- 1. Campuses
CREATE TABLE IF NOT EXISTS campuses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  address TEXT,
  city TEXT DEFAULT 'Taxila',
  phone TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  campus_id INTEGER,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,
  role TEXT CHECK(role IN ('super_admin','campus_admin','teacher','accountant','parent','student')) NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (campus_id) REFERENCES campuses(id)
);

-- 3. Classes
CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  campus_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  level TEXT CHECK(level IN ('montessori','primary','middle','high','college')),
  monthly_fee REAL DEFAULT 0,
  admission_fee REAL DEFAULT 0,
  exam_fee REAL DEFAULT 0,
  max_students INTEGER DEFAULT 40,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (campus_id) REFERENCES campuses(id)
);

-- 4. Sections
CREATE TABLE IF NOT EXISTS sections (
  id SERIAL PRIMARY KEY,
  class_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  teacher_id INTEGER,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- 5. Parents
CREATE TABLE IF NOT EXISTS parents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  name TEXT NOT NULL,
  cnic TEXT,
  phone_primary TEXT NOT NULL,
  phone_secondary TEXT,
  email TEXT,
  address TEXT,
  occupation TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 6. Students
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
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
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (campus_id) REFERENCES campuses(id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (section_id) REFERENCES sections(id),
  FOREIGN KEY (parent_id) REFERENCES parents(id)
);

-- 7. Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  campus_id INTEGER NOT NULL,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('compulsory','elective','activity')),
  total_marks INTEGER DEFAULT 100,
  passing_marks INTEGER DEFAULT 40,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (campus_id) REFERENCES campuses(id)
);

-- 8. Class Subjects
CREATE TABLE IF NOT EXISTS class_subjects (
  class_id INTEGER,
  subject_id INTEGER,
  teacher_id INTEGER,
  PRIMARY KEY (class_id, subject_id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- 9. Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  status TEXT CHECK(status IN ('present','late','absent','half_day','excused','holiday')),
  check_in_time TEXT,
  remarks TEXT,
  marked_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (marked_by) REFERENCES users(id),
  UNIQUE(student_id, date)
);

-- 10. Exams
CREATE TABLE IF NOT EXISTS exams (
  id SERIAL PRIMARY KEY,
  campus_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('monthly','midterm','final','board_prep')),
  class_id INTEGER,
  start_date TEXT,
  end_date TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','published','completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (campus_id) REFERENCES campuses(id),
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- 11. Results
CREATE TABLE IF NOT EXISTS results (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  subject_id INTEGER,
  marks_obtained REAL,
  total_marks REAL DEFAULT 100,
  grade TEXT,
  gpa REAL,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (exam_id) REFERENCES exams(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- 12. Fee Structures
CREATE TABLE IF NOT EXISTS fee_structures (
  id SERIAL PRIMARY KEY,
  class_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  tuition_fee REAL DEFAULT 0,
  exam_fee REAL DEFAULT 0,
  transport_fee REAL DEFAULT 0,
  lab_fee REAL DEFAULT 0,
  activity_fee REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

-- 13. Fee Vouchers
CREATE TABLE IF NOT EXISTS fee_vouchers (
  id SERIAL PRIMARY KEY,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 14. Fee Payments
CREATE TABLE IF NOT EXISTS fee_payments (
  id SERIAL PRIMARY KEY,
  voucher_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT CHECK(payment_method IN ('cash','bank_transfer','jazzcash','easypaisa','other')),
  transaction_id TEXT,
  received_by INTEGER,
  payment_date TEXT DEFAULT (CURRENT_DATE),
  receipt_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (voucher_id) REFERENCES fee_vouchers(id),
  FOREIGN KEY (received_by) REFERENCES users(id)
);

-- 15. Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  campus_id INTEGER,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK(type IN ('general','urgent','event','holiday')),
  target_role TEXT DEFAULT 'all',
  created_by INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (campus_id) REFERENCES campuses(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 16. Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  registration TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  capacity INTEGER DEFAULT 30,
  driver_name TEXT,
  driver_phone TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Transport Routes
CREATE TABLE IF NOT EXISTS transport_routes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  vehicle_id INTEGER,
  fare REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- 18. Transport Stops
CREATE TABLE IF NOT EXISTS transport_stops (
  id SERIAL PRIMARY KEY,
  route_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  stop_order INTEGER NOT NULL,
  arrival_time TEXT,
  FOREIGN KEY (route_id) REFERENCES transport_routes(id)
);

-- 19. Student Transport
CREATE TABLE IF NOT EXISTS student_transport (
  student_id INTEGER,
  route_id INTEGER,
  stop_id INTEGER,
  PRIMARY KEY (student_id, route_id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (route_id) REFERENCES transport_routes(id),
  FOREIGN KEY (stop_id) REFERENCES transport_stops(id)
);

-- 20. Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  entity_name TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 21. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK(type IN ('activity','alert','info')) DEFAULT 'activity',
  is_read INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 22. Teacher Salaries
CREATE TABLE IF NOT EXISTS teacher_salaries (
  id SERIAL PRIMARY KEY,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- =============================================
-- SEED DATA
-- =============================================

-- Campuses
INSERT INTO campuses (name, slug, address, city, phone) VALUES
('Regal Montessori - Khanpur Road', 'khanpur-road', 'Khanpur Road, Taxila', 'Taxila', '051-1234567'),
('Regal School & College - UET Campus', 'uet-campus', 'Near UET Taxila, Gangu Campus', 'Taxila', '051-7654321');

-- Users (passwords all bcrypt hash of: admin123, teacher123, account123)
INSERT INTO users (campus_id, name, email, phone, password, role) VALUES
(1, 'Super Admin', 'admin@regal.school', '03001234567', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin'),
(1, 'Khanpur Campus Admin', 'khanpur.admin@regal.school', '03001234568', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'campus_admin'),
(2, 'UET Campus Admin', 'uet.admin@regal.school', '03001234569', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'campus_admin'),
(1, 'Sir Ahmed', 'ahmed@regal.school', '03001111111', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher'),
(1, 'Miss Fatima', 'fatima@regal.school', '03002222222', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher'),
(2, 'Sir Imran', 'imran@regal.school', '03003333333', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher'),
(1, 'Accountant Ali', 'ali@regal.school', '03004444444', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'accountant');

-- Classes
INSERT INTO classes (campus_id, name, slug, level, monthly_fee, admission_fee, exam_fee) VALUES
(1, 'Montessori 1', 'm1', 'montessori', 5000, 10000, 2000),
(1, 'Montessori 2', 'm2', 'montessori', 5500, 10000, 2000),
(1, 'Montessori 3', 'm3', 'montessori', 6000, 10000, 2000),
(1, 'Class 1', 'c1', 'primary', 7000, 12000, 3000),
(1, 'Class 2', 'c2', 'primary', 7500, 12000, 3000),
(1, 'Class 3', 'c3', 'primary', 8000, 12000, 3000),
(1, 'Class 4', 'c4', 'primary', 8500, 12000, 3000),
(1, 'Class 5', 'c5', 'primary', 9000, 12000, 3000),
(2, 'Class 6', 'c6', 'middle', 10000, 15000, 4000),
(2, 'Class 7', 'c7', 'middle', 10500, 15000, 4000),
(2, 'Class 8', 'c8', 'middle', 11000, 15000, 4000),
(2, 'Class 9', 'c9', 'high', 12000, 18000, 5000),
(2, 'Class 10', 'c10', 'high', 13000, 18000, 5000),
(2, '1st Year', 'fsc1', 'college', 15000, 20000, 6000),
(2, '2nd Year', 'fsc2', 'college', 16000, 20000, 6000);

-- Sections (A and B for each class)
INSERT INTO sections (class_id, name) VALUES
(1,'A'),(1,'B'),(2,'A'),(2,'B'),(3,'A'),(3,'B'),
(4,'A'),(4,'B'),(5,'A'),(5,'B'),(6,'A'),(6,'B'),
(7,'A'),(7,'B'),(8,'A'),(8,'B'),(9,'A'),(9,'B'),
(10,'A'),(10,'B'),(11,'A'),(11,'B'),(12,'A'),(12,'B'),
(13,'A'),(13,'B'),(14,'A'),(14,'B'),(15,'A'),(15,'B');

-- Parents
INSERT INTO parents (name, phone_primary, email, address) VALUES
('Muhammad Ali Khan', '03001110001', 'ali.khan@gmail.com', 'Sector F-5, Taxila Cantt'),
('Ahmed Raza Shah', '03001110002', 'ahmed.raza@yahoo.com', 'Wah Cantt, Phase 2'),
('Hassan Mehmood', '03001110003', 'hassan@hotmail.com', 'Khanpur Road, Taxila'),
('Usman Ghani', '03001110004', 'usman.ghani@gmail.com', 'Taxila Bypass'),
('Bilal Tariq', '03001110005', 'bilal.tariq@outlook.com', 'Satellite Town, Taxila'),
('Faisal Naveed', '03001110006', 'faisal.naveed@gmail.com', 'Jand, Taxila'),
('Asif Mehmood', '03001110007', 'asif@gmail.com', 'Wah Saddar'),
('Kamran Akmal', '03001110008', 'kamran@gmail.com', 'Taxila Industrial Area'),
('Naeem Butt', '03001110009', 'naeem@gmail.com', 'Gandhian, Taxila'),
('Rashid Ali', '03001110010', 'rashid@gmail.com', 'Chak Beli Khan'),
('Tariq Javed', '03001110011', 'tariq.j@gmail.com', 'Haro River Road'),
('Zahid Mehmood', '03001110012', 'zahid@gmail.com', 'Peshawar Road, Taxila');

-- Students
INSERT INTO students (student_id, campus_id, first_name, last_name, father_name, date_of_birth, gender, address, city, admission_date, class_id, section_id, parent_id) VALUES
('RMS-2026-001', 1, 'Ahmed', 'Ali', 'Muhammad Ali Khan', '2018-03-15', 'male', 'Sector F-5, Taxila Cantt', 'Taxila', '2026-01-10', 4, 7, 1),
('RMS-2026-002', 1, 'Ayesha', 'Khan', 'Ahmed Raza Shah', '2018-07-22', 'female', 'Wah Cantt, Phase 2', 'Wah', '2026-01-10', 4, 7, 2),
('RMS-2026-003', 1, 'Hassan', 'Raza', 'Hassan Mehmood', '2019-01-10', 'male', 'Khanpur Road, Taxila', 'Taxila', '2026-01-12', 3, 5, 3),
('RMS-2026-004', 1, 'Fatima', 'Noor', 'Usman Ghani', '2017-11-05', 'female', 'Taxila Bypass', 'Taxila', '2025-09-01', 5, 9, 4),
('RMS-2026-005', 1, 'Bilal', 'Ahmad', 'Bilal Tariq', '2018-05-18', 'male', 'Satellite Town, Taxila', 'Taxila', '2026-01-10', 4, 8, 5),
('RMS-2026-006', 1, 'Sara', 'Malik', 'Faisal Naveed', '2019-09-25', 'female', 'Jand, Taxila', 'Taxila', '2026-01-15', 2, 4, 6),
('RMS-2026-007', 1, 'Omar', 'Farooq', 'Asif Mehmood', '2016-12-01', 'male', 'Wah Saddar', 'Wah', '2025-04-01', 8, 15, 7),
('RMS-2026-008', 1, 'Zainab', 'Hussain', 'Kamran Akmal', '2017-04-14', 'female', 'Taxila Industrial Area', 'Taxila', '2025-04-01', 6, 11, 8),
('RMS-2026-009', 1, 'Hamza', 'Tariq', 'Naeem Butt', '2020-02-20', 'male', 'Gandhian, Taxila', 'Taxila', '2026-01-10', 1, 1, 9),
('RMS-2026-010', 1, 'Maryam', 'Bibi', 'Rashid Ali', '2020-06-30', 'female', 'Chak Beli Khan', 'Taxila', '2026-01-10', 1, 2, 10),
('RMS-2026-011', 2, 'Saad', 'Ali', 'Tariq Javed', '2015-08-12', 'male', 'Haro River Road', 'Taxila', '2024-09-01', 13, 25, 11),
('RMS-2026-012', 2, 'Iqra', 'Yousaf', 'Zahid Mehmood', '2015-03-28', 'female', 'Peshawar Road, Taxila', 'Taxila', '2024-09-01', 13, 26, 12),
('RMS-2026-013', 2, 'Daniyal', 'Khan', 'Muhammad Ali Khan', '2014-11-15', 'male', 'Sector F-5, Taxila Cantt', 'Taxila', '2024-04-01', 15, 29, 1),
('RMS-2026-014', 2, 'Hira', 'Shah', 'Ahmed Raza Shah', '2014-06-08', 'female', 'Wah Cantt, Phase 2', 'Wah', '2024-04-01', 15, 30, 2),
('RMS-2026-015', 2, 'Rehan', 'Butt', 'Bilal Tariq', '2016-01-20', 'male', 'Satellite Town, Taxila', 'Taxila', '2025-09-01', 11, 21, 5);

-- Attendance (today)
INSERT INTO attendance (student_id, date, status, check_in_time) VALUES
(1, CURRENT_DATE, 'present', '07:55'),
(2, CURRENT_DATE, 'present', '07:55'),
(3, CURRENT_DATE, 'late', '08:15'),
(4, CURRENT_DATE, 'present', '07:55'),
(5, CURRENT_DATE, 'absent', NULL),
(6, CURRENT_DATE, 'present', '07:55'),
(7, CURRENT_DATE, 'present', '07:55'),
(8, CURRENT_DATE, 'late', '08:15'),
(9, CURRENT_DATE, 'present', '07:55'),
(10, CURRENT_DATE, 'present', '07:55'),
(11, CURRENT_DATE, 'present', '07:55'),
(12, CURRENT_DATE, 'present', '07:55'),
(13, CURRENT_DATE, 'present', '07:55'),
(14, CURRENT_DATE, 'absent', NULL),
(15, CURRENT_DATE, 'present', '07:55');

-- Fee Vouchers
INSERT INTO fee_vouchers (student_id, voucher_number, month, year, tuition_fee, exam_fee, transport_fee, total_amount, status, due_date) VALUES
(1, 'RMS-FV-2026-0001', 6, 2026, 8500, 2200, 0, 10700, 'paid', '2026-07-10'),
(2, 'RMS-FV-2026-0002', 6, 2026, 8500, 2200, 0, 10700, 'paid', '2026-07-10'),
(3, 'RMS-FV-2026-0003', 6, 2026, 8000, 2000, 0, 10000, 'pending', '2026-07-10'),
(4, 'RMS-FV-2026-0004', 6, 2026, 9000, 2400, 0, 11400, 'pending', '2026-07-10'),
(5, 'RMS-FV-2026-0005', 6, 2026, 8500, 2200, 0, 10700, 'partial', '2026-07-10'),
(6, 'RMS-FV-2026-0006', 6, 2026, 7500, 1800, 3000, 12300, 'pending', '2026-07-10'),
(7, 'RMS-FV-2026-0007', 6, 2026, 9000, 2400, 0, 11400, 'paid', '2026-07-10'),
(8, 'RMS-FV-2026-0008', 6, 2026, 10000, 2600, 3000, 15600, 'paid', '2026-07-10'),
(9, 'RMS-FV-2026-0009', 6, 2026, 5000, 1200, 0, 6200, 'pending', '2026-07-10'),
(10, 'RMS-FV-2026-0010', 6, 2026, 5000, 1200, 0, 6200, 'paid', '2026-07-10'),
(11, 'RMS-FV-2026-0011', 6, 2026, 12000, 3000, 3000, 18000, 'pending', '2026-07-10'),
(12, 'RMS-FV-2026-0012', 6, 2026, 12000, 3000, 0, 15000, 'paid', '2026-07-10'),
(13, 'RMS-FV-2026-0013', 6, 2026, 15000, 3600, 0, 18600, 'paid', '2026-07-10'),
(14, 'RMS-FV-2026-0014', 6, 2026, 15000, 3600, 0, 18600, 'pending', '2026-07-10'),
(15, 'RMS-FV-2026-0015', 6, 2026, 11000, 2800, 0, 13800, 'paid', '2026-07-10'),
(1, 'RMS-FV-2026-0016', 7, 2026, 8500, 2200, 0, 10700, 'pending', '2026-08-10'),
(2, 'RMS-FV-2026-0017', 7, 2026, 8500, 2200, 0, 10700, 'paid', '2026-08-10'),
(3, 'RMS-FV-2026-0018', 7, 2026, 8000, 2000, 0, 10000, 'pending', '2026-08-10'),
(4, 'RMS-FV-2026-0019', 7, 2026, 9000, 2400, 0, 11400, 'pending', '2026-08-10'),
(5, 'RMS-FV-2026-0020', 7, 2026, 8500, 2200, 0, 10700, 'pending', '2026-08-10');

-- Announcements
INSERT INTO announcements (campus_id, title, content, type, created_by) VALUES
(NULL, 'Independence Day Celebration', 'School will remain closed on 14th August 2026 for Independence Day celebrations.', 'holiday', 1),
(1, 'PTM Scheduled', 'Parent-Teacher Meeting is scheduled for 20th July 2026 (Saturday). All parents are requested to attend.', 'event', 2),
(2, 'Annual Exam Schedule', 'Annual examination for Classes 9-10 will begin from 15th August 2026. Detailed schedule will be shared soon.', 'general', 3);

-- Teacher Salaries
INSERT INTO teacher_salaries (teacher_id, month, year, base_salary, bonus, deductions, net_salary, status, paid_date) VALUES
(4, 6, 2026, 45000, 5000, 2000, 48000, 'paid', '2026-07-01'),
(4, 7, 2026, 45000, 0, 0, 45000, 'pending', NULL),
(5, 6, 2026, 42000, 3000, 1500, 43500, 'paid', '2026-07-01'),
(5, 7, 2026, 42000, 0, 0, 42000, 'pending', NULL),
(6, 6, 2026, 48000, 4000, 2000, 50000, 'paid', '2026-07-01'),
(6, 7, 2026, 48000, 0, 0, 48000, 'pending', NULL);

-- 23. Owner Commissions (auto-generated on student admission)
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
