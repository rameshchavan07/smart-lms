import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import api from '../services/api';

interface SubmitAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  assignmentTitle: string;
  onSuccess: () => void;
}

const SubmitAssignmentModal: React.FC<SubmitAssignmentModalProps> = ({ isOpen, onClose, assignmentId, assignmentTitle, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl.trim()) {
      setError('Please provide a URL to your submission');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post(`/assignments/${assignmentId}/submit`, { fileUrl });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      setError(errorResponse.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setLoading(false);
    }
  };

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
            <label className="block text-sm font-semibold text-primary mb-1">Submission URL</label>
            <p className="text-xs text-secondary mb-2">Please paste a link to your work (e.g., Google Doc, GitHub repo, or Drive link).</p>
            <input 
              type="url" 
              required
              placeholder="https://..."
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-sm text-primary focus:border-brand-500 outline-none"
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
              disabled={loading || !fileUrl.trim()}
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
