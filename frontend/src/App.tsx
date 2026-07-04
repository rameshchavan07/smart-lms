import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './contexts/SocketContext';

// ─── Eagerly loaded (small / auth pages) ──────────────────────────────────
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';

// ─── Code-split layouts ───────────────────────────────────────────────────
const AdminLayout      = React.lazy(() => import('./layouts/AdminLayout'));
const TeacherLayout    = React.lazy(() => import('./layouts/TeacherLayout'));
const StudentLayout    = React.lazy(() => import('./layouts/StudentLayout'));

// ─── Code-split pages ─────────────────────────────────────────────────────
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const InstitutesManagement = React.lazy(() => import('./pages/admin/InstitutesManagement'));
const InstituteDetails = React.lazy(() => import('./pages/admin/InstituteDetails'));
const UserManagement = React.lazy(() => import('./pages/admin/UserManagement'));
const CourseManagement = React.lazy(() => import('./pages/admin/CourseManagement'));
const EnrollmentManagement = React.lazy(() => import('./pages/admin/EnrollmentManagement'));
const AdminAssessments = React.lazy(() => import('./pages/admin/AdminAssessments'));
const AdminReports = React.lazy(() => import('./pages/admin/AdminReports'));
const AdminCommunication = React.lazy(() => import('./pages/admin/AdminCommunication'));
const AdminIntegrations = React.lazy(() => import('./pages/admin/AdminIntegrations'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));

const TeacherDashboard   = React.lazy(() => import('./pages/teacher/TeacherDashboard'));
const TeacherCourses     = React.lazy(() => import('./pages/teacher/TeacherCourses'));
const QuizBuilder        = React.lazy(() => import('./pages/teacher/QuizBuilder'));
const TeacherEnrollments = React.lazy(() => import('./pages/teacher/TeacherEnrollments'));
const TeacherAssessments = React.lazy(() => import('./pages/teacher/TeacherAssessments'));
const TeacherReports     = React.lazy(() => import('./pages/teacher/TeacherReports'));
const TeacherCommunication = React.lazy(() => import('./pages/teacher/TeacherCommunication'));
const TeacherSettings    = React.lazy(() => import('./pages/teacher/TeacherSettings'));
const RecordingStudioPage = React.lazy(() => import('./pages/teacher/RecordingStudioPage'));

const StudentDashboard = React.lazy(() => import('./pages/student/StudentDashboard'));
const StudentCourses = React.lazy(() => import('./pages/student/StudentCourses'));
const StudentAssignments = React.lazy(() => import('./pages/student/StudentAssignments'));
const StudentGrades = React.lazy(() => import('./pages/student/StudentGrades'));
const StudentCommunity = React.lazy(() => import('./pages/student/StudentCommunity'));
const StudentMessages = React.lazy(() => import('./pages/student/StudentMessages'));
const StudentReports = React.lazy(() => import('./pages/student/StudentReports'));
const StudentSettings = React.lazy(() => import('./pages/student/StudentSettings'));

const CourseDetails      = React.lazy(() => import('./pages/shared/CourseDetails'));
const LiveClassRoom      = React.lazy(() => import('./pages/shared/LiveClassRoom'));
const QuizView           = React.lazy(() => import('./pages/shared/QuizView'));

