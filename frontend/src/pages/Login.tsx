import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, GraduationCap, Users, Shield, Award, CheckCircle } from 'lucide-react';
import { Logo } from '../components';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [searchParams] = useSearchParams();

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

  const selectQuickRole = (role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'GUEST') => {
    if (role === 'ADMIN') {
      setEmail('admin@openlearnx.com');
      setPassword('admin123');
      toast.success('Admin credentials loaded');
    } else if (role === 'TEACHER') {
      setEmail('teacher@openlearnx.com');
      setPassword('teacher123');
      toast.success('Teacher credentials loaded');
    } else if (role === 'STUDENT') {
      setEmail('student@openlearnx.com');
      setPassword('student123');
      toast.success('Student credentials loaded');
    } else if (role === 'PARENT') {
      setEmail('student@openlearnx.com');
      setPassword('student123');
      toast.success('Parent Demo: loading Student credentials');
    } else if (role === 'GUEST') {
      setEmail('student@openlearnx.com');
      setPassword('student123');
      toast.success('Guest Demo: loading Student credentials');
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#f4f7fe] dark:bg-[#090e1a] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Left Column - Branding and Illustration */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-white dark:bg-[#0f172a] border-r border-slate-200/80 dark:border-slate-850/60 relative overflow-hidden">
        {/* Glow bubbles */}
        <div className="absolute top-1/3 -left-20 w-96 h-96 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-80 h-80 rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />
        
        {/* Logo at Top Left */}
        <div className="relative z-10 flex items-start">
          <Logo size="md" lightText={false} subtext="OpenSource Portal" />
        </div>

        {/* Center Illustration Area */}
        <div className="flex flex-col items-center justify-center my-auto relative z-10 max-w-xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              Open. Learn.<br />
              Grow. <span className="text-[#2563eb]">Together.</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed font-medium px-4">
              OpenLearnX is an open-source Learning Management System for everyone. Connect with your peers and tutors in a modern virtual ecosystem.
            </p>
          </motion.div>

          {/* Educational Laptop/Student Illustration */}
          <div className="w-full flex justify-center py-2">
            <svg className="w-96 h-64 text-primary-500/20" viewBox="0 0 400 280" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Laptop Screen */}
              <rect x="70" y="40" width="260" height="170" rx="16" fill="#1e293b" />
              <rect x="78" y="48" width="244" height="142" rx="8" fill="#0f172a" />
              {/* Classroom / Video feed boxes inside laptop */}
              <rect x="88" y="58" width="70" height="50" rx="6" fill="#1e3a8a" opacity="0.8" />
              <rect x="164" y="58" width="70" height="50" rx="6" fill="#065f46" opacity="0.8" />
              <rect x="240" y="58" width="70" height="50" rx="6" fill="#701a75" opacity="0.8" />
              
              <rect x="88" y="116" width="222" height="66" rx="6" fill="#1e293b" opacity="0.6" />
              <circle cx="120" cy="149" r="14" fill="#3b82f6" />
              <polygon points="117,144 126,149 117,154" fill="#ffffff" />
              <rect x="145" y="140" width="100" height="6" rx="3" fill="#ffffff" opacity="0.8" />
              <rect x="145" y="152" width="60" height="5" rx="2" fill="#ffffff" opacity="0.4" />
              
              {/* Laptop Base */}
              <path d="M50 210H350C350 210 350 226 338 226H62C50 226 50 210 50 210Z" fill="#94a3b8" />
              <rect x="175" y="212" width="50" height="4" rx="2" fill="#cbd5e1" />

              {/* Decorative Student avatars/bubbles */}
              <g transform="translate(30, 160)">
                <circle cx="20" cy="20" r="20" fill="#e0f2fe" />
                <path d="M10 32C10 26 15 25 20 25C25 25 30 26 30 32" stroke="#0284c7" strokeWidth="2" />
                <circle cx="20" cy="15" r="5" fill="#0284c7" />
              </g>
              <g transform="translate(330, 90)">
                <circle cx="20" cy="20" r="20" fill="#dcfce7" />
                <path d="M10 32C10 26 15 25 20 25C25 25 30 26 30 32" stroke="#16a34a" strokeWidth="2" />
                <circle cx="20" cy="15" r="5" fill="#16a34a" />
              </g>
            </svg>
          </div>
        </div>

        {/* Feature Icons Footer */}
        <div className="grid grid-cols-4 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col items-center text-center space-y-1.5">
            <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-955/20 flex items-center justify-center text-[#2563eb] shadow-sm">
              <Lock className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Open Source</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-1.5">
            <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-955/20 flex items-center justify-center text-[#2563eb] shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Multi-User</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-1.5">
            <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-955/20 flex items-center justify-center text-[#2563eb] shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Secure</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-1.5">
            <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-955/20 flex items-center justify-center text-[#2563eb] shadow-sm">
              <Award className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Analytics</p>
          </div>
        </div>
      </div>

      {/* Right Column - Glass Card Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative overflow-y-auto">
        <div className="absolute top-1/4 right-10 w-96 h-96 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full bg-white dark:bg-[#0f172a] p-8 md:p-10 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800/80 space-y-6 relative z-10"
        >
          {/* Logo on small screens */}
          <div className="lg:hidden flex justify-center mb-2">
            <Logo size="md" subtext="OpenSource Portal" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome Back!
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Sign in to your OpenLearnX account
            </p>
          </div>

          {oauthError && (
            <div className="text-red-600 text-xs bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl font-semibold">
              Google authentication failed. Please try again.
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="text-red-600 text-xs bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl font-semibold">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="pl-10 pr-4 py-2.5 w-full bg-[#f8fafc]/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-900 dark:text-white font-medium"
                  placeholder="Email or Username"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="pl-10 pr-10 py-2.5 w-full bg-[#f8fafc]/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-slate-900 dark:text-white font-medium"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center">
                <input
                  id="remember_me"
                  name="remember_me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-500 border-slate-300 dark:border-slate-800 rounded-lg focus:ring-primary-500/30 cursor-pointer"
                />
                <label htmlFor="remember_me" className="ml-2 block text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                  Remember me
                </label>
              </div>
              <Link to="/forgot-password" className="text-[#2563eb] hover:text-[#1d4ed8] transition-colors">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer text-sm"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Social SSO Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200/80 dark:border-slate-800/80" />
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
              <span className="px-3 bg-white dark:bg-[#0f172a] text-slate-400">
                or continue with
              </span>
            </div>
          </div>

          {/* SSO Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex justify-center items-center py-2.5 px-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-sm"
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              </svg>
            </button>
            <button
              type="button"
              className="flex justify-center items-center py-2.5 px-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-sm"
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 23 23">
                <rect x="0" y="0" width="11" height="11" fill="#f25022"/>
                <rect x="12" y="0" width="11" height="11" fill="#7fba00"/>
                <rect x="0" y="12" width="11" height="11" fill="#00a4ef"/>
                <rect x="12" y="12" width="11" height="11" fill="#ffb900"/>
              </svg>
            </button>
            <button
              type="button"
              className="flex justify-center items-center py-2.5 px-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-sm"
            >
              <svg className="w-4.5 h-4.5 fill-current text-slate-800 dark:text-white" viewBox="0 0 24 24">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </button>
          </div>

          {/* Choose Role for Quick Testing */}
          <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center mb-4">
              Choose your role to continue
            </p>
            <div className="grid grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => selectQuickRole('ADMIN')}
                className="flex flex-col items-center p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#2563eb] hover:bg-[#2563eb]/5 transition-all text-center cursor-pointer group"
              >
                <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-955/20 text-[#2563eb] flex items-center justify-center shadow-sm group-hover:bg-[#2563eb] group-hover:text-white transition-colors">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold text-slate-700 dark:text-slate-350 mt-1">Admin</span>
              </button>
              
              <button
                type="button"
                onClick={() => selectQuickRole('TEACHER')}
                className="flex flex-col items-center p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#22c55e] hover:bg-[#22c55e]/5 transition-all text-center cursor-pointer group"
              >
                <div className="h-9 w-9 rounded-lg bg-green-50 dark:bg-green-955/20 text-[#22c55e] flex items-center justify-center shadow-sm group-hover:bg-[#22c55e] group-hover:text-white transition-colors">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold text-slate-700 dark:text-slate-350 mt-1">Teacher</span>
              </button>

              <button
                type="button"
                onClick={() => selectQuickRole('STUDENT')}
                className="flex flex-col items-center p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all text-center cursor-pointer group"
              >
                <div className="h-9 w-9 rounded-lg bg-purple-50 dark:bg-purple-955/20 text-[#8b5cf6] flex items-center justify-center shadow-sm group-hover:bg-[#8b5cf6] group-hover:text-white transition-colors">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold text-slate-700 dark:text-slate-350 mt-1">Student</span>
              </button>

              <button
                type="button"
                onClick={() => selectQuickRole('PARENT')}
                className="flex flex-col items-center p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#f59e0b] hover:bg-[#f59e0b]/5 transition-all text-center cursor-pointer group"
              >
                <div className="h-9 w-9 rounded-lg bg-amber-50 dark:bg-amber-955/20 text-[#f59e0b] flex items-center justify-center shadow-sm group-hover:bg-[#f59e0b] group-hover:text-white transition-colors">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold text-slate-700 dark:text-slate-350 mt-1">Parent</span>
              </button>

              <button
                type="button"
                onClick={() => selectQuickRole('GUEST')}
                className="flex flex-col items-center p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-500 hover:bg-slate-500/5 transition-all text-center cursor-pointer group"
              >
                <div className="h-9 w-9 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-500 flex items-center justify-center shadow-sm group-hover:bg-slate-500 group-hover:text-white transition-colors">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold text-slate-700 dark:text-slate-350 mt-1">Guest</span>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 pt-2 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-primary-500 hover:text-primary-600 transition-colors">
              Sign Up
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
