import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { AxiosError } from 'axios';
import { Button, Card } from '../components';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { getBackendBaseUrl } from '../utils/url';

const BACKEND_URL = getBackendBaseUrl();

export default function RegisterInstitute() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    instituteName: '',
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    password: ''
  });

  const registerMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post('/institutes/register', data),
    onSuccess: () => {
      toast.success('Registration request submitted successfully!');
      navigate('/verify-email', { state: { email: formData.email, next: '/pending-approval' } });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      const errorMsg = err.response?.data?.message || 'Failed to submit registration';
      toast.error(errorMsg);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleSignup = () => {
    if (!formData.instituteName.trim()) {
      toast.error('Please enter your Institute Name before continuing with Google.');
      return;
    }
    const state = JSON.stringify({ 
      action: 'register_institute', 
      instituteName: formData.instituteName, 
      phone: formData.phone 
    });
    window.location.href = `${BACKEND_URL}/api/auth/google?state=${encodeURIComponent(state)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <Card className="w-full max-w-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">Register Your Institute</h1>
          <p className="text-muted mt-2">Submit a request to join our platform.</p>
        </div>
        
        <button
          type="button"
          onClick={handleGoogleSignup}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 mb-6 border border-slate-250 dark:border-slate-800 bg-surface/50 dark:bg-slate-900/50 text-secondary dark:text-slate-250 font-bold rounded-xl hover:bg-bg-subtle transition-colors cursor-pointer shadow-sm hover:shadow active:scale-[0.98]"
        >
          <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          </svg>
          Register with Google
        </button>
        
        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60 dark:border-slate-800/80" />
          </div>
          <div className="relative flex justify-center text-xs font-bold uppercase">
            <span className="px-3 bg-surface text-muted">
              or register manually
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Institute Name <span className="text-red-500">*</span></label>
            <input required name="instituteName" type="text" className="input w-full" value={formData.instituteName} onChange={handleChange} placeholder="Required for Google Signup too" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email (Contact)</label>
              <input required name="email" type="email" className="input w-full" value={formData.email} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input name="phone" type="text" className="input w-full" value={formData.phone} onChange={handleChange} />
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-4">
            <h3 className="font-semibold mb-4 text-primary">Admin Details</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
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
              <label className="block text-sm font-medium mb-1">Password</label>
              <input required name="password" type="password" minLength={6} className="input w-full" value={formData.password} onChange={handleChange} />
            </div>
          </div>

          <Button type="submit" className="w-full btn-primary mt-6" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </Button>

          <p className="text-center text-sm text-muted mt-4">
            Already have an account? <Link to="/login" className="text-brand-500 hover:underline">Log in</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
