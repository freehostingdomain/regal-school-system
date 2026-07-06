const express = require('express');
const { getDb, getPool } = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    let campusFilter = '';
    let paramIdx = 1;
    const params = [];

    if (req.user.role !== 'super_admin') {
      campusFilter = ` AND s.campus_id = $${paramIdx++}`;
      params.push(req.user.campus_id);
    }

    const totalStudents = (await pool.query(
      `SELECT COUNT(*) as count FROM students s WHERE s.is_active = 1${campusFilter}`, params
    )).rows[0].count;

    const campusParams = req.user.role !== 'super_admin' ? [req.user.campus_id] : [];
    const campusFilterAlt = req.user.role !== 'super_admin' ? ` AND c.campus_id = $1` : '';

    const totalClasses = (await pool.query(
      `SELECT COUNT(*) as count FROM classes c WHERE c.is_active = 1${campusFilterAlt}`, campusParams
    )).rows[0].count;

    const teacherFilterAlt = req.user.role !== 'super_admin' ? ` AND u.campus_id = $1` : '';
    const totalTeachers = (await pool.query(
      `SELECT COUNT(*) as count FROM users u WHERE u.role = 'teacher' AND u.is_active = 1${teacherFilterAlt}`, campusParams
    )).rows[0].count;

    const attendanceParams = [today, ...(req.user.role !== 'super_admin' ? [req.user.campus_id] : [])];
    const attendanceFilterAlt = req.user.role !== 'super_admin' ? ` AND s.campus_id = $2` : '';
    const todayAttendance = (await pool.query(`
      SELECT a.status, COUNT(*) as count
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE a.date = $1${attendanceFilterAlt}
      GROUP BY a.status
    `, attendanceParams)).rows;

    const attendanceSummary = { present: 0, late: 0, absent: 0, total: 0 };
    todayAttendance.forEach(a => {
      if (a.status === 'present' || a.status === 'late') attendanceSummary.present += parseInt(a.count);
      if (a.status === 'late') attendanceSummary.late = parseInt(a.count);
      if (a.status === 'absent') attendanceSummary.absent = parseInt(a.count);
      attendanceSummary.total += parseInt(a.count);
    });

    let feeSql = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN fv.status = 'paid' THEN fv.total_amount ELSE 0 END) as paid,
        SUM(CASE WHEN fv.status != 'paid' THEN fv.total_amount ELSE 0 END) as pending,
        COUNT(CASE WHEN fv.status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN fv.status != 'paid' THEN 1 END) as pending_count
      FROM fee_vouchers fv`;
    const feeParams = [currentMonth, currentYear];
    if (req.user.role !== 'super_admin' && req.user.campus_id) {
      feeSql += ` JOIN students s ON fv.student_id = s.id WHERE fv.month = $1 AND fv.year = $2 AND s.campus_id = $3`;
      feeParams.push(req.user.campus_id);
    } else {
      feeSql += ` WHERE fv.month = $1 AND fv.year = $2`;
    }
    const feeSummary = (await pool.query(feeSql, feeParams)).rows[0];

    const recentStudentsParams = req.user.role !== 'super_admin' ? [req.user.campus_id] : [];
    const recentStudentsFilter = req.user.role !== 'super_admin' ? ` AND s.campus_id = $1` : '';
    const recentStudents = (await pool.query(`
      SELECT s.id, s.student_id, s.first_name, s.last_name, s.father_name, s.admission_date,
             c.name as class_name, sc.name as campus_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN campuses sc ON s.campus_id = sc.id
      WHERE s.is_active = 1${recentStudentsFilter}
      ORDER BY s.created_at DESC LIMIT 5
    `, recentStudentsParams)).rows;

    const announcementParams = req.user.role !== 'super_admin' ? [req.user.campus_id] : [];
    const announcementFilter = req.user.role !== 'super_admin' ? ` AND (a.campus_id IS NULL OR a.campus_id = $1)` : '';
    const announcements = (await pool.query(`
      SELECT * FROM announcements
      WHERE is_active = 1${announcementFilter}
      ORDER BY created_at DESC LIMIT 5
    `, announcementParams)).rows;

    let monthlyAttSql = `
      SELECT TO_CHAR(a.date::date, 'YYYY-MM') as month,
             SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) as present_count,
             COUNT(*) as total
      FROM attendance a`;
    const monthlyAttParams = [];
    if (req.user.role !== 'super_admin' && req.user.campus_id) {
      monthlyAttSql += ` JOIN students s ON a.student_id = s.id`;
      monthlyAttSql += ` WHERE a.date >= (CURRENT_DATE - INTERVAL '6 months')::text AND s.campus_id = $1`;
      monthlyAttParams.push(req.user.campus_id);
    } else {
      monthlyAttSql += ` WHERE a.date >= (CURRENT_DATE - INTERVAL '6 months')::text`;
    }
    monthlyAttSql += ` GROUP BY TO_CHAR(a.date::date, 'YYYY-MM') ORDER BY month ASC`;
    const monthlyAttendance = (await pool.query(monthlyAttSql, monthlyAttParams)).rows;

    let campusStats = null;
    if (req.user.role === 'super_admin') {
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
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
