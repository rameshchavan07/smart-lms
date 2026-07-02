import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import EnrollStudentModal from '../../components/EnrollStudentModal';
import { UserPlus, MoreVertical, ShieldAlert, BookOpen } from 'lucide-react';
import { Button, EmptyState, Modal, ConfirmDialog } from '../../components';
import toast from 'react-hot-toast';

interface Course {
  id: string;
  title: string;
}

interface EnrollmentData {
  student: {
    id: string;
    enrollmentNumber: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    }
  };
  enrolledAt: string;
}

const EnrollmentManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Custom Delete Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [studentIdToUnenroll, setStudentIdToUnenroll] = useState<string | null>(null);

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['courses-list'],
    queryFn: async () => {
      const { data } = await api.get('/courses');
      if (data.courses.length > 0 && !selectedCourseId) {
        setSelectedCourseId(data.courses[0].id);
      }
      return data.courses;
    }
  });

  const { data: enrollments = [], isLoading: loading } = useQuery<EnrollmentData[]>({
    queryKey: ['enrollments', selectedCourseId],
    queryFn: async () => {
      const { data } = await api.get(`/enrollments/course/${selectedCourseId}/students`);
      return data.enrollments;
    },
    enabled: !!selectedCourseId,
  });

  const confirmUnenroll = (studentId: string) => {
    setStudentIdToUnenroll(studentId);
    setIsConfirmOpen(true);
  };

  const unenrollMutation = useMutation({
    mutationFn: async () => {
      return api.delete(`/enrollments/${selectedCourseId}/students/${studentIdToUnenroll}`);
    },
    onSuccess: () => {
      toast.success('Student unenrolled successfully.');
      setIsConfirmOpen(false);
      setStudentIdToUnenroll(null);
      queryClient.invalidateQueries({ queryKey: ['enrollments', selectedCourseId] });
    },
    onError: (error: unknown) => {
      console.error('Failed to unenroll', error);
      toast.error('Failed to remove student from course.');
    }
  });

  const handleUnenrollExecute = () => {
    if (!studentIdToUnenroll) return;
    unenrollMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-extrabold text-primary">Student Enrollments</h1>
        <Button 
          onClick={() => setIsModalOpen(true)}
          disabled={!selectedCourseId}
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Enroll Student
        </Button>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-slate-205 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="p-4 border-b border-border bg-bg-subtle/50 dark:bg-slate-850/20 flex gap-4 items-center">
          <label className="text-sm font-semibold text-secondary dark:text-slate-305">Select Course:</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="block w-64 pl-3 pr-10 py-2 text-base border-slate-350 dark:border-slate-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-xl border bg-surface text-slate-850 dark:text-slate-150 transition-all"
          >
            <option value="" disabled>-- Select a Course --</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-6 space-y-4">
            <div className="skeleton h-10 w-full rounded-xl" />
            <div className="skeleton h-10 w-full rounded-xl" />
            <div className="skeleton h-10 w-full rounded-xl" />
            <div className="skeleton h-10 w-full rounded-xl" />
          </div>
        ) : !selectedCourseId ? (
          <div className="p-8">
            <EmptyState
              icon={<BookOpen className="w-8 h-8 text-primary-500" />}
              title="No Course Selected"
              description="Please select a course from the dropdown menu to manage enrolled students."
            />
          </div>
        ) : enrollments.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<ShieldAlert className="w-8 h-8 text-primary-500" />}
              title="No Students Enrolled"
              description="There are currently no students registered in this course module."
              actionLabel="Enroll Student"
              onAction={() => setIsModalOpen(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-bg-subtle/50 dark:bg-slate-800/40 text-muted text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left">Student Name</th>
                  <th className="px-6 py-4 text-left">Email Address</th>
                  <th className="px-6 py-4 text-left">Enrolled Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-slate-200 dark:divide-slate-700">
                {enrollments.map((record) => (
                  <tr key={record.student.id} className="hover:bg-bg-subtle/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-primary-50 dark:bg-primary-955/40 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-bold text-sm shadow-xs border border-primary-100 dark:border-primary-900/10">
                          {record.student.user.firstName[0]}{record.student.user.lastName[0]}
                        </div>
                        <div className="ml-4 text-left">
                          <div className="text-sm font-semibold text-primary">
                            {record.student.user.firstName} {record.student.user.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-605 dark:text-slate-350">
                      {record.student.user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      {new Date(record.enrolledAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button 
                        variant="ghost" 
                        onClick={() => confirmUnenroll(record.student.id)} 
                        className="text-xs text-red-500 hover:text-red-655 hover:bg-red-50 dark:hover:bg-red-950/20 py-1.5 px-3"
                      >
                        Unenroll
                      </Button>
                      <button className="text-muted hover:text-primary-500 transition-colors">
                        <MoreVertical className="h-5 w-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EnrollStudentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        courseId={selectedCourseId}
        onSuccess={() => {
          setIsModalOpen(false);
          toast.success('Student enrolled successfully.');
          queryClient.invalidateQueries({ queryKey: ['enrollments', selectedCourseId] });
        }}
      />

      {/* Custom Confirmation Modal */}
      <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Confirm Student Unenrollment">
        <ConfirmDialog
          title="Confirm Unenrollment"
          message="Are you sure you want to remove this student from the selected course? They will lose access to all lecture logs, recordings, and assignments in this course module."
          onConfirm={handleUnenrollExecute}
          onCancel={() => setIsConfirmOpen(false)}
          loading={unenrollMutation.isPending}
          danger
        />
      </Modal>
    </div>
  );
};

export default EnrollmentManagement;
