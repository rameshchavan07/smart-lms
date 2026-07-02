import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [role, setRole] = useState<'TEACHER' | 'STUDENT'>(user?.role === 'TEACHER' ? 'STUDENT' : 'TEACHER');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    employeeCode: '', // Teacher
    specialization: '', // Teacher
    enrollmentNumber: '', // Student
    academicYear: '', // Student
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const createUserMutation = useMutation({
    mutationFn: async () => {
      if (role === 'TEACHER') {
        return api.post('/users/teacher', {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          employeeCode: formData.employeeCode,
          specialization: formData.specialization,
        });
      } else {
        return api.post('/users/student', {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          enrollmentNumber: formData.enrollmentNumber,
          academicYear: formData.academicYear,
        });
      }
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create user');
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    createUserMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-500 dark:bg-slate-900/80 bg-opacity-75 transition-opacity" onClick={onClose} aria-hidden="true"></div>
        
        <div className="relative bg-surface rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
          <div className="bg-surface px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-5 border-b border-border pb-3">
              <h3 className="text-lg leading-6 font-medium text-primary" id="modal-title">
                Create New User
              </h3>
              <button onClick={onClose} className="text-muted hover:text-slate-500 dark:hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {error && <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {user?.role === 'ADMIN' && (
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">User Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'TEACHER' | 'STUDENT')}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-border-strong bg-surface text-primary focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                  >
                    <option value="TEACHER">Teacher</option>
                    <option value="STUDENT">Student</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">First Name</label>
                  <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} className="w-full border-border-strong bg-surface text-primary rounded-md border p-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">Last Name</label>
                  <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} className="w-full border-border-strong bg-surface text-primary rounded-md border p-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Email</label>
                <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full border-border-strong bg-surface text-primary rounded-md border p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Password</label>
                <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full border-border-strong bg-surface text-primary rounded-md border p-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>

              {role === 'TEACHER' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Employee Code</label>
                    <input type="text" name="employeeCode" required value={formData.employeeCode} onChange={handleChange} className="w-full border-border-strong bg-surface text-primary rounded-md border p-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Specialization</label>
                    <input type="text" name="specialization" required value={formData.specialization} onChange={handleChange} className="w-full border-border-strong bg-surface text-primary rounded-md border p-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>
              )}

              {role === 'STUDENT' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Enrollment Number</label>
                    <input type="text" name="enrollmentNumber" required value={formData.enrollmentNumber} onChange={handleChange} className="w-full border-border-strong bg-surface text-primary rounded-md border p-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Academic Year</label>
                    <input type="text" name="academicYear" required value={formData.academicYear} onChange={handleChange} className="w-full border-border-strong bg-surface text-primary rounded-md border p-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-6">
                <button type="button" onClick={onClose} className="px-4 py-2 border border-border-strong rounded-md text-secondary bg-surface hover:bg-slate-50 dark:bg-slate-700 font-medium text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={createUserMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm transition-colors disabled:opacity-50">
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateUserModal;
