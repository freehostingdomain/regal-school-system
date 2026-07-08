const express = require('express');
const { getPool } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /staff-attendance - list staff attendance by date
router.get('/', authenticate, authorize('super_admin', 'campus_admin', 'accountant'), async (req, res) => {
  try {
    const pool = getPool();
    const { date, campus_id } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    let query = `
      SELECT u.id, u.name, u.email, u.role, u.campus_id, u.gender, u.designation,
             c.name as campus_name,
             sa.id as attendance_id, sa.status, sa.check_in_time, sa.check_out_time, sa.notes
      FROM users u
      LEFT JOIN campuses c ON u.campus_id = c.id
      LEFT JOIN staff_attendance sa ON u.id = sa.user_id AND sa.date = $1
      WHERE u.is_active = 1 AND u.role IN ('teacher','campus_admin','accountant')
    `;
    const params = [targetDate];

    if (campus_id) {
      query += ` AND (u.campus_id = $2 OR u.campus_id IS NULL)`;
      params.push(parseInt(campus_id));
    }

    if (req.user.role === 'campus_admin') {
      query += ` AND (u.campus_id = $${params.length + 1} OR u.campus_id IS NULL)`;
      params.push(req.user.campus_id);
    }

    query += ` ORDER BY u.role, u.name`;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows, date: targetDate });
  } catch (error) {
    console.error('Staff attendance list error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /staff-attendance - mark staff attendance (bulk)
router.post('/', authenticate, authorize('super_admin', 'campus_admin'), async (req, res) => {
  try {
    const pool = getPool();
    const { records, date } = req.body;
    if (!records || !records.length) return res.status(400).json({ success: false, message: 'No records provided.' });

    const targetDate = date || new Date().toISOString().split('T')[0];

    for (const record of records) {
      await pool.query(`
        INSERT INTO staff_attendance (user_id, date, status, check_in_time, check_out_time, notes, marked_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id, date)
        DO UPDATE SET status = $3, check_in_time = $4, check_out_time = $5, notes = $6, marked_by = $7
      `, [record.user_id, targetDate, record.status, record.check_in_time || null, record.check_out_time || null, record.notes || null, req.user.id]);
    }

    res.json({ success: true, message: 'Staff attendance saved.' });
  } catch (error) {
    console.error('Staff attendance save error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /staff-attendance/summary - monthly summary for a staff member
router.get('/summary', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const { user_id, month, year } = req.query;
    const targetUser = user_id || req.user.id;
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();

    const result = await pool.query(`
      SELECT sa.*, u.name as user_name
      FROM staff_attendance sa
      JOIN users u ON sa.user_id = u.id
      WHERE sa.user_id = $1 AND EXTRACT(MONTH FROM sa.date::date) = $2 AND EXTRACT(YEAR FROM sa.date::date) = $3
      ORDER BY sa.date DESC
    `, [targetUser, parseInt(targetMonth), parseInt(targetYear)]);

    const total = result.rows.length;
    const present = result.rows.filter(r => r.status === 'present').length;
    const absent = result.rows.filter(r => r.status === 'absent').length;
    const late = result.rows.filter(r => r.status === 'late').length;
    const leave = result.rows.filter(r => r.status === 'leave').length;

    res.json({
      success: true,
      data: result.rows,
      summary: { total, present, absent, late, leave, percentage: total > 0 ? ((present + late) / total * 100).toFixed(1) : 0 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /staff-leaves - list all leave requests
router.get('/leaves', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const { status, user_id } = req.query;

    let query = `
      SELECT sl.*, u.name as user_name, u.role as user_role, u.campus_id, u.designation,
             approver.name as approved_by_name
      FROM staff_leaves sl
      JOIN users u ON sl.user_id = u.id
      LEFT JOIN users approver ON sl.approved_by = approver.id
      WHERE 1=1
    `;
    const params = [];
    let paramIdx = 1;

    if (status) {
      query += ` AND sl.status = $${paramIdx++}`;
      params.push(status);
    }

    if (user_id) {
      query += ` AND sl.user_id = $${paramIdx++}`;
      params.push(parseInt(user_id));
    }

    // Campus admin only sees their campus
    if (req.user.role === 'campus_admin') {
      query += ` AND (u.campus_id = $${paramIdx++} OR u.campus_id IS NULL)`;
      params.push(req.user.campus_id);
    }

    // Teachers only see their own leaves
    if (req.user.role === 'teacher') {
      query += ` AND sl.user_id = $${paramIdx++}`;
      params.push(req.user.id);
    }

    query += ` ORDER BY sl.created_at DESC`;

    const result = await pool.query(query, params);

    // Get leave balances for each user
    const balances = {};
    const userIds = [...new Set(result.rows.map(r => r.user_id))];
    if (userIds.length > 0) {
      const balResult = await pool.query(
        `SELECT id, name, casual_leaves, sick_leaves, earned_leaves FROM users WHERE id = ANY($1)`,
        [userIds]
      );
      balResult.rows.forEach(u => { balances[u.id] = u; });
    }

    res.json({ success: true, data: result.rows, balances });
  } catch (error) {
    console.error('Staff leaves list error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /staff-leaves - apply for leave
router.post('/leaves', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const { leave_type, start_date, end_date, reason } = req.body;

    if (!start_date || !end_date || !reason) {
      return res.status(400).json({ success: false, message: 'Start date, end date and reason are required.' });
    }

    // Calculate days
    const start = new Date(start_date);
    const end = new Date(end_date);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Check leave balance
    const user = (await pool.query('SELECT casual_leaves, sick_leaves, earned_leaves FROM users WHERE id = $1', [req.user.id])).rows[0];
    if (leave_type === 'casual' && user.casual_leaves < days) {
      return res.status(400).json({ success: false, message: `Insufficient casual leaves. Remaining: ${user.casual_leaves}` });
    }
    if (leave_type === 'sick' && user.sick_leaves < days) {
      return res.status(400).json({ success: false, message: `Insufficient sick leaves. Remaining: ${user.sick_leaves}` });
    }

    const result = await pool.query(`
      INSERT INTO staff_leaves (user_id, leave_type, start_date, end_date, reason)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [req.user.id, leave_type || 'casual', start_date, end_date, reason]);

    res.json({ success: true, data: result.rows[0], message: 'Leave application submitted.' });
  } catch (error) {
    console.error('Staff leave apply error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /staff-leaves/:id/approve - approve/reject leave
router.put('/leaves/:id/approve', authenticate, authorize('super_admin', 'campus_admin'), async (req, res) => {
  try {
    const pool = getPool();
    const { status, admin_remarks } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
    }

    const leave = (await pool.query('SELECT * FROM staff_leaves WHERE id = $1', [req.params.id])).rows[0];
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found.' });
    if (leave.status !== 'pending') return res.status(400).json({ success: false, message: 'Leave already processed.' });

    await pool.query(`
      UPDATE staff_leaves SET status = $1, approved_by = $2, admin_remarks = $3, updated_at = NOW() WHERE id = $4
    `, [status, req.user.id, admin_remarks || null, req.params.id]);

    // Deduct leaves if approved
    if (status === 'approved') {
      const days = Math.ceil((new Date(leave.end_date) - new Date(leave.start_date)) / (1000 * 60 * 60 * 24)) + 1;
      if (leave.leave_type === 'casual') {
        await pool.query('UPDATE users SET casual_leaves = casual_leaves - $1 WHERE id = $2', [days, leave.user_id]);
      } else if (leave.leave_type === 'sick') {
        await pool.query('UPDATE users SET sick_leaves = sick_leaves - $1 WHERE id = $2', [days, leave.user_id]);
      } else if (leave.leave_type === 'earned') {
        await pool.query('UPDATE users SET earned_leaves = earned_leaves - $1 WHERE id = $2', [days, leave.user_id]);
      }
    }

    res.json({ success: true, message: `Leave ${status}.` });
  } catch (error) {
    console.error('Staff leave approve error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /staff-leaves/:id - cancel leave (only pending)
router.delete('/leaves/:id', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const leave = (await pool.query('SELECT * FROM staff_leaves WHERE id = $1', [req.params.id])).rows[0];
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found.' });
    if (leave.status !== 'pending' && req.user.role !== 'super_admin') {
      return res.status(400).json({ success: false, message: 'Only pending leaves can be cancelled.' });
    }
    if (leave.user_id !== req.user.id && req.user.role !== 'super_admin' && req.user.role !== 'campus_admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    await pool.query('DELETE FROM staff_leaves WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Leave cancelled.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
