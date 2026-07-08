<div align="center">
  <br />
  <h1>🎓 Smart LMS (OpenLearnX)</h1>
  <p>
    <strong>A high-performance, multi-tenant virtual classroom platform designed for educational institutes, coaching centers, and independent educators.</strong>
  </p>
  
  <p>
    [![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2018.0.0-emerald.svg?style=for-the-badge&logo=node.js)](https://nodejs.org)
    [![React Version](https://img.shields.io/badge/react-19.0.0-blue.svg?style=for-the-badge&logo=react)](https://react.dev)
    [![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
    [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg?style=for-the-badge&logo=postgresql)](https://www.postgresql.org)
    [![Prisma ORM](https://img.shields.io/badge/Prisma-7.0-indigo.svg?style=for-the-badge&logo=prisma)](https://www.prisma.io)
    [![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4.0-38bdf8.svg?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
  </p>

  <p>
    <a href="#-project-overview">Overview</a> •
    <a href="#-key-features">Features</a> •
    <a href="#-system-architecture">Architecture</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-deployment">Deployment</a>
  </p>
</div>

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

| Frontend | Backend | Infrastructure / DevOps |
| :--- | :--- | :--- |
| **React 19** (Vite) | **Node.js** + **Express 5** | **PostgreSQL** |
| **TypeScript** | **TypeScript** | **Prisma ORM** |
| **Tailwind CSS v4** | **Socket.IO** (Real-time) | **Redis** (Caching/PubSub) |
| **TanStack Query v5** | **Passport.js** (Auth) | **Husky** (Git Hooks) |
| **Framer Motion** | **Pino** (Logging) | **Vitest** (Testing) |

## 🏗️ System Architecture

```mermaid
graph TD
    SA[Super Admin Portal] -->|Manages| I(Institutes & System Settings)
    SA -->|Onboards| A[Admin Portal]
    A -->|Manages Institute| B(Users, Courses & Quizzes)
    C[Teacher Portal] -->|Schedules & Records| D(Live Classes)
    C -->|Uploads| E(Drive Study Materials)
    F[Student Portal] -->|Attends| D
    F -->|Downloads| E
    F -->|Takes| G(Assessments & Quizzes)
    C -->|Grades| G
    H[WebSocket Server] -->|Real-time Events| F
    H -->|Real-time Events| C
```

<details>
<summary><b>📂 View Project Directory Structure</b></summary>

```text
smart-lms/
├── backend/                  # Node.js REST API
│   ├── prisma/               # Database Schema (schema.prisma) & Seed Scripts
│   ├── src/
│   │   ├── controllers/      # API Request Handlers
│   │   ├── middleware/       # Express Route Protections (Auth, CSRF, Rate limits)
│   │   ├── routes/           # REST endpoint mapping
│   │   ├── services/         # Integrations (Google Drive, Passport)
│   │   └── utils/            # Helpers & Loggers (Pino)
│   └── package.json
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/       # Reusable UI widgets
│   │   ├── contexts/         # React Contexts (Auth, Theme, Institute, Socket)
│   │   ├── layouts/          # Workspace Frames (Admin, Teacher, Student, SuperAdmin)
│   │   ├── pages/            # Role-based dashboard views
│   │   └── services/         # API Client configuration (Axios)
│   └── package.json
└── README.md
```
</details>

---

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
   # Root hooks
   npm install

   # Backend
   cd backend && npm install

   # Frontend
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
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev

   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

---

## ⚙️ Configuration

<details>
<summary><b>Backend <code>.env</code> template</b></summary>

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/smart_lms?schema=public"

# Authentication Secrets
SESSION_SECRET="your_session_secret"
JWT_SECRET="your_jwt_secret"
JWT_REFRESH_SECRET="your_refresh_secret"

# Redis (Optional)
REDIS_URL="redis://localhost:6379"
```
</details>

<details>
<summary><b>Frontend <code>.env</code> template</b></summary>

```env
VITE_API_URL=http://localhost:5000/api
```
</details>

---

## 🔒 Authentication Flow

Smart LMS ensures robust security utilizing a **JWT + HttpOnly Cookie** architecture:
1. Client authenticates via `/api/auth/login`.
2. Server validates and sets strict `HttpOnly`, `Secure`, `SameSite=Strict` cookies.
3. Tokens are inherently protected from XSS attacks (no `localStorage`).
4. Double CSRF tokens prevent Cross-Site Request Forgery on state-changing API endpoints.
5. React Context verifies session automatically on load.

---

## 🌐 Deployment

Smart LMS is built to be deployed on modern serverless or containerized cloud providers.

- **Database**: Use Serverless Postgres (e.g., Neon, Supabase)
- **Cache/WebSockets**: Serverless Redis (e.g., Upstash)
- **API Server**: Render, Railway, or Heroku
- **Frontend App**: Vercel, Netlify, or Cloudflare Pages

> **Important Deployment Note**: Ensure your `FRONTEND_URL` in the backend environment matches your production frontend URL to avoid CORS errors. Additionally, `withCredentials: true` must remain active in the Axios setup.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is distributed under the **ISC License**. See the `LICENSE` file for more information.

<div align="center">
  <br />
  <i>Designed and developed by <a href="https://github.com/rameshchavan07">Ramesh Chavan</a></i>
</div>
