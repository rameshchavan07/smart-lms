import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Loader2, Check } from 'lucide-react';
import api from '../services/api';
import { API_ENDPOINTS } from '../services/apiEndpoints';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface ViewSubmissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  assignmentTitle: string;
}

const ViewSubmissionsModal: React.FC<ViewSubmissionsModalProps> = ({ isOpen, onClose, assignmentId, assignmentTitle }) => {
  interface Submission {
    id: string;
    studentId: string;
    student: {
      user: {
        firstName: string;
        lastName: string;
        email: string;
      }
    };
    fileUrl: string;
    submittedAt: string;
    marks: number | null;
    feedback: string | null;
  }
  
  const queryClient = useQueryClient();
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [marks, setMarks] = useState<number | ''>('');
  const [feedback, setFeedback] = useState('');

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['assignment-submissions', assignmentId],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.ASSIGNMENTS.SUBMISSIONS(assignmentId));
      return res.data.submissions as Submission[];
    },
    enabled: isOpen && !!assignmentId
  });

  const gradeMutation = useMutation({
    mutationFn: async ({ submissionId, grade, feedback }: { submissionId: string, grade: number, feedback: string }) => {
      return await api.put(API_ENDPOINTS.ASSIGNMENTS.GRADE(submissionId), {
        marks: grade,
        feedback
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions', assignmentId] });
      setGradingId(null);
      toast.success('Graded successfully');
    },
    onError: () => {
      toast.error('Failed to grade submission');
    }
  });

  const handleGrade = async (submissionId: string) => {
    if (marks === '') return;
    gradeMutation.mutate({ submissionId, grade: Number(marks), feedback });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-4xl rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-bg-subtle shrink-0">
          <div>
            <h2 className="text-lg font-bold text-primary">Submissions for: {assignmentTitle}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-secondary">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-xl bg-bg-subtle">
              <p className="text-secondary text-sm">No submissions yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map(sub => (
                <div key={sub.id} className="p-4 border border-border rounded-xl bg-bg">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <h4 className="font-bold text-primary">
                        {sub.student.user.firstName} {sub.student.user.lastName}
                      </h4>
                      <p className="text-xs text-secondary">{sub.student.user.email}</p>
                      <p className="text-xs text-secondary mt-1">Submitted: {new Date(sub.submittedAt).toLocaleString()}</p>
                    </div>
                    
                    <div className="flex flex-col items-start md:items-end gap-2">
                      <a 
                        href={sub.fileUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-brand-600 hover:text-brand-700 text-sm font-semibold flex items-center gap-1"
                      >
                        <ExternalLink size={16} /> View Work
                      </a>
                      {sub.marks !== null ? (
                        <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                          Graded: {sub.marks} marks
                        </div>
                      ) : (
                        <div className="text-sm font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                          Pending Grading
                        </div>
                      )}
                    </div>
                  </div>

                  {gradingId === sub.id ? (
                    <div className="mt-4 pt-4 border-t border-border bg-bg-subtle p-4 rounded-lg">
                      <div className="flex gap-4 mb-4">
                        <div className="w-1/4">
                          <label className="block text-xs font-semibold text-secondary mb-1">Marks</label>
                          <input 
                            type="number" 
                            value={marks}
                            onChange={(e) => setMarks(e.target.value ? Number(e.target.value) : '')}
                            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500"
                          />
                        </div>
                        <div className="w-3/4">
                          <label className="block text-xs font-semibold text-secondary mb-1">Feedback (optional)</label>
                          <input 
                            type="text" 
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setGradingId(null)}
                          className="px-4 py-1.5 text-sm font-medium text-secondary hover:text-primary transition"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleGrade(sub.id)}
                          className="px-4 py-1.5 text-sm font-bold bg-indigo-600 text-white rounded-lg flex items-center gap-1 hover:bg-indigo-700 transition"
                        >
                          <Check size={16} /> Save Grade
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                      <p className="text-sm text-secondary italic">
                        {sub.feedback ? `"${sub.feedback}"` : "No feedback provided"}
                      </p>
                      <button 
                        onClick={() => {
                          setGradingId(sub.id);
                          setMarks(sub.marks !== null ? sub.marks : '');
                          setFeedback(sub.feedback || '');
                        }}
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition"
                      >
                        {sub.marks !== null ? 'Edit Grade' : 'Grade Assignment'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewSubmissionsModal;
