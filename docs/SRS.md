# Software Requirements Specification (SRS)
## Custom School Management System (SMS) & Portals
### Regal Montessori & School System, Taxila, Pakistan

**Document Version:** 1.0  
**Date:** July 2026  
**Prepared For:** Regal Montessori & School System (Regal School and College)  
**Campuses:** Khanpur Road (Primary/Montessori) & Near UET Taxila (Secondary)

---

## 1. Executive Summary

This document outlines the complete Software Requirements Specification and System Design for a cloud-based School Management System (SMS) tailored specifically for Regal Montessori & School System. The system will manage two campuses under a unified super-admin dashboard while maintaining distinct records for each branch.

The solution addresses four core pillars:
1. **Core Administrative Foundations** (SIS, Admission, Attendance)
2. **Academics, Montessori Activity & Examination Management**
3. **Portals, Communication & Local Gateways**
4. **Finance, Logistics & Operations Management**

---

## 2. Project Context & Operational Requirements

### 2.1 Campus Locations
| Campus | Location | Focus |
|--------|----------|-------|
| Primary/Montessori | Khanpur Road, Taxila | Early childhood, Activity-based education |
| Secondary/College | Near UET Taxila (Gangu Campus) | High school, College level |

### 2.2 Operational Hours
| Day | Hours | Status |
|-----|-------|--------|
| Monday - Thursday | 8:00 AM – 1:00 PM | Full Day |
| Friday | 8:00 AM – 12:30 PM | Early Dismissal |
| Saturday | 8:00 AM – 1:00 PM | Full Day |
| Sunday | Closed | Holiday |

### 2.3 System Timing Requirements
- **Late Arrival Threshold:** 8:00 AM (auto-calculated based on day type)
- **Absent Alert Trigger:** 9:00 AM (if student未 marked present)
- **Fee Challan Generation:** Monthly (1st of each month)
- **Report Card Generation:** End of each term

---

## 3. Technical Architecture

### 3.1 Technology Stack Recommendation

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | React 18 + Inertia.js + Tailwind CSS | Modern SPA experience with Laravel integration, responsive design |
| **Backend** | Laravel 12 (PHP 8.2+) | Mature ecosystem, excellent RBAC support, Pakistan-specific packages available |
| **Database** | PostgreSQL 16 | Robust relational DB, JSON support, excellent for multi-tenant |
| **Authentication** | Laravel Breeze + Sanctum | API tokens for mobile, session-based for web |
| **RBAC** | Spatie Laravel-Permission | Industry standard for Laravel RBAC |
| **PDF Generation** | DomPDF / Snappy | Report cards, fee challans, certificates |
| **Queue System** | Redis + Laravel Queue | Async SMS/WhatsApp, notifications |
| **Cache** | Redis | Session, query caching |
| **Storage** | AWS S3 / DigitalOcean Spaces | Document uploads, media files |
| **Deployment** | Docker + Nginx | Consistent environments, easy scaling |

### 3.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │  Super Admin │  │ Campus Admin│  │   Teacher   │  │  Parent   │ │
│  │   Dashboard  │  │   Portal    │  │   Portal    │  │  Portal   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘ │
│                           │                                         │
│                    React + Inertia.js                               │
│                    Tailwind CSS + shadcn/ui                         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                                  │
│                    Laravel Sanctum (Token Auth)                     │
│                    Rate Limiting + CORS                              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    LARAVEL 12 BACKEND                        │  │
│  │                                                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │  │
│  │  │   Auth      │  │   RBAC      │  │   Core      │         │  │
│  │  │  Module     │  │  (Spatie)   │  │  Services   │         │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘         │  │
│  │                                                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │  │
│  │  │  Student    │  │  Finance    │  │ Notification│         │  │
│  │  │  Module     │  │  Module     │  │   Engine    │         │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘         │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    QUEUE WORKERS                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │  │
│  │  │ SMS Queue   │  │WhatsApp Queue│  │ Email Queue │         │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘         │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │ PostgreSQL  │  │   Redis     │  │ S3/Digital   │                │
│  │  Database   │  │   Cache     │  │Ocean Spaces  │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   EXTERNAL INTEGRATIONS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │ LifetimeSMS │  │ WhatsApp    │  │ Easypaisa/  │                │
│  │    API      │  │ Business API│  │ JazzCash    │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │ ZKTeco/     │  │  Google     │  │  Firebase   │                │
│  │ eSSL Biometric│ │ Maps API   │  │  (Push)     │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Project Structure

