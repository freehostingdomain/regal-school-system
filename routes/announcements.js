const express = require('express');
const { getDb } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    let query = `
      SELECT a.*, u.name as created_by_name, c.name as campus_name
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN campuses c ON a.campus_id = c.id
      WHERE a.is_active = 1
    `;
    const params = [];

    if (req.user.role !== 'super_admin') {
      query += ' AND (a.campus_id IS NULL OR a.campus_id = ?)';
      params.push(req.user.campus_id);
    }

    query += ' ORDER BY a.created_at DESC';
    const announcements = db.prepare(query).all(...params);

    res.json({ success: true, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authenticate, authorize('super_admin', 'campus_admin', 'teacher', 'accountant'), activityLogger('Announcement'), (req, res) => {
  try {
    const db = getDb();
    const { title, content, type, target_role, campus_id } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }

    const targetCampus = req.user.role === 'super_admin' ? (campus_id || null) : req.user.campus_id;

    const result = db.prepare(`
      INSERT INTO announcements (campus_id, title, content, type, target_role, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(targetCampus, title, content, type || 'general', target_role || 'all', req.user.id);

    const announcement = db.prepare('SELECT * FROM announcements WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, message: 'Announcement created.', data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', authenticate, authorize('super_admin', 'campus_admin', 'teacher', 'accountant'), activityLogger('Announcement'), (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE announcements SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Announcement deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
