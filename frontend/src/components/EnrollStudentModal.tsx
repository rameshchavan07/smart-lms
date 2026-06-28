import React, { useState, useEffect } from 'react';
import api from '../services/api';
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
  const [students, setStudents] = useState<StudentData[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchStudents = async () => {
        try {
          const { data } = await api.get('/users?role=STUDENT&limit=100');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setStudents(data.users.filter((u: any) => u.student)); // Only keep those with a student profile
        } catch (error) {
          console.error('Failed to fetch students', error);
        }
      };
      fetchStudents();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedStudentId('');

      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setError('Please select a student');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/enrollments', {
        studentId: selectedStudentId,
        courseId,
      });
      onSuccess();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to enroll student');
    } finally {
      setLoading(false);
    }
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

              <div className="pt-4 border-t border-border flex justify-end gap-3 mt-6">
                <button type="button" onClick={onClose} className="px-4 py-2 border border-border-strong rounded-md text-secondary bg-surface hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm transition-colors">
                  {loading ? 'Enrolling...' : 'Enroll Student'}
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
