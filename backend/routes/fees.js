const express = require('express');
const { getDb } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

const router = express.Router();

router.get('/structures', authenticate, (req, res) => {
  try {
    const db = getDb();
    const structures = db.prepare(`
      SELECT fs.*, c.name as class_name
      FROM fee_structures fs
      JOIN classes c ON fs.class_id = c.id
      WHERE fs.is_active = 1
      ORDER BY c.sort_order ASC
    `).all();
    res.json({ success: true, data: structures });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/vouchers', authenticate, (req, res) => {
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

    if (req.user.role === 'parent') {
      const student = db.prepare('SELECT id FROM students WHERE parent_id = (SELECT id FROM parents WHERE user_id = ?)').get(req.user.id);
      if (student) {
        query += ' AND fv.student_id = ?';
        params.push(student.id);
      }
    } else if (req.user.role === 'student') {
      query += ' AND fv.student_id = ?';
      params.push(req.user.id);
    } else if (req.user.role !== 'super_admin') {
      query += ' AND s.campus_id = ?';
      params.push(req.user.campus_id);
    }

    if (status) { query += ' AND fv.status = ?'; params.push(status); }
    if (month) { query += ' AND fv.month = ?'; params.push(month); }
    if (year) { query += ' AND fv.year = ?'; params.push(year); }
    if (student_id) { query += ' AND fv.student_id = ?'; params.push(student_id); }

    query += ' ORDER BY fv.year DESC, fv.month DESC, s.student_id ASC';
    const vouchers = db.prepare(query).all(...params);

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

router.post('/vouchers/generate', authenticate, authorize('super_admin', 'campus_admin', 'teacher', 'accountant'), activityLogger('Fee Voucher'), (req, res) => {
  try {
    const db = getDb();
    const { month, year, campus_id } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required.' });
    }

    let studentQuery = 'SELECT s.*, c.monthly_fee, c.exam_fee FROM students s JOIN classes c ON s.class_id = c.id WHERE s.is_active = 1';
    const params = [];

    if (req.user.role !== 'super_admin' && campus_id) {
      studentQuery += ' AND s.campus_id = ?';
      params.push(campus_id);
    } else if (req.user.role !== 'super_admin') {
      studentQuery += ' AND s.campus_id = ?';
      params.push(req.user.campus_id);
    }

    const students = db.prepare(studentQuery).all(...params);
    let generated = 0;

    const insertVoucher = db.prepare(`
      INSERT OR IGNORE INTO fee_vouchers (student_id, voucher_number, month, year, tuition_fee, exam_fee, transport_fee, total_amount, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const gen = db.transaction((studs) => {
      let count = db.prepare('SELECT COUNT(*) as c FROM fee_vouchers WHERE month = ? AND year = ?').get(month, year);
      for (const student of studs) {
        const voucherNum = `RMS-FV-${year}-${String(count.c + generated + 1).padStart(4, '0')}`;
        const tuition = student.monthly_fee || 0;
        const exam = (student.exam_fee || 0) / 3;
        const transport = 0;
        const total = tuition + exam + transport;
        insertVoucher.run(student.id, voucherNum, month, year, tuition, exam, transport, total, `${year}-${String(month).padStart(2, '0')}-10`);
        generated++;
      }
    });

    gen(students);
    res.json({ success: true, message: `Generated ${generated} fee vouchers.`, generated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/payments', authenticate, authorize('super_admin', 'campus_admin', 'teacher', 'accountant'), activityLogger('Fee Payment'), (req, res) => {
  try {
    const db = getDb();
    const { voucher_id, amount, payment_method, transaction_id, notes } = req.body;

    const voucher = db.prepare('SELECT * FROM fee_vouchers WHERE id = ?').get(voucher_id);
    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Voucher not found.' });
    }

    const paymentCount = db.prepare('SELECT COUNT(*) as c FROM fee_payments').get();
    const receiptNumber = `RMS-REC-${Date.now()}-${String(paymentCount.c + 1).padStart(3, '0')}`;

    db.prepare(`
      INSERT INTO fee_payments (voucher_id, amount, payment_method, transaction_id, received_by, receipt_number, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(voucher_id, amount, payment_method || 'cash', transaction_id, req.user.id, receiptNumber, notes);

    const totalPaid = db.prepare('SELECT SUM(amount) as total FROM fee_payments WHERE voucher_id = ?').get(voucher_id);
    const paidAmount = totalPaid.total || 0;

    let newStatus = 'pending';
    if (paidAmount >= voucher.total_amount) newStatus = 'paid';
    else if (paidAmount > 0) newStatus = 'partial';

    db.prepare('UPDATE fee_vouchers SET status = ? WHERE id = ?').run(newStatus, voucher_id);

    res.json({
      success: true,
      message: 'Payment recorded successfully.',
      data: { receipt_number: receiptNumber, total_paid: paidAmount, new_status: newStatus }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/reports', authenticate, authorize('super_admin', 'campus_admin', 'teacher', 'accountant'), (req, res) => {
  try {
    const db = getDb();
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
      WHERE fv.month = ? AND fv.year = ?
    `;
    const params = [targetMonth, targetYear];

    if (req.user.role !== 'super_admin') {
      query += ' AND s.campus_id = ?';
      params.push(req.user.campus_id);
    }

    query += ' GROUP BY s.campus_id';
    const reports = db.prepare(query).all(...params);

    res.json({ success: true, data: reports, month: targetMonth, year: targetYear });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
