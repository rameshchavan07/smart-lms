import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { AxiosError } from 'axios';
import { Button, Card } from '../components';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <Card className="w-full max-w-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">Register Your Institute</h1>
          <p className="text-muted mt-2">Submit a request to join our platform.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Institute Name</label>
            <input required name="instituteName" type="text" className="input w-full" value={formData.instituteName} onChange={handleChange} />
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
