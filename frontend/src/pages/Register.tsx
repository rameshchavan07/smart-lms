import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mail, Lock, User } from 'lucide-react';
import { Logo } from '../components';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const dataToSend = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      };
      const { data } = await api.post('/auth/register', dataToSend);

      toast.success('Registration successful!');
      // Navigate to OTP verification with email in state
      navigate('/verify-email', { state: { email: data.email } });
    } catch (err) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      const msg = errorObj.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = `${BACKEND_URL}/api/auth/google`;
  };

  return (
    <div className="min-h-screen flex bg-slate-background dark:bg-[#090e1a] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Left Column - Branding and Illustration */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 bg-white dark:bg-[#0f172a] border-r border-slate-200/60 dark:border-slate-800/60 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-primary-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10">
          <Logo size="lg" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6 max-w-xl relative z-10 text-left"
        >
          <h1 className="text-5xl font-black tracking-tight text-primary leading-tight">
            Start Your<br />
            Learning <span className="bg-gradient-to-r from-primary-500 to-indigo-650 bg-clip-text text-transparent">Adventure.</span>
          </h1>
          <p className="text-muted text-lg leading-relaxed font-medium">
            Create an account on OpenLearnX to join live classes, access study material repositories, and follow syllabus roadmaps.
          </p>

          {/* Simple Vector Graphic */}
          <div className="relative py-4 flex justify-center">
            <svg className="w-72 h-56 text-primary-500/20" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="70" className="fill-slate-50/50 dark:fill-slate-900/50 stroke-slate-200 dark:stroke-slate-800" strokeWidth="2.5" />
              <path d="M70 120 L100 80 L130 120" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="100" cy="70" r="8" fill="#10b981" />
              <path d="M50 140 H150" stroke="var(--border)" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        </motion.div>

        <div className="text-xs text-slate-400 font-semibold relative z-10">
          <span>&copy; 2026 OpenLearnX. All rights reserved.</span>
        </div>
      </div>

      {/* Right Column - Register Card Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-16 relative">
        <div className="absolute top-1/3 right-10 w-96 h-96 rounded-full bg-primary-500/5 blur-[120px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-md w-full glass-panel p-8 rounded-2xl shadow-lg border border-slate-200/60 dark:border-slate-800/60 space-y-6 relative z-10"
        >
          <div className="lg:hidden flex justify-center mb-4">
            <Logo size="md" />
          </div>

          <div className="text-center md:text-left space-y-1.5">
            <h2 className="text-2xl font-black text-primary">
              Create an Account
            </h2>
            <p className="text-sm text-muted font-medium">
              Join OpenLearnX and start learning
            </p>
          </div>

          {/* Google Sign-Up Button */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-slate-250 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-250 font-bold rounded-xl hover:bg-bg-subtle transition-colors cursor-pointer shadow-sm hover:shadow active:scale-[0.98]"
          >
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            </svg>
            Sign up with Google
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200/60 dark:border-slate-800/80" />
            </div>
            <div className="relative flex justify-center text-xs font-bold uppercase">
              <span className="px-3 bg-[#f8fafc] dark:bg-[#0f172a] text-slate-400">
                or register with email
              </span>
            </div>
          </div>

          {/* Email Registration Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5 uppercase tracking-wider">First Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    name="firstName"
                    type="text"
                    required
                    className="pl-10 pr-4 py-2.5 w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5 uppercase tracking-wider">Last Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    name="lastName"
                    type="text"
                    required
                    className="pl-10 pr-4 py-2.5 w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted mb-1.5 uppercase tracking-wider">Email address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  className="pl-10 pr-4 py-2.5 w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  name="password"
                  type="password"
                  required
                  className="pl-10 pr-4 py-2.5 w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white"
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted mb-1.5 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  className={`pl-10 pr-4 py-2.5 w-full bg-white/50 dark:bg-slate-900/50 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all dark:text-white
                    ${formData.confirmPassword && formData.confirmPassword !== formData.password
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                      : 'border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:ring-primary-500/20'
                    }`}
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
              {formData.confirmPassword && formData.confirmPassword !== formData.password && (
                <p className="text-red-500 text-[11px] font-semibold mt-1.5">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-indigo-650 hover:from-primary-600 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer text-sm border border-primary-600/10"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <div className="text-center text-sm text-slate-500 pt-2 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-primary-500 hover:text-primary-600 transition-colors">
                Sign in here
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
