# ARCHITECTURE.md

# Smart LMS - System Architecture

## Overview

Smart LMS is a web-based Learning Management System designed to support online education, live classes, recorded lectures, assignments, attendance tracking, and course management.

The system follows a modern three-tier architecture:

- Presentation Layer (Frontend)
- Application Layer (Backend API)
- Data Layer (Database & Storage)

# High Level Architecture

┌────────────────────────────┐  
│ React Frontend │  
│ │  
│ Admin Dashboard │  
│ Teacher Dashboard │  
│ Student Dashboard │  
└──────────────┬─────────────┘  
│  
│ HTTPS / REST API  
│  
┌──────────────▼─────────────┐  
│ Node.js Backend │  
│ │  
│ Authentication Service │  
│ User Service │  
│ Course Service │  
│ Lecture Service │  
│ Assignment Service │  
│ Attendance Service │  
│ Notification Service │  
│ Google Drive Service │  
│ Jitsi Meet Service │  
└──────────────┬─────────────┘  
│  
┌─────────┴──────────┐  
│ │  
┌────▼────┐ ┌────────▼─────┐  
│PostgreSQL│ │ Google Drive │  
│Database │ │ File Storage │  
└─────────┘ └──────────────┘  
<br/>│  
▼  
<br/>Jitsi Meet  
Live Video Classes

# Technology Architecture

## Frontend Layer

Technology:

- React
- TypeScript
- Tailwind CSS
- React Router
- Axios
- React Query

Responsibilities:

- User Interface
- Form Validation
- Authentication
- Dashboard Rendering
- API Communication
- State Management

# Backend Layer

Technology:

- Node.js
- Express.js
- TypeScript

Responsibilities:

- Business Logic
- Authentication
- Authorization
- API Management
- File Upload Management
- Meeting Management

# Database Layer

Technology:

- PostgreSQL
- Prisma ORM

Responsibilities:

- Store User Data
- Store Course Data
- Store Lecture Data
- Store Attendance Data
- Store Assignment Data

# Storage Layer

Technology:

- Google Drive API

Purpose:

Store:

- Recorded Lectures
- Study Materials
- Assignment Attachments
- Course Resources

Important:

Actual files remain in Google Drive.

Database only stores:

- File ID
- File URL
- Metadata

# Authentication Architecture

Login Methods:

- Email and Password
- Google Login

Authentication Flow:

User Login ↓ Backend Validation ↓ JWT Access Token ↓ Refresh Token ↓ Authenticated Session

Security:

- bcrypt Password Hashing
- JWT Authentication
- Refresh Tokens
- Role Based Authorization

# Role-Based Access Control

Roles:

ADMIN TEACHER STUDENT

Permissions:

ADMIN

- Full Access

TEACHER

- Manage Courses
- Manage Lectures
- Manage Assignments
- Manage Attendance

STUDENT

- Attend Classes
- View Courses
- Submit Assignments

# Jitsi Meet Integration

Purpose:

Provide live classes.

Workflow:

Teacher Creates Lecture ↓ Backend Generates Room Name ↓ Meeting URL Created ↓ Meeting Stored in Database ↓ Students Join Through LMS

Example:

<https://meet.jit.si/lms-course-random-room-id>

# Google Drive Integration

Purpose:

Store large files.

Workflow:

Teacher Uploads Recording ↓ Backend Receives File ↓ Upload to Google Drive ↓ Save File Metadata ↓ Return File URL

Stored Metadata:

- Drive File ID
- File URL
- File Name
- Upload Date

# Attendance Architecture

Method 1:

Manual Attendance

Teacher marks attendance.

Method 2:

Automatic Attendance

Student joins meeting. ↓ Join event recorded. ↓ Attendance generated.

Attendance Status:

- Present
- Absent
- Late

# Assignment Architecture

Teacher Creates Assignment ↓ Assignment Stored ↓ Students Submit Files ↓ Submission Stored ↓ Teacher Reviews ↓ Marks Assigned

# Notification Architecture

Events:

- New Course
- New Lecture
- Assignment Created
- Assignment Deadline
- New Study Material

Delivery:

- In-App Notifications
- Email Notifications (Future)

# API Architecture

Frontend never accesses database directly.

Flow:

Frontend ↓ API Request ↓ Controller ↓ Service ↓ Prisma ORM ↓ PostgreSQL

Example:

React ↓ GET /api/courses ↓ Course Controller ↓ Course Service ↓ Prisma Query ↓ Database

# Backend Folder Structure

backend/

src/

controllers/ services/ routes/ middleware/ validators/ utils/ config/ prisma/

# Frontend Folder Structure

frontend/

src/

pages/ components/ layouts/ hooks/ services/ routes/ contexts/ types/ utils/

# Scalability Plan

Phase 1

- Single Server
- PostgreSQL
- Google Drive
- Jitsi Meet

Phase 2

- Redis Cache
- Background Jobs
- Email Service

Phase 3

- Microservices
- Kubernetes
- Cloud Storage
- Multi-Tenant LMS

# Security Requirements

Mandatory:

- HTTPS
- JWT Authentication
- Refresh Tokens
- Password Hashing
- Input Validation
- Rate Limiting
- CORS Protection
- SQL Injection Protection
- XSS Protection
- CSRF Protection

# Deployment Architecture

Frontend:

Vercel

Backend:

Render / Railway / VPS

Database:

PostgreSQL

Storage:

Google Drive (5 TB)

Video Meetings:

Jitsi Meet

# Future Enhancements

- Mobile Application
- AI Chatbot
- Online Exams
- Certificates
- Payment Gateway
- Multi-Institute Support
- Analytics Dashboard
- AI Attendance Tracking
- AI Course Recommendations