import React, { useState } from 'react';
import { useInstitute } from '../../contexts/InstituteContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Card } from '../../components';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { AxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import { getBackendBaseUrl } from '../../utils/url';

export default function InstituteRegister() {
  const { institute, isLoading: instituteLoading } = useInstitute();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const BACKEND_URL = getBackendBaseUrl();

  const handleGoogleSignup = () => {
    if (!institute?.slug) return;
    const statePayload = JSON.stringify({ instituteSlug: institute.slug, action: 'register' });
    window.location.href = `${BACKEND_URL}/api/auth/google?state=${encodeURIComponent(statePayload)}`;
  };

  if (instituteLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!institute) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Institute Not Found</h1>
        <p className="text-muted">The institute you are trying to access does not exist or the URL is incorrect.</p>
        <Link to="/" className="btn btn-primary mt-4">Go to Homepage</Link>
      </div>
    );
  }
  const getRedirectPath = (role?: string) => {
    switch (role) {
      case 'ADMIN': return `/i/${institute.slug}/admin`;
      case 'TEACHER': return `/i/${institute.slug}/teacher`;
      case 'STUDENT': return `/i/${institute.slug}/student`;
      default: return `/i/${institute.slug}`;
    }
  };

  if (isAuthenticated && user) {
    return <Navigate to={getRedirectPath(user.role)} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/institutes/${institute.slug}/auth/register`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      });
      navigate('/verify-email', { 
        state: { 
          email: formData.email, 
          next: `/i/${institute.slug}/login` 
        } 
      });
      const msg = institute.isPrivate 
        ? 'Registration submitted! Please verify your email. Your application is pending Admin approval.'
        : 'Registration successful! Please check your email to verify your account.';
      toast.success(msg);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const msg = axiosError.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Setup dynamic theme color if provided
  const dynamicStyles = institute.themeColor ? {
    '--brand-500': institute.themeColor,
    '--brand-600': institute.themeColor,
  } as React.CSSProperties : {};

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-surface p-4 relative"
      style={{
        ...dynamicStyles,
        ...(institute.coverImageUrl && {
          backgroundImage: `url(${institute.coverImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        })
      }}
    >
      {/* Overlay if there's a background image */}
      {institute.coverImageUrl && <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />}

      <Card className="w-full max-w-md p-8 relative z-10 shadow-2xl">
        <div className="text-center mb-6">
          {institute.logoUrl && (
            <img src={institute.logoUrl} alt="Logo" className="w-16 h-16 mx-auto mb-4 rounded-xl object-cover bg-white" />
          )}
          <h1 className="text-2xl font-bold text-primary">Join {institute.name}</h1>
          {institute.description ? (
            <p className="text-muted mt-2 text-[14px] leading-relaxed px-2">{institute.description}</p>
          ) : (
            <p className="text-muted mt-2">Create a student account</p>
          )}
        </div>

        {institute.isPrivate && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-200 text-[13px]">
            <strong className="block mb-1">Private Institute</strong>
            Registration is by application only. Submitting this form will send an application to the institute's administrators. You will not be able to log in until they approve it.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input required name="firstName" type="text" className="input w-full" value={formData.firstName} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input required name="lastName" type="text" className="input w-full" value={formData.lastName} onChange={handleChange} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input required name="email" type="email" className="input w-full" value={formData.email} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input required name="password" type="password" minLength={6} className="input w-full" value={formData.password} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input required name="confirmPassword" type="password" minLength={6} className="input w-full" value={formData.confirmPassword} onChange={handleChange} />
          </div>

          <Button type="submit" className="w-full btn-primary mt-6" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
          </Button>

          <div className="relative flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-[12px] font-medium px-1 text-muted">or continue with</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
            className="btn btn-secondary w-full gap-3"
            style={{ height: '48px' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-[14px]">Sign up with Google</span>
          </button>

          <p className="text-center text-sm text-muted mt-6">
            Already have an account? <Link to={`/i/${institute.slug}/login`} className="text-brand-500 hover:underline">Log in here</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
