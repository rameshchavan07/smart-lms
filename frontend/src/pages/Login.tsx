import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { LogIn, Mail, Lock, Eye, EyeOff, Github, Chrome, Compass, GraduationCap, Users, Shield, Cpu, Activity, Play } from 'lucide-react';
import { Logo } from '../components';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [searchParams] = useSearchParams();

  // Show error from Google OAuth failure
  const oauthError = searchParams.get('error');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${BACKEND_URL}/api/auth/google`;
  };

  // Auto-fill login credentials for testing
  const selectQuickRole = (role: 'ADMIN' | 'TEACHER' | 'STUDENT') => {
    if (role === 'ADMIN') {
      setEmail('admin@openlearnx.com');
      setPassword('admin123');
    } else if (role === 'TEACHER') {
      setEmail('teacher@openlearnx.com');
      setPassword('teacher123');
    } else if (role === 'STUDENT') {
      setEmail('student@openlearnx.com');
      setPassword('student123');
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      
      {/* Left Column - Branding and Illustration */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
        <Logo size="lg" />

        <div className="space-y-6 max-w-xl">
          <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            Open. Learn.<br />
            Grow. <span className="text-primary-500">Together.</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
            OpenLearnX is an open-source Learning Management System designed to bring teachers and students together in a modern virtual workspace.
          </p>

          {/* Core Illustration Area */}
          <div className="relative py-4 flex justify-center">
            <svg className="w-80 h-64 text-primary-500/20" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="20" y="30" width="160" height="110" rx="12" className="fill-slate-100 dark:fill-slate-700 stroke-slate-200 dark:stroke-slate-600" strokeWidth="4" />
              <rect x="15" y="140" width="170" height="15" rx="5" className="fill-slate-300 dark:fill-slate-600" />
              {/* Internal Workspace Representation */}
              <circle cx="55" cy="70" r="15" className="fill-primary-500/20" />
              <path d="M45 100C45 92 50 88 55 88C60 88 65 92 65 100H45Z" className="fill-primary-500" />
              
              <circle cx="100" cy="70" r="12" className="fill-emerald-500/20" />
              <path d="M92 95C92 88.5 96 85 100 85C104 85 108 88.5 108 95H92Z" className="fill-success" />

              <circle cx="145" cy="70" r="10" className="fill-indigo-500/20" />
              <path d="M138 90C138 85 141.5 82 145 82C148.5 82 152 85 152 90H138Z" className="fill-indigo-500" />
              
              {/* Network connecting nodes */}
              <path d="M55 55L100 58M100 58L145 60M55 55L145 60" stroke="#0066f5" strokeWidth="2" strokeDasharray="4 4" />
            </svg>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-4 gap-4 pt-6">
            <div className="bg-slate-50 dark:bg-slate-805 p-3 rounded-2xl border border-slate-150 dark:border-slate-750 text-center">
              <Cpu className="w-5 h-5 mx-auto text-primary-500 mb-1" />
              <p className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">Open Source</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-805 p-3 rounded-2xl border border-slate-150 dark:border-slate-750 text-center">
              <Users className="w-5 h-5 mx-auto text-primary-500 mb-1" />
              <p className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">Multi-User</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-805 p-3 rounded-2xl border border-slate-150 dark:border-slate-750 text-center">
              <Shield className="w-5 h-5 mx-auto text-primary-500 mb-1" />
              <p className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">Secure</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-805 p-3 rounded-2xl border border-slate-150 dark:border-slate-750 text-center">
              <Activity className="w-5 h-5 mx-auto text-primary-500 mb-1" />
              <p className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">Analytics</p>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-semibold flex gap-4">
          <span>&copy; 2026 OpenLearnX. All rights reserved.</span>
        </div>
      </div>

      {/* Right Column - Login Card Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 space-y-6">
          <div className="lg:hidden flex justify-center mb-4">
            <Logo size="md" />
          </div>

          <div className="text-center md:text-left space-y-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Welcome Back!
            </h2>
            <p className="text-sm text-slate-400 dark:text-slate-400">
              Sign in to your OpenLearnX account
            </p>
          </div>

          {oauthError && (
            <div className="text-red-750 text-xs bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3 rounded-xl">
              Google authentication failed. Please try again.
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="text-red-750 text-xs bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-400 dark:text-slate-550 mb-1 uppercase tracking-wider">
                Email address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="pl-10 pr-4 py-2.5 w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-750 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-900 dark:text-white"
                  placeholder="name@openlearnx.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-bold text-primary-500 hover:text-primary-655 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="pl-10 pr-10 py-2.5 w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-750 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-900 dark:text-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember_me"
                name="remember_me"
                type="checkbox"
                className="h-4 w-4 text-primary-500 border-slate-300 dark:border-slate-700 rounded-lg focus:ring-primary-500"
              />
              <label htmlFor="remember_me" className="ml-2 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-bold rounded-xl shadow-md transition-all active:scale-97 cursor-pointer text-sm"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Social SSO Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs font-bold uppercase">
              <span className="px-3 bg-white dark:bg-slate-800 text-slate-400">
                or continue with
              </span>
            </div>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex justify-center items-center py-2 px-4 border border-slate-205 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
            >
              <Chrome className="w-4 h-4 text-red-500" />
            </button>
            <button
              type="button"
              className="flex justify-center items-center py-2 px-4 border border-slate-205 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
            >
              <Github className="w-4 h-4 text-slate-900 dark:text-white" />
            </button>
            <button
              type="button"
              className="flex justify-center items-center py-2 px-4 border border-slate-205 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
            >
              <Compass className="w-4 h-4 text-blue-500" />
            </button>
          </div>

          {/* Choose Role for Quick Testing */}
          <div className="pt-4 border-t border-slate-150 dark:border-slate-700">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-3">
              Choose your role to continue
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => selectQuickRole('ADMIN')}
                className="flex flex-col items-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50/10 dark:hover:bg-primary-950/10 transition-all text-center cursor-pointer"
              >
                <Shield className="w-4 h-4 text-primary-500 mb-1" />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Admin</span>
              </button>
              <button
                type="button"
                onClick={() => selectQuickRole('TEACHER')}
                className="flex flex-col items-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50/10 dark:hover:bg-primary-950/10 transition-all text-center cursor-pointer"
              >
                <Users className="w-4 h-4 text-primary-500 mb-1" />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Teacher</span>
              </button>
              <button
                type="button"
                onClick={() => selectQuickRole('STUDENT')}
                className="flex flex-col items-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50/10 dark:hover:bg-primary-950/10 transition-all text-center cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-primary-500 mb-1" />
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Student</span>
              </button>
            </div>
          </div>

          <div className="text-center text-sm text-slate-500 pt-2">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-primary-500 hover:text-primary-600 transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
