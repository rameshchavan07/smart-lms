# 🎓 Smart LMS (OpenLearnX)

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2018.0.0-emerald.svg?style=for-the-badge&logo=node.js)](https://nodejs.org) [![React Version](https://img.shields.io/badge/react-19.0.0-blue.svg?style=for-the-badge&logo=react)](https://react.dev) [![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org) [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg?style=for-the-badge&logo=postgresql)](https://www.postgresql.org) [![Prisma ORM](https://img.shields.io/badge/Prisma-7.0-indigo.svg?style=for-the-badge&logo=prisma)](https://www.prisma.io) [![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4.0-38bdf8.svg?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)

**A high-performance, multi-tenant virtual classroom platform designed for educational institutes, coaching centers, and independent educators.**

---

## 📖 Project Overview

Smart LMS (OpenLearnX) is a feature-rich, **multi-tenant virtual learning portal**. It delivers real-time classrooms, centralized document storage via Google Drive, highly flexible user administration, and dynamic student dashboards wrapped in a stunning, performant UI.

Built on a robust **Monorepo-style structure**, it marries a secure, strongly-typed **Express/TypeScript REST API** with a pixel-perfect, responsive **React 19 & Tailwind CSS v4** frontend application.

## ✨ Key Features

- **🏢 Multi-Tenant Institute System**: Fully isolated data per institute. Each institute gets its own customized portal, themes, and branding (`/i/[slug]`).
- **🔐 Comprehensive RBAC**: Dedicated portals and permissions for **Super Admins** (global), **Admins** (institute-level), **Teachers**, and **Students**.
- **📹 Live Classrooms & Recording**: Integrated WebRTC (Jitsi Meet) for seamless, low-latency virtual lectures, complete with a built-in recording studio.
- **📝 Interactive Assessments**: Dynamic quiz creation tools for teachers featuring automated grading and comprehensive student analytics.
- **💬 Real-Time Communication**: Integrated WebSockets (`Socket.IO`) powering Chat Groups, Discussion Boards, and instant messaging between peers.
- **☁️ Cloud Storage Integration**: Automated Google Drive folder creation and secure, direct link proxying for study materials, saving server bandwidth.
- **🛡️ Enterprise-Grade Security**: JWT-based auth via strict `HttpOnly` cookies, Double CSRF Token validation, and API rate limiting.
- **📈 Horizontal Scalability**: Ready for scale with `@socket.io/redis-adapter` for multi-node WebSocket broadcasting and query caching.

## 💻 Tech Stack

- **Frontend**: React 19 (Vite), TypeScript, Tailwind CSS v4, TanStack Query v5, Framer Motion
- **Backend**: Node.js, Express 5, TypeScript, Socket.IO (Real-time), Passport.js (Auth)
- **Infrastructure**: PostgreSQL, Prisma ORM, Redis (Caching/PubSub)

## 🏗️ System Architecture Flow

```mermaid
graph TD
    SA["Super Admin Portal"] -->|"Manages"| I("Institutes & System Settings")
    SA -->|"Onboards"| A["Admin Portal"]
    A -->|"Manages Institute"| B("Users, Courses & Quizzes")
    C["Teacher Portal"] -->|"Schedules & Records"| D("Live Classes")
    C -->|"Uploads"| E("Drive Study Materials")
    F["Student Portal"] -->|"Attends"| D
    F -->|"Downloads"| E
    F -->|"Takes"| G("Assessments & Quizzes")
    C -->|"Grades"| G
    H["WebSocket Server"] -->|"Real-time Events"| F
    H -->|"Real-time Events"| C
```

## 🗄️ Database Schema Diagram

Below is a high-level Entity-Relationship diagram illustrating the core models in the Prisma database.

```mermaid
erDiagram
    Institute ||--o{ User : "has"
    Institute ||--o{ Course : "offers"
    
    User ||--o| Teacher : "can be"
    User ||--o| Student : "can be"
    
    Teacher ||--o{ Course : "teaches"
    
    Student ||--o{ Enrollment : "enrolls in"
    Course ||--o{ Enrollment : "has"
    
    Course ||--o{ Lecture : "contains"
    Course ||--o{ Assignment : "contains"
    Course ||--o{ Quiz : "contains"
    Course ||--o{ StudyMaterial : "contains"
    
    Student ||--o{ AssignmentSubmission : "submits"
    Assignment ||--o{ AssignmentSubmission : "receives"
    
    Student ||--o{ QuizSubmission : "submits"
    Quiz ||--o{ QuizSubmission : "receives"
```

## 📂 Project Directory Structure

```text
smart-lms/
├── backend/                  # Node.js REST API
│   ├── prisma/               # Database Schema (schema.prisma) & Seed Scripts
│   ├── src/
│   │   ├── controllers/      # API Request Handlers
│   │   ├── middleware/       # Express Route Protections (Auth, CSRF, Rate limits)
│   │   ├── routes/           # REST endpoint mapping
│   │   ├── services/         # Integrations (Google Drive, Passport)
│   │   └── utils/            # Helpers & Loggers
│   └── package.json
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/       # Reusable UI widgets
│   │   ├── contexts/         # React Contexts (Auth, Theme, Institute, Socket)
│   │   ├── layouts/          # Workspace Frames
│   │   ├── pages/            # Role-based dashboard views
│   │   └── services/         # API Client configuration
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### 📋 Prerequisites

- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: Running locally or remotely (e.g., Neon.tech)
- **Redis** (Optional but recommended for full Socket.io features)

### 📥 Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rameshchavan07/smart-lms.git
   cd smart-lms
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Configure Environment Variables:**
   Create `.env` files in both `backend/` and `frontend/` directories (see Configuration below).

4. **Initialize Database:**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Start Development Servers:**
   Open two terminals:
   
   **Terminal 1: Backend**
   ```bash
   cd backend
   npm run dev
   ```
   
   **Terminal 2: Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

## ⚙️ Configuration

### Backend `.env` template
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
DATABASE_URL="postgresql://user:password@localhost:5432/smart_lms?schema=public"
SESSION_SECRET="your_session_secret"
JWT_SECRET="your_jwt_secret"
REDIS_URL="redis://localhost:6379"
```

### Frontend `.env` template
```env
VITE_API_URL=http://localhost:5000/api
```

## 🌐 Deployment

Smart LMS is built to be deployed on modern serverless or containerized cloud providers.

- **Database**: Serverless Postgres (e.g., Neon)
- **Cache**: Serverless Redis (e.g., Upstash)
- **API Server**: Render, Railway, or Heroku
- **Frontend App**: Vercel, Netlify, or Cloudflare Pages

> **Important**: Ensure your `FRONTEND_URL` in the backend environment matches your production frontend URL to avoid CORS errors.

## 📄 License

This project is distributed under the **ISC License**.

*Designed and developed by Ramesh Chavan*
