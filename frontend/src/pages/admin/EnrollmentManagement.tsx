import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import EnrollStudentModal from '../../components/EnrollStudentModal';
import { UserPlus, MoreVertical, ShieldAlert, BookOpen } from 'lucide-react';

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchEnrollments(selectedCourseId);
    }
  }, [selectedCourseId]);

  const handleUnenroll = async (studentId: string) => {
    if (window.confirm('Are you sure you want to remove this student from the course?')) {
      try {
        await api.delete(`/enrollments/${selectedCourseId}/students/${studentId}`);
        fetchEnrollments(selectedCourseId);
      } catch (error) {
        console.error('Failed to unenroll', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Student Enrollments</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          disabled={!selectedCourseId}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors shadow-sm font-medium text-sm"
        >
          <UserPlus className="w-4 h-4" />
          Enroll Student
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4 items-center">
          <label className="text-sm font-medium text-slate-700">Select Course:</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="block w-64 pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
          >
            <option value="" disabled>-- Select a Course --</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading enrollments...</div>
        ) : !selectedCourseId ? (
          <div className="p-16 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No Course Selected</h3>
            <p className="text-slate-500 mt-1">Please select a course to view its enrolled students.</p>
          </div>
        ) : enrollments.length === 0 ? (
          <div className="p-16 text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No Students Enrolled</h3>
            <p className="text-slate-500 mt-1">There are currently no students enrolled in this course.</p>
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
                {enrollments.map((record) => (
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
                      <button onClick={() => handleUnenroll(record.student.id)} className="text-red-400 hover:text-red-600 transition-colors mr-3">
                        Unenroll
                      </button>
                      <button className="text-slate-400 hover:text-blue-600 transition-colors">
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
          fetchEnrollments(selectedCourseId);
        }}
      />
    </div>
  );
};

export default EnrollmentManagement;
