const express = require('express');
const { getDb, getPool } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

const router = express.Router();

const COMMISSION_RATE = 15;

router.get('/', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const pool = getPool();
    const { status, campus_id, month, year } = req.query;

    let query = `
      SELECT oc.*, sc.name as campus_name
      FROM owner_commissions oc
      LEFT JOIN campuses sc ON oc.campus_id = sc.id
      WHERE 1=1
    `;
    const params = [];
    let paramIdx = 1;

    if (status) { query += ` AND oc.status = $${paramIdx++}`; params.push(status); }
    if (campus_id) { query += ` AND oc.campus_id = $${paramIdx++}`; params.push(campus_id); }
    if (month) { query += ` AND EXTRACT(MONTH FROM oc.created_at) = $${paramIdx++}`; params.push(month); }
    if (year) { query += ` AND EXTRACT(YEAR FROM oc.created_at) = $${paramIdx++}`; params.push(year); }

    query += ' ORDER BY oc.created_at DESC';
    const commissions = (await pool.query(query, params)).rows;

    const summary = {
      total: commissions.length,
      total_amount: commissions.reduce((s, c) => s + (c.commission_amount || 0), 0),
      paid: commissions.filter(c => c.status === 'paid').length,
      paid_amount: commissions.filter(c => c.status === 'paid').reduce((s, c) => s + (c.commission_amount || 0), 0),
      pending: commissions.filter(c => c.status === 'pending').length,
      pending_amount: commissions.filter(c => c.status === 'pending').reduce((s, c) => s + (c.commission_amount || 0), 0),
    };

    res.json({ success: true, data: commissions, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/summary', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const pool = getPool();
    const byCampus = (await pool.query(`
      SELECT oc.campus_id, sc.name as campus_name,
             COUNT(*) as total_students,
             COALESCE(SUM(oc.commission_amount), 0) as total_commission,
             COALESCE(SUM(CASE WHEN oc.status='paid' THEN oc.commission_amount ELSE 0 END), 0) as paid,
             COALESCE(SUM(CASE WHEN oc.status='pending' THEN oc.commission_amount ELSE 0 END), 0) as pending
      FROM owner_commissions oc
      LEFT JOIN campuses sc ON oc.campus_id = sc.id
      GROUP BY oc.campus_id, sc.name
    `)).rows;

    const byMonth = (await pool.query(`
      SELECT TO_CHAR(oc.created_at, 'YYYY-MM') as month,
             COUNT(*) as total_students,
             COALESCE(SUM(oc.commission_amount), 0) as total_commission
      FROM owner_commissions oc
      GROUP BY TO_CHAR(oc.created_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `)).rows;

    const overall = (await pool.query(`
      SELECT COUNT(*) as total,
             COALESCE(SUM(commission_amount), 0) as total_commission,
             COALESCE(SUM(CASE WHEN status='paid' THEN commission_amount ELSE 0 END), 0) as paid,
             COALESCE(SUM(CASE WHEN status='pending' THEN commission_amount ELSE 0 END), 0) as pending
      FROM owner_commissions
    `)).rows[0];

    res.json({ success: true, data: { overall, byCampus, byMonth } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/pay', authenticate, authorize('super_admin'), activityLogger('Commission'), async (req, res) => {
  try {
    const pool = getPool();
    await pool.query(
      "UPDATE owner_commissions SET status = 'paid', paid_date = CURRENT_DATE WHERE id = $1",
      [req.params.id]
    );
    res.json({ success: true, message: 'Commission marked as paid.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/pay-all', authenticate, authorize('super_admin'), activityLogger('Commission'), async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      "UPDATE owner_commissions SET status = 'paid', paid_date = CURRENT_DATE WHERE status = 'pending'"
    );
    res.json({ success: true, message: `${result.rowCount} commissions marked as paid.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', authenticate, authorize('super_admin'), activityLogger('Commission'), async (req, res) => {
  try {
    const pool = getPool();
    await pool.query("UPDATE owner_commissions SET status = 'cancelled' WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: 'Commission cancelled.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
