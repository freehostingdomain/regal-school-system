const express = require('express');
const { getDb } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

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

router.get('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const cls = db.prepare(`
      SELECT c.*, sc.name as campus_name,
             (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id AND s.is_active = 1) as student_count
      FROM classes c
      LEFT JOIN campuses sc ON c.campus_id = sc.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!cls) return res.status(404).json({ success: false, message: 'Class not found.' });

    const sections = db.prepare(`
      SELECT sec.*, u.name as teacher_name,
             (SELECT COUNT(*) FROM students s WHERE s.section_id = sec.id AND s.is_active = 1) as student_count
      FROM sections sec
      LEFT JOIN users u ON sec.teacher_id = u.id
      WHERE sec.class_id = ? AND sec.is_active = 1
    `).all(req.params.id);

    res.json({ success: true, data: { ...cls, sections } });
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

router.put('/:id', authenticate, authorize('super_admin', 'campus_admin', 'teacher', 'accountant'), activityLogger('Class'), (req, res) => {
  try {
    const db = getDb();
    const { name, slug, level, monthly_fee, admission_fee, exam_fee, max_students, campus_id } = req.body;

    db.prepare(`
      UPDATE classes SET
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        level = COALESCE(?, level),
        monthly_fee = COALESCE(?, monthly_fee),
        admission_fee = COALESCE(?, admission_fee),
        exam_fee = COALESCE(?, exam_fee),
        max_students = COALESCE(?, max_students),
        campus_id = COALESCE(?, campus_id)
      WHERE id = ?
    `).run(name, slug, level, monthly_fee, admission_fee, exam_fee, max_students, campus_id, req.params.id);

    const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id);
    res.json({ success: true, message: 'Class updated successfully.', data: cls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', authenticate, authorize('super_admin', 'campus_admin'), activityLogger('Class'), (req, res) => {
  try {
    const db = getDb();
    const studentCount = db.prepare('SELECT COUNT(*) as count FROM students WHERE class_id = ? AND is_active = 1').get(req.params.id);
    if (studentCount.count > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete class. ${studentCount.count} active student(s) enrolled.` });
    }
    db.prepare('UPDATE classes SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Class deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/sections', authenticate, authorize('super_admin', 'campus_admin', 'teacher', 'accountant'), activityLogger('Section'), (req, res) => {
  try {
    const db = getDb();
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Section name is required.' });

    const result = db.prepare('INSERT INTO sections (class_id, name) VALUES (?, ?)').run(req.params.id, name);
    const section = db.prepare('SELECT * FROM sections WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, message: 'Section added.', data: section });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:classId/sections/:sectionId', authenticate, authorize('super_admin', 'campus_admin'), activityLogger('Section'), (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE sections SET is_active = 0 WHERE id = ?').run(req.params.sectionId);
    res.json({ success: true, message: 'Section deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
