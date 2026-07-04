import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { X, Check } from 'lucide-react';
import api from '../services/api';
import { API_ENDPOINTS } from '../services/apiEndpoints';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    description: '',
    dueDate: '',
    totalMarks: '100'
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['my-courses-for-assignment'],
    queryFn: async () => {
      const res = await api.get(`${API_ENDPOINTS.COURSES.MY_COURSES}?limit=100`);
      return res.data.enrollments?.map((e: { course: unknown }) => e.course) || res.data.courses || [];
    },
    enabled: isOpen
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      await api.post(API_ENDPOINTS.ASSIGNMENTS.BY_COURSE(formData.courseId), data);
    },
    onSuccess: () => {
      toast.success('Assignment created successfully');
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      onSuccess();
      onClose();
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to create assignment');
    }
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseId) {
      toast.error('Please select a course');
      return;
    }
    createAssignmentMutation.mutate({
      title: formData.title,
      description: formData.description,
      dueDate: new Date(formData.dueDate).toISOString(),
      totalMarks: Number(formData.totalMarks)
    });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-lg rounded-2xl shadow-xl flex flex-col">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-bold text-primary">Create Assignment</h2>
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-secondary">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-primary mb-1">Course</label>
            <select 
              required
              value={formData.courseId}
              onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
              className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-primary focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            >
              <option value="">Select a course...</option>
              {courses.map((c: { id: string, title: string }) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-1">Assignment Title</label>
            <input 
              type="text" 
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Week 1 React Project"
              className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-primary focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-primary mb-1">Description</label>
            <textarea 
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Instructions for the students..."
              className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-primary focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-primary mb-1">Due Date</label>
              <input 
                type="datetime-local" 
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-primary focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-primary mb-1">Total Marks</label>
              <input 
                type="number" 
                min="1"
                required
                value={formData.totalMarks}
                onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-primary focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-secondary hover:text-primary transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={createAssignmentMutation.isPending}
              className="px-5 py-2.5 text-sm font-semibold bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {createAssignmentMutation.isPending ? 'Creating...' : <><Check size={16} /> Create Assignment</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssignmentModal;
