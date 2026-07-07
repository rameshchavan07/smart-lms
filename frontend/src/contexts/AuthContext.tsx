import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { subscribeToPushNotifications } from '../utils/pushNotifications';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'SUPER_ADMIN';
  profileImage?: string;
  profile?: { bio?: string };
  instituteId?: string | null;
  instituteSlug?: string | null;
}

export interface LoginData {
  token?: string;
  refreshToken?: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'SUPER_ADMIN';
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImage?: string;
  profile?: { bio?: string };
  instituteSlug?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: LoginData) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
      if (data) {
        subscribeToPushNotifications();
      }
    } catch (error) {
      console.error('Auth verification failed', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    checkAuth();
  }, [checkAuth]);

  const refreshUser = useCallback(async () => {
    await checkAuth();
  }, [checkAuth]);

  const getRedirectPath = useCallback((role: string, instituteSlug?: string | null): string => {
    if (role === 'SUPER_ADMIN') {
      return '/super-admin';
    }

    if (!instituteSlug) {
      // Fallback for users without an institute
      return '/dashboard';
    }

    switch (role) {
      case 'ADMIN':
        return `/i/${instituteSlug}/admin`;
      case 'TEACHER':
        return `/i/${instituteSlug}/teacher/courses`;
      case 'STUDENT':
        return `/i/${instituteSlug}/student/courses`;
      default:
        return '/dashboard';
    }
  }, []);

  const login = useCallback(async (data: LoginData) => {
    let userData: LoginData = { ...data };
    
    // If user details (like firstName, email) are missing (e.g. Google OAuth redirect callback),
    // fetch full user data from /auth/me before redirecting
    if (!data.firstName || !data.email) {
      try {
        const { data: meData } = await api.get('/auth/me');
        userData = { ...userData, ...meData };
      } catch (error) {
        console.error('Failed to fetch user details during login:', error);
      }
    }
    
    setUser({
      id: userData.id || '',
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      email: userData.email || '',
      role: userData.role,
      profileImage: userData.profileImage,
      profile: userData.profile,
      instituteSlug: userData.instituteSlug,
    });
    
    subscribeToPushNotifications();

    const redirectPath = getRedirectPath(userData.role, userData.instituteSlug);
    navigate(redirectPath);
  }, [navigate, getRedirectPath]);

  const register = useCallback((data: LoginData) => {
    login(data); // Auto login after register
  }, [login]);

  const logout = useCallback(async () => {
    setUser(null);
    navigate('/login');
    try {
      await api.post('/auth/logout', {});
    } catch (error) {
      console.error('Server logout failed', error);
    }
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
