import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  Users, 
  UserMinus, 
  Plus, 
  Loader2 
} from 'lucide-react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import EnrollStudentModal from '../../components/EnrollStudentModal';

interface StudentEnrollmentData {
  student: {
    id: string;
    enrollmentNumber: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  enrolledAt: string;
}

interface StudentsTabProps {
  courseId: string;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({ courseId }) => {
  const queryClient = useQueryClient();
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  const { data: enrolledStudents = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['enrolledStudents', courseId],
    queryFn: async () => {
      const { data } = await api.get(API_ENDPOINTS.ENROLLMENTS.COURSE_STUDENTS(courseId));
      return data.enrollments as StudentEnrollmentData[];
    }
  });

  const unenrollStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      return api.delete(API_ENDPOINTS.ENROLLMENTS.STUDENT_ENROLLMENT(courseId, studentId));
    },
    onSuccess: () => {
      toast.success('Student unenrolled successfully.');
      queryClient.invalidateQueries({ queryKey: ['enrolledStudents', courseId] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to unenroll student.');
    }
  });

  const handleUnenrollStudent = (studentId: string) => {
    if (!window.confirm('Are you sure you want to remove this student from the course?')) return;
    unenrollStudentMutation.mutate(studentId);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-900">Enrolled Students</h3>
        <button 
          onClick={() => setShowEnrollModal(true)}
          className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 transition font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Enroll Student
        </button>
      </div>

      {studentsLoading ? (
        <div className="text-center py-8 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
          <span className="text-xs mt-2 block">Loading enrolled students...</span>
        </div>
      ) : enrolledStudents.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">No students enrolled in this course yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left">Student Name</th>
                <th className="px-6 py-4 text-left">Email Address</th>
                <th className="px-6 py-4 text-left">Enrolled Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {enrolledStudents.map((record) => (
                <tr key={record.student.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                        {record.student.user.firstName[0]}{record.student.user.lastName[0]}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">
                          {record.student.user.firstName} {record.student.user.lastName}
                        </div>
                        <div className="text-xs text-slate-400">{record.student.enrollmentNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {record.student.user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(record.enrolledAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleUnenrollStudent(record.student.id)} 
                      className="text-red-500 hover:text-red-700 font-medium hover:bg-red-50 p-2 rounded-lg transition"
                      title="Unenroll"
                    >
                      <UserMinus className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showEnrollModal && (
        <EnrollStudentModal 
          isOpen={showEnrollModal} 
          onClose={() => setShowEnrollModal(false)} 
          courseId={courseId}
          onSuccess={() => {
            setShowEnrollModal(false);
            queryClient.invalidateQueries({ queryKey: ['enrolledStudents', courseId] });
            toast.success('Student enrolled successfully!');
          }}
        />
      )}
    </div>
  );
};
