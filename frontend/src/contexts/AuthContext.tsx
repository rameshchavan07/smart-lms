import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { subscribeToPushNotifications } from '../utils/pushNotifications';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  profileImage?: string;
  profile?: { bio?: string };
}

export interface LoginData {
  token?: string;
  refreshToken?: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImage?: string;
  profile?: { bio?: string };
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
    });
    
    subscribeToPushNotifications();

    if (userData.role === 'ADMIN') {
      navigate('/admin/users');
    } else if (userData.role === 'TEACHER') {
      navigate('/teacher/courses');
    } else if (userData.role === 'STUDENT') {
      navigate('/student/courses');
    } else {
      navigate('/dashboard');
    }
  }, [navigate]);

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

