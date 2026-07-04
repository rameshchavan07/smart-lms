import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { API_ENDPOINTS } from '../services/apiEndpoints';
import { X } from 'lucide-react';

interface EnrollStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courseId: string;
  enrolledStudentIds?: string[];
}

interface StudentData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  student: { id: string } | null;
}

const EnrollStudentModal: React.FC<EnrollStudentModalProps> = ({ isOpen, onClose, onSuccess, courseId, enrolledStudentIds = [] }) => {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [error, setError] = useState('');

  const { data: students = [] } = useQuery<StudentData[]>({
    queryKey: ['availableStudents'],
    queryFn: async () => {
      const { data } = await api.get(`${API_ENDPOINTS.USERS.BASE}?role=STUDENT&limit=100`);
      return data.users.filter((u: { student: unknown }) => u.student);
    },
    enabled: isOpen
  });

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedStudentId('');
      setError('');
    }
  }, [isOpen]);

  const enrollStudentMutation = useMutation({
    mutationFn: async () => {
      return api.post(API_ENDPOINTS.ENROLLMENTS.BASE, {
        studentId: selectedStudentId,
        courseId,
      });
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to enroll student');
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setError('Please select a student');
      return;
    }
    setError('');
    enrollStudentMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-500 dark:bg-slate-900/80 bg-opacity-75 transition-opacity" onClick={onClose} aria-hidden="true"></div>

        <div className="relative bg-surface rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
          <div className="bg-surface px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-5 border-b border-border pb-3">
              <h3 className="text-lg leading-6 font-medium text-primary" id="modal-title">
                Enroll Student
              </h3>
              <button onClick={onClose} className="text-muted hover:text-slate-500 dark:hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-border-strong bg-surface text-primary focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                  required
                >
                  <option value="" disabled>-- Select a Student --</option>
                  {students.map(s => {
                    const isEnrolled = s.student?.id ? enrolledStudentIds.includes(s.student.id) : false;
                    return (
                      <option key={s.id} value={s.student?.id} disabled={isEnrolled}>
                        {s.firstName} {s.lastName} ({s.email}) {isEnrolled ? '- Already Enrolled' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-6">
                <button type="button" onClick={onClose} className="px-4 py-2 border border-border-strong rounded-md text-secondary bg-surface hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={enrollStudentMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm transition-colors disabled:opacity-50">
                  {enrollStudentMutation.isPending ? 'Enrolling...' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollStudentModal;
