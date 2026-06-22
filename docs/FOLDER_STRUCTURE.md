# FOLDER_STRUCTURE.md

# Smart LMS - Project Folder Structure

## Overview

The project follows a Monorepo structure.

Technology Stack:

- React
- TypeScript
- Node.js
- Express.js
- PostgreSQL
- Prisma
- Jitsi Meet
- Google Drive API

# Root Structure

lms/

├── frontend/ ├── backend/ ├── docs/ ├── .github/ ├── .gitignore ├── README.md ├── docker-compose.yml └── package.json

# Frontend Structure

frontend/

src/

assets/ components/ features/ hooks/ layouts/ pages/ routes/ services/ store/ types/ utils/ contexts/

App.tsx main.tsx

# Frontend Detailed Structure

frontend/

src/

assets/

images/ icons/ logos/

components/

ui/ common/ forms/ tables/ modals/ cards/ charts/ loaders/

features/

auth/ courses/ lectures/ assignments/ attendance/ materials/ notifications/ dashboard/

Each feature contains:

components/ pages/ services/ types/ hooks/

pages/

LandingPage LoginPage RegisterPage ForgotPasswordPage NotFoundPage

layouts/

AdminLayout TeacherLayout StudentLayout AuthLayout

routes/

AppRoutes ProtectedRoute RoleRoute

services/

api.ts

auth.service.ts course.service.ts lecture.service.ts assignment.service.ts attendance.service.ts material.service.ts

store/

authStore courseStore notificationStore

types/

auth.types.ts course.types.ts lecture.types.ts

utils/

constants.ts helpers.ts validators.ts dateUtils.ts

contexts/

AuthContext ThemeContext

# Backend Structure

backend/

src/

config/ controllers/ services/ repositories/ routes/ middleware/ validators/ utils/ prisma/ types/ jobs/

server.ts

# Backend Detailed Structure

config/

database.ts jwt.ts googleDrive.ts jitsi.ts env.ts

controllers/

auth.controller.ts

user.controller.ts teacher.controller.ts student.controller.ts

course.controller.ts lecture.controller.ts

assignment.controller.ts

attendance.controller.ts

material.controller.ts

notification.controller.ts

services/

auth.service.ts

user.service.ts teacher.service.ts student.service.ts

course.service.ts lecture.service.ts

assignment.service.ts

attendance.service.ts

material.service.ts

notification.service.ts

googleDrive.service.ts jitsi.service.ts

repositories/

user.repository.ts

course.repository.ts

lecture.repository.ts

assignment.repository.ts

attendance.repository.ts

material.repository.ts

Repository layer should only contain database queries.

routes/

auth.routes.ts

user.routes.ts

teacher.routes.ts

student.routes.ts

course.routes.ts

lecture.routes.ts

assignment.routes.ts

attendance.routes.ts

material.routes.ts

notification.routes.ts

index.ts

middleware/

auth.middleware.ts

role.middleware.ts

error.middleware.ts

upload.middleware.ts

validation.middleware.ts

rateLimit.middleware.ts

validators/

auth.validator.ts

course.validator.ts

lecture.validator.ts

assignment.validator.ts

student.validator.ts

teacher.validator.ts

Zod validation schemas.

utils/

ApiResponse.ts

ApiError.ts

logger.ts

generateMeetingRoom.ts

fileHelpers.ts

dateHelpers.ts

types/

auth.types.ts

course.types.ts

lecture.types.ts

assignment.types.ts

user.types.ts

jobs/

attendance.job.ts

notification.job.ts

recordingCleanup.job.ts

Future background jobs.

# Prisma Structure

backend/

prisma/

schema.prisma

migrations/

seed.ts

# File Upload Structure

Files are stored in Google Drive.

Do NOT store uploads locally.

Database stores:

fileId fileUrl fileName

Temporary uploads:

backend/

temp/

Automatically cleaned after upload.

# Documentation Structure

docs/

README.md

REQUIREMENTS.md

ARCHITECTURE.md

DATABASE.md

API_DOCUMENTATION.md

USER_FLOW.md

UI_UX_REQUIREMENTS.md

ROUTES_AND_PERMISSIONS.md

PRISMA_SCHEMA_GUIDE.md

FOLDER_STRUCTURE.md

DEPLOYMENT.md

SECURITY.md

# GitHub Structure

.github/

workflows/

frontend.yml

backend.yml

deploy.yml

# Environment Variables

frontend/

.env

VITE_API_URL

backend/

.env

DATABASE_URL

JWT_SECRET

JWT_REFRESH_SECRET

GOOGLE_CLIENT_ID

GOOGLE_CLIENT_SECRET

GOOGLE_DRIVE_FOLDER_ID

# API Layer Rules

Controller

↓

Service

↓

Repository

↓

Prisma

↓

PostgreSQL

Controllers should never access Prisma directly.

# Frontend Rules

Pages

↓

Services

↓

API

Components should not call APIs directly.

Use services layer.

# Naming Conventions

Files:

kebab-case

Example:

course.service.ts

lecture.controller.ts

attendance.routes.ts

Interfaces:

PascalCase

Example:

CreateCourseDto

UserResponse

LectureDetails

React Components:

PascalCase

Example:

CourseCard.tsx

LectureTable.tsx

AttendanceChart.tsx

# Scalability Structure

Future Additions

modules/

exam/

certificate/

payment/

analytics/

chatbot/

Each module follows:

controllers/ services/ routes/ validators/ types/

# Development Standards

Backend

- TypeScript Strict Mode
- Prisma ORM
- Zod Validation
- Service Layer Pattern
- Repository Pattern

Frontend

- React
- TypeScript
- Feature-Based Architecture
- Reusable Components
- Protected Routes

This structure should be followed for all future development.