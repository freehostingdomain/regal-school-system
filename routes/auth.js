const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database');
const { JWT_SECRET, authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required.' });
    }

    const db = getDb();
    const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'Account is inactive.' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, campus_id: user.campus_id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    let campus = null;
    if (user.campus_id) {
      campus = await db.prepare('SELECT name FROM campuses WHERE id = ?').get(user.campus_id);
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          campus_id: user.campus_id,
          campus_name: campus ? campus.name : 'All Campuses',
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  const db = getDb();
  let campus = null;
  if (req.user.campus_id) {
    campus = await db.prepare('SELECT name FROM campuses WHERE id = ?').get(req.user.campus_id);
  }
  res.json({
    success: true,
    data: {
      ...req.user,
      campus_name: campus ? campus.name : 'All Campuses'
    }
  });
});

router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, current_password, new_password } = req.body;
    const db = getDb();
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    if (current_password && new_password) {
      if (!bcrypt.compareSync(current_password, user.password)) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }
      const hashedPassword = bcrypt.hashSync(new_password, 10);
      await db.prepare('UPDATE users SET password = ?, name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE id = ?')
        .run(hashedPassword, name || null, phone || null, req.user.id);
    } else {
      await db.prepare('UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE id = ?')
        .run(name || null, phone || null, req.user.id);
    }

    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
