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
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const role = searchParams.get('role');
    const error = searchParams.get('error');

    if (error || !token || !refreshToken || !role) {
      navigate('/login?error=google_failed');
      return;
    }

    // Reconstruct a minimal user object for the AuthContext
    // The full user will be fetched on next /me call
    login({
      token,
      refreshToken,
      role: role as 'ADMIN' | 'TEACHER' | 'STUDENT',
    });
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin mx-auto mb-4" />
        <p className="text-slate-600 font-medium">Signing you in with Google...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
