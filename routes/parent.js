const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getPool } = require('../database');

// GET /parent/children - parent ke saare bache
router.get('/children', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const parent = await pool.query('SELECT id FROM parents WHERE user_id = $1', [req.user.id]);
    if (!parent.rows.length) return res.json([]);

    const parentId = parent.rows[0].id;
    const result = await pool.query(`
      SELECT s.*, c.name as class_name, sec.name as section_name,
             camp.name as campus_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN campuses camp ON s.campus_id = camp.id
      WHERE s.parent_id = $1
      ORDER BY s.id
    `, [parentId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Parent children error:', err);
    res.status(500).json({ error: 'Failed to fetch children' });
  }
});

// GET /parent/attendance/:studentId - bache ki attendance
router.get('/attendance/:studentId', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const { studentId } = req.params;
    const { month, year } = req.query;

    let query = `
      SELECT a.*, c.name as class_name
      FROM attendance a
      LEFT JOIN classes c ON a.class_id = c.id
      WHERE a.student_id = $1
    `;
    const params = [studentId];

    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM a.date::date) = $2 AND EXTRACT(YEAR FROM a.date::date) = $3`;
      params.push(parseInt(month), parseInt(year));
    }
    query += ' ORDER BY a.date DESC';

    const result = await pool.query(query, params);

    const total = result.rows.length;
    const present = result.rows.filter(r => r.status === 'present').length;
    const absent = result.rows.filter(r => r.status === 'absent').length;
    const late = result.rows.filter(r => r.status === 'late').length;
    const leave = result.rows.filter(r => r.status === 'leave').length;

    res.json({
      attendance: result.rows,
      summary: { total, present, absent, late, leave, percentage: total > 0 ? ((present + late) / total * 100).toFixed(1) : 0 }
    });
  } catch (err) {
    console.error('Parent attendance error:', err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// GET /parent/fees/:studentId - bache ke fee vouchers
router.get('/fees/:studentId', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const { studentId } = req.params;
    const result = await pool.query(`
      SELECT fv.*, c.name as class_name,
             COALESCE(paid.total_paid, 0) as total_paid,
             (fv.total_amount - COALESCE(paid.total_paid, 0)) as balance
      FROM fee_vouchers fv
      LEFT JOIN classes c ON fv.class_id = c.id
      LEFT JOIN (
        SELECT voucher_id, SUM(amount) as total_paid
        FROM fee_payments GROUP BY voucher_id
      ) paid ON paid.voucher_id = fv.id
      WHERE fv.student_id = $1
      ORDER BY fv.due_date DESC
    `, [studentId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Parent fees error:', err);
    res.status(500).json({ error: 'Failed to fetch fees' });
  }
});

// GET /parent/results/:studentId - bache ke exam results
router.get('/results/:studentId', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const { studentId } = req.params;
    const result = await pool.query(`
      SELECT r.*, e.name as exam_name, e.type as exam_type, e.total_marks as exam_total,
             s.name as subject_name
      FROM results r
      JOIN exams e ON r.exam_id = e.id
      JOIN subjects s ON r.subject_id = s.id
      WHERE r.student_id = $1
      ORDER BY e.start_date DESC, s.name
    `, [studentId]);

    const exams = {};
    for (const row of result.rows) {
      if (!exams[row.exam_id]) {
        exams[row.exam_id] = {
          exam_id: row.exam_id,
          exam_name: row.exam_name,
          exam_type: row.exam_type,
          subjects: [],
          total_marks: 0,
          obtained_marks: 0
        };
      }
      exams[row.exam_id].subjects.push({
        subject: row.subject_name,
        marks: row.marks_obtained,
        total: row.exam_total,
        grade: row.grade
      });
      exams[row.exam_id].total_marks += row.exam_total;
      exams[row.exam_id].obtained_marks += row.marks_obtained;
    }

    res.json(Object.values(exams));
  } catch (err) {
    console.error('Parent results error:', err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// GET /parent/profile - parent ka profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT p.*, u.email, u.name as user_name
      FROM parents p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1
    `, [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Parent not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Parent profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
