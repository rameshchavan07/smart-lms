import React, { useEffect, useState } from 'react';
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
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Custom Delete Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [studentIdToUnenroll, setStudentIdToUnenroll] = useState<string | null>(null);
  const [unenrolling, setUnenrolling] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await api.get('/courses');
        setCourses(data.courses);
        if (data.courses.length > 0) {
          setSelectedCourseId(data.courses[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch courses', error);
        toast.error('Failed to load courses.');
      }
    };
    fetchCourses();
  }, []);

  const fetchEnrollments = async (courseId: string) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/enrollments/course/${courseId}/students`);
      setEnrollments(data.enrollments);
    } catch (error) {
      console.error('Failed to fetch enrollments', error);
      toast.error('Failed to fetch student enrollments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchEnrollments(selectedCourseId);
    }
  }, [selectedCourseId]);

  const confirmUnenroll = (studentId: string) => {
    setStudentIdToUnenroll(studentId);
    setIsConfirmOpen(true);
  };

  const handleUnenrollExecute = async () => {
    if (!studentIdToUnenroll) return;
    setUnenrolling(true);
    try {
      await api.delete(`/enrollments/${selectedCourseId}/students/${studentIdToUnenroll}`);
      toast.success('Student unenrolled successfully.');
      setIsConfirmOpen(false);
      setStudentIdToUnenroll(null);
      fetchEnrollments(selectedCourseId);
    } catch (error) {
      console.error('Failed to unenroll', error);
      toast.error('Failed to remove student from course.');
    } finally {
      setUnenrolling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">Student Enrollments</h1>
        <Button 
          onClick={() => setIsModalOpen(true)}
          disabled={!selectedCourseId}
          className="flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Enroll Student
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-205 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850/20 flex gap-4 items-center">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-305">Select Course:</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="block w-64 pl-3 pr-10 py-2 text-base border-slate-350 dark:border-slate-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-xl border bg-white dark:bg-slate-800 text-slate-850 dark:text-slate-150 transition-all"
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
              <thead className="bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left">Student Name</th>
                  <th className="px-6 py-4 text-left">Email Address</th>
                  <th className="px-6 py-4 text-left">Enrolled Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {enrollments.map((record) => (
                  <tr key={record.student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-primary-50 dark:bg-primary-955/40 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-bold text-sm shadow-xs border border-primary-100 dark:border-primary-900/10">
                          {record.student.user.firstName[0]}{record.student.user.lastName[0]}
                        </div>
                        <div className="ml-4 text-left">
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {record.student.user.firstName} {record.student.user.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-605 dark:text-slate-350">
                      {record.student.user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
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
                      <button className="text-slate-400 hover:text-primary-500 transition-colors">
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
          fetchEnrollments(selectedCourseId);
        }}
      />

      {/* Custom Confirmation Modal */}
      <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Confirm Student Unenrollment">
        <ConfirmDialog
          title="Confirm Unenrollment"
          message="Are you sure you want to remove this student from the selected course? They will lose access to all lecture logs, recordings, and assignments in this course module."
          onConfirm={handleUnenrollExecute}
          onCancel={() => setIsConfirmOpen(false)}
          loading={unenrolling}
          danger
        />
      </Modal>
    </div>
  );
};

export default EnrollmentManagement;
