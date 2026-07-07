const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

const { initDatabase } = require('../database');
const authRoutes = require('../routes/auth');
const studentRoutes = require('../routes/students');
const classRoutes = require('../routes/classes');
const attendanceRoutes = require('../routes/attendance');
const feeRoutes = require('../routes/fees');
const dashboardRoutes = require('../routes/dashboard');
const announcementRoutes = require('../routes/announcements');
const notificationRoutes = require('../routes/notifications');
const teacherRoutes = require('../routes/teachers');
const commissionRoutes = require('../routes/commissions');
const examRoutes = require('../routes/exams');
const parentRoutes = require('../routes/parent');

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/parent', parentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

initDatabase();

module.exports = app;
module.exports.handler = serverless(app);
