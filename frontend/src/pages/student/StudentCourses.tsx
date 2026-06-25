import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { BookOpen, Video, PlayCircle } from 'lucide-react';
import { getDirectDriveUrl } from '../../utils/drive';

interface EnrollmentData {
  course: {
    id: string;
    title: string;
    description: string;
    thumbnailUrl?: string;
    teacher?: {
      user: {
        firstName: string;
        lastName: string;
      }
    };
    _count: {
      lectures: number;
    }
  }
}

const StudentCourses: React.FC = () => {
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const { data } = await api.get('/enrollments/my-courses');
        setEnrollments(data.enrollments);
      } catch (error) {
        console.error('Failed to fetch enrolled courses', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyCourses();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading your courses...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Enrolled Courses</h1>
        <p className="text-slate-500 mt-1">Jump right back into your active classes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrollments.length === 0 ? (
          <div className="col-span-full p-12 bg-white rounded-xl border border-slate-200 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">Not enrolled in any courses</h3>
            <p className="text-slate-500 mt-1">Check back later once the administrator assigns you to a course.</p>
          </div>
        ) : (
          enrollments.map((record) => {
            const course = record.course;
            return (
              <div key={course.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-32 border-b border-slate-100 relative overflow-hidden bg-indigo-50">
                  {course.thumbnailUrl ? (
                    <img 
                      src={getDirectDriveUrl(course.thumbnailUrl)} 
                      alt={course.title} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  <div className="absolute bottom-4 left-4 h-10 w-10 bg-white/95 backdrop-blur shadow-sm rounded-lg flex items-center justify-center text-indigo-600 z-10">
                    <BookOpen className="w-5 h-5" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-1 truncate">{course.title}</h3>
                  <p className="text-xs font-medium text-blue-600 mb-3">
                    {course.teacher ? `By ${course.teacher.user.firstName} ${course.teacher.user.lastName}` : 'No teacher assigned'}
                  </p>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-6 h-10">
                    {course.description || 'No description provided.'}
                  </p>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <Video className="w-4 h-4 text-slate-400" />
                      <span>{course._count.lectures} Lectures</span>
                    </div>
                    <Link to={`/student/courses/${course.id}`} className="text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 text-sm font-medium">
                      <PlayCircle className="w-4 h-4" /> Go to Course
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentCourses;