```
regal-school-system/
├── backend/                          # Laravel API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── Api/
│   │   │   │   │   ├── Auth/
│   │   │   │   │   ├── Student/
│   │   │   │   │   ├── Teacher/
│   │   │   │   │   ├── Attendance/
│   │   │   │   │   ├── Finance/
│   │   │   │   │   ├── Academics/
│   │   │   │   │   └── Transport/
│   │   │   │   └── Web/
│   │   │   ├── Middleware/
│   │   │   │   ├── EnsureCampusAccess.php
│   │   │   │   └── CheckCampusDomain.php
│   │   │   └── Requests/
│   │   ├── Models/
│   │   │   ├── Campus.php
│   │   │   ├── Student.php
│   │   │   ├── Teacher.php
│   │   │   ├── Class.php
│   │   │   ├── Section.php
│   │   │   ├── Attendance.php
│   │   │   ├── FeeStructure.php
│   │   │   ├── FeeVoucher.php
│   │   │   ├── Exam.php
│   │   │   ├── Result.php
│   │   │   ├── Timetable.php
│   │   │   ├── TransportRoute.php
│   │   │   └── ... (30+ models)
│   │   ├── Services/
│   │   │   ├── AdmissionService.php
│   │   │   ├── AttendanceService.php
│   │   │   ├── FeeService.php
│   │   │   ├── ExamService.php
│   │   │   ├── NotificationService.php
│   │   │   ├── ReportCardService.php
│   │   │   └── BiometricService.php
│   │   ├── Jobs/
│   │   │   ├── SendAbsenceAlert.php
│   │   │   ├── SendFeeReminder.php
│   │   │   ├── GenerateFeeChallans.php
│   │   │   └── SyncBiometricLogs.php
│   │   ├── Notifications/
│   │   │   ├── SmsNotification.php
│   │   │   ├── WhatsAppNotification.php
│   │   │   └── EmailNotification.php
│   │   └── Policies/
│   │       ├── StudentPolicy.php
│   │       └── FeePolicy.php
│   ├── config/
│   │   ├── campus.php
│   │   ├── sms.php
│   │   ├── whatsapp.php
│   │   ├── payment.php
│   │   └── biometric.php
│   ├── database/
│   │   ├── migrations/
│   │   │   ├── 0001_create_campuses_table.php
│   │   │   ├── 0002_create_users_table.php
│   │   │   ├── 0003_create_students_table.php
│   │   │   ├── ... (100+ migrations)
│   │   ├── seeders/
│   │   │   ├── CampusSeeder.php
│   │   │   ├── RoleSeeder.php
│   │   │   └── DemoDataSeeder.php
│   │   └── factories/
│   ├── routes/
│   │   ├── api.php
│   │   ├── web.php
│   │   └── channels.php
│   ├── tests/
│   └── docker/
│       ├── Dockerfile
│       └── docker-compose.yml
│
├── frontend/                         # React + Inertia
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── DashboardLayout.tsx
│   │   │   ├── students/
│   │   │   ├── teachers/
│   │   │   ├── attendance/
│   │   │   ├── finance/
│   │   │   ├── academics/
│   │   │   ├── transport/
│   │   │   └── reports/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── admin/
│   │   │   ├── teacher/
│   │   │   ├── parent/
│   │   │   └── dashboard/
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── utils.ts
│   │   │   ├── validations.ts
│   │   │   └── constants.ts
│   │   └── types/
│   ├── public/
│   └── package.json
│
├── docs/
│   ├── SRS.md
│   ├── API.md
│   └── DEPLOYMENT.md
│
├── .env.example
├── .gitignore
├── README.md
└── docker-compose.yml
```

---

## 4. Database Design

### 4.1 Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CORE TABLES                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐  │
│  │ Campuses │─────<│  Users   │─────<│ Students │─────<│ Parents  │  │
│  └──────────┘      └──────────┘      └──────────┘      └──────────┘  │
│       │                 │                 │                   │         │
│       │                 │                 │                   │         │
│       ▼                 ▼                 ▼                   ▼         │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐  │
│  │ Classes  │─────<│Teachers  │      │Admissions│      │Emergency │  │
│  └──────────┘      └──────────┘      └──────────┘      │ Contacts │  │
│       │                                                   └──────────┘  │
│       ▼                                                                  │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐                      │
│  │ Sections │─────<│Enrollments│─────<│ Attendance│                      │
│  └──────────┘      └──────────┘      └──────────┘                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         ACADEMIC TABLES                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐                      │
│  │ Subjects │─────<│Timetable │      │ Lessons  │                      │
│  └──────────┘      └──────────┘      └──────────┘                      │
│       │                                                                   │
│       ▼                                                                   │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐                      │
│  │  Exams   │─────<│ Results  │      │ Report   │                      │
│  └──────────┘      └──────────┘      │  Cards   │                      │
│                                      └──────────┘                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         FINANCE TABLES                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐                      │
│  │   Fee    │─────<│ Fee      │      │  Fee     │                      │
│  │Structure │      │ Vouchers │      │ Payments │                      │
│  └──────────┘      └──────────┘      └──────────┘                      │
│                                                                         │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐                      │
│  │  Staff   │─────<│ Payroll  │      │ Payslips │                      │
│  │ Salaries │      │ Records  │      │          │                      │
│  └──────────┘      └──────────┘      └──────────┘                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      TRANSPORT & LOGISTICS                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐                      │
│  │ Vehicles │─────<│  Routes  │─────<│  Route   │                      │
│  └──────────┘      └──────────┘      │ Stops    │                      │
│       │                              └──────────┘                      │
│       ▼                                                                   │
│  ┌──────────┐      ┌──────────┐                                         │
│  │ Drivers  │      │ Vehicle  │                                         │
│  └──────────┘      │Assignments│                                         │
│                    └──────────┘                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Core Table Definitions

