const express = require('express');
const { getPool } = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const campusIdFilter = req.query.campus_id ? parseInt(req.query.campus_id) : null;
    const effectiveCampusId = campusIdFilter || req.user.campus_id || null;

    function campusSql(tableAlias) {
      if (!effectiveCampusId) return { clause: '', params: [] };
      return { clause: ` AND ${tableAlias}.campus_id = $1`, params: [effectiveCampusId] };
    }

    const sc = campusSql('s');
    const cc = campusSql('c');
    const uc = campusSql('u');

    const totalStudents = (await pool.query(
      `SELECT COUNT(*) as count FROM students s WHERE s.is_active = 1${sc.clause}`, sc.params
    )).rows[0].count;

    const totalClasses = (await pool.query(
      `SELECT COUNT(*) as count FROM classes c WHERE c.is_active = 1${cc.clause}`, cc.params
    )).rows[0].count;

    const totalTeachers = (await pool.query(
      `SELECT COUNT(*) as count FROM users u WHERE u.role = 'teacher' AND u.is_active = 1${uc.clause}`, uc.params
    )).rows[0].count;

    let todayAttendanceRows;
    if (effectiveCampusId) {
      todayAttendanceRows = (await pool.query(`
        SELECT a.status, COUNT(*) as count
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE a.date = $1 AND s.campus_id = $2
        GROUP BY a.status
      `, [today, effectiveCampusId])).rows;
    } else {
      todayAttendanceRows = (await pool.query(`
        SELECT a.status, COUNT(*) as count
        FROM attendance a WHERE a.date = $1
        GROUP BY a.status
      `, [today])).rows;
    }

    const attendanceSummary = { present: 0, late: 0, absent: 0, total: 0 };
    todayAttendanceRows.forEach(a => {
      if (a.status === 'present' || a.status === 'late') attendanceSummary.present += parseInt(a.count);
      if (a.status === 'late') attendanceSummary.late = parseInt(a.count);
      if (a.status === 'absent') attendanceSummary.absent += parseInt(a.count);
      attendanceSummary.total += parseInt(a.count);
    });

    let feeSummary;
    if (effectiveCampusId) {
      feeSummary = (await pool.query(`
        SELECT
          COUNT(*) as total,
          COALESCE(SUM(CASE WHEN fv.status = 'paid' THEN fv.total_amount ELSE 0 END), 0) as paid,
          COALESCE(SUM(CASE WHEN fv.status != 'paid' THEN fv.total_amount ELSE 0 END), 0) as pending,
          COUNT(CASE WHEN fv.status = 'paid' THEN 1 END) as paid_count,
          COUNT(CASE WHEN fv.status != 'paid' THEN 1 END) as pending_count
        FROM fee_vouchers fv
        JOIN students s ON fv.student_id = s.id
        WHERE fv.month = $1 AND fv.year = $2 AND s.campus_id = $3
      `, [currentMonth, currentYear, effectiveCampusId])).rows[0];
    } else {
      feeSummary = (await pool.query(`
        SELECT
          COUNT(*) as total,
          COALESCE(SUM(CASE WHEN fv.status = 'paid' THEN fv.total_amount ELSE 0 END), 0) as paid,
          COALESCE(SUM(CASE WHEN fv.status != 'paid' THEN fv.total_amount ELSE 0 END), 0) as pending,
          COUNT(CASE WHEN fv.status = 'paid' THEN 1 END) as paid_count,
          COUNT(CASE WHEN fv.status != 'paid' THEN 1 END) as pending_count
        FROM fee_vouchers fv
        WHERE fv.month = $1 AND fv.year = $2
      `, [currentMonth, currentYear])).rows[0];
    }

    const recentStudents = (await pool.query(`
      SELECT s.id, s.student_id, s.first_name, s.last_name, s.father_name, s.admission_date,
             c.name as class_name, sc.name as campus_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN campuses sc ON s.campus_id = sc.id
      WHERE s.is_active = 1${sc.clause}
      ORDER BY s.created_at DESC LIMIT 5
    `, sc.params)).rows;

    let announcements;
    if (effectiveCampusId) {
      announcements = (await pool.query(`
        SELECT * FROM announcements
        WHERE is_active = 1 AND (campus_id IS NULL OR campus_id = $1)
        ORDER BY created_at DESC LIMIT 5
      `, [effectiveCampusId])).rows;
    } else {
      announcements = (await pool.query(`
        SELECT * FROM announcements WHERE is_active = 1
        ORDER BY created_at DESC LIMIT 5
      `)).rows;
    }

    let monthlyAttendance;
    if (effectiveCampusId) {
      monthlyAttendance = (await pool.query(`
        SELECT TO_CHAR(a.date::date, 'YYYY-MM') as month,
               SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) as present_count,
               COUNT(*) as total
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE a.date >= (CURRENT_DATE - INTERVAL '6 months')::text AND s.campus_id = $1
        GROUP BY TO_CHAR(a.date::date, 'YYYY-MM')
        ORDER BY month ASC
      `, [effectiveCampusId])).rows;
    } else {
      monthlyAttendance = (await pool.query(`
        SELECT TO_CHAR(a.date::date, 'YYYY-MM') as month,
               SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) as present_count,
               COUNT(*) as total
        FROM attendance a
        WHERE a.date >= (CURRENT_DATE - INTERVAL '6 months')::text
        GROUP BY TO_CHAR(a.date::date, 'YYYY-MM')
        ORDER BY month ASC
      `)).rows;
    }

    let campusStats = null;
    if (req.user.role === 'super_admin' && !effectiveCampusId) {
      campusStats = (await pool.query(`
        SELECT sc.name, sc.slug,
               (SELECT COUNT(*) FROM students s WHERE s.campus_id = sc.id AND s.is_active = 1) as students,
               (SELECT COUNT(*) FROM users u WHERE u.campus_id = sc.id AND u.role = 'teacher' AND u.is_active = 1) as teachers
        FROM campuses sc WHERE sc.is_active = 1
      `)).rows;
    }

    res.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          totalClasses,
          totalTeachers,
          attendanceRate: attendanceSummary.total > 0 ? ((attendanceSummary.present / attendanceSummary.total) * 100).toFixed(1) : 0,
          todayAttendance: attendanceSummary,
          feeSummary
        },
        recentStudents,
        announcements,
        monthlyAttendance,
        campusStats
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