// ─── Loading fallback ─────────────────────────────────────────────────────
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-full min-h-[200px]" style={{ color: 'var(--text-muted)' }}>
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin opacity-40" />
      <p className="text-[13px] font-medium opacity-40">Loading…</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes cache to reduce API calls
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <SocketProvider>
              {/* Skip to main content link (accessibility) */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:text-white"
              style={{ background: 'var(--brand-500)' }}
            >
              Skip to main content
            </a>

            <Routes>
              {/* ── Live classroom (eager — needed quickly) ── */}
              <Route path="/live/:id" element={
                <ProtectedRoute allowedRoles={['TEACHER', 'STUDENT']}>
                  <Suspense fallback={<PageLoader />}>
                    <LiveClassRoom />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* ── Public routes ── */}
              <Route path="/"               element={<LandingPage />} />
              <Route path="/login"          element={<Login />} />
              <Route path="/register"       element={<Register />} />
              <Route path="/verify-email"   element={<VerifyOtp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/callback"  element={<AuthCallback />} />

              {/* ── Generic dashboard redirect ── */}
              <Route path="/dashboard" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              } />

              {/* ── Admin Portal ── */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                  <Suspense fallback={<PageLoader />}>
                    <AdminLayout />
                  </Suspense>
                </ProtectedRoute>
              }>
                <Route index element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
                <Route path="institutes"  element={<Suspense fallback={<PageLoader />}><InstitutesManagement /></Suspense>} />
                <Route path="institutes/:id" element={<Suspense fallback={<PageLoader />}><InstituteDetails /></Suspense>} />
                <Route path="users"       element={<Suspense fallback={<PageLoader />}><UserManagement /></Suspense>} />
                <Route path="courses"     element={<Suspense fallback={<PageLoader />}><CourseManagement /></Suspense>} />
                <Route path="enrollments" element={<Suspense fallback={<PageLoader />}><EnrollmentManagement /></Suspense>} />
                <Route path="assessments" element={<Suspense fallback={<PageLoader />}><AdminAssessments /></Suspense>} />
                <Route path="reports" element={<Suspense fallback={<PageLoader />}><AdminReports /></Suspense>} />
                <Route path="communication" element={<Suspense fallback={<PageLoader />}><AdminCommunication /></Suspense>} />
                <Route path="integrations" element={<Suspense fallback={<PageLoader />}><AdminIntegrations /></Suspense>} />
                <Route path="settings"    element={<Suspense fallback={<PageLoader />}><AdminSettings /></Suspense>} />
              </Route>

              {/* ── Teacher Portal ── */}
              <Route path="/teacher" element={
                <ProtectedRoute allowedRoles={['TEACHER']}>
                  <Suspense fallback={<PageLoader />}>
                    <TeacherLayout />
                  </Suspense>
                </ProtectedRoute>
              }>
                <Route index element={<Suspense fallback={<PageLoader />}><TeacherDashboard /></Suspense>} />
                <Route path="courses" element={<Suspense fallback={<PageLoader />}><TeacherCourses /></Suspense>} />
                <Route path="courses/:id" element={<Suspense fallback={<PageLoader />}><CourseDetails /></Suspense>} />
                <Route path="courses/:id/quizzes/new" element={<Suspense fallback={<PageLoader />}><QuizBuilder /></Suspense>} />
                <Route path="courses/:id/quizzes/:quizId" element={<Suspense fallback={<PageLoader />}><QuizView /></Suspense>} />
                <Route path="students" element={<Suspense fallback={<PageLoader />}><UserManagement /></Suspense>} />
                <Route path="enrollments" element={<Suspense fallback={<PageLoader />}><TeacherEnrollments /></Suspense>} />
                <Route path="assessments" element={<Suspense fallback={<PageLoader />}><TeacherAssessments /></Suspense>} />
                <Route path="reports" element={<Suspense fallback={<PageLoader />}><TeacherReports /></Suspense>} />
                <Route path="communication" element={<Suspense fallback={<PageLoader />}><TeacherCommunication /></Suspense>} />
                <Route path="settings" element={<Suspense fallback={<PageLoader />}><TeacherSettings /></Suspense>} />
                <Route path="recorder" element={<Suspense fallback={<PageLoader />}><RecordingStudioPage /></Suspense>} />
              </Route>

              {/* ── Student Portal ── */}
              <Route path="/student" element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <Suspense fallback={<PageLoader />}>
                    <StudentLayout />
                  </Suspense>
                </ProtectedRoute>
              }>
                <Route index element={<Suspense fallback={<PageLoader />}><StudentDashboard /></Suspense>} />
                <Route path="courses" element={<Suspense fallback={<PageLoader />}><StudentCourses /></Suspense>} />
                <Route path="courses/:id" element={<Suspense fallback={<PageLoader />}><CourseDetails /></Suspense>} />
                <Route path="courses/:id/quizzes/:quizId" element={<Suspense fallback={<PageLoader />}><QuizView /></Suspense>} />
                <Route path="assignments" element={<Suspense fallback={<PageLoader />}><StudentAssignments /></Suspense>} />
                <Route path="grades" element={<Suspense fallback={<PageLoader />}><StudentGrades /></Suspense>} />
                <Route path="community" element={<Suspense fallback={<PageLoader />}><StudentCommunity /></Suspense>} />
                <Route path="messages" element={<Suspense fallback={<PageLoader />}><StudentMessages /></Suspense>} />
                <Route path="reports" element={<Suspense fallback={<PageLoader />}><StudentReports /></Suspense>} />
                <Route path="settings" element={<Suspense fallback={<PageLoader />}><StudentSettings /></Suspense>} />
              </Route>

              {/* ── Catch-all ── */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            </SocketProvider>
          </AuthProvider>
        </Router>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              fontWeight: 500,
              fontSize: '14px',
              boxShadow: 'var(--shadow-lg)',
            },
            success: { style: { borderLeft: '4px solid #10b981' } },
            error:   { style: { borderLeft: '4px solid #ef4444' } },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
