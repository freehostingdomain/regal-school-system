const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const teachers = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.campus_id, u.is_active, u.created_at,
             c.name as campus_name,
             (SELECT COUNT(*) FROM sections sec WHERE sec.teacher_id = u.id AND sec.is_active = 1) as sections_assigned,
             (SELECT ts.base_salary FROM teacher_salaries ts WHERE ts.teacher_id = u.id ORDER BY ts.year DESC, ts.month DESC LIMIT 1) as last_salary
      FROM users u
      LEFT JOIN campuses c ON u.campus_id = c.id
      WHERE u.role = 'teacher' AND u.is_active = 1
      ORDER BY u.name ASC
    `).all();
    res.json({ success: true, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authenticate, authorize('super_admin', 'campus_admin'), activityLogger('Teacher'), (req, res) => {
  try {
    const db = getDb();
    const { name, email, phone, password, campus_id, base_salary } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password required.' });
    }
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already exists.' });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    const targetCampus = req.user.role === 'super_admin' ? (campus_id || req.user.campus_id) : req.user.campus_id;
    const result = db.prepare('INSERT INTO users (campus_id, name, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)').run(
      targetCampus, name, email, phone || '', hashedPassword, 'teacher'
    );
    const teacherId = result.lastInsertRowid;

    if (base_salary && base_salary > 0) {
      const now = new Date();
      db.prepare('INSERT INTO teacher_salaries (teacher_id, month, year, base_salary, net_salary, status) VALUES (?, ?, ?, ?, ?, ?)').run(
        teacherId, now.getMonth() + 1, now.getFullYear(), base_salary, base_salary, 'pending'
      );
    }

    const teacher = db.prepare('SELECT id, name, email, phone, campus_id FROM users WHERE id = ?').get(teacherId);
    res.status(201).json({ success: true, message: 'Teacher added successfully.', data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', authenticate, authorize('super_admin', 'campus_admin'), activityLogger('Teacher'), (req, res) => {
  try {
    const db = getDb();
    const { name, email, phone, campus_id } = req.body;
    db.prepare('UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), campus_id = COALESCE(?, campus_id) WHERE id = ? AND role = ?').run(
      name, email, phone, campus_id, req.params.id, 'teacher'
    );
    const teacher = db.prepare('SELECT id, name, email, phone, campus_id FROM users WHERE id = ?').get(req.params.id);
    res.json({ success: true, message: 'Teacher updated.', data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', authenticate, authorize('super_admin', 'campus_admin'), activityLogger('Teacher'), (req, res) => {
  try {
    const db = getDb();
    db.prepare("UPDATE users SET is_active = 0 WHERE id = ? AND role = 'teacher'").run(req.params.id);
    res.json({ success: true, message: 'Teacher removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/salaries', authenticate, (req, res) => {
  try {
    const db = getDb();
    const salaries = db.prepare('SELECT * FROM teacher_salaries WHERE teacher_id = ? ORDER BY year DESC, month DESC').all(req.params.id);
    res.json({ success: true, data: salaries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/salaries', authenticate, authorize('super_admin', 'campus_admin'), activityLogger('Salary'), (req, res) => {
  try {
    const db = getDb();
    const { month, year, base_salary, bonus, deductions, notes } = req.body;
    if (!month || !year || !base_salary) {
      return res.status(400).json({ success: false, message: 'Month, year and base salary required.' });
    }
    const net = base_salary + (bonus || 0) - (deductions || 0);
    const result = db.prepare('INSERT INTO teacher_salaries (teacher_id, month, year, base_salary, bonus, deductions, net_salary, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      req.params.id, month, year, base_salary, bonus || 0, deductions || 0, net, notes || ''
    );
    const salary = db.prepare('SELECT * FROM teacher_salaries WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, message: 'Salary record created.', data: salary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/salaries/:salaryId/pay', authenticate, authorize('super_admin', 'campus_admin'), activityLogger('Salary'), (req, res) => {
  try {
    const db = getDb();
    db.prepare("UPDATE teacher_salaries SET status = 'paid', paid_date = date('now') WHERE id = ? AND teacher_id = ?").run(
      req.params.salaryId, req.params.id
    );
    res.json({ success: true, message: 'Salary marked as paid.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/salaries/:salaryId', authenticate, authorize('super_admin', 'campus_admin'), activityLogger('Salary'), (req, res) => {
  try {
    const db = getDb();
    const { month, year, base_salary, bonus, deductions, notes } = req.body;
    const net = (base_salary || 0) + (bonus || 0) - (deductions || 0);
    db.prepare('UPDATE teacher_salaries SET month = COALESCE(?, month), year = COALESCE(?, year), base_salary = COALESCE(?, base_salary), bonus = COALESCE(?, bonus), deductions = COALESCE(?, deductions), net_salary = ?, notes = COALESCE(?, notes) WHERE id = ? AND teacher_id = ?').run(
      month, year, base_salary, bonus, deductions, net, notes, req.params.salaryId, req.params.id
    );
    const salary = db.prepare('SELECT * FROM teacher_salaries WHERE id = ?').get(req.params.salaryId);
    res.json({ success: true, message: 'Salary updated.', data: salary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id/salaries/:salaryId', authenticate, authorize('super_admin', 'campus_admin'), activityLogger('Salary'), (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM teacher_salaries WHERE id = ? AND teacher_id = ?').run(req.params.salaryId, req.params.id);
    res.json({ success: true, message: 'Salary record deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
