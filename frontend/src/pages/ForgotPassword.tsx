import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { KeyRound, Mail, ShieldCheck, RefreshCw, Eye, EyeOff, CheckCircle } from 'lucide-react';

type Step = 'email' | 'otp' | 'password' | 'success';

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const canResend = countdown <= 0;

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (step === 'otp') inputRefs.current[0]?.focus();
  }, [step]);

  useEffect(() => {
    if (step !== 'otp') return;
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, step]);

  // ── Step 1: Request OTP ─────────────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setStep('otp');
      setCountdown(60);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  // ── OTP helpers ─────────────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    pasted.split('').forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter all 6 digits.'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/verify-reset-otp', { email, otp: code });
      setResetToken(data.resetToken);
      setStep('password');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setLoading(true); setError('');
    try {
      await api.post('/auth/resend-otp', { email, type: 'PASSWORD_RESET' });
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to resend OTP.');
    } finally { setLoading(false); }
  };

  // ── Step 3: Reset Password ──────────────────────────────────────────────────
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/reset-password', { resetToken, newPassword });
      setStep('success');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to reset password. Please start over.');
    } finally { setLoading(false); }
  };

  // ── Step Indicator ──────────────────────────────────────────────────────────
  const steps = [
    { key: 'email', label: 'Email', icon: Mail },
    { key: 'otp', label: 'Verify', icon: ShieldCheck },
    { key: 'password', label: 'Reset', icon: KeyRound },
  ];
  const stepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-10">

        {step === 'success' ? (
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Password Reset!</h2>
            <p className="text-slate-500 mb-6">Your password has been reset successfully.</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all duration-150 active:scale-95"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto h-14 w-14 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <KeyRound className="h-7 w-7 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Forgot Password</h2>
              <p className="text-slate-500 text-sm mt-1">We'll help you get back in</p>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {steps.map((s, i) => {
                const Icon = s.icon;
                const isActive = i === stepIndex;
                const isDone = i < stepIndex;
                return (
                  <React.Fragment key={s.key}>
                    <div className="flex flex-col items-center gap-1">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-300
                        ${isDone ? 'bg-green-500' : isActive ? 'bg-indigo-600' : 'bg-slate-100'}`}>
                        {isDone
                          ? <CheckCircle className="h-4 w-4 text-white" />
                          : <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        }
                      </div>
                      <span className={`text-xs font-medium ${isActive ? 'text-indigo-600' : isDone ? 'text-green-600' : 'text-slate-400'}`}>
                        {s.label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`h-0.5 w-8 mb-4 rounded transition-all duration-300 ${i < stepIndex ? 'bg-green-400' : 'bg-slate-200'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {error && (
              <div className="mb-4 text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-lg py-2 px-4">
                {error}
              </div>
            )}

            {/* Step 1: Email */}
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-xl transition-all duration-150 active:scale-95"
                >
                  {loading ? <span className="flex items-center justify-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Sending...</span> : 'Send Reset Code'}
                </button>
                <div className="text-center text-sm text-slate-500">
                  Remember your password?{' '}
                  <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">Sign in</Link>
                </div>
              </form>
            )}

            {/* Step 2: OTP */}
            {step === 'otp' && (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <p className="text-sm text-slate-500 text-center">
                  Enter the 6-digit code sent to <span className="font-semibold text-slate-700">{email}</span>
                </p>
                <div className="flex gap-3 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all
                        ${digit ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200'}
                        focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200`}
                    />
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={loading || otp.join('').length < 6}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-xl transition-all duration-150 active:scale-95"
                >
                  {loading ? <span className="flex items-center justify-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Verifying...</span> : 'Verify Code'}
                </button>
                <div className="text-center text-sm text-slate-500">
                  {canResend
                    ? <button type="button" onClick={handleResend} disabled={loading} className="font-semibold text-indigo-600 hover:text-indigo-700">Resend Code</button>
                    : <span>Resend in <span className="font-semibold text-slate-700">{countdown}s</span></span>
                  }
                </div>
              </form>
            )}

            {/* Step 3: New Password */}
            {step === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setError(''); }}
                      placeholder="Min. 6 characters"
                      className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                    placeholder="Repeat your new password"
                    className={`w-full px-4 py-3 border rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all
                      ${confirmPassword && confirmPassword !== newPassword ? 'border-red-400 focus:border-red-400' : 'border-slate-200 focus:border-indigo-500'}`}
                  />
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-xl transition-all duration-150 active:scale-95"
                >
                  {loading ? <span className="flex items-center justify-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Resetting...</span> : 'Reset Password'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
