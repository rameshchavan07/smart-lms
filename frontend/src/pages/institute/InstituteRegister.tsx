import React, { useState } from 'react';
import { useInstitute } from '../../contexts/InstituteContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Card } from '../../components';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { AxiosError } from 'axios';
import { Loader2 } from 'lucide-react';

export default function InstituteRegister() {
  const { institute, isLoading: instituteLoading } = useInstitute();
  const { register, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (instituteLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!institute) return <Navigate to="/not-found" replace />;
  if (isAuthenticated) return <Navigate to={`/i/${institute.slug}/dashboard`} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await api.post(`/institutes/${institute.slug}/auth/register`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      });
      register({
        token: data.token,
        refreshToken: data.refreshToken,
        role: data.role,
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        instituteSlug: data.instituteSlug
      });
      toast.success('Registration successful! Please check your email to verify your account.');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          {institute.logoUrl && (
            <img src={institute.logoUrl} alt="Logo" className="w-16 h-16 mx-auto mb-4 rounded-xl object-cover bg-white" />
          )}
          <h1 className="text-2xl font-bold text-primary">Join {institute.name}</h1>
          <p className="text-muted mt-2">Create a student account</p>
        </div>

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

          <p className="text-center text-sm text-muted mt-6">
            Already have an account? <Link to={`/i/${institute.slug}/login`} className="text-brand-500 hover:underline">Log in here</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
