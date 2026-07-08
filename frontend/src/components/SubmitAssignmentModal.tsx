import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import api from '../services/api';
import { API_ENDPOINTS } from '../services/apiEndpoints';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface SubmitAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  assignmentTitle: string;
  onSuccess: () => void;
}

const SubmitAssignmentModal: React.FC<SubmitAssignmentModalProps> = ({ isOpen, onClose, assignmentId, assignmentTitle, onSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const { mutate: submitAssignment, isPending: loading } = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }
      await api.post(API_ENDPOINTS.ASSIGNMENTS.SUBMIT(assignmentId), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      onSuccess();
      onClose();
      toast.success('Assignment submitted successfully');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to submit assignment');
      toast.error('Failed to submit assignment');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a file for your submission');
      return;
    }
    setError(null);
    submitAssignment();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-bg-subtle shrink-0">
          <h2 className="text-lg font-bold text-primary">Submit Assignment</h2>
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-secondary">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="mb-4">
            <p className="text-sm font-medium text-secondary">Submitting for:</p>
            <p className="text-base font-bold text-primary">{assignmentTitle}</p>
          </div>

          {error && (
            <div className="p-3 text-sm text-rose-500 bg-rose-500/10 rounded-lg border border-rose-500/20">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-primary mb-1">Upload File</label>
            <p className="text-xs text-secondary mb-2">Please upload your assignment file (e.g., PDF, Word Doc).</p>
            <input 
              type="file" 
              required
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-sm text-primary focus:border-brand-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
            />
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
              disabled={loading || !file}
              className="px-5 py-2.5 text-sm font-semibold bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : <><Check size={16} /> Submit</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitAssignmentModal;
