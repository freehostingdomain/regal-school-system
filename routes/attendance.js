const express = require('express');
const { getDb, getPool } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const { date, class_id, section_id } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    let query = `
      SELECT a.*, s.student_id as student_code, s.first_name, s.last_name, s.father_name,
             c.name as class_name, sec.name as section_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      WHERE a.date = $1
    `;
    const params = [targetDate];
    let paramIdx = 2;

    if (req.user.role !== 'super_admin') {
      query += ` AND s.campus_id = $${paramIdx++}`;
      params.push(req.user.campus_id);
    }

    if (class_id) {
      query += ` AND s.class_id = $${paramIdx++}`;
      params.push(class_id);
    }
    if (section_id) {
      query += ` AND s.section_id = $${paramIdx++}`;
      params.push(section_id);
    }

    query += ' ORDER BY s.student_id ASC';
    const result = await getPool().query(query, params);
    const attendance = result.rows;

    const summary = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      late: attendance.filter(a => a.status === 'late').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      half_day: attendance.filter(a => a.status === 'half_day').length,
      excused: attendance.filter(a => a.status === 'excused').length,
    };

    res.json({ success: true, data: attendance, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/today', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];

    let studentQuery = `
      SELECT s.id, s.student_id as student_code, s.first_name, s.last_name, s.father_name,
             c.name as class_name, sec.name as section_name,
             a.status, a.check_in_time
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN attendance a ON a.student_id = s.id AND a.date = $1
      WHERE s.is_active = 1
    `;
    const params = [today];
    let paramIdx = 2;

    if (req.user.role !== 'super_admin') {
      studentQuery += ` AND s.campus_id = $${paramIdx++}`;
      params.push(req.user.campus_id);
    }

    studentQuery += ' ORDER BY s.student_id ASC';
    const result = await getPool().query(studentQuery, params);

    res.json({ success: true, data: result.rows, date: today });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authenticate, authorize('super_admin', 'campus_admin', 'teacher'), activityLogger('Attendance'), async (req, res) => {
  try {
    const { records, date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Records array is required.' });
    }

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    const isLate = hours > 8 || (hours === 8 && minutes > 0);

    const client = await getPool().connect();
    try {
      await client.query('BEGIN');

      for (const record of records) {
        let status = record.status;
        if (status === 'present' && isLate) {
          status = 'late';
        }
        await client.query(`
          INSERT INTO attendance (student_id, date, status, check_in_time, marked_by)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (student_id, date) DO UPDATE SET
            status = EXCLUDED.status,
            check_in_time = EXCLUDED.check_in_time,
            marked_by = EXCLUDED.marked_by
        `, [
          record.student_id,
          targetDate,
          status,
          status !== 'absent' ? currentTime : null,
          req.user.id
        ]);
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    res.json({ success: true, message: `Attendance marked for ${records.length} students.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/student/:studentId', authenticate, async (req, res) => {
  try {
    const { month, year } = req.query;
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();

    const result = await getPool().query(`
      SELECT * FROM attendance
      WHERE student_id = $1 AND TO_CHAR(date::date, 'MM') = $2 AND TO_CHAR(date::date, 'YYYY') = $3
      ORDER BY date ASC
    `, [req.params.studentId, String(targetMonth).padStart(2, '0'), String(targetYear)]);

    const attendance = result.rows;

    const summary = {
      total_days: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      late: attendance.filter(a => a.status === 'late').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      half_day: attendance.filter(a => a.status === 'half_day').length,
      percentage: 0
    };
    if (summary.total_days > 0) {
      summary.percentage = ((summary.present + summary.late) / summary.total_days * 100).toFixed(1);
    }

    res.json({ success: true, data: attendance, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
