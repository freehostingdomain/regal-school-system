const express = require('express');
const { getDb } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const { campus_id, class_id, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE s.is_active = 1';
    const params = [];

    if (req.user.role !== 'super_admin') {
      where += ' AND s.campus_id = ?';
      params.push(req.user.campus_id);
    } else if (campus_id) {
      where += ' AND s.campus_id = ?';
      params.push(campus_id);
    }

    if (class_id) {
      where += ' AND s.class_id = ?';
      params.push(class_id);
    }

    if (search) {
      where += ' AND (s.student_id LIKE ? OR s.first_name LIKE ? OR s.last_name LIKE ? OR s.father_name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    const countResult = await db.prepare(`SELECT COUNT(*) as total FROM students s ${where}`).get(...params);

    const students = await db.prepare(`
      SELECT s.*, c.name as class_name, sec.name as section_name, sc.name as campus_name,
             p.name as parent_name, p.phone_primary as parent_phone
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN campuses sc ON s.campus_id = sc.id
      LEFT JOIN parents p ON s.parent_id = p.id
      ${where}
      ORDER BY s.student_id ASC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), parseInt(offset));

    res.json({
      success: true,
      data: students,
      meta: {
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const student = await db.prepare(`
      SELECT s.*, c.name as class_name, sec.name as section_name, sc.name as campus_name,
             p.name as parent_name, p.phone_primary as parent_phone, p.email as parent_email,
             p.occupation as parent_occupation
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN campuses sc ON s.campus_id = sc.id
      LEFT JOIN parents p ON s.parent_id = p.id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const attendance = await db.prepare(`
      SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC LIMIT 30
    `).all(req.params.id);

    const feeVouchers = await db.prepare(`
      SELECT * FROM fee_vouchers WHERE student_id = ? ORDER BY year DESC, month DESC LIMIT 12
    `).all(req.params.id);

    const results = await db.prepare(`
      SELECT r.*, e.name as exam_name, sub.name as subject_name
      FROM results r
      JOIN exams e ON r.exam_id = e.id
      LEFT JOIN subjects sub ON r.subject_id = sub.id
      WHERE r.student_id = ?
      ORDER BY e.start_date DESC
    `).all(req.params.id);

    res.json({
      success: true,
      data: { ...student, attendance, feeVouchers, results }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authenticate, authorize('super_admin', 'campus_admin', 'teacher', 'accountant'), activityLogger('Student'), async (req, res) => {
  try {
    const db = getDb();
    const {
      first_name, last_name, father_name, father_cnic, b_form_number,
      date_of_birth, gender, blood_group, address, city,
      emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
      medical_conditions, admission_date, class_id, section_id, parent_id, previous_school, campus_id
    } = req.body;

    if (!first_name || !last_name || !father_name || !admission_date) {
      return res.status(400).json({ success: false, message: 'First name, last name, father name, and admission date are required.' });
    }

    const studentCount = await db.prepare('SELECT COUNT(*) as count FROM students').get();
    const year = new Date().getFullYear();
    const studentId = `RMS-${year}-${String(studentCount.count + 1).padStart(3, '0')}`;

    let targetCampus = req.user.campus_id;
    if (req.user.role === 'super_admin') {
      targetCampus = campus_id || 1;
    }
    if (!targetCampus) {
      targetCampus = 1;
    }

    const finalClassId = class_id && class_id !== '' ? class_id : null;
    const finalSectionId = section_id && section_id !== '' ? section_id : null;
    const finalParentId = parent_id && parent_id !== '' ? parent_id : null;

    const result = await db.prepare(`
      INSERT INTO students (student_id, campus_id, first_name, last_name, father_name,
        father_cnic, b_form_number, date_of_birth, gender, blood_group, address, city,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
        medical_conditions, admission_date, class_id, section_id, parent_id, previous_school)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      studentId, targetCampus, first_name, last_name, father_name,
      father_cnic || null, b_form_number || null, date_of_birth || null, gender || 'male',
      blood_group || null, address || null, city || 'Taxila',
      emergency_contact_name || null, emergency_contact_phone || null, emergency_contact_relation || null,
      medical_conditions || null, admission_date, finalClassId, finalSectionId, finalParentId,
      previous_school || null
    );

    const student = await db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, message: 'Student created successfully.', data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', authenticate, authorize('super_admin', 'campus_admin', 'teacher', 'accountant'), activityLogger('Student'), async (req, res) => {
  try {
    const db = getDb();
    const {
      first_name, last_name, father_name, father_cnic, b_form_number,
      date_of_birth, gender, blood_group, address, city,
      emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
      medical_conditions, class_id, section_id, parent_id, is_active
    } = req.body;

    await db.prepare(`
      UPDATE students SET
        first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name),
        father_name = COALESCE(?, father_name), father_cnic = COALESCE(?, father_cnic),
        b_form_number = COALESCE(?, b_form_number), date_of_birth = COALESCE(?, date_of_birth),
        gender = COALESCE(?, gender), blood_group = COALESCE(?, blood_group),
        address = COALESCE(?, address), city = COALESCE(?, city),
        emergency_contact_name = COALESCE(?, emergency_contact_name),
        emergency_contact_phone = COALESCE(?, emergency_contact_phone),
        emergency_contact_relation = COALESCE(?, emergency_contact_relation),
        medical_conditions = COALESCE(?, medical_conditions),
        class_id = COALESCE(?, class_id), section_id = COALESCE(?, section_id),
        parent_id = COALESCE(?, parent_id), is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(
      first_name, last_name, father_name, father_cnic, b_form_number,
      date_of_birth, gender, blood_group, address, city,
      emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
      medical_conditions, class_id, section_id, parent_id, is_active, req.params.id
    );

    const student = await db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
    res.json({ success: true, message: 'Student updated successfully.', data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', authenticate, authorize('super_admin', 'campus_admin', 'teacher', 'accountant'), activityLogger('Student'), async (req, res) => {
  try {
    const db = getDb();
    await db.prepare('UPDATE students SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Student deactivated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
