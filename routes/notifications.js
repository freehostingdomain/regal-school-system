const express = require('express');
const { getDb } = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { unread_only, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [req.user.id];

    if (unread_only === 'true') {
      query += ' AND is_read = 0';
    }

    const total = db.prepare(query.replace('SELECT *', 'SELECT COUNT(*) as count')).get(...params).count;
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const notifications = db.prepare(query).all(...params);

    const unreadCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id).count;

    res.json({
      success: true,
      data: notifications,
      unread_count: unreadCount,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/activity', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { page = 1, limit = 30, role, action, entity_type } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM activity_logs WHERE 1=1';
    const params = [];

    if (role) {
      query += ' AND user_role = ?';
      params.push(role);
    }
    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }
    if (entity_type) {
      query += ' AND entity_type = ?';
      params.push(entity_type);
    }

    const total = db.prepare(query.replace('SELECT *', 'SELECT COUNT(*) as count')).get(...params).count;

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const logs = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: logs,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/read', authenticate, (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/read-all', authenticate, (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
