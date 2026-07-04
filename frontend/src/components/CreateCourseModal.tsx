import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../services/api';
import { API_ENDPOINTS } from '../services/apiEndpoints';
import { X } from 'lucide-react';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TeacherData {
  id: string;
  firstName: string;
  lastName: string;
  teacher: { id: string } | null;
}

const CreateCourseModal: React.FC<CreateCourseModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    teacherId: '', 
  });
  const [error, setError] = useState('');

  const { data: teachers = [] } = useQuery<TeacherData[]>({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data } = await api.get(`${API_ENDPOINTS.USERS.BASE}?role=TEACHER&limit=100`);
      return data.users.filter((u: { teacher: unknown }) => u.teacher);
    },
    enabled: isOpen
  });

  const createCourseMutation = useMutation({
    mutationFn: async () => {
      return api.post(API_ENDPOINTS.COURSES.BASE, {
        title: formData.title,
        description: formData.description,
        teacherId: formData.teacherId || null,
      });
    },
    onSuccess: () => {
      onSuccess();
      toast.success('Course created successfully');
    },
    onError: (err: unknown) => {
      const error = err as Error | { response?: { data?: { message?: string } } };
      const msg = ('response' in error ? error.response?.data?.message : (error as Error).message) || 'Failed to create course';
      setError(msg);
    }
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    createCourseMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-7000 dark:bg-slate-900/80 bg-opacity-75 transition-opacity" onClick={onClose} aria-hidden="true"></div>
        
        <div className="relative bg-surface rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
          <div className="bg-surface px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
              <h3 className="text-lg leading-6 font-medium text-primary" id="modal-title">
                Create New Course
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {error && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Course Title</label>
                <input 
                  type="text" 
                  name="title" 
                  required 
                  value={formData.title} 
                  onChange={handleChange} 
                  className="w-full border-border-strong rounded-md border p-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="e.g. Introduction to React"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Description</label>
                <textarea 
                  name="description" 
                  rows={3}
                  value={formData.description} 
                  onChange={handleChange} 
                  className="w-full border-border-strong rounded-md border p-2 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Course description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Assign Teacher (Optional)</label>
                <select
                  name="teacherId"
                  value={formData.teacherId}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-border-strong focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                >
                  <option value="">-- Unassigned --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.teacher?.id}>
                      {t.firstName} {t.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createCourseMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {createCourseMutation.isPending ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCourseModal;