#### 4.2.1 Campuses Table
```sql
CREATE TABLE campuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- 'khanpur-road' or 'uet-campus'
    address TEXT NOT NULL,
    city VARCHAR(100) DEFAULT 'Taxila',
    province VARCHAR(100) DEFAULT 'Punjab',
    phone VARCHAR(20),
    email VARCHAR(255),
    logo_url TEXT,
    opening_time TIME DEFAULT '08:00:00',
    closing_time TIME DEFAULT '13:00:00',
    friday_closing_time TIME DEFAULT '12:30:00',
    late_threshold_minutes INT DEFAULT 15,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4.2.2 Users Table (Staff & Admins)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campus_id UUID REFERENCES campuses(id),
    employee_id VARCHAR(50) UNIQUE, -- REG-EMP-001
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'campus_admin', 'teacher', 'accountant', 'staff') NOT NULL,
    designation VARCHAR(100),
    qualification VARCHAR(255),
    joining_date DATE,
    salary DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    avatar_url TEXT,
    last_login_at TIMESTAMP,
    email_verified_at TIMESTAMP,
    remember_token VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4.2.3 Students Table
```sql
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(50) UNIQUE NOT NULL, -- RMS-2026-001
    campus_id UUID REFERENCES campuses(id) NOT NULL,
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    father_name VARCHAR(255) NOT NULL,
    father_cnic VARCHAR(15), -- XXXXX-XXXXXXX-X
    b_form_number VARCHAR(15), -- Child's CNIC/B-Form
    date_of_birth DATE NOT NULL,
    gender ENUM('male', 'female') NOT NULL,
    blood_group VARCHAR(5),
    religion VARCHAR(50),
    nationality VARCHAR(50) DEFAULT 'Pakistani',
    mother_tongue VARCHAR(50),
    
    -- Contact Information
    address TEXT NOT NULL,
    city VARCHAR(100) DEFAULT 'Taxila',
    province VARCHAR(100) DEFAULT 'Punjab',
    postal_code VARCHAR(10),
    
    -- Emergency Contact
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    
    -- Medical Information
    medical_conditions TEXT,
    allergies TEXT,
    medications TEXT,
    physician_name VARCHAR(255),
    physician_phone VARCHAR(20),
    
    -- Admission Details
    admission_date DATE NOT NULL,
    admission_class VARCHAR(50),
    admission_section VARCHAR(50),
    previous_school VARCHAR(255),
    transfer_certificate_url TEXT,
    
    -- Documents
    b_form_url TEXT,
    father_cnic_url TEXT,
    student_photo_url TEXT,
    birth_certificate_url TEXT,
    
    -- Current Status
    current_class_id UUID REFERENCES classes(id),
    current_section_id UUID REFERENCES sections(id),
    is_active BOOLEAN DEFAULT true,
    is_transport_user BOOLEAN DEFAULT false,
    
    -- System Fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_students_campus ON students(campus_id);
CREATE INDEX idx_students_class ON students(current_class_id);
CREATE INDEX idx_students_active ON students(is_active);
CREATE INDEX idx_students_admission_date ON students(admission_date);
```

#### 4.2.4 Parents Table
```sql
CREATE TABLE parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id), -- For portal login
    name VARCHAR(255) NOT NULL,
    cnic VARCHAR(15) UNIQUE,
    phone_primary VARCHAR(20) NOT NULL,
    phone_secondary VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    occupation VARCHAR(100),
    monthly_income DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE student_parent (
    student_id UUID REFERENCES students(id),
    parent_id UUID REFERENCES parents(id),
    relationship ENUM('father', 'mother', 'guardian') NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    PRIMARY KEY (student_id, parent_id)
);
```

#### 4.2.5 Classes & Sections
```sql
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campus_id UUID REFERENCES campuses(id) NOT NULL,
    name VARCHAR(100) NOT NULL, -- 'Montessori 1', 'Class 1', '9th Grade'
    slug VARCHAR(50) NOT NULL,
    level ENUM('montessori', 'primary', 'middle', 'high', 'college') NOT NULL,
    shift ENUM('morning', 'evening') DEFAULT 'morning',
    max_students INT DEFAULT 40,
    class_teacher_id UUID REFERENCES users(id),
    monthly_fee DECIMAL(10,2) NOT NULL,
    admission_fee DECIMAL(10,2),
    exam_fee DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(campus_id, slug)
);

CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) NOT NULL,
    name VARCHAR(50) NOT NULL, -- 'A', 'B', 'C'
    slug VARCHAR(50) NOT NULL,
    teacher_id UUID REFERENCES users(id), -- Section teacher
    room_number VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(class_id, slug)
);
```

#### 4.2.6 Subjects Table
```sql
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campus_id UUID REFERENCES campuses(id) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL, -- 'MATH-01', 'ENG-01'
    name VARCHAR(255) NOT NULL,
    type ENUM('compulsory', 'elective', 'activity') NOT NULL,
    level VARCHAR(50) NOT NULL, -- 'montessori', 'primary', 'secondary'
    description TEXT,
    total_marks INT,
    passing_marks INT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE class_subject (
    class_id UUID REFERENCES classes(id),
    subject_id UUID REFERENCES subjects(id),
    teacher_id UUID REFERENCES users(id),
    weekly_hours INT DEFAULT 1,
    PRIMARY KEY (class_id, subject_id)
);
```

---

## 5. Module Specifications

### 5.1 Module 1: Core Administrative Foundations

#### 5.1.1 Student Information System (SIS)

**Features:**
- Unique Student ID Generation: `RMS-{YEAR}-{SEQUENCE}` (e.g., RMS-2026-001)
- Multi-campus student tagging
- Comprehensive profile management
- Document upload & verification
- Student lifecycle tracking

**API Endpoints:**
```
GET    /api/students                    # List students (filtered by campus)
POST   /api/students                    # Create new student
GET    /api/students/{id}               # Get student details
PUT    /api/students/{id}               # Update student
DELETE /api/students/{id}               # Soft delete student
GET    /api/students/{id}/documents     # List student documents
POST   /api/students/{id}/documents     # Upload document
GET    /api/students/search?q={query}   # Search students
POST   /api/students/bulk-import        # Bulk import from CSV
GET    /api/students/{id}/parents       # Get student parents
POST   /api/students/{id}/parents       # Link parent to student
```

#### 5.1.2 Admission Management Workflow

**Pipeline Stages:**
```
Applied → Interview/Test Scheduled → Approved → Fee Pending → Enrolled
    ↓           ↓                      ↓           ↓            ↓
 [Reject]   [No Show]             [Waitlist]   [Cancel]    [Active]
