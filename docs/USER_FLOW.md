# USER_FLOW.md

# Smart LMS - User Flow Documentation

## Overview

This document describes how users interact with the LMS system.

Supported Roles:

- Admin
- Teacher
- Student

Each role has separate permissions, dashboards, and workflows.

# Authentication Flow

## New User Registration

User Opens LMS ↓ Register Page ↓ Enter Details ↓ Email Verification (Future) ↓ Account Created ↓ Login ↓ Dashboard Redirect

# Login Flow

User Opens Login Page ↓ Enter Credentials ↓ Backend Authentication ↓ Generate JWT Token ↓ Fetch User Role ↓ Redirect To Role Dashboard

Role Routing:

ADMIN → /admin/dashboard

TEACHER → /teacher/dashboard

STUDENT → /student/dashboard

# Password Reset Flow

Forgot Password ↓ Enter Email ↓ Receive Reset Link ↓ Create New Password ↓ Login

# ADMIN USER FLOW

## Admin Dashboard

Login ↓ Admin Dashboard ↓ View Statistics ↓ Manage System

Dashboard Widgets:

- Total Students
- Total Teachers
- Total Courses
- Total Lectures
- Attendance Overview

# Teacher Management Flow

Admin Dashboard ↓ Teachers Menu ↓ Teacher List ↓ Add Teacher ↓ Fill Teacher Information ↓ Create Teacher Account ↓ Send Credentials

Actions:

- Create Teacher
- Edit Teacher
- Deactivate Teacher
- Delete Teacher

# Student Management Flow

Admin Dashboard ↓ Students Menu ↓ Student List ↓ Add Student ↓ Create Student Account

Actions:

- Create Student
- Edit Student
- Deactivate Student
- Delete Student

# Course Management Flow

Admin Dashboard ↓ Courses ↓ Create Course ↓ Assign Teacher ↓ Save Course

Actions:

- Create Course
- Update Course
- Delete Course
- Archive Course

# Enrollment Flow

Admin Dashboard ↓ Select Course ↓ Enroll Students ↓ Select Students ↓ Confirm Enrollment

Result:

Students receive course access.

# Reports Flow

Admin Dashboard ↓ Reports ↓ Select Report Type ↓ Generate Report ↓ Download PDF

Reports:

- Attendance Report
- Student Report
- Teacher Report
- Course Report

# TEACHER USER FLOW

## Teacher Dashboard

Login ↓ Teacher Dashboard ↓ View Assigned Courses ↓ Manage Teaching Activities

Widgets:

- Assigned Courses
- Upcoming Lectures
- Student Count
- Pending Assignments

# Course Management

Teacher Dashboard ↓ My Courses ↓ Select Course

Teacher Can:

- View Course Details
- Upload Materials
- Create Lectures
- Create Assignments

# Create Lecture Flow

Teacher Dashboard ↓ My Courses ↓ Select Course ↓ Create Lecture

Enter:

- Lecture Title
- Description
- Date
- Time

Save ↓ Generate Jitsi Meeting Link ↓ Store Meeting Information

Result:

Lecture Created

# Start Live Class Flow

Teacher Dashboard ↓ Upcoming Lectures ↓ Click Start Class ↓ Open Jitsi Meeting ↓ Students Join

Result:

Live Session Started

# Upload Recording Flow

Teacher Dashboard ↓ Recorded Lectures ↓ Upload Video ↓ Server Uploads To Google Drive ↓ Save Metadata In Database

Result:

Students Can Access Recording

# Upload Study Material Flow

Teacher Dashboard ↓ Course ↓ Study Materials ↓ Upload File ↓ Google Drive Storage

Supported Files:

- PDF
- PPTX
- DOCX
- ZIP

# Assignment Creation Flow

Teacher Dashboard ↓ Assignments ↓ Create Assignment

Enter:

- Title
- Description
- Due Date
- Total Marks

Save Assignment

Result:

Students Receive Notification

# Assignment Review Flow

Teacher Dashboard ↓ Assignment Submissions ↓ Review Submission ↓ Assign Marks ↓ Add Feedback

Result:

Marks Published

# Attendance Flow

Teacher Dashboard ↓ Attendance ↓ Select Lecture ↓ Mark Attendance

OR

Auto Attendance Generated

Actions:

- Mark Present
- Mark Absent
- Mark Late

# STUDENT USER FLOW

## Student Dashboard

Login ↓ Student Dashboard ↓ Access Learning Content

Widgets:

- My Courses
- Upcoming Classes
- Attendance Percentage
- Pending Assignments

# Course Access Flow

Student Dashboard ↓ My Courses ↓ Select Course ↓ View Course Content

Can Access:

- Materials
- Lectures
- Assignments

# Join Live Class Flow

Student Dashboard ↓ Upcoming Lectures ↓ Join Class ↓ Open Jitsi Meeting

Attendance Recorded

Result:

Student Attends Class

# Watch Recording Flow

Student Dashboard ↓ Recorded Lectures ↓ Select Lecture ↓ Watch Video

Options:

- Stream Video
- Download Video (Optional)

# Download Material Flow

Student Dashboard ↓ Study Materials ↓ Select File ↓ Download

# Assignment Submission Flow

Student Dashboard ↓ Assignments ↓ Select Assignment ↓ Upload File ↓ Submit

Result:

Submission Stored

# View Attendance Flow

Student Dashboard ↓ Attendance ↓ View Attendance History

Displays:

- Present Count
- Absent Count
- Attendance Percentage

# Notification Flow

System Event ↓ Notification Generated ↓ Notification Stored ↓ User Receives Alert

Events:

- New Lecture
- New Assignment
- New Material
- Upcoming Class
- Assignment Deadline

# Authorization Flow

User Requests Resource ↓ JWT Validation ↓ Role Validation

Admin:

Full Access

Teacher:

Assigned Courses Only

Student:

Enrolled Courses Only

# Error Handling Flow

Unauthorized User ↓ 401 Response ↓ Redirect To Login

Forbidden Resource ↓ 403 Response ↓ Access Denied Page

Page Not Found ↓ 404 Page

# Complete LMS User Journey

Admin Creates Teacher ↓ Admin Creates Course ↓ Admin Assigns Teacher ↓ Admin Enrolls Students ↓ Teacher Creates Lecture ↓ Teacher Starts Live Class ↓ Students Join Class ↓ Attendance Recorded ↓ Teacher Uploads Recording ↓ Students Watch Recording ↓ Teacher Creates Assignment ↓ Students Submit Assignment ↓ Teacher Grades Assignment ↓ Students View Results

End-to-End Learning Lifecycle Complete