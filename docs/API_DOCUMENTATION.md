# API_DOCUMENTATION.md

# Smart LMS API Documentation

## Base URL

Development:

<https://localhost:5000/api>

Production:

<https://api.smartlms.com/api>

# Authentication

Authentication Type:

Bearer Token (JWT)

Header:

Authorization: Bearer

# AUTH MODULE

## Register User

POST /auth/register

Description:

Create a new user account.

Request Body:

{ "firstName": "John", "lastName": "Doe", "email": "<john@example.com>", "password": "Password123", "role": "STUDENT" }

Response:

{ "success": true, "message": "User registered successfully" }

## Login

POST /auth/login

Request:

{ "email": "<john@example.com>", "password": "Password123" }

Response:

{ "accessToken": "jwt_token", "refreshToken": "refresh_token", "user": { "id": "uuid", "name": "John Doe", "role": "STUDENT" } }

## Google Login

POST /auth/google

Request:

{ "googleToken": "google_oauth_token" }

Response:

{ "accessToken": "jwt_token", "refreshToken": "refresh_token" }

## Refresh Token

POST /auth/refresh-token

Request:

{ "refreshToken": "token" }

Response:

{ "accessToken": "new_token" }

## Logout

POST /auth/logout

Response:

{ "success": true }

# USER MANAGEMENT

## Get Current User

GET /users/me

Response:

{ "id": "uuid", "name": "John Doe", "email": "<john@example.com>", "role": "STUDENT" }

## Get All Users

GET /users

Role:

ADMIN

Query Params:

?page=1 &limit=10 &role=STUDENT

## Create Teacher

POST /users/teachers

Role:

ADMIN

Request:

{ "firstName": "Ramesh", "lastName": "Patil", "email": "<teacher@example.com>" }

## Create Student

POST /users/students

Role:

ADMIN

Request:

{ "firstName": "Amit", "lastName": "Sharma", "email": "<student@example.com>" }

# COURSES MODULE

## Create Course

POST /courses

Role:

ADMIN

Request:

{ "title": "React Development", "description": "Complete React Course", "teacherId": "uuid" }

## Get All Courses

GET /courses

Query:

?page=1 &limit=10

## Get Course By ID

GET /courses/:id

## Update Course

PUT /courses/:id

## Delete Course

DELETE /courses/:id

# ENROLLMENT MODULE

## Enroll Student

POST /enrollments

Request:

{ "studentId": "uuid", "courseId": "uuid" }

## Get Course Students

GET /courses/:id/students

## Remove Student

DELETE /enrollments/:id

# LECTURES MODULE

## Create Lecture

POST /lectures

Role:

TEACHER

Request:

{ "courseId": "uuid", "title": "Introduction to React", "description": "React Basics", "startTime": "2026-07-10T10:00:00", "endTime": "2026-07-10T11:00:00" }

Backend Generates:

{ "meetingUrl": "<https://meet.jit.si/room-id>" }

## Get Lectures

GET /lectures

## Get Lecture By ID

GET /lectures/:id

## Update Lecture

PUT /lectures/:id

## Delete Lecture

DELETE /lectures/:id

# ATTENDANCE MODULE

## Mark Attendance

POST /attendance

Request:

{ "lectureId": "uuid", "studentId": "uuid", "status": "PRESENT" }

## Get Attendance

GET /attendance

Query:

?courseId= ?lectureId=

# ASSIGNMENT MODULE

## Create Assignment

POST /assignments

Role:

TEACHER

Request:

{ "courseId": "uuid", "title": "React Assignment", "description": "Build a Todo App", "dueDate": "2026-07-15" }

## Get Assignments

GET /assignments

## Submit Assignment

POST /assignment-submissions

Request:

{ "assignmentId": "uuid", "fileUrl": "uploaded-file-url" }

## Grade Assignment

PUT /assignment-submissions/:id/grade

Request:

{ "marks": 90, "feedback": "Good Work" }

# STUDY MATERIALS MODULE

## Upload Material

POST /materials/upload

Role:

TEACHER

Content-Type:

multipart/form-data

Fields:

file courseId title

Response:

{ "fileId": "drive_file_id", "fileUrl": "google_drive_url" }

## Get Materials

GET /materials

Query:

?courseId=

## Delete Material

DELETE /materials/:id

# RECORDED LECTURES

## Upload Recording

POST /recordings/upload

Role:

TEACHER

Content-Type:

multipart/form-data

Fields:

file lectureId

Workflow:

Teacher Uploads File ↓ Server Uploads To Google Drive ↓ Metadata Saved In Database

Response:

{ "recordingId": "uuid", "recordingUrl": "google_drive_url" }

## Get Recordings

GET /recordings

Query:

?courseId=

# JITSI MEET MODULE

## Generate Meeting Room

POST /meetings/create

Request:

{ "lectureId": "uuid" }

Response:

{ "roomName": "react-course-123", "meetingUrl": "<https://meet.jit.si/react-course-123>" }

# NOTIFICATION MODULE

## Get Notifications

GET /notifications

## Mark As Read

PUT /notifications/:id/read

# DASHBOARD MODULE

## Admin Dashboard

GET /dashboard/admin

Returns:

- Total Students
- Total Teachers
- Total Courses
- Total Lectures

## Teacher Dashboard

GET /dashboard/teacher

Returns:

- Assigned Courses
- Upcoming Lectures
- Student Count

## Student Dashboard

GET /dashboard/student

Returns:

- Enrolled Courses
- Upcoming Classes
- Pending Assignments

# FILE UPLOAD RULES

Allowed Types:

- pdf
- docx
- pptx
- zip
- mp4
- mov
- mkv

Maximum File Size:

2 GB

# API RESPONSE FORMAT

Success:

{ "success": true, "message": "Operation successful", "data": {} }

Error:

{ "success": false, "message": "Something went wrong" }

# HTTP STATUS CODES

200 Success

201 Created

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

500 Internal Server Error