```

**API Endpoints:**
```
GET    /api/admissions                  # List all applications
POST   /api/admissions                  # Submit new application
GET    /api/admissions/{id}             # Get application details
PUT    /api/admissions/{id}             # Update application
PUT    /api/admissions/{id}/status      # Update application status
GET    /api/admissions/pipeline         # Get pipeline view
POST   /api/admissions/{id}/interview   # Schedule interview
POST   /api/admissions/{id}/enroll      # Enroll student
```

#### 5.1.3 Attendance System

**Features:**
- Daily attendance marking interface
- Late arrival auto-detection (after 8:00 AM)
- Half-day marking for Friday early dismissal
- Biometric/RFID integration hooks
- Monthly attendance reports

**API Endpoints:**
```
GET    /api/attendance                  # Get attendance records
POST   /api/attendance                  # Mark attendance (bulk)
PUT    /api/attendance/{id}             # Update attendance record
GET    /api/attendance/today            # Get today's attendance
GET    /api/attendance/report           # Generate attendance report
POST   /api/attendance/biometric-sync   # Sync biometric data
GET    /api/attendance/student/{id}     # Get student attendance history
```

**Attendance Statuses:**
- `present` - Marked on time
- `late` - Arrived after 8:00 AM (configurable)
- `absent` - Not marked present
- `half_day` - Left early (Friday before 12:30 PM)
- `excused` - Excused absence
- `holiday` - School holiday

---

### 5.2 Module 2: Academics & Examination Management

#### 5.2.1 Dynamic Timetable Generator

**Features:**
- Conflict-free class scheduling
- Teacher workload balancing
- Friday early dismissal schedule support
- Room allocation
- Substitute teacher management

**API Endpoints:**
```
GET    /api/timetable                  # Get full timetable
POST   /api/timetable                  # Generate timetable
GET    /api/timetable/class/{id}       # Get class timetable
GET    /api/timetable/teacher/{id}     # Get teacher timetable
PUT    /api/timetable/{id}             # Update slot
DELETE /api/timetable/{id}             # Remove slot
GET    /api/timetable/conflicts        # Check for conflicts
```

#### 5.2.2 Montessori Activity Module

**Features:**
- Descriptive grading (not numerical)
- Activity categories:
  - Cognitive Skills
  - Motor Skills (Fine & Gross)
  - Social Behavior
  - Language Development
  - Creative Expression
  - Self-Help Skills
- Photo/Video activity logs
- Progress narrative generation

**Grading Scale (Montessori):**
```javascript
const MONTESSORI_GRADES = {
  MASTERY: 'M',        // Consistently demonstrates skill
  DEVELOPING: 'D',     // progressing well
  EMERGING: 'E',       // Beginning to show skill
  NEEDS_SUPPORT: 'NS'  // Requires additional help
};
```

**API Endpoints:**
```
GET    /api/montessori/activities       # List activities
POST   /api/montessori/activities       # Create activity
GET    /api/montessori/assessments      # Get student assessments
POST   /api/montessori/assessments      # Record assessment
GET    /api/montessori/progress/{id}    # Get student progress report
POST   /api/montessori/media            # Upload activity media
```

#### 5.2.3 Examination Management (Senior Campus)

**Features:**
- Exam types: Monthly Tests, Mid-term, Final, Board Prep
- Marks entry portal
- Automated GPA/Grade calculation
- Pakistani grading standards
- Result analytics

**Pakistani Grading Scale:**
```javascript
const GRADE_SCALE = [
  { min: 90, max: 100, grade: 'A+', gpa: 4.0 },
  { min: 80, max: 89, grade: 'A', gpa: 3.7 },
  { min: 70, max: 79, grade: 'B', gpa: 3.3 },
  { min: 60, max: 69, grade: 'C', gpa: 3.0 },
  { min: 50, max: 59, grade: 'D', gpa: 2.0 },
  { min: 40, max: 49, grade: 'E', gpa: 1.0 },
  { min: 0, max: 39, grade: 'F', gpa: 0.0 }
];
```

**API Endpoints:**
```
GET    /api/exams                       # List exams
POST   /api/exams                       # Create exam
GET    /api/exams/{id}                  # Get exam details
PUT    /api/exams/{id}                  # Update exam
GET    /api/exams/{id}/results          # Get exam results
POST   /api/exams/{id}/results          # Submit marks (bulk)
GET    /api/exams/{id}/analytics        # Get result analytics
POST   /api/exams/{id}/publish          # Publish results
```

#### 5.2.4 Report Card Generation

**Features:**
- PDF report cards with school branding
- Campus-specific headers
- Montessori narrative reports
- Senior campus grade sheets
- Parent signature section
- Digital download & print

**API Endpoints:**
```
GET    /api/report-cards                # List report cards
POST   /api/report-cards/generate       # Generate report cards
GET    /api/report-cards/{id}/pdf       # Download PDF
POST   /api/report-cards/{id}/email     # Email to parents
GET    /api/report-cards/student/{id}   # Get student's reports
```

---

### 5.3 Module 3: Portals & Communication

#### 5.3.1 Role-Based Access Control (RBAC)

**Roles & Permissions Matrix:**

| Role | Students | Attendance | Finance | Academics | Reports | Settings |
|------|----------|------------|---------|-----------|---------|----------|
| **Super Admin** | Full | Full | Full | Full | Full | Full |
| **Campus Admin** | Campus | Campus | Campus | Campus | Campus | Campus |
| **Teacher** | Assigned | Mark/View | View Only | Enter Marks | View | None |
| **Accountant** | View | View | Full | None | Finance | None |
| **Parent** | Own Child | View | Pay Fees | View | View | None |
| **Student** | Self | View | View | View | Self | None |

**Spatie Permissions Setup:**
```php
// Roles
$roles = ['super-admin', 'campus-admin', 'teacher', 'accountant', 'parent', 'student'];

