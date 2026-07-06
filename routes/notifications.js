const express = require('express');
const { getDb, getPool } = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const { unread_only, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE user_id = $1';
    const params = [req.user.id];
    let paramIdx = 2;

    if (unread_only === 'true') {
      whereClause += ' AND is_read = 0';
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM notifications ${whereClause}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(parseInt(limit), parseInt(offset));
    const notifications = await pool.query(
      `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      params
    );

    const unreadResult = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = 0',
      [req.user.id]
    );
    const unreadCount = parseInt(unreadResult.rows[0].count);

    res.json({
      success: true,
      data: notifications.rows,
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

router.get('/activity', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const { page = 1, limit = 30, role, action, entity_type } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIdx = 1;

    if (role) {
      whereClause += ` AND user_role = $${paramIdx++}`;
      params.push(role);
    }
    if (action) {
      whereClause += ` AND action = $${paramIdx++}`;
      params.push(action);
    }
    if (entity_type) {
      whereClause += ` AND entity_type = $${paramIdx++}`;
      params.push(entity_type);
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM activity_logs ${whereClause}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(parseInt(limit), parseInt(offset));
    const logs = await pool.query(
      `SELECT * FROM activity_logs ${whereClause} ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      params
    );

    res.json({
      success: true,
      data: logs.rows,
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

router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/read-all', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = $1', [req.user.id]);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
