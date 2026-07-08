const express = require('express');
const { getDb, getPool } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const { class_id, status, campus_id } = req.query;

    let query = `
      SELECT e.*, c.name as class_name, sc.name as campus_name,
             (SELECT COUNT(DISTINCT r.student_id) FROM results r WHERE r.exam_id = e.id) as students_entered
      FROM exams e
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN campuses sc ON e.campus_id = sc.id
      WHERE e.is_active = 1
    `;
    const params = [];
    let paramIdx = 1;

    if (req.user.role !== 'super_admin' && req.user.role !== 'accountant') {
      query += ` AND e.campus_id = $${paramIdx++}`;
      params.push(req.user.campus_id);
    } else if (campus_id) {
      query += ` AND e.campus_id = $${paramIdx++}`;
      params.push(campus_id);
    }

    if (class_id) { query += ` AND e.class_id = $${paramIdx++}`; params.push(class_id); }
    if (status) { query += ` AND e.status = $${paramIdx++}`; params.push(status); }

    query += ' ORDER BY e.created_at DESC';
    const exams = (await pool.query(query, params)).rows;
    res.json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/list/subjects', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const campusId = req.query.campus_id || req.user.campus_id;
    let query = 'SELECT id, name, code, campus_id FROM subjects';
    const params = [];
    if (campusId) {
      query += ' WHERE campus_id = $1';
      params.push(campusId);
    }
    query += ' ORDER BY name';
    const subjects = (await pool.query(query, params)).rows;
    res.json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authenticate, authorize('super_admin', 'campus_admin', 'teacher'), activityLogger('Exam'), async (req, res) => {
  try {
    const pool = getPool();
    const { name, type, class_id, campus_id, total_marks, passing_marks, start_date, end_date, subject_ids } = req.body;

    if (!name || !class_id) {
      return res.status(400).json({ success: false, message: 'Name and class are required.' });
    }

    const targetCampus = req.user.role === 'super_admin' ? (campus_id || req.user.campus_id) : req.user.campus_id;

    const result = await pool.query(`
      INSERT INTO exams (campus_id, class_id, name, type, total_marks, passing_marks, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
    `, [targetCampus, class_id, name, type || 'midterm', total_marks || 100, passing_marks || 40, start_date || null, end_date || null]);

    const examId = result.rows[0].id;

    if (subject_ids && subject_ids.length > 0) {
      for (const sub of subject_ids) {
        await pool.query(`
          INSERT INTO exam_subjects (exam_id, subject_id, max_marks, passing_marks)
          VALUES ($1, $2, $3, $4)
        `, [examId, sub.id, sub.max_marks || 100, sub.passing_marks || 40]);
      }
    }

    const exam = await pool.query('SELECT * FROM exams WHERE id = $1', [examId]);
    res.status(201).json({ success: true, message: 'Exam created.', data: exam.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', authenticate, authorize('super_admin', 'campus_admin', 'teacher'), activityLogger('Exam'), async (req, res) => {
  try {
    const pool = getPool();
    const { name, type, total_marks, passing_marks, start_date, end_date, status } = req.body;

    await pool.query(`
      UPDATE exams SET name = COALESCE($1, name), type = COALESCE($2, type),
        total_marks = COALESCE($3, total_marks), passing_marks = COALESCE($4, passing_marks),
        start_date = COALESCE($5, start_date), end_date = COALESCE($6, end_date),
        status = COALESCE($7, status)
      WHERE id = $8
    `, [name, type, total_marks, passing_marks, start_date, end_date, status, req.params.id]);

    const exam = await pool.query('SELECT * FROM exams WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Exam updated.', data: exam.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', authenticate, authorize('super_admin', 'campus_admin'), activityLogger('Exam'), async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('UPDATE exams SET is_active = 0 WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Exam deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Datesheet CRUD
router.get('/:id/datesheet', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const rows = (await pool.query(`
      SELECT ed.*, s.name as subject_name, s.code as subject_code, c.name as class_name
      FROM exam_datesheets ed
      JOIN subjects s ON ed.subject_id = s.id
      LEFT JOIN classes c ON ed.class_id = c.id
      WHERE ed.exam_id = $1
      ORDER BY ed.class_id, ed.exam_date, ed.start_time
    `, [req.params.id])).rows;
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/datesheet', authenticate, authorize('super_admin', 'campus_admin', 'teacher'), async (req, res) => {
  try {
    const pool = getPool();
    const { entries } = req.body;
    if (!entries || !entries.length) return res.status(400).json({ success: false, message: 'No entries provided.' });

    for (const entry of entries) {
      await pool.query(`
        INSERT INTO exam_datesheets (exam_id, subject_id, class_id, exam_date, start_time, end_time, room_number, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (exam_id, subject_id, class_id)
        DO UPDATE SET exam_date = $4, start_time = $5, end_time = $6, room_number = $7, notes = $8
      `, [req.params.id, entry.subject_id, entry.class_id || null, entry.exam_date, entry.start_time || '09:00', entry.end_time || '12:00', entry.room_number || '', entry.notes || '']);
    }
    res.json({ success: true, message: 'Datesheet saved.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id/datesheet', authenticate, authorize('super_admin', 'campus_admin', 'teacher'), async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('DELETE FROM exam_datesheets WHERE exam_id = $1', [req.params.id]);
    res.json({ success: true, message: 'Datesheet deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/toggle-datesheet', authenticate, authorize('super_admin', 'campus_admin', 'teacher'), async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      'UPDATE exams SET is_datesheet_live = CASE WHEN is_datesheet_live = 1 THEN 0 ELSE 1 END WHERE id = $1 RETURNING is_datesheet_live',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Exam not found.' });
    res.json({ success: true, is_live: result.rows[0].is_datesheet_live === 1 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/toggle-results', authenticate, authorize('super_admin', 'campus_admin', 'teacher'), async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      'UPDATE exams SET is_results_live = CASE WHEN is_results_live = 1 THEN 0 ELSE 1 END WHERE id = $1 RETURNING is_results_live',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Exam not found.' });
    res.json({ success: true, is_live: result.rows[0].is_results_live === 1 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Parent-facing: get live datesheets
router.get('/live/datesheets', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const query = `
      SELECT e.*, c.name as class_name, sc.name as campus_name
      FROM exams e
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN campuses sc ON e.campus_id = sc.id
      WHERE e.is_active = 1 AND e.is_datesheet_live = 1
      ORDER BY e.start_date ASC
    `;
    const exams = (await pool.query(query)).rows;
    res.json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Parent-facing: get live results
router.get('/live/results', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const query = `
      SELECT e.*, c.name as class_name, sc.name as campus_name
      FROM exams e
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN campuses sc ON e.campus_id = sc.id
      WHERE e.is_active = 1 AND e.is_results_live = 1
      ORDER BY e.start_date DESC
    `;
    const exams = (await pool.query(query)).rows;
    res.json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/subjects', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const subjects = (await pool.query(`
      SELECT es.*, s.name as subject_name, s.code as subject_code
      FROM exam_subjects es
      JOIN subjects s ON es.subject_id = s.id
      WHERE es.exam_id = $1
    `, [req.params.id])).rows;
    res.json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/subjects', authenticate, authorize('super_admin', 'campus_admin'), async (req, res) => {
  try {
    const pool = getPool();
    const { subject_id, max_marks, passing_marks } = req.body;
    await pool.query(`
      INSERT INTO exam_subjects (exam_id, subject_id, max_marks, passing_marks)
      VALUES ($1, $2, $3, $4) ON CONFLICT (exam_id, subject_id) DO NOTHING
    `, [req.params.id, subject_id, max_marks || 100, passing_marks || 40]);
    res.json({ success: true, message: 'Subject added to exam.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/students', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const exam = (await pool.query('SELECT * FROM exams WHERE id = $1', [req.params.id])).rows[0];
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });

    const students = (await pool.query(`
      SELECT s.id, s.student_id as student_code, s.first_name, s.last_name
      FROM students s
      WHERE s.class_id = $1 AND s.is_active = 1
      ORDER BY s.student_id ASC
    `, [exam.class_id])).rows;

    const subjects = (await pool.query(`
      SELECT es.*, sub.name as subject_name
      FROM exam_subjects es
      JOIN subjects sub ON es.subject_id = sub.id
      WHERE es.exam_id = $1
    `, [req.params.id])).rows;

    const existingMarks = (await pool.query(`
      SELECT * FROM results WHERE exam_id = $1
    `, [req.params.id])).rows;

    res.json({ success: true, data: { students, subjects, existingMarks, exam } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/marks', authenticate, authorize('super_admin', 'campus_admin', 'teacher'), activityLogger('Results'), async (req, res) => {
  try {
    const pool = getPool();
    const { marks } = req.body;

    if (!marks || !Array.isArray(marks)) {
      return res.status(400).json({ success: false, message: 'Marks array required.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const entry of marks) {
        const { student_id, subject_id, marks_obtained, remarks } = entry;

        const subject = (await client.query('SELECT * FROM exam_subjects WHERE exam_id = $1 AND subject_id = $2', [req.params.id, subject_id])).rows[0];
        if (!subject) continue;

        let grade = 'F';
        const pct = subject.max_marks > 0 ? (marks_obtained / subject.max_marks) * 100 : 0;
        if (pct >= 80) grade = 'A+';
        else if (pct >= 70) grade = 'A';
        else if (pct >= 60) grade = 'B';
        else if (pct >= 50) grade = 'C';
        else if (pct >= 40) grade = 'D';

        await client.query(`
          INSERT INTO results (exam_id, student_id, subject_id, marks_obtained, grade, remarks, entered_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (exam_id, student_id, subject_id)
          DO UPDATE SET marks_obtained = $4, grade = $5, remarks = $6, entered_by = $7
        `, [req.params.id, student_id, subject_id, marks_obtained, grade, remarks || '', req.user.id]);
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    res.json({ success: true, message: 'Marks saved successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id/report', authenticate, async (req, res) => {
  try {
    const pool = getPool();
    const exam = (await pool.query(`
      SELECT e.*, c.name as class_name, sc.name as campus_name
      FROM exams e
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN campuses sc ON e.campus_id = sc.id
      WHERE e.id = $1
    `, [req.params.id])).rows[0];

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });

    const examClassId = exam.class_id;
    
    // Get students in exam's class
    let studentsQuery = `
      SELECT DISTINCT s.id, s.student_id as student_code, s.first_name, s.last_name, s.father_name, s.parent_id
      FROM students s
      WHERE s.class_id = $1 AND s.is_active = 1
    `;
    let studentsParams = [examClassId];
    
    // If parent is viewing, also include their children even if in different class
    if (req.user.role === 'parent') {
      const parent = (await pool.query('SELECT id FROM parents WHERE user_id = $1', [req.user.id])).rows[0];
      if (parent) {
        studentsQuery += ` OR (s.parent_id = $2 AND s.is_active = 1)`;
        studentsParams.push(parent.id);
      }
    }
    studentsQuery += ' ORDER BY s.student_id ASC';
    
    const students = (await pool.query(studentsQuery, studentsParams)).rows;

    const subjects = (await pool.query(`
      SELECT es.*, sub.name as subject_name
      FROM exam_subjects es
      JOIN subjects sub ON es.subject_id = sub.id
      WHERE es.exam_id = $1
    `, [req.params.id])).rows;

    const allMarks = (await pool.query(`
      SELECT r.*, s.first_name, s.last_name, s.student_id as student_code
      FROM results r
      JOIN students s ON r.student_id = s.id
      WHERE r.exam_id = $1
    `, [req.params.id])).rows;

    const reportData = students.map(student => {
      const studentMarks = allMarks.filter(m => m.student_id === student.id);
      let totalObtained = 0;
      let totalMax = 0;
      const subjectResults = subjects.map(sub => {
        const mark = studentMarks.find(m => m.subject_id === sub.subject_id);
        const obtained = mark ? mark.marks_obtained : 0;
        totalObtained += obtained;
        totalMax += sub.max_marks;
        return {
          subject: sub.subject_name,
          max_marks: sub.max_marks,
          marks_obtained: obtained,
          grade: mark ? mark.grade : '-'
        };
      });
      const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : 0;
      let overallGrade = 'F';
      if (percentage >= 80) overallGrade = 'A+';
      else if (percentage >= 70) overallGrade = 'A';
      else if (percentage >= 60) overallGrade = 'B';
      else if (percentage >= 50) overallGrade = 'C';
      else if (percentage >= 40) overallGrade = 'D';

      return {
        ...student,
        subjects: subjectResults,
        totalObtained,
        totalMax,
        percentage,
        overallGrade
      };
    });

    reportData.sort((a, b) => b.percentage - a.percentage);
    reportData.forEach((r, i) => r.position = i + 1);

    res.json({ success: true, data: { exam, subjects, reportData } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