// Permissions
$permissions = [
    'students.view', 'students.create', 'students.edit', 'students.delete',
    'attendance.view', 'attendance.mark', 'attendance.edit',
    'finance.view', 'finance.create', 'finance.edit',
    'academics.view', 'academics.create', 'academics.edit',
    'exams.view', 'exams.create', 'exams.marks-entry',
    'reports.view', 'reports.generate',
    'settings.view', 'settings.edit',
];
```

**API Endpoints:**
```
GET    /api/roles                       # List roles
POST   /api/roles                       # Create role
GET    /api/roles/{id}                  # Get role details
PUT    /api/roles/{id}                  # Update role
DELETE /api/roles/{id}                  # Delete role
GET    /api/permissions                 # List all permissions
POST   /api/roles/{id}/permissions      # Assign permissions to role
GET    /api/users/{id}/roles            # Get user roles
POST   /api/users/{id}/roles            # Assign role to user
```

#### 5.3.2 Parent/Student Portal

**Features:**
- Clean, mobile-first dashboard
- Child's daily attendance
- Performance charts
- Homework/diary upload
- Fee status & payment
- School announcements
- Direct messaging with teacher

**Dashboard Widgets:**
```
┌─────────────────────────────────────────────────────────────┐
│  Parent Portal Dashboard                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │  Attendance │ │  Fees Due   │ │  Latest     │          │
│  │  92%        │ │  PKR 15,000 │ │  Result: A  │          │
│  │  [Graph]    │ │  [Pay Now]  │ │  [View]     │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Recent Announcements                                │   │
│  │  • Parent-Teacher Meeting - 15th July                │   │
│  │  • Summer Uniform Reminder                           │   │
│  │  • Sports Day Schedule                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Today's Homework                                    │   │
│  │  • Math: Chapter 5 exercises                        │   │
│  │  • English: Essay writing (200 words)               │   │
│  │  • Science: Lab report submission                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**API Endpoints:**
```
GET    /api/portal/dashboard            # Get dashboard data
GET    /api/portal/child/attendance     # Get child's attendance
GET    /api/portal/child/performance    # Get performance data
GET    /api/portal/child/homework       # Get homework list
GET    /api/portal/fees                 # Get fee status
POST   /api/portal/fees/pay             # Initiate payment
GET    /api/portal/announcements        # Get announcements
GET    /api/portal/messages             # Get messages
POST   /api/portal/messages             # Send message
```

#### 5.3.3 Notification Engine

**SMS Gateway Integration (LifetimeSMS):**
```php
class SmsNotificationService
{
    private $apiKey;
    private $senderId = 'REGALSCH';
    
    public function sendAbsenceAlert(Student $student): void
    {
        $parent = $student->primaryParent;
        $message = "Dear {$parent->name}, your child {$student->first_name} {$student->last_name} was marked ABSENT on " . now()->format('d M Y') . ". If this is an error, please contact the school office.";
        
        $this->send($parent->phone_primary, $message);
    }
    
    public function sendFeeReminder(Student $student, FeeVoucher $voucher): void
    {
        $parent = $student->primaryParent;
        $message = "Dear {$parent->name}, fee voucher #{$voucher->voucher_number} for {$student->first_name} is due on {$voucher->due_date}. Amount: PKR " . number_format($voucher->total_amount) . ". Pay now to avoid late fee.";
        
        $this->send($parent->phone_primary, $message);
    }
    
    private function send(string $phone, string $message): void
    {
        $url = "https://lifetimesms.pk/api/sendsms";
        
        Http::post($url, [
            'api_key' => $this->apiKey,
            'sender' => $this->senderId,
            'numbers' => $phone,
            'message' => $message,
        ]);
    }
}
```

**WhatsApp Business API Integration:**
```php
class WhatsAppNotificationService
{
    public function sendAbsentAlert(Student $student): void
    {
        $parent = $student->primaryParent;
        
        $template = [
            'messaging_product' => 'whatsapp',
            'to' => $parent->phone_primary,
            'type' => 'template',
            'template' => [
                'name' => 'absent_alert',
                'language' => ['code' => 'en_US'],
                'components' => [
                    [
                        'type' => 'body',
                        'parameters' => [
                            ['type' => 'text', 'text' => $student->first_name],
                            ['type' => 'text', 'text' => now()->format('d M Y')],
                        ]
                    ]
                ]
            ]
        ];
        
        Http::withToken($this->accessToken)
            ->post('https://graph.facebook.com/v18.0/' . $this->phoneNumberId . '/messages', $template);
    }
}
```

**Notification Triggers:**
| Event | SMS | WhatsApp | Email | Timing |
|-------|-----|----------|-------|--------|
| Absence Alert | ✅ | ✅ | ❌ | 9:00 AM daily |
| Fee Challan | ✅ | ✅ | ✅ | 1st of month |
| Fee Reminder | ✅ | ✅ | ❌ | 5 days before due |
| Late Arrival | ✅ | ❌ | ❌ | Real-time |
| Exam Result | ❌ | ✅ | ✅ | After publish |
| Emergency Holiday | ✅ | ✅ | ✅ | Immediate |
| PTM Reminder | ✅ | ✅ | ✅ | 1 day before |

