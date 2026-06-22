# PRISMA_SCHEMA_GUIDE.md

# Smart LMS - Prisma Schema Guide

## Purpose

This document defines database modeling standards for the LMS project using Prisma ORM and PostgreSQL.

The AI should use this guide when generating:

- schema.prisma
- migrations
- repositories
- services
- database queries

# Database Provider

Database:

PostgreSQL

ORM:

Prisma

# General Rules

## Primary Keys

All tables must use UUID.

Example:

id String @id @default(uuid())

## Timestamps

Every table should contain:

createdAt DateTime @default(now())

updatedAt DateTime @updatedAt

## Soft Delete

Where applicable:

isActive Boolean @default(true)

Avoid permanent deletion.

# ENUMS

## UserRole

ADMIN

TEACHER

STUDENT

enum UserRole { ADMIN TEACHER STUDENT }

## CourseStatus

DRAFT

ACTIVE

ARCHIVED

enum CourseStatus { DRAFT ACTIVE ARCHIVED }

## AttendanceStatus

PRESENT

ABSENT

LATE

enum AttendanceStatus { PRESENT ABSENT LATE }

# USER MODEL

Purpose:

Stores all users.

Fields:

id

firstName

lastName

email

passwordHash

role

profileImage

googleId

isActive

createdAt

updatedAt

Relationships:

User -> Teacher

User -> Student

User -> Notifications

User -> AuditLogs

# TEACHER MODEL

Purpose:

Teacher specific information.

Fields:

id

userId

employeeCode

specialization

qualification

joiningDate

Relationships:

Teacher -> User

Teacher -> Courses

# STUDENT MODEL

Purpose:

Student specific information.

Fields:

id

userId

studentCode

enrollmentNumber

academicYear

admissionDate

Relationships:

Student -> User

Student -> Enrollments

Student -> Attendance

Student -> AssignmentSubmissions

# COURSE MODEL

Purpose:

Store course information.

Fields:

id

title

description

thumbnailUrl

teacherId

status

createdAt

updatedAt

Relationships:

Course -> Teacher

Course -> Enrollments

Course -> Lectures

Course -> Assignments

Course -> StudyMaterials

# ENROLLMENT MODEL

Purpose:

Many-to-many relationship.

Fields:

id

studentId

courseId

enrolledAt

Relationships:

Student -> Enrollments

Course -> Enrollments

Unique Constraint:

studentId + courseId

# LECTURE MODEL

Purpose:

Store live and recorded lectures.

Fields:

id

courseId

title

description

meetingUrl

recordingUrl

startTime

endTime

createdBy

Relationships:

Lecture -> Course

Lecture -> Attendance

# ATTENDANCE MODEL

Purpose:

Track lecture attendance.

Fields:

id

lectureId

studentId

joinTime

leaveTime

status

Relationships:

Attendance -> Lecture

Attendance -> Student

# ASSIGNMENT MODEL

Purpose:

Store assignments.

Fields:

id

courseId

title

description

dueDate

totalMarks

Relationships:

Assignment -> Course

Assignment -> AssignmentSubmission

# ASSIGNMENT SUBMISSION MODEL

Purpose:

Store assignment submissions.

Fields:

id

assignmentId

studentId

fileUrl

marks

feedback

submittedAt

Relationships:

Assignment -> Submissions

Student -> Submissions

# STUDY MATERIAL MODEL

Purpose:

Store educational materials.

Fields:

id

courseId

title

fileUrl

fileType

uploadedBy

uploadedAt

Relationships:

Course -> StudyMaterials

# NOTIFICATION MODEL

Purpose:

Store notifications.

Fields:

id

userId

title

message

isRead

createdAt

Relationships:

User -> Notifications

# GOOGLE DRIVE FILE MODEL

Purpose:

Store Google Drive metadata.

Fields:

id

driveFileId

fileName

fileUrl

uploadedBy

createdAt

Relationships:

User -> DriveFiles

# AUDIT LOG MODEL

Purpose:

Track important system actions.

Fields:

id

userId

action

entityType

entityId

createdAt

Relationships:

User -> AuditLogs

# INDEXES

Required Indexes

User:

email

Teacher:

employeeCode

Student:

enrollmentNumber

Course:

teacherId

Lecture:

courseId

Attendance:

lectureId

studentId

Assignment:

courseId

Notification:

userId

# RELATIONSHIP RULES

User ↓ Teacher (1:1)

User ↓ Student (1:1)

Teacher ↓ Course (1:N)

Course ↓ Lecture (1:N)

Course ↓ Assignment (1:N)

Course ↓ StudyMaterial (1:N)

Student ↓ Enrollment (1:N)

Student ↓ Attendance (1:N)

Student ↓ AssignmentSubmission (1:N)

Assignment ↓ AssignmentSubmission (1:N)

User ↓ Notification (1:N)

User ↓ AuditLog (1:N)

# FILE STORAGE STRATEGY

Actual Files:

Google Drive

Database Stores:

driveFileId

fileUrl

fileName

fileType

Do not store binary files in PostgreSQL.

# AUTHENTICATION STRATEGY

Password Hashing:

bcrypt

Authentication:

JWT

Social Login:

Google OAuth

Refresh Tokens:

Separate refresh token table recommended.

# FUTURE SCHEMA EXPANSION

Phase 2

- Online Exams
- Quiz Module
- Certificate Module
- Discussion Forum

Phase 3

- Multi-Tenant LMS
- Subscription Plans
- Payment Gateway
- AI Learning Analytics

# AI GENERATION RULES

When generating schema.prisma:

- Use UUID primary keys.
- Use Prisma relations.
- Use indexes.
- Use enums.
- Use createdAt and updatedAt fields.
- Use cascade delete only where appropriate.
- Follow PostgreSQL best practices.
- Generate production-ready schema.