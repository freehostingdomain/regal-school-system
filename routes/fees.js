const express = require('express');
const { getDb, getPool } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

const router = express.Router();

router.get('/structures', authenticate, async (req, res) => {
  try {
    const db = getDb();
    let query = `
      SELECT fs.*, c.name as class_name, c.campus_id, sc.name as campus_name
      FROM fee_structures fs
      JOIN classes c ON fs.class_id = c.id
      LEFT JOIN campuses sc ON c.campus_id = sc.id
      WHERE fs.is_active = 1
    `;
    const params = [];
    if (req.user.role !== 'super_admin' && req.user.role !== 'accountant') {
      query += ' AND c.campus_id = ?';
      params.push(req.user.campus_id);
    } else if (req.query.campus_id) {
      query += ' AND c.campus_id = ?';
      params.push(req.query.campus_id);
    }
    query += ' ORDER BY c.sort_order ASC, c.name ASC';
    const structures = await db.prepare(query).all(...params);
    res.json({ success: true, data: structures });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/structures', authenticate, authorize('super_admin', 'campus_admin', 'accountant'), activityLogger('Fee Structure'), async (req, res) => {
  try {
    const db = getDb();
    const { class_id, name, tuition_fee, exam_fee, transport_fee, lab_fee, activity_fee } = req.body;
    if (!class_id || !name) {
      return res.status(400).json({ success: false, message: 'Class and name are required.' });
    }
    const result = await db.prepare(`
      INSERT INTO fee_structures (class_id, name, tuition_fee, exam_fee, transport_fee, lab_fee, activity_fee)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(class_id, name, tuition_fee || 0, exam_fee || 0, transport_fee || 0, lab_fee || 0, activity_fee || 0);
    const structure = await db.prepare('SELECT * FROM fee_structures WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, message: 'Fee structure created.', data: structure });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/structures/:id', authenticate, authorize('super_admin', 'campus_admin', 'accountant'), activityLogger('Fee Structure'), async (req, res) => {
  try {
    const db = getDb();
    const { name, tuition_fee, exam_fee, transport_fee, lab_fee, activity_fee } = req.body;
    await db.prepare(`
      UPDATE fee_structures SET
        name = COALESCE(?, name), tuition_fee = COALESCE(?, tuition_fee),
        exam_fee = COALESCE(?, exam_fee), transport_fee = COALESCE(?, transport_fee),
        lab_fee = COALESCE(?, lab_fee), activity_fee = COALESCE(?, activity_fee)
      WHERE id = ?
    `).run(name, tuition_fee, exam_fee, transport_fee, lab_fee, activity_fee, req.params.id);
    const structure = await db.prepare('SELECT * FROM fee_structures WHERE id = ?').get(req.params.id);
    res.json({ success: true, message: 'Fee structure updated.', data: structure });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/structures/:id', authenticate, authorize('super_admin', 'campus_admin', 'accountant'), activityLogger('Fee Structure'), async (req, res) => {
  try {
    const db = getDb();
    await db.prepare('UPDATE fee_structures SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Fee structure deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/vouchers', authenticate, async (req, res) => {
  try {
    const db = getDb();
    const { status, month, year, student_id } = req.query;

    let query = `
      SELECT fv.*, s.student_id as student_code, s.first_name, s.last_name, s.father_name,
             c.name as class_name
      FROM fee_vouchers fv
      JOIN students s ON fv.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramIdx = 1;

    if (req.user.role === 'parent') {
      const student = await db.prepare('SELECT id FROM students WHERE parent_id = (SELECT id FROM parents WHERE user_id = ?)').get(req.user.id);
      if (student) {
        query += ` AND fv.student_id = $${paramIdx++}`;
        params.push(student.id);
      }
    } else if (req.user.role === 'student') {
      query += ` AND fv.student_id = $${paramIdx++}`;
      params.push(req.user.id);
    } else if (req.query.campus_id) {
      query += ` AND s.campus_id = $${paramIdx++}`;
      params.push(req.query.campus_id);
    } else if (req.user.role !== 'super_admin' && req.user.role !== 'accountant' && req.user.campus_id) {
      query += ` AND s.campus_id = $${paramIdx++}`;
      params.push(req.user.campus_id);
    }

    if (status) { query += ` AND fv.status = $${paramIdx++}`; params.push(status); }
    if (month) { query += ` AND fv.month = $${paramIdx++}`; params.push(month); }
    if (year) { query += ` AND fv.year = $${paramIdx++}`; params.push(year); }
    if (student_id) { query += ` AND fv.student_id = $${paramIdx++}`; params.push(student_id); }

    query += ' ORDER BY fv.year DESC, fv.month DESC, s.student_id ASC';
    const vouchers = await db.prepare(query).all(...params);

    const summary = {
      total: vouchers.length,
      pending: vouchers.filter(v => v.status === 'pending').length,
      paid: vouchers.filter(v => v.status === 'paid').length,
      partial: vouchers.filter(v => v.status === 'partial').length,
      overdue: vouchers.filter(v => v.status === 'overdue').length,
      total_amount: vouchers.reduce((sum, v) => sum + v.total_amount, 0),
      paid_amount: vouchers.filter(v => v.status === 'paid').reduce((sum, v) => sum + v.total_amount, 0),
      pending_amount: vouchers.filter(v => v.status !== 'paid').reduce((sum, v) => sum + v.total_amount, 0),
    };

    res.json({ success: true, data: vouchers, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/vouchers/generate', authenticate, authorize('super_admin', 'campus_admin', 'teacher', 'accountant'), activityLogger('Fee Voucher'), async (req, res) => {
  try {
    const { month, year, campus_id } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required.' });
    }

    const pool = getPool();
    let studentQuery = 'SELECT s.*, c.monthly_fee, c.exam_fee FROM students s JOIN classes c ON s.class_id = c.id WHERE s.is_active = 1';
    const params = [];
    let paramIdx = 1;

    if (req.user.role !== 'super_admin' && campus_id) {
      studentQuery += ` AND s.campus_id = $${paramIdx++}`;
      params.push(campus_id);
    } else if (req.user.role !== 'super_admin') {
      studentQuery += ` AND s.campus_id = $${paramIdx++}`;
      params.push(req.user.campus_id);
    }

    const studentsResult = await pool.query(studentQuery, params);
    const students = studentsResult.rows;
    let generated = 0;

    const countResult = await pool.query('SELECT COUNT(*) as c FROM fee_vouchers WHERE month = $1 AND year = $2', [month, year]);
    let count = parseInt(countResult.rows[0].c);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const student of students) {
        count++;
        const voucherNum = `RMS-FV-${year}-${String(count).padStart(4, '0')}`;
        const tuition = student.monthly_fee || 0;
        const exam = (student.exam_fee || 0) / 3;
        const transport = 0;
        const total = tuition + exam + transport;
        const dueDate = `${year}-${String(month).padStart(2, '0')}-10`;

        await client.query(`
          INSERT INTO fee_vouchers (student_id, voucher_number, month, year, tuition_fee, exam_fee, transport_fee, total_amount, due_date)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (voucher_number) DO NOTHING
        `, [student.id, voucherNum, month, year, tuition, exam, transport, total, dueDate]);
        generated++;
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    res.json({ success: true, message: `Generated ${generated} fee vouchers.`, generated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payments', authenticate, authorize('super_admin', 'campus_admin', 'teacher', 'accountant'), activityLogger('Fee Payment'), async (req, res) => {
  try {
    const db = getDb();
    const pool = getPool();
    const { voucher_id, amount, payment_method, transaction_id, notes } = req.body;

    const voucher = await db.prepare('SELECT * FROM fee_vouchers WHERE id = ?').get(voucher_id);
    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Voucher not found.' });
    }

    const paymentCount = await db.prepare('SELECT COUNT(*) as c FROM fee_payments').get();
    const receiptNumber = `RMS-REC-${Date.now()}-${String(paymentCount.c + 1).padStart(3, '0')}`;

    await db.prepare(`
      INSERT INTO fee_payments (voucher_id, amount, payment_method, transaction_id, received_by, receipt_number, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(voucher_id, amount, payment_method || 'cash', transaction_id, req.user.id, receiptNumber, notes);

    const totalPaid = await db.prepare('SELECT SUM(amount) as total FROM fee_payments WHERE voucher_id = ?').get(voucher_id);
    const paidAmount = totalPaid.total || 0;

    let newStatus = 'pending';
    if (paidAmount >= voucher.total_amount) newStatus = 'paid';
    else if (paidAmount > 0) newStatus = 'partial';

    await db.prepare('UPDATE fee_vouchers SET status = ? WHERE id = ?').run(newStatus, voucher_id);

    res.json({
      success: true,
      message: 'Payment recorded successfully.',
      data: { receipt_number: receiptNumber, total_paid: paidAmount, new_status: newStatus }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/reports', authenticate, authorize('super_admin', 'campus_admin', 'teacher', 'accountant'), async (req, res) => {
  try {
    const pool = getPool();
    const { month, year } = req.query;
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();

    let query = `
      SELECT s.campus_id, sc.name as campus_name,
             COUNT(fv.id) as total_vouchers,
             SUM(fv.total_amount) as total_amount,
             SUM(CASE WHEN fv.status = 'paid' THEN fv.total_amount ELSE 0 END) as paid_amount,
             SUM(CASE WHEN fv.status != 'paid' THEN fv.total_amount ELSE 0 END) as pending_amount,
             COUNT(CASE WHEN fv.status = 'paid' THEN 1 END) as paid_count,
             COUNT(CASE WHEN fv.status != 'paid' THEN 1 END) as pending_count
      FROM fee_vouchers fv
      JOIN students s ON fv.student_id = s.id
      JOIN campuses sc ON s.campus_id = sc.id
      WHERE fv.month = $1 AND fv.year = $2
    `;
    const params = [targetMonth, targetYear];
    let paramIdx = 3;

    if (req.query.campus_id) {
      query += ` AND s.campus_id = $${paramIdx++}`;
      params.push(req.query.campus_id);
    } else if (req.user.role !== 'super_admin' && req.user.role !== 'accountant' && req.user.campus_id) {
      query += ` AND s.campus_id = $${paramIdx++}`;
      params.push(req.user.campus_id);
    }

    query += ' GROUP BY s.campus_id, sc.name';
    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows, month: targetMonth, year: targetYear });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