**API Endpoints:**
```
GET    /api/notifications               # List notifications
POST   /api/notifications/send          # Send notification
GET    /api/notifications/settings      # Get notification settings
PUT    /api/notifications/settings      # Update settings
GET    /api/notifications/logs          # Get notification logs
POST   /api/notifications/test          # Test notification
```

---

### 5.4 Module 4: Finance & Operations

#### 5.4.1 Fee Management

**Fee Structure:**
```javascript
const FEE_CATEGORIES = [
    { id: 'admission', name: 'Admission Fee', type: 'one-time' },
    { id: 'tuition', name: 'Tuition Fee', type: 'monthly' },
    { id: 'exam', name: 'Exam Fee', type: 'term' },
    { id: 'transport', name: 'Transport Fee', type: 'monthly' },
    { id: 'lab', name: 'Lab Fee', type: 'monthly' },
    { id: 'activity', name: 'Activity Fee', type: 'term' },
    { id: 'uniform', name: 'Uniform Fee', type: 'one-time' },
    { id: 'books', name: 'Books Fee', type: 'one-time' },
];
```

**Fee Voucher Generation:**
```php
class FeeService
{
    public function generateMonthlyChallans(int $month, int $year): Collection
    {
        $students = Student::where('is_active', true)->get();
        $vouchers = collect();
        
        foreach ($students as $student) {
            $feeStructure = $student->class->feeStructure;
            
            $voucher = FeeVoucher::create([
                'student_id' => $student->id,
                'voucher_number' => $this->generateVoucherNumber(),
                'month' => $month,
                'year' => $year,
                'due_date' => Carbon::create($year, $month, 10)->endOfMonth(),
                'tuition_fee' => $feeStructure->tuition_fee,
                'exam_fee' => $feeStructure->exam_fee / 3, // Monthly installment
                'transport_fee' => $student->is_transport_user ? $feeStructure->transport_fee : 0,
                'other_charges' => 0,
                'discount' => 0,
                'fine' => 0,
                'total_amount' => 0, // Calculated
                'status' => 'pending',
            ]);
            
            $vouchers->push($voucher);
        }
        
        return $vouchers;
    }
}
```

**Payment Integration (Easypaisa/JazzCash):**
```php
class PaymentService
{
    public function initiatePayment(FeeVoucher $voucher, string $method): PaymentResponse
    {
        $payload = [
            'amount' => $voucher->total_amount,
            'merchant_id' => config("payment.{$method}.merchant_id"),
            'order_id' => $voucher->voucher_number,
            'return_url' => route('payment.callback'),
            'callback_url' => route('payment.webhook'),
        ];
        
        // Easypaisa API call
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . config("payment.{$method}.api_key"),
        ])->post(config("payment.{$method}.api_url") . '/create', $payload);
        
        return new PaymentResponse($response->json());
    }
    
    public function verifyPayment(string $transactionId): bool
    {
        // Verify with payment gateway
        // Update voucher status
        // Send confirmation SMS/WhatsApp
    }
}
```

**API Endpoints:**
```
GET    /api/finance/fee-structures      # List fee structures
POST   /api/finance/fee-structures      # Create fee structure
GET    /api/finance/vouchers            # List vouchers
POST   /api/finance/vouchers/generate   # Generate monthly challans
GET    /api/finance/vouchers/{id}       # Get voucher details
POST   /api/finance/payments            # Record payment
POST   /api/finance/payments/initiate   # Initiate online payment
POST   /api/finance/payments/callback   # Payment callback
GET    /api/finance/reports             # Financial reports
GET    /api/finance/reports/outstanding # Outstanding fees report
```

#### 5.4.2 Staff Payroll

**API Endpoints:**
```
GET    /api/payroll/salaries            # List salary structures
POST   /api/payroll/salaries            # Create salary structure
GET    /api/payroll/records             # List payroll records
POST   /api/payroll/records/generate    # Generate monthly payroll
GET    /api/payroll/records/{id}        # Get payroll record
PUT    /api/payroll/records/{id}        # Update payroll record
POST   /api/payroll/records/{id}/payslip # Generate payslip
GET    /api/payroll/reports             # Payroll reports
```

#### 5.4.3 Transport Management

**API Endpoints:**
```
GET    /api/transport/vehicles          # List vehicles
POST   /api/transport/vehicles          # Add vehicle
GET    /api/transport/routes            # List routes
POST   /api/transport/routes            # Create route
GET    /api/transport/routes/{id}       # Get route details
PUT    /api/transport/routes/{id}       # Update route
POST   /api/transport/routes/{id}/stops # Add stop to route
GET    /api/transport/assignments       # List student-vehicle assignments
POST   /api/transport/assignments       # Assign student to vehicle
GET    /api/transport/drivers           # List drivers
POST   /api/transport/drivers           # Add driver
```

---

## 6. Security Requirements

### 6.1 Authentication & Authorization

```php
// Sanctum API Token Authentication
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('students', StudentController::class);
    Route::apiResource('attendance', AttendanceController::class);
    // ... other routes
});

// Campus-based middleware
Route::middleware(['campus.access'])->group(function () {
    // Users can only access their campus data
});
```

### 6.2 Data Protection

