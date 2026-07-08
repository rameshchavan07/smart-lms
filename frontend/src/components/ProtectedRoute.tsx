import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('ADMIN' | 'TEACHER' | 'STUDENT' | 'SUPER_ADMIN')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { slug } = useParams<{ slug?: string }>();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    // If we're inside an institute route, redirect to institute login
    if (slug) {
      return <Navigate to={`/i/${slug}/login`} replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Super Admin bypasses institute validation
  if (user.role === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  // If we're in an institute route, verify the user belongs to this institute
  if (slug && user.instituteSlug && decodeURIComponent(user.instituteSlug) !== decodeURIComponent(slug)) {
    // Redirect to the user's correct institute
    const rolePath = user.role === 'ADMIN' ? 'admin' : user.role === 'TEACHER' ? 'teacher' : 'student';
    return <Navigate to={`/i/${user.instituteSlug}/${rolePath}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
