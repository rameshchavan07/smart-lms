# BRAIN.md — OpenLearnX LMS Repository Memory

This document serves as the project's permanent memory and developer handbook. It captures the architecture, integrations, schemas, authentication flows, and development guidelines of **OpenLearnX** to allow any AI model or developer to immediately continue development without onboarding friction.

---

## 1. Project Vision & Goals
OpenLearnX is a premium, open-source Learning Management System (LMS) that integrates:
- Collapsible role-based portals (Student, Teacher, Admin).
- Interactive video rooms (Jitsi Meet WebRTC).
- File storage and proxy streaming directly from Google Drive.
- Custom analytics dashboards.

---

## 2. Complete Architecture
OpenLearnX uses a decoupled Client-Server architecture:
- **Frontend SPA**: React 19, TypeScript, Vite, TailwindCSS, Framer Motion, Recharts.
- **Backend API**: Node.js, Express, TypeScript.
- **Database**: PostgreSQL with Prisma ORM.
- **Third-Party**: Google APIs (Drive, OAuth 2.0), Jitsi JaaS (WebRTC JWT).

---

## 3. Technology Stack
### Backend
- Node.js, Express, TypeScript.
- Prisma ORM, PostgreSQL.
- Passport.js, Express Session, JSON Web Tokens.
- Nodemailer.

### Frontend
- React 19, Vite, TypeScript.
- TailwindCSS, Framer Motion.
- Axios, React Hot Toast.
- Recharts (charts plotting).

---

## 4. Feature List
- **Auth**: Email OTP verification, Password resets, Google OAuth 2.0, Local credentials check.
- **Student**: Join courses, view continue learning progress, see tasks list with priority colors (High, Medium, Low), monthly calendar events.
- **Teacher**: Create/edit courses, upload study material, schedule video calls, monitor class averages, track submissions.
- **Admin**: Create users, enroll students, manage system health status, review audit trails.
- **File Management**: Direct streaming and proxy buffering from Google Drive folders, reducing local server storage load to zero.
- **Live Classes**: In-browser video rooms with screensharing and host moderation controls (Teachers).

---

## 5. Database Schema (Prisma)
### Key Models
- **User**: Base account data (name, email, bcrypt password hash, role enum, profile image, googleId).
- **Student**: Tied to a `User` (studentCode, enrollmentNumber, academicYear).
- **Teacher**: Tied to a `User` (employeeCode, specialization, joiningDate).
- **Course**: Title, status (DRAFT, ACTIVE, ARCHIVED), study materials, assignments, enrollments.
- **Enrollment**: Many-to-many join model linking `Student` and `Course`.
- **Lecture**: Holds start/end times, meeting links, and points to a `Course`.
- **Attendance**: Connects `Student` to a `Lecture` (PRESENT, ABSENT, LATE status).
- **Assignment / AssignmentSubmission**: Submission files, marks, and teacher feedback.
- **StudyMaterial**: Path to file on Drive, size, and uploaded details.
- **GoogleDriveFolder**: Caches resolved folder path-to-ID mappings.
- **GoogleDriveFile**: Records file references.
- **AuditLog**: Stores server-side action histories.
- **RefreshToken**: Long-lived token rotation details.
- **OtpToken**: Password resets and verification logs.

---

## 6. Authentication Flow

### Local Authentication
1. User POSTs email & password.
2. Backend queries database and verifies the password hash using `bcrypt.compare()`.
3. Server returns a JWT access token (expires in 15m) and a refresh token (expires in 7d).
4. Frontend Axios interceptors automatically inject the JWT in the `Authorization: Bearer <token>` header.

### Google OAuth
1. Client navigates to `/api/auth/google`.
2. Passport handles redirection to Google Consent.
3. Upon approval, Google redirects back to the callback URL.
4. Server generates JWTs, saves tokens in localStorage, and redirects client home.

---

## 7. API Documentation (Endpoints)
- **Auth**:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh-token`
  - `POST /api/auth/verify-email`
  - `GET /api/auth/google` (and `/google/callback`)
- **Users**:
  - `GET /api/users` (CRUD)
  - `POST /api/users`
- **Courses**:
  - `GET /api/courses` (Manage, enroll, view materials)
  - `POST /api/courses`
- **Analytics**:
  - `GET /api/analytics/admin`
  - `GET /api/analytics/teacher`
  - `GET /api/analytics/student`
- **Media**:
  - `GET /api/media/drive/:fileId` (Pipes Google Drive stream directly to response)

---

## 8. Environment Variables

### Backend `.env`
```bash
PORT=5000
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
JWT_SECRET="jwt-key"
JWT_REFRESH_SECRET="refresh-key"
GOOGLE_CLIENT_ID="google-oauth-client-id"
GOOGLE_CLIENT_SECRET="google-oauth-client-secret"
GOOGLE_REFRESH_TOKEN="google-drive-refresh-token"
GOOGLE_DRIVE_FOLDER_ID="root-drive-folder-id"
JITSI_APP_ID="jitsi-app-id"
JITSI_KID="jitsi-key-id"
JITSI_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
SESSION_SECRET="session-secret"
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="smtp-username"
SMTP_PASS="smtp-password"
EMAIL_FROM="noreply@openlearnx.com"
```

### Frontend `.env`
```bash
VITE_API_URL="http://localhost:5000/api"
VITE_API_BASE_URL="http://localhost:5000"
```

---

## 9. File Upload System
1. Study Materials or Assignment Submissions are uploaded via multipart form.
2. Backend intercepts the request, streams the file buffer to Google Drive.
3. Google Drive responds with a `fileId`.
4. File permissions are set to public reader so they can be viewed.
5. In the frontend, files are requested via `/api/media/drive/:fileId`. The backend proxies and pipes the stream directly, applying a 24-hour cache header.

---

## 10. Live Classes (Jitsi Integration)
- Teachers start classes by creating a `Lecture`.
- Server signs a Jitsi JaaS token using the RS256 algorithm (signed with the private key) and appends moderator roles for teachers.
- The frontend loads the `@jitsi/react-sdk` inside a secure iframe, passing the signed JWT for authentication.

---

## 11. Security Implementation
- **Headers**: Helmet disables CSP to allow external CDNs, but maintains clickjacking security.
- **Passwords**: Hashed with a salt factor of 10.
- **Auth Guard**: Role guards verify token signatures and check `UserRole` matching.

---

## 12. Coding Standards
- **Strict TypeScript**: Avoid `any` typing; use descriptive interfaces.
- **Asynchronous Effects**: Always run effects asynchronously (`Promise.resolve().then(...)`) to prevent synchronous React state triggers.
- **Functional Components**: Use arrow function definitions for React components.

---

## 13. Build & Run Instructions
To run the project locally:

### 1. Database Setup
```bash
cd backend
npx prisma db push
npx prisma db seed
```

### 2. Boot Servers
```bash
# Start backend
cd backend
npm run dev

# Start frontend
cd frontend
npm run dev
```

### 3. Compilation check
```bash
cd frontend
npm run build
```