- **Encryption at Rest:** AES-256 for sensitive fields (CNIC, medical data)
- **Encryption in Transit:** TLS 1.3 for all communications
- **Password Hashing:** Bcrypt with cost factor 12
- **API Rate Limiting:** 60 requests/minute per user
- **Input Validation:** Laravel Form Requests with custom rules
- **SQL Injection Prevention:** Eloquent ORM (parameterized queries)
- **XSS Prevention:** Blade escaping, React auto-escaping

### 6.3 Audit Logging

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    campus_id UUID REFERENCES campuses(id),
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete'
    entity_type VARCHAR(50) NOT NULL, -- 'Student', 'FeeVoucher'
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 6.4 Backup Strategy

| Backup Type | Frequency | Retention | Storage |
|-------------|-----------|-----------|---------|
| Full Database | Daily 2:00 AM | 30 days | S3 + Local |
| Incremental | Every 6 hours | 7 days | S3 |
| File Storage | Daily | 30 days | S3 |
| Configuration | On change | Permanent | Git |

---

## 7. Deployment Architecture

### 7.1 Docker Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile
    container_name: regal-school-app
    restart: unless-stopped
    ports:
      - "8000:80"
    volumes:
      - ./backend:/var/www/html
      - storage:/var/www/html/storage
    environment:
      - APP_ENV=production
      - DB_CONNECTION=pgsql
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=regal_school
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: regal-school-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    environment:
      - VITE_API_URL=http://app:80/api

  postgres:
    image: postgres:16-alpine
    container_name: regal-school-db
    restart: unless-stopped
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=regal_school
      - POSTGRES_USER=regal_admin
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    container_name: regal-school-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  queue:
    build:
      context: .
      dockerfile: docker/Dockerfile
    container_name: regal-school-queue
    restart: unless-stopped
    command: php artisan queue:work --sleep=3 --tries=3 --max-time=3600
    volumes:
      - ./backend:/var/www/html
    environment:
      - QUEUE_CONNECTION=redis
    depends_on:
      - redis

  scheduler:
    build:
      context: .
      dockerfile: docker/Dockerfile
    container_name: regal-school-scheduler
    restart: unless-stopped
    command: php artisan schedule:run
    volumes:
      - ./backend:/var/www/html
    depends_on:
      - redis

  nginx:
    image: nginx:alpine
    container_name: regal-school-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx.conf:/etc/nginx/conf.d/default.conf
      - ./docker/ssl:/etc/nginx/ssl
    depends_on:
      - app
      - frontend

volumes:
  postgres_data:
  redis_data:
  storage:
```

### 7.2 Environment Configuration

```env
# .env.example
APP_NAME="Regal School System"
APP_ENV=production
APP_KEY=base64:GENERATE_KEY
APP_URL=https://regal.school

# Database
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=regal_school
DB_USERNAME=regal_admin
DB_PASSWORD=secure_password

# Cache & Session
REDIS_HOST=redis
CACHE_DRIVER=redis
SESSION_DRIVER=redis

# Queue
QUEUE_CONNECTION=redis

# SMS Gateway (LifetimeSMS)
SMS_API_KEY=your_api_key
SMS_SENDER_ID=REGALSCH
SMS_API_URL=https://lifetimesms.pk/api/sendsms

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id

# Payment Gateways
EASYPAYSA_MERCHANT_ID=your_merchant_id
EASYPAYSA_API_KEY=your_api_key
EASYPAYSA_API_URL=https://api.easypaisa.com

JAZZCASH_MERCHANT_ID=your_merchant_id
JAZZCASH_API_KEY=your_api_key
JAZZCASH_API_URL=https://api.jazzcash.com

# File Storage
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_DEFAULT_REGION=ap-south-1
AWS_BUCKET=regal-school-storage

# Biometric Device
BIOMETRIC_API_URL=http://device_ip:port
BIOMETRIC_API_KEY=your_key
```

---

## 8. API Documentation Summary

### 8.1 Authentication Endpoints
```
POST   /api/auth/login                 # User login
POST   /api/auth/logout                # User logout
POST   /api/auth/register              # Register (Parent portal)
POST   /api/auth/forgot-password       # Request password reset
POST   /api/auth/reset-password        # Reset password
GET    /api/auth/me                     # Get current user
PUT    /api/auth/profile                # Update profile
```

### 8.2 Common Response Format
```json
{
    "success": true,
    "message": "Operation completed successfully",
    "data": {
        "id": "uuid",
        "name": "John Doe",
        // ... other data
    },
    "meta": {
        "current_page": 1,
        "last_page": 5,
        "per_page": 20,
        "total": 100
    }
}
```

### 8.3 Error Response Format
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "email": ["The email field is required."],
        "password": ["The password must be at least 8 characters."]
    }
}
```

---

## 9. Development Timeline (Estimated)

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: Foundation** | 4 weeks | Project setup, DB design, Auth, RBAC, Campus module |
| **Phase 2: Student Management** | 3 weeks | SIS, Admission workflow, Documents |
| **Phase 3: Academics** | 4 weeks | Classes, Sections, Subjects, Timetable, Montessori module |
| **Phase 4: Attendance** | 2 weeks | Daily attendance, Reports, Biometric hooks |
| **Phase 5: Examination** | 3 weeks | Exam management, Marks entry, Results, Report cards |
| **Phase 6: Finance** | 4 weeks | Fee structures, Vouchers, Payments, Payroll |
| **Phase 7: Communication** | 3 weeks | SMS/WhatsApp integration, Notifications, Announcements |
| **Phase 8: Portals** | 3 weeks | Parent portal, Student portal, Teacher portal |
| **Phase 9: Transport** | 2 weeks | Vehicles, Routes, Drivers, Assignments |
| **Phase 10: Reports** | 2 weeks | Analytics, Custom reports, Export (PDF/Excel) |
| **Phase 11: Testing** | 2 weeks | Unit tests, Integration tests, UAT |
| **Phase 12: Deployment** | 1 week | Production setup, Data migration, Training |

