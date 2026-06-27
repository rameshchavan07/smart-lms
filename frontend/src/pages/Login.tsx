import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { 
  Mail, Lock, Eye, EyeOff, GraduationCap, 
  BookOpen, Users, ShieldCheck, BarChart3,
  Sparkles, ArrowRight, CheckCircle2
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

const FEATURES = [
  { icon: BookOpen,    label: 'Open Source',   desc: 'Free & transparent' },
  { icon: Users,       label: 'Multi-Role',    desc: 'Students, Teachers, Admins' },
  { icon: ShieldCheck, label: 'Secure',        desc: 'Enterprise-grade security' },
  { icon: BarChart3,   label: 'Analytics',     desc: 'Detailed insights' },
];

const Login: React.FC = () => {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
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
      const e2 = err as { response?: { data?: { message?: string } } };
      setError(e2.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${BACKEND_URL}/api/auth/google`;
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#080d18] text-slate-900 dark:text-slate-100 font-sans">
      {/* ── Left Panel: Branding ── */}
      <div className="hidden lg:flex flex-col w-[52%] bg-gradient-to-br from-[#0f1729] via-[#162040] to-[#0a0f1e] relative overflow-hidden p-12">
        {/* Decorative blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full bg-brand-500/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-60px] right-[-60px] w-[300px] h-[300px] rounded-full bg-purple-500/15 blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-3 mb-auto">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-brand">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-bold text-xl">OpenLearnX</span>
        </div>

        {/* Hero Content */}
        <div className="relative flex-1 flex flex-col justify-center py-12">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6 w-fit">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-[12px] text-white/70 font-medium">Modern Enterprise LMS</span>
          </div>

          <h1 className="text-5xl font-bold text-white leading-[1.1] mb-6">
            Open.<br />
            Learn.<br />
            <span className="text-gradient">Grow Together.</span>
          </h1>
          <p className="text-white/50 text-lg leading-relaxed max-w-sm mb-10">
            The all-in-one learning management platform built for schools, universities, and enterprises.
          </p>

          {/* Feature Pills */}
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl p-3.5 hover:bg-white/8 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4 h-4 text-brand-400" />
                </div>
                <div>
                  <p className="text-white text-[13px] font-semibold leading-none">{f.label}</p>
                  <p className="text-white/40 text-[11px] mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero illustration */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex-1 min-h-[300px] mt-8">
          <img
            src="/assets/login-illustration.png"
            alt="Learning platform"
            className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-700 hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1729] via-[#0f1729]/40 to-transparent" />
        </div>

        {/* Trust Badges */}
        <div className="relative flex items-center gap-4 mt-6">
          {['10K+ Students', '500+ Teachers', '200+ Courses'].map((t) => (
            <div key={t} className="flex items-center gap-1.5 text-white/40 text-[12px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 lg:p-12">
        <div className="w-full max-w-md animate-fade-up">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-white">OpenLearnX</span>
          </div>

          <h2 className="text-3xl font-bold mb-1 text-slate-900 dark:text-white">Welcome back</h2>
          <p className="mb-8 text-[15px] text-slate-500 dark:text-slate-400">Sign in to your account to continue</p>

          {/* Error Messages */}
          {(oauthError || error) && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800/30 text-red-600 dark:text-red-400 text-[13px] font-medium flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5">⚠️</span>
              {error || 'Google authentication failed. Please try again.'}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold mb-1.5 text-slate-500 dark:text-slate-400">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[13px] font-semibold text-slate-500 dark:text-slate-400">
                  Password
                </label>
                <Link to="/forgot-password" className="text-[12px] font-medium text-brand-500 hover:text-brand-600 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input pl-10 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <input
                id="remember"
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/30 cursor-pointer"
              />
              <label htmlFor="remember" className="text-[13px] cursor-pointer text-slate-500 dark:text-slate-400">
                Keep me signed in
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full gap-2 mt-2"
              style={{ height: '48px', fontSize: '15px' }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-[12px] font-medium px-1 text-slate-400 dark:text-slate-500">or continue with</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="btn btn-secondary w-full gap-3"
            style={{ height: '48px' }}
          >
            <img src="/assets/google-logo.png" alt="Google" className="w-5 h-5 flex-shrink-0" 
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span className="text-[14px]">Continue with Google</span>
          </button>


          {/* Footer */}
          <p className="text-center text-[13px] mt-6 text-slate-400 dark:text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-500 hover:text-brand-600 transition-colors">
              Create one free
            </Link>
          </p>
          <p className="text-center text-[11px] mt-4 text-slate-300 dark:text-slate-600">
            © 2026 OpenLearnX. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
