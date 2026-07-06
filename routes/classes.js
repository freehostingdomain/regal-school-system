const express = require('express');
const { getDb } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
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
    } else if (req.query.campus_id) {
      query += ' AND c.campus_id = ?';
      params.push(req.query.campus_id);
    }

    query += ' ORDER BY c.sort_order ASC, c.name ASC';
    const classes = await db.prepare(query).all(...params);

    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/sections', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const sections = await db.prepare(`
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

router.post('/', authenticate, authorize('super_admin', 'campus_admin'), async (req, res) => {
  try {
    const db = getDb();
    const { name, slug, level, monthly_fee, admission_fee, exam_fee, campus_id, max_students } = req.body;

    const targetCampus = req.user.role === 'super_admin' ? (campus_id || req.user.campus_id) : req.user.campus_id;

    const result = await db.prepare(`
      INSERT INTO classes (campus_id, name, slug, level, monthly_fee, admission_fee, exam_fee, max_students)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(targetCampus, name, slug, level, monthly_fee || 0, admission_fee || 0, exam_fee || 0, max_students || 40);

    const cls = await db.prepare('SELECT * FROM classes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, message: 'Class created successfully.', data: cls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', authenticate, authorize('super_admin', 'campus_admin'), async (req, res) => {
  try {
    const db = getDb();
    const { name, level, monthly_fee, admission_fee, exam_fee, max_students, campus_id } = req.body;

    await db.prepare(`
      UPDATE classes SET
        name = COALESCE(?, name), level = COALESCE(?, level),
        monthly_fee = COALESCE(?, monthly_fee), admission_fee = COALESCE(?, admission_fee),
        exam_fee = COALESCE(?, exam_fee), max_students = COALESCE(?, max_students),
        campus_id = COALESCE(?, campus_id)
      WHERE id = ?
    `).run(name, level, monthly_fee, admission_fee, exam_fee, max_students, campus_id, req.params.id);

    const cls = await db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id);
    res.json({ success: true, message: 'Class updated.', data: cls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', authenticate, authorize('super_admin', 'campus_admin'), async (req, res) => {
  try {
    const db = getDb();
    await db.prepare('UPDATE classes SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Class deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/sections', authenticate, authorize('super_admin', 'campus_admin'), async (req, res) => {
  try {
    const db = getDb();
    const { name, teacher_id } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Section name required.' });
    }
    const result = await db.prepare('INSERT INTO sections (class_id, name, teacher_id) VALUES (?, ?, ?)').run(
      req.params.id, name, teacher_id || null
    );
    const section = await db.prepare('SELECT * FROM sections WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, message: 'Section added.', data: section });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/sections/:sectionId', authenticate, authorize('super_admin', 'campus_admin'), async (req, res) => {
  try {
    const db = getDb();
    const { name, teacher_id } = req.body;
    await db.prepare('UPDATE sections SET name = COALESCE(?, name), teacher_id = COALESCE(?, teacher_id) WHERE id = ? AND class_id = ?').run(
      name, teacher_id, req.params.sectionId, req.params.id
    );
    const section = await db.prepare('SELECT * FROM sections WHERE id = ?').get(req.params.sectionId);
    res.json({ success: true, message: 'Section updated.', data: section });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id/sections/:sectionId', authenticate, authorize('super_admin', 'campus_admin'), async (req, res) => {
  try {
    const db = getDb();
    await db.prepare('UPDATE sections SET is_active = 0 WHERE id = ? AND class_id = ?').run(req.params.sectionId, req.params.id);
    res.json({ success: true, message: 'Section deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/teachers', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const teachers = await db.prepare("SELECT id, name FROM users WHERE role = 'teacher' AND is_active = 1 ORDER BY name").all();
    res.json({ success: true, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