**Total Estimated Duration:** 16-20 weeks (4-5 months)

---

## 10. Cost Estimation (Infrastructure)

### Monthly Running Costs (Pakistan Region)

| Service | Provider | Cost (PKR/month) |
|---------|----------|------------------|
| Cloud Server (4 vCPU, 8GB RAM) | DigitalOcean | ~15,000 |
| Managed PostgreSQL | DigitalOcean | ~8,000 |
| Managed Redis | DigitalOcean | ~4,000 |
| Object Storage (100GB) | DigitalOcean | ~1,500 |
| Domain + SSL | Namecheap | ~500 |
| SMS Gateway (5000 SMS) | LifetimeSMS | ~5,000 |
| WhatsApp API | Meta Cloud | ~3,000 |
| **Total** | | **~37,000** |

### One-Time Setup Costs

| Item | Cost (PKR) |
|------|------------|
| Development (if outsourced) | 800,000 - 1,500,000 |
| UI/UX Design | 100,000 - 200,000 |
| Biometric Device (per campus) | 50,000 - 100,000 |
| Training & Documentation | 50,000 |
| **Total** | **~1,000,000 - 1,850,000** |

---

## 11. Success Metrics

| Metric | Target |
|--------|--------|
| Attendance marking time | < 5 minutes for full class |
| Fee collection rate | > 90% on time |
| Parent engagement | > 70% portal login weekly |
| System uptime | > 99.5% |
| SMS delivery rate | > 95% |
| Report generation time | < 30 seconds |

---

## 12. Appendices

### Appendix A: Sample Fee Challan Layout

```
╔════════════════════════════════════════════════════════════════╗
║                    REGAL MONTESSORI & SCHOOL SYSTEM            ║
║              Khanpur Road, Taxila | Ph: 051-XXXXXXX           ║
╠════════════════════════════════════════════════════════════════╣
║  FEE VOUCHER                                                  ║
║  Voucher #: RMS-FV-2026-00001        Date: 01 Jul 2026        ║
║  Due Date: 31 Jul 2026                                      ║
╠════════════════════════════════════════════════════════════════╣
║  Student: Ahmed Ali               Class: Class 5 - Section A  ║
║  Father: Muhammad Ali             Roll #: 15                   ║
╠════════════════════════════════════════════════════════════════╣
║  Fee Description              │  Amount (PKR)                 ║
║  ─────────────────────────────┼────────────────                ║
║  Tuition Fee                  │  8,000                        ║
║  Exam Fee (Installment)       │  1,000                        ║
║  Lab Fee                      │  500                          ║
║  Activity Fee                 │  500                          ║
║  ─────────────────────────────┼────────────────                ║
║  Sub Total                    │  10,000                       ║
║  Discount (10%)               │  -1,000                       ║
║  ─────────────────────────────┼────────────────                ║
║  TOTAL PAYABLE                │  9,000                        ║
╠════════════════════════════════════════════════════════════════╣
║  Payment Methods:                                              ║
║  • Cash at School Office                                      ║
║  • Bank Transfer: HBL XXXX-XXXX-XXXX                          ║
║  • JazzCash/Easypaisa: 0300-XXXXXXX                           ║
║  • Online: scan QR code →                                    ║
╠════════════════════════════════════════════════════════════════╣
║  [QR CODE]        Paid By: _____________ Amount: __________   ║
║                   Receipt #: ___________ Date: ______________  ║
╚════════════════════════════════════════════════════════════════╝
```

### Appendix B: Attendance Marking Interface

```
╔════════════════════════════════════════════════════════════════╗
║  Daily Attendance Register                                     ║
║  Class: Class 5 - Section A  │  Date: 05 Jul 2026 (Saturday) ║
║  Total Students: 35           │  Time: 8:15 AM                ║
╠════════════════════════════════════════════════════════════════╣
║  #  │ Roll │ Name              │ Status      │ Time    │ Mark ║
║  ───┼──────┼───────────────────┼─────────────┼─────────┼───── ║
║  1  │ 01   │ Ahmed Ali         │ ✅ Present   │ 7:55 AM │ -   ║
║  2  │ 02   │ Ayesha Khan       │ ⚠️ Late      │ 8:10 AM │ 10m ║
║  3  │ 03   │ Bilal Ahmad       │ ✅ Present   │ 7:50 AM │ -   ║
║  4  │ 04   │ Fatima Noor       │ ❌ Absent    │   -     │ -   ║
║  5  │ 05   │ Hassan Raza       │ ✅ Present   │ 7:45 AM │ -   ║
║  ...  │  ...  │ ...               │ ...         │ ...     │ ... ║
╠════════════════════════════════════════════════════════════════╣
║  Summary: Present: 30 │ Late: 3 │ Absent: 2 │ Leave: 0       ║
║                                                              ║
║  [Save Attendance]  [Mark All Present]  [Import Biometric]   ║
╚════════════════════════════════════════════════════════════════╝
```

---

**Document Prepared By:** AI System Architect  
**Version:** 1.0  
**Status:** Ready for Review

---

*This SRS document provides a comprehensive blueprint for developing the Custom School Management System for Regal Montessori & School System. All specifications are tailored to the specific operational requirements of Pakistani educational institutions.*
