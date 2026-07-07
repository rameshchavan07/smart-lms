import React, { useState } from 'react';
import { useInstitute } from '../../contexts/InstituteContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Card } from '../../components';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function InstituteLogin() {
  const { institute, isLoading: instituteLoading } = useInstitute();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (instituteLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!institute) return <Navigate to="/not-found" replace />;
  
  if (isAuthenticated) {
    return <Navigate to={`/i/${institute.slug}/dashboard`} replace />; // Will be redirected by AuthContext/ProtectedRoute logic
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data } = await api.post(`/institutes/${institute.slug}/auth/login`, { email, password });
      await login({
        token: data.token,
        refreshToken: data.refreshToken,
        role: data.role,
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        profileImage: data.profileImage,
        instituteSlug: data.instituteSlug
      });
      toast.success('Logged in successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          {institute.logoUrl && (
            <img src={institute.logoUrl} alt="Logo" className="w-16 h-16 mx-auto mb-4 rounded-xl object-cover bg-white" />
          )}
          <h1 className="text-2xl font-bold text-primary">Log in to {institute.name}</h1>
          <p className="text-muted mt-2">Enter your credentials to access your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input required type="email" className="input w-full" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium">Password</label>
              <Link to="/forgot-password" className="text-xs text-brand-500 hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <input 
                required 
                type={showPassword ? "text" : "password"} 
                className="input w-full pr-10" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
              <button 
                type="button" 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full btn-primary mt-6" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
          </Button>

          <p className="text-center text-sm text-muted mt-6">
            Don't have an account? <Link to={`/i/${institute.slug}/register`} className="text-brand-500 hover:underline">Register here</Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
