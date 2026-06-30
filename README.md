# 🎓 Smart LMS — Modern Learning Management System

<div align="center">

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2018.0.0-emerald.svg?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![React Version](https://img.shields.io/badge/react-19.0.0-blue.svg?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg?style=for-the-badge&logo=postgresql)](https://www.postgresql.org)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.0-indigo.svg?style=for-the-badge&logo=prisma)](https://www.prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4.0-38bdf8.svg?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)

**A high-performance, responsive virtual classroom platform designed for schools, colleges, coaching institutes, and independent online educators.**

[Explore Docs](./docs) • [Report Bug](https://github.com/rameshchavan07/smart-lms/issues) • [Request Feature](https://github.com/rameshchavan07/smart-lms/issues)

</div>

---

## 📖 Project Overview

Smart LMS is a feature-rich virtual learning portal. It delivers **real-time classrooms**, **centralized document storage (Google Drive integration)**, **flexible user administration**, and **dynamic student dashboards** in a fast, beautiful interface. 

Built using a high-performance **Monorepo** structure, it combines a secure, strongly-typed **Express/TypeScript REST API** with a pixel-perfect, responsive **React 19/Tailwind CSS v4** single-page application.

## ✨ Key Features

- **Role-Based Portals:** Dedicated dashboards for Admins, Teachers, and Students.
- **Live Classrooms:** Integrated Jitsi Meet for seamless, low-latency virtual lectures.
- **Cloud Storage Integration:** Automated Google Drive folder creation and secure, direct link proxying for study materials and lecture recordings.
- **Enterprise-Grade Security:** JWT-based authentication using strictly HTTPOnly cookies to prevent XSS attacks.
- **Responsive UI/UX:** Built with Tailwind CSS v4 featuring dark mode, animated skeleton loaders, and modern design tokens.
- **Comprehensive Testing:** End-to-end and unit testing powered by Vitest and React Testing Library.

## 💻 Technologies and Frameworks Used

### Frontend Application
*   **Engine**: React 19 (Vite bundler) + TypeScript
*   **Styling**: Tailwind CSS v4 + Lucide Icons + HSL tailored dark-mode palettes
*   **State Management**: React Context API (Auth status) + React Query (cache synchronization)
*   **Integrations**: Jitsi Meet React SDK for virtual classes
*   **Testing**: Vitest + React Testing Library

### Backend Services
*   **Engine**: Node.js + Express.js + TypeScript
*   **ORM**: Prisma Client v6
*   **Database**: PostgreSQL
*   **File Engine**: Google Drive API v3 (for secure, scalable cloud storage)
*   **Security**: JSON Web Tokens (JWT) via HTTPOnly Cookies + BCrypt hashing + Cookie Parser
*   **Testing**: Vitest + Supertest

---

## 🏗️ System Architecture

```mermaid
graph TD
    A[Admin Portal] -->|Manages| B(Users, Courses & Enrollments)
    C[Teacher Portal] -->|Schedules| D(Jitsi Live Classes)
    C -->|Uploads| E(Drive Study Materials)
    F[Student Portal] -->|Accesses| D
    F -->|Downloads| E
```

Smart LMS follows a decoupled client-server architecture. 
- The **Frontend** communicates with the backend via a RESTful API.
- The **Backend** handles business logic, auth, and communicates with a PostgreSQL database via Prisma ORM.
- **Google Drive API** acts as the decentralized CDN for large files. The backend orchestrates upload permissions, caching, and returns direct Google Drive `webViewLink`s, completely offloading bandwidth from the Node server.

---

## 📂 Project Folder Structure

```text
smart-lms/
├── backend/                  # Node.js REST API
│   ├── prisma/               # Database Schema & Seed Engine
│   ├── src/
│   │   ├── controllers/      # API Controllers (Auth, Course, Lectures, Study Materials)
│   │   ├── middleware/       # Express Route Protections (Cookie auth)
│   │   ├── routes/           # REST endpoints mapping
│   │   ├── services/         # Integrations (Google Drive, Jitsi Meet tokens)
│   │   └── tests/            # Vitest backend tests
│   └── vitest.config.ts      # Backend testing configuration
├── frontend/                 # React Single Page App
│   ├── src/
│   │   ├── components/       # Reusable UI widgets (e.g. Skeletons)
│   │   ├── contexts/         # React Contexts (AuthContext)
│   │   ├── layouts/          # Workspace Frames (Admin, Teacher, Student)
│   │   ├── pages/            # View dashboards and Classroom tabs
│   │   ├── services/         # API Client configuration (Axios)
│   │   └── tests/            # Vitest frontend tests
│   └── vite.config.ts        # Vite + Vitest frontend configuration
├── docs/                     # Full technical guidelines & roadmap status
└── package.json              # Monorepo root config (Husky, lint-staged)
```

---

## 🚀 Getting Started

### 📋 Prerequisites

Ensure you have the following installed on your local machine:
*   [Node.js](https://nodejs.org) (v18.0.0 or higher)
*   [PostgreSQL](https://www.postgresql.org/) (Running locally on default port `5432` or via Docker)
*   Git

### 📥 Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rameshchavan07/smart-lms.git
   cd smart-lms
   ```

2. **Install Root Dependencies (Husky):**
   ```bash
   npm install
   ```

3. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

4. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

---

## ⚙️ Environment Variable Configuration (.env)

You need to create a `.env` file in both the `backend` and `frontend` directories.

**Backend (`backend/.env`):**
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/smart_lms?schema=public"

# Authentication
JWT_SECRET="your_super_secret_jwt_key_here"
JWT_REFRESH_SECRET="your_super_secret_refresh_key_here"
FRONTEND_URL="http://localhost:5173"

# Google Drive API
GOOGLE_DRIVE_FOLDER_ID="your_master_folder_id"
# Provide credentials via getGoogleToken.js setup
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🗄️ Database Setup and Migrations

From the `backend` directory, run the Prisma migration and seed scripts:

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db push
npx prisma db seed
```
*(The seed script automatically populates your database with a default Admin, Teacher, and Student user.)*

---

## 🏃 Running the Project

### Development Environment

Open two separate terminal windows.

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

The app will be running at `http://localhost:5173` and the API at `http://localhost:5000`.

### Production Deployment

To build for production:

**Backend:**
```bash
cd backend
npm run build
npm run start
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve the dist/ directory using Nginx, Apache, or a static host like Vercel/Netlify.
```

---

## 🔌 API Documentation

| Endpoint | Method | Description | Auth Required |
| --- | --- | --- | --- |
| `/api/auth/login` | POST | Authenticates user, sets `HttpOnly` cookie | No |
| `/api/auth/logout`| POST | Clears `HttpOnly` token cookies | Yes |
| `/api/auth/me`    | GET  | Fetches active user data from cookie session| Yes |
| `/api/courses`    | GET  | Returns list of active courses | Yes |
| `/api/lectures`   | POST | Schedules a new Jitsi lecture (Teacher only)| Yes |

---

## 🔒 Authentication and Authorization Flow

Smart LMS relies on a highly secure **JWT + HTTPOnly Cookie** architecture:
1. User logs in.
2. Backend validates credentials and signs an Access Token (15m) and Refresh Token (7d).
3. Tokens are returned to the browser in `Set-Cookie` headers with `HttpOnly`, `Secure`, and `SameSite=Strict` flags, hiding them from JavaScript and preventing XSS.
4. The React app (`AuthContext.tsx`) verifies the session state via `/api/auth/me`.
5. For all API requests, Axios (`withCredentials: true`) automatically attaches the cookies.
6. Backend Express middleware (`cookie-parser`) verifies the JWT from the cookie on protected routes.

---

## 🎨 Screenshots & UI Previews

*(Screenshots to be added here. E.g., `![Admin Dashboard](./docs/screenshots/admin.png)`)*

---

## 🛠️ Usage Guide

1. Log in to the application using the seeded Admin credentials (or sign up).
2. Create users (Teachers/Students) in the Admin panel.
3. Create a Course and assign a Teacher.
4. Log in as a Teacher to manage the course roster, upload Google Drive materials, and start live Jitsi lectures.
5. Log in as a Student to consume materials and attend lectures.

---

## 🔗 Third-Party Services and Integrations

- **Google Drive API v3:** Handles dynamic folder creation (`courses/courseId/Teachers/teacherId`) and generates direct `webViewLink` permissions for scalable file sharing.
- **Jitsi Meet React SDK:** Imbeds a real-time classroom directly into the frontend React DOM for seamless lectures.

---

## 🐛 Error Handling and Troubleshooting

- **CORS Issues on Login:** Ensure `FRONTEND_URL` in `backend/.env` exactly matches your Vite server URL (e.g., `http://localhost:5173`).
- **Database Connection Refused:** Verify your PostgreSQL server is running and the `DATABASE_URL` credentials are correct.
- **Unauthorized / Session Drops:** Clear your browser cookies for `localhost`. Ensure `withCredentials: true` is not stripped in your frontend API configuration.

---

## 🧪 Testing Instructions

Both the frontend and backend are thoroughly tested using Vitest.

**Run Backend Tests:**
```bash
cd backend
npm run test
```
*Tests Auth endpoints and HttpOnly cookie generation via Supertest.*

**Run Frontend Tests:**
```bash
cd frontend
npm run test
```
*Tests component rendering and React Context logic using Testing Library.*

---

## ⚡ Performance and Security Considerations

- **Security:** Tokens are invisible to client-side JS (`localStorage` is entirely avoided).
- **Bandwidth:** Backend server does not buffer files. Direct Google Drive proxying saves Node.js event-loop blocking and reduces bandwidth costs drastically.
- **UI Performance:** React Query handles aggressive caching of API responses. Skeleton loaders mask network latency during data fetching.

---

## 🔮 Future Enhancements

- **Phase 5 Implementation:** Integrated Stripe payment gateway for premium course subscriptions.
- **Push Notifications:** Real-time websockets or Service Workers for new assignments.
- **Advanced Analytics:** AI-powered student retention and performance tracking metrics.

---

## 🤝 Contributing Guidelines

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes. Husky pre-commit hooks will automatically lint and format your code using Prettier.
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request for review.

---

## 📄 License

Distributed under the ISC License. See `LICENSE` for more information.

---

## 📬 Contact Information

**Maintainer:** Ramesh Chavan  
**Project Link:** [https://github.com/rameshchavan07/smart-lms](https://github.com/rameshchavan07/smart-lms)
