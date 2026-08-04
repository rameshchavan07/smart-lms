import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Mail, Lock, Eye, EyeOff, 
  BookOpen, Users, ShieldCheck, BarChart3,
  Sparkles, ArrowRight, CheckCircle2
} from 'lucide-react';
import { getBackendBaseUrl } from '../utils/url';
import Lottie from 'lottie-react';
import registerAnimation from '../assets/animations/register.json';

const BACKEND_URL = getBackendBaseUrl();

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
  const [, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get('error');

  const navigate = useNavigate();

  React.useEffect(() => {
    if (oauthError) {
      toast.error('Google authentication failed. Please try again.');
    }
  }, [oauthError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      toast.success('Login successful!');
      login(data);
    } catch (err) {
      const e2 = err as { response?: { data?: { message?: string }; status?: number } };
      const msg = e2.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
      toast.error(msg);
      
      // If the email is not verified, redirect them to the verification page
      if (e2.response?.status === 403 && msg.includes('not verified')) {
        setTimeout(() => {
          navigate('/verify-email', { state: { email } });
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${BACKEND_URL}/api/auth/google`;
  };

  return (
    <div className="min-h-screen flex bg-bg-subtle dark:bg-[#080d18] text-primary font-sans">
      {/* ── Left Panel: Branding ── */}
      <div className="hidden lg:flex flex-col w-[52%] bg-gradient-to-br from-[#0f1729] via-[#162040] to-[#0a0f1e] relative overflow-hidden p-12">
        {/* Decorative blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full bg-brand-500/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-60px] right-[-60px] w-[300px] h-[300px] rounded-full bg-purple-500/15 blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-3 mb-auto">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center">
            <img src="/logo.jpg" alt="OpenLearnX" className="w-10 h-10 rounded-xl object-cover" />
          </div>
          <span className="text-white font-bold text-xl">OpenLearnX</span>
        </div>

        {/* Hero Content */}
        <div className="relative flex-1 flex flex-col justify-center py-12">
          <div className="inline-flex items-center gap-2 bg-surface/5 border border-white/10 rounded-full px-4 py-1.5 mb-6 w-fit">
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
                className="flex items-center gap-3 bg-surface/5 border border-white/8 rounded-xl p-3.5 hover:bg-surface/8 transition-colors"
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
        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex-1 min-h-[300px] mt-8 flex items-center justify-center bg-white/5">
          {/* @ts-expect-error Lottie import resolution mismatch */}
          {React.createElement(Lottie.default || Lottie, {
            animationData: registerAnimation,
            loop: true,
            className: "w-full max-w-[400px]"
          })}
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
            <div className="w-9 h-9 rounded-xl flex items-center justify-center">
              <img src="/logo.jpg" alt="OpenLearnX" className="w-9 h-9 rounded-xl object-cover" />
            </div>
            <span className="font-bold text-lg text-primary">OpenLearnX</span>
          </div>

          <h2 className="text-3xl font-bold mb-1 text-primary">Welcome back</h2>
          <p className="mb-8 text-[15px] text-muted">Sign in to your account to continue</p>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold mb-1.5 text-muted">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
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
                <label className="block text-[13px] font-semibold text-muted">
                  Password
                </label>
                <Link to="/forgot-password" className="text-[12px] font-medium text-brand-500 hover:text-brand-600 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors text-muted hover:text-secondary dark:hover:text-slate-300"
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
              <label htmlFor="remember" className="text-[13px] cursor-pointer text-muted">
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
            <span className="text-[12px] font-medium px-1 text-muted">or continue with</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="btn btn-secondary w-full gap-3"
            style={{ height: '48px' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-[14px]">Continue with Google</span>
          </button>


          {/* Footer */}
          <p className="text-center text-[13px] mt-6 text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-500 hover:text-brand-600 transition-colors">
              Create one free
            </Link>
          </p>
          <p className="text-center text-[11px] mt-4 text-slate-300 dark:text-secondary">
            © 2026 OpenLearnX. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
