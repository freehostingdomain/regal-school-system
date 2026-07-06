const jwt = require('jsonwebtoken');
const { getDb } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'regal_school_secret_key_2026';

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDb();
    const user = await db.prepare('SELECT id, name, email, role, campus_id, is_active FROM users WHERE id = ?').get(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Invalid token or user inactive.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
}

function campusAccess(req, res, next) {
  if (req.user.role === 'super_admin') return next();
  const campusId = req.params.campusId || req.body.campus_id;
  if (campusId && req.user.campus_id !== campusId) {
    return res.status(403).json({ success: false, message: 'Access denied to this campus.' });
  }
  next();
}

module.exports = { authenticate, authorize, campusAccess, JWT_SECRET };
