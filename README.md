# Regal School Management System

Full-stack School Management System with multi-campus support, RBAC, and Supabase PostgreSQL backend.

## Quick Start

### 1. Install Dependencies
```bash
npm install
cd frontend && npm install && cd ..
```

### 2. Setup Environment
```bash
copy .env.example .env
```
Edit `.env` and fill in:
- `JWT_SECRET` — any random string
- `DATABASE_URL` — your Supabase PostgreSQL connection string

### 3. Setup Database
1. Go to [Supabase](https://supabase.com) and create a project
2. Open SQL Editor
3. Paste contents of `supabase-schema.sql` and run it

### 4. Run Locally
```bash
npm start
```
Server runs on `http://localhost:5000`

### 5. Deploy to Netlify
1. Push code to GitHub
2. Connect GitHub repo to Netlify
3. Build settings: `npm install && cd frontend && npm install && npm run build`
4. Add environment variables in Netlify dashboard

## Login Credentials
| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@regal.school | admin123 |
| Campus Admin | khanpur.admin@regal.school | admin123 |
| Teacher | ahmed@regal.school | teacher123 |
| Accountant | ali@regal.school | account123 |

## Features
- Multi-campus support (Khanpur Road + UET Campus)
- Role-based access (Super Admin, Campus Admin, Teacher, Accountant)
- Student management with sections
- Attendance tracking
- Fee management with vouchers and payments
- Teacher salary management
- Announcements
- Notifications system
- Dashboard with campus-level filtering

## Tech Stack
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express.js
- **Database:** Supabase PostgreSQL
- **Deployment:** Netlify (frontend) + Netlify Functions (API)
