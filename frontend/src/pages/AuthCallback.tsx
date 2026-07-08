import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RefreshCw } from 'lucide-react';

/**
 * Landing page after Google OAuth redirect.
 * Backend redirects here with ?token=...&refreshToken=...&role=...
 */
const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const role = searchParams.get('role');
    const error = searchParams.get('error');

    if (error || !role) {
      navigate('/login?error=google_failed');
      return;
    }

    const instituteSlug = searchParams.get('instituteSlug');

    // Reconstruct a minimal user object for the AuthContext
    // The full user will be fetched on next /me call
    login({
      role: role as 'ADMIN' | 'TEACHER' | 'STUDENT',
      instituteSlug: instituteSlug || undefined,
    });
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-subtle">
      <div className="text-center">
        <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin mx-auto mb-4" />
        <p className="text-secondary font-medium">Signing you in with Google...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
