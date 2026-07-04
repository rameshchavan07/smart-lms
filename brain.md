# Smart LMS - Project Brain (Context for AI Models)

This document provides a comprehensive overview of the **Smart LMS** project architecture, technology stack, directory structure, database schema, and key workflows. Use this document as the primary context when developing new features, debugging, or refactoring the codebase.

## 1. Project Overview & Architecture

Smart LMS is a monolithic repository (monorepo) containing a highly secure, scalable virtual learning platform. It is designed for schools, colleges, and online educators.

**Core Architecture (Client-Server):**
- **Frontend:** React 19 single-page application (SPA) bundled with Vite. Provides role-based portals (Admin, Teacher, Student).
- **Backend:** Node.js/Express.js REST API using TypeScript. Handles business logic, authentication, and database operations.
- **Database:** PostgreSQL accessed via Prisma ORM v6.
- **Cloud/External Services:**
  - **Google Drive API v3:** Acts as a decentralized CDN for study materials and lecture recordings. Files are not stored on the Node.js server; instead, Google Drive `webViewLink`s are proxied to the frontend to reduce bandwidth.
  - **Jitsi Meet:** Integrated via React SDK for real-time live virtual classrooms.

## 2. Technology Stack

### Frontend
- **Framework:** React 19 (TypeScript) + Vite
- **Styling:** Tailwind CSS v4, Lucide Icons, HSL-based dark mode
- **State/Data Fetching:** React Context API (Auth), React Query (Server state/caching)
- **Testing:** Vitest, React Testing Library

### Backend
- **Framework:** Node.js, Express.js (TypeScript)
- **Database ORM:** Prisma Client v6
- **Database Engine:** PostgreSQL
- **Security:** JSON Web Tokens (JWT) stored in HTTPOnly cookies, BCrypt for passwords
- **Testing:** Vitest, Supertest

## 3. Directory Structure

The repository is structured as a monorepo with two main folders at the root:

```text
smart-lms/
├── backend/                  # Node.js REST API
│   ├── prisma/               # Database Schema (schema.prisma) & Seed Scripts
│   ├── src/
│   │   ├── controllers/      # API logic (Auth, Course, Lectures, Materials)
│   │   ├── middleware/       # Express protections (e.g., JWT cookie validation)
│   │   ├── routes/           # Express router definitions
│   │   ├── services/         # Third-party integrations (Google Drive, Jitsi)
│   │   ├── utils/            # Helpers (e.g., jwt.ts)
│   │   ├── validators/       # Request validation schemas
│   │   └── tests/            # Backend unit & integration tests (Vitest)
│   └── vitest.config.ts      
├── frontend/                 # React Single Page App
│   ├── src/
│   │   ├── components/       # Reusable UI widgets (Skeletons, Buttons, etc.)
│   │   ├── contexts/         # React Context providers (AuthContext)
│   │   ├── layouts/          # Portal layouts (AdminLayout, TeacherLayout, StudentLayout)
│   │   ├── pages/            # View components for specific routes
│   │   ├── services/         # Axios API clients
│   │   └── tests/            # Frontend unit tests
│   └── vite.config.ts        
├── docs/                     # Technical guidelines and screenshots
└── package.json              # Root config (Husky, lint-staged)
```

## 4. Database Schema (Prisma)

The PostgreSQL database is modeled using Prisma (`backend/prisma/schema.prisma`).

**Core Entities & Relationships:**
- **User:** The base authentication entity. Has a specific `UserRole` (`SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`). 
  - `User` has one-to-one relations with `Teacher` or `Student` profiles depending on the role.
  - **Institute Admin Assignment:** `SUPER_ADMIN`s have the ability to assign an `ADMIN` role to a user and link them to a specific `Institute` directly from the user management modals.
- **Institute:** Organizations that users and courses belong to.
- **Course:** The central learning unit. A course has one `Teacher`, many `Enrollment`s (Students), `Lecture`s, `StudyMaterial`s, `Assignment`s, and `Quiz`zes.
- **Lecture:** Represents a live session (Jitsi meeting). Tracks attendance.
- **Assignment & Submissions:** Teachers create assignments with rubrics; students upload file links/content as submissions.
- **Quiz & Submissions:** Quizzes contain `QuizQuestion`s and `QuizOption`s. Students generate `QuizSubmission`s.
- **Communication:** Supports `Discussion` threads in courses, direct `Message`s between users, and `ChatGroup`s.
- **File Management:** Tracks `GoogleDriveFolder`s and `GoogleDriveFile`s to manage cloud assets efficiently.

## 5. Security & Authentication Flow

Smart LMS strictly uses **JWT + HTTPOnly Cookies** to prevent XSS attacks. No tokens are stored in `localStorage`.

1. **Login (`/api/auth/login`):** User submits credentials. Backend validates and signs an Access Token (15m) and Refresh Token (7d).
2. **Cookie Setting:** Tokens are sent in the response header as `Set-Cookie` with `HttpOnly`, `Secure`, and `SameSite=Strict` flags.
3. **Frontend Hydration (`/api/auth/me`):** On app load, `AuthContext.tsx` hits this endpoint to verify the session and load user data.
4. **API Requests:** The frontend uses Axios with `withCredentials: true` to automatically send cookies with every request.
5. **Route Protection:** Backend routes use middleware that extracts the token using `cookie-parser` and verifies it.

## 6. Key Development Workflows

- **Running Locally:**
  - Database: Make sure Postgres is running and `DATABASE_URL` is configured in `backend/.env`. Apply migrations with `npx prisma db push` and `npx prisma db seed`.
  - Backend: `cd backend && npm run dev` (Runs on `http://localhost:5000`)
  - Frontend: `cd frontend && npm run dev` (Runs on `http://localhost:5173`)
- **Adding a New API Route:**
  1. Define request validation in `backend/src/validators/`.
  2. Implement business logic in `backend/src/controllers/`.
  3. Register the endpoint in `backend/src/routes/` and protect it with auth middleware.
- **Adding a New Frontend Feature:**
  1. Define API calls in `frontend/src/services/`.
  2. Create components in `frontend/src/components/` (use Tailwind v4 utilities).
  3. Consume data using React Query in `frontend/src/pages/`.
- **Testing:** 
  - Run backend tests: `cd backend && npm run test`
  - Run frontend tests: `cd frontend && npm run test`

## 7. Useful Environment Variables
- Backend requires: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`, `GOOGLE_DRIVE_FOLDER_ID`
- Frontend requires: `VITE_API_URL`
