# DATABASE.md

# Smart LMS Database Design

## Database Technology

- PostgreSQL
- Prisma ORM
- UUID Primary Keys

# Users Table

Stores all system users.

## Table: users

| Column        | Type         | Description             |
| ------------- | ------------ | ----------------------- |
| id            | UUID         | Primary Key             |
| first_name    | VARCHAR(100) | User First Name         |
| last_name     | VARCHAR(100) | User Last Name          |
| email         | VARCHAR(255) | Unique Email            |
| password_hash | TEXT         | Hashed Password         |
| role          | ENUM         | ADMIN, TEACHER, STUDENT |
| profile_image | TEXT         | Profile Image URL       |
| google_id     | VARCHAR(255) | Google Login ID         |
| is_active     | BOOLEAN      | Account Status          |
| created_at    | TIMESTAMP    | Created Date            |
| updated_at    | TIMESTAMP    | Updated Date            |

# Teachers Table

Additional teacher information.

## Table: teachers

| Column         | Type         |
| -------------- | ------------ |
| id             | UUID         |
| user_id        | UUID         |
| employee_code  | VARCHAR(50)  |
| specialization | VARCHAR(255) |
| qualification  | VARCHAR(255) |
| joining_date   | DATE         |

Relationship:

Teacher belongs to one User.

# Students Table

## Table: students

| Column            | Type         |
| ----------------- | ------------ |
| id                | UUID         |
| user_id           | UUID         |
| student_code      | VARCHAR(50)  |
| enrollment_number | VARCHAR(100) |
| admission_date    | DATE         |
| academic_year     | VARCHAR(50)  |

Relationship:

Student belongs to one User.

# Courses Table

## Table: courses

| Column        | Type         |
| ------------- | ------------ |
| id            | UUID         |
| title         | VARCHAR(255) |
| description   | TEXT         |
| thumbnail_url | TEXT         |
| teacher_id    | UUID         |
| status        | ENUM         |
| created_at    | TIMESTAMP    |

Status Values:

- DRAFT
- ACTIVE
- ARCHIVED

# Course Enrollments

Many-to-Many Relationship

## Table: enrollments

| Column      | Type      |
| ----------- | --------- |
| id          | UUID      |
| student_id  | UUID      |
| course_id   | UUID      |
| enrolled_at | TIMESTAMP |

# Lectures Table

Stores all scheduled lectures.

## Table: lectures

| Column        | Type         |
| ------------- | ------------ |
| id            | UUID         |
| course_id     | UUID         |
| title         | VARCHAR(255) |
| description   | TEXT         |
| meeting_url   | TEXT         |
| start_time    | TIMESTAMP    |
| end_time      | TIMESTAMP    |
| recording_url | TEXT         |
| created_by    | UUID         |

# Attendance Table

## Table: attendance

| Column     | Type      |
| ---------- | --------- |
| id         | UUID      |
| lecture_id | UUID      |
| student_id | UUID      |
| join_time  | TIMESTAMP |
| leave_time | TIMESTAMP |
| status     | ENUM      |

Status:

- PRESENT
- ABSENT
- LATE

# Assignments Table

## Table: assignments

| Column      | Type         |
| ----------- | ------------ |
| id          | UUID         |
| course_id   | UUID         |
| title       | VARCHAR(255) |
| description | TEXT         |
| due_date    | TIMESTAMP    |
| total_marks | INTEGER      |
| created_at  | TIMESTAMP    |

# Assignment Submissions

## Table: assignment_submissions

| Column        | Type      |
| ------------- | --------- |
| id            | UUID      |
| assignment_id | UUID      |
| student_id    | UUID      |
| file_url      | TEXT      |
| submitted_at  | TIMESTAMP |
| marks         | INTEGER   |
| feedback      | TEXT      |

# Study Materials

## Table: study_materials

| Column      | Type         |
| ----------- | ------------ |
| id          | UUID         |
| course_id   | UUID         |
| title       | VARCHAR(255) |
| file_url    | TEXT         |
| file_type   | VARCHAR(50)  |
| uploaded_by | UUID         |
| uploaded_at | TIMESTAMP    |

# Notifications

## Table: notifications

| Column     | Type         |
| ---------- | ------------ |
| id         | UUID         |
| user_id    | UUID         |
| title      | VARCHAR(255) |
| message    | TEXT         |
| is_read    | BOOLEAN      |
| created_at | TIMESTAMP    |

# Google Drive Files

Stores file references.

## Table: google_drive_files

| Column        | Type         |
| ------------- | ------------ |
| id            | UUID         |
| drive_file_id | TEXT         |
| file_name     | VARCHAR(255) |
| file_url      | TEXT         |
| uploaded_by   | UUID         |
| created_at    | TIMESTAMP    |

# Audit Logs

Tracks important actions.

## Table: audit_logs

| Column      | Type         |
| ----------- | ------------ |
| id          | UUID         |
| user_id     | UUID         |
| action      | VARCHAR(255) |
| entity_type | VARCHAR(100) |
| entity_id   | UUID         |
| created_at  | TIMESTAMP    |

# Relationships

User → Teacher (1:1)

User → Student (1:1)

Teacher → Courses (1:N)

Course → Lectures (1:N)

Course → Assignments (1:N)

Course → Study Materials (1:N)

Student → Enrollments (1:N)

Lecture → Attendance (1:N)

Assignment → Submissions (1:N)

User → Notifications (1:N)

User → Audit Logs (1:N)