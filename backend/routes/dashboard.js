const express = require('express');
const { getDb } = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    let campusFilter = '';
    const params = [];

    if (req.user.role !== 'super_admin') {
      campusFilter = ' AND s.campus_id = ?';
      params.push(req.user.campus_id);
    }

    const totalStudents = db.prepare(`SELECT COUNT(*) as count FROM students s WHERE s.is_active = 1${campusFilter}`).get(...params).count;
    const totalClasses = db.prepare(`SELECT COUNT(*) as count FROM classes c WHERE c.is_active = 1${req.user.role !== 'super_admin' ? ' AND c.campus_id = ?' : ''}`).get(...(req.user.role !== 'super_admin' ? [req.user.campus_id] : [])).count;
    const totalTeachers = db.prepare(`SELECT COUNT(*) as count FROM users u WHERE u.role = 'teacher' AND u.is_active = 1${req.user.role !== 'super_admin' ? ' AND u.campus_id = ?' : ''}`).get(...(req.user.role !== 'super_admin' ? [req.user.campus_id] : [])).count;

    let attendanceFilter = campusFilter.replace('s.campus_id', 's.campus_id');
    const todayAttendance = db.prepare(`
      SELECT a.status, COUNT(*) as count
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE a.date = ?${attendanceFilter}
      GROUP BY a.status
    `).all(today, ...(req.user.role !== 'super_admin' ? [req.user.campus_id] : []));

    const attendanceSummary = { present: 0, late: 0, absent: 0, total: 0 };
    todayAttendance.forEach(a => {
      if (a.status === 'present' || a.status === 'late') attendanceSummary.present += a.count;
      if (a.status === 'late') attendanceSummary.late = a.count;
      if (a.status === 'absent') attendanceSummary.absent = a.count;
      attendanceSummary.total += a.count;
    });

    const feeSummary = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as paid,
        SUM(CASE WHEN status != 'paid' THEN total_amount ELSE 0 END) as pending,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN status != 'paid' THEN 1 END) as pending_count
      FROM fee_vouchers
      WHERE month = ? AND year = ?
    `).get(currentMonth, currentYear);

    const recentStudents = db.prepare(`
      SELECT s.id, s.student_id, s.first_name, s.last_name, s.father_name, s.admission_date,
             c.name as class_name, sc.name as campus_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN campuses sc ON s.campus_id = sc.id
      WHERE s.is_active = 1${campusFilter}
      ORDER BY s.created_at DESC LIMIT 5
    `).all(...(req.user.role !== 'super_admin' ? [req.user.campus_id] : []));

    const announcements = db.prepare(`
      SELECT * FROM announcements
      WHERE is_active = 1 AND (campus_id IS NULL${req.user.role !== 'super_admin' ? ' OR campus_id = ?' : ''})
      ORDER BY created_at DESC LIMIT 5
    `).all(...(req.user.role !== 'super_admin' ? [req.user.campus_id] : []));

    const monthlyAttendance = db.prepare(`
      SELECT strftime('%Y-%m', date) as month,
             SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) as present_count,
             COUNT(*) as total
      FROM attendance
      WHERE date >= date('now', '-6 months')
      GROUP BY month
      ORDER BY month ASC
    `).all();

    const campusStats = req.user.role === 'super_admin' ? db.prepare(`
      SELECT sc.name, sc.slug,
             (SELECT COUNT(*) FROM students s WHERE s.campus_id = sc.id AND s.is_active = 1) as students,
             (SELECT COUNT(*) FROM users u WHERE u.campus_id = sc.id AND u.role = 'teacher' AND u.is_active = 1) as teachers
      FROM campuses sc WHERE sc.is_active = 1
    `).all() : null;

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
