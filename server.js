const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('./database');
const { authenticate } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const classRoutes = require('./routes/classes');
const attendanceRoutes = require('./routes/attendance');
const feeRoutes = require('./routes/fees');
const dashboardRoutes = require('./routes/dashboard');
const announcementRoutes = require('./routes/announcements');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/teachers', authenticate, (req, res) => {
  try {
    const { getDb } = require('./database');
    const db = getDb();
    const teachers = db.prepare("SELECT id, name, email, role FROM users WHERE is_active = 1 AND role = 'teacher' ORDER BY name ASC").all();
    res.json({ success: true, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const frontendDist = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

initDatabase();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
