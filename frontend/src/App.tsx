import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import AdminLayout from './layouts/AdminLayout';
import UserManagement from './pages/admin/UserManagement';
import CourseManagement from './pages/admin/CourseManagement';
import EnrollmentManagement from './pages/admin/EnrollmentManagement';
import TeacherLayout from './layouts/TeacherLayout';
import TeacherCourses from './pages/teacher/TeacherCourses';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentLayout from './layouts/StudentLayout';
import StudentCourses from './pages/student/StudentCourses';
import StudentDashboard from './pages/student/StudentDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import CourseDetails from './pages/shared/CourseDetails';
import LiveClassRoom from './pages/shared/LiveClassRoom';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <Routes>
              <Route 
                path="/live/:id" 
                element={
                  <ProtectedRoute allowedRoles={['TEACHER', 'STUDENT']}>
                    <LiveClassRoom />
                  </ProtectedRoute>
                }
              />
              
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyOtp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="courses" element={<CourseManagement />} />
                <Route path="enrollments" element={<EnrollmentManagement />} />
              </Route>
              
              {/* Teacher Routes */}
              <Route 
                path="/teacher" 
                element={
                  <ProtectedRoute allowedRoles={['TEACHER']}>
                    <TeacherLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<TeacherDashboard />} />
                <Route path="courses" element={<TeacherCourses />} />
                <Route path="courses/:id" element={<CourseDetails />} />
                <Route path="students" element={<UserManagement />} />
              </Route>
  
              {/* Student Routes */}
              <Route 
                path="/student" 
                element={
                  <ProtectedRoute allowedRoles={['STUDENT']}>
                    <StudentLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<StudentDashboard />} />
                <Route path="courses" element={<StudentCourses />} />
                <Route path="courses/:id" element={<CourseDetails />} />
              </Route>
              
              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </AuthProvider>
        </Router>
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              fontWeight: 500,
              fontSize: '14px'
            },
            success: {
              style: {
                borderLeft: '4px solid #10b981'
              }
            },
            error: {
              style: {
                borderLeft: '4px solid #ef4444'
              }
            }
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
