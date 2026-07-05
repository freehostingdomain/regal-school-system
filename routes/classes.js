const express = require('express');
const { getDb } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    let query = `
      SELECT c.*, sc.name as campus_name,
             (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id AND s.is_active = 1) as student_count
      FROM classes c
      LEFT JOIN campuses sc ON c.campus_id = sc.id
      WHERE c.is_active = 1
    `;
    const params = [];

    if (req.user.role !== 'super_admin') {
      query += ' AND c.campus_id = ?';
      params.push(req.user.campus_id);
    }

    query += ' ORDER BY c.sort_order ASC, c.name ASC';
    const classes = db.prepare(query).all(...params);

    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/sections', authenticate, (req, res) => {
  try {
    const db = getDb();
    const sections = db.prepare(`
      SELECT sec.*, u.name as teacher_name,
             (SELECT COUNT(*) FROM students s WHERE s.section_id = sec.id AND s.is_active = 1) as student_count
      FROM sections sec
      LEFT JOIN users u ON sec.teacher_id = u.id
      WHERE sec.class_id = ? AND sec.is_active = 1
    `).all(req.params.id);

    res.json({ success: true, data: sections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authenticate, authorize('super_admin', 'campus_admin'), (req, res) => {
  try {
    const db = getDb();
    const { name, slug, level, monthly_fee, admission_fee, exam_fee, campus_id, max_students } = req.body;

    const targetCampus = req.user.role === 'super_admin' ? (campus_id || req.user.campus_id) : req.user.campus_id;

    const result = db.prepare(`
      INSERT INTO classes (campus_id, name, slug, level, monthly_fee, admission_fee, exam_fee, max_students)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(targetCampus, name, slug, level, monthly_fee || 0, admission_fee || 0, exam_fee || 0, max_students || 40);

    const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, message: 'Class created successfully.', data: cls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
