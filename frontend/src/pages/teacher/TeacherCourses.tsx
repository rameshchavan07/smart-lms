import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Video } from 'lucide-react';

interface CourseData {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  _count: {
    enrollments: number;
    lectures: number;
  }
}

const TeacherCourses: React.FC = () => {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const { data } = await api.get('/courses/my-courses');
        setCourses(data.courses);
      } catch (error) {
        console.error('Failed to fetch assigned courses', error);
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
        <h1 className="text-2xl font-bold text-slate-900">My Assigned Courses</h1>
        <p className="text-slate-500 mt-1">Manage and view the courses assigned to you.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.length === 0 ? (
          <div className="col-span-full p-12 bg-white rounded-xl border border-slate-200 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No courses assigned yet</h3>
            <p className="text-slate-500 mt-1">Contact the administrator to be assigned to a course.</p>
          </div>
        ) : (
          courses.map((course) => (
            <div key={course.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-32 bg-blue-50 border-b border-slate-100 p-6 flex flex-col justify-between">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2 truncate">{course.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-6 h-10">
                  {course.description || 'No description provided.'}
                </p>
                <div className="mb-4">
                  <Link to={`/teacher/courses/${course.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                    View Lectures &rarr;
                  </Link>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{course._count.enrollments} Students</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Video className="w-4 h-4 text-slate-400" />
                    <span>{course._count.lectures} Lectures</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeacherCourses;
