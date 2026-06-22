# Smart LMS - Project Requirements

## Project Overview

Smart LMS is a web-based Learning Management System designed for schools, colleges, coaching institutes, and online educators.

The platform provides:

- User Authentication
- Course Management
- Live Classes
- Recorded Lectures
- Attendance Tracking
- Assignment Management
- Study Materials
- Notifications

The application supports three user roles:

- Admin
- Teacher
- Student

# Technology Stack

## Frontend

- React
- TypeScript
- Tailwind CSS
- React Router
- Axios
- React Query

## Backend

- Node.js
- Express.js
- TypeScript

## Database

- PostgreSQL
- Prisma ORM

## Authentication

- JWT Authentication
- Refresh Tokens
- Google Login

## Video Meeting

- Jitsi Meet Integration

## File Storage

- Google Drive API (5 TB Storage)

# User Roles

## Admin

### Responsibilities

- Create Teachers
- Create Students
- Create Courses
- Assign Teachers to Courses
- View Reports
- Manage Platform Settings

### Permissions

- Full System Access

## Teacher

### Responsibilities

- Manage Assigned Courses
- Schedule Live Classes
- Upload Study Materials
- Upload Recorded Lectures
- Mark Attendance
- Create Assignments

### Permissions

- Access only assigned courses

## Student

### Responsibilities

- Attend Live Classes
- View Recorded Lectures
- Download Materials
- Submit Assignments

### Permissions

- Access only enrolled courses

# Authentication Requirements

## Login Methods

### Email and Password

Users can login using:

- Email
- Password

### Google Login

Users can login using Google OAuth.

### Role-Based Access

Every user must have one role:

- ADMIN
- TEACHER
- STUDENT

# Course Management

## Admin

Can create:

- Course Name
- Description
- Teacher Assignment
- Course Thumbnail

## Teacher

Can update:

- Course Content
- Course Materials

## Student

Can view enrolled courses only.

# Live Classes

## Teacher

Can create a live lecture.

Fields:

- Lecture Title
- Course
- Date
- Start Time
- End Time

System automatically generates a Jitsi Meeting Room.

Meeting URL must be stored in database.

# Recorded Lectures

Workflow:

- Teacher records lecture.
- Teacher uploads video.
- Backend uploads video to Google Drive.
- Google Drive File ID stored in database.
- Students can stream video from LMS.

Supported Formats:

- MP4
- MKV
- MOV

Maximum Size:

- 2 GB

# Attendance System

Attendance must be tracked.

Fields:

- Student ID
- Lecture ID
- Join Time
- Leave Time
- Status

Status:

- Present
- Absent
- Late

# Assignment Module

Teacher can:

- Create Assignment
- Set Deadline
- Upload Files

Student can:

- Submit Assignment
- Upload PDF
- Upload DOCX

Teacher can:

- Review Submission
- Assign Marks

# Study Materials

Supported Files:

- PDF
- DOCX
- PPTX
- ZIP

Files stored in Google Drive.

# Notifications

Students receive notifications for:

- New Lecture
- Assignment Created
- Assignment Deadline
- Course Updates

# Security Requirements

- Passwords must be hashed using bcrypt.
- JWT authentication required.
- Role-based authorization required.
- Input validation required.
- Rate limiting required.

# Performance Requirements

- Support 1000+ users.
- Response time below 2 seconds.
- Optimized database queries.
- Pagination on all tables.

# Future Features

Phase 2:

- Online Exams
- AI Chatbot
- Certificates
- Analytics Dashboard

Phase 3:

- Mobile Application
- Payment Gateway
- Multi-Institute Support