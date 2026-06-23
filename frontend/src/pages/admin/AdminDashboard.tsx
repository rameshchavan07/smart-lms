import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Users, UserSquare2, GraduationCap, BookOpen, UserPlus, FilePlus } from 'lucide-react';

interface AdminMetrics {
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalCourses: number;
  totalEnrollments: number;
}

const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/analytics/admin');
        setMetrics(data.metrics);
        setRecentCourses(data.recentCourses);
      } catch (error) {
        console.error('Failed to fetch admin analytics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Users</p>
            <h3 className="text-2xl font-bold text-slate-900">{metrics?.totalUsers}</h3>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
          <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-4">
            <UserSquare2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Teachers</p>
            <h3 className="text-2xl font-bold text-slate-900">{metrics?.totalTeachers}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-4">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Students</p>
            <h3 className="text-2xl font-bold text-slate-900">{metrics?.totalStudents}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
          <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-4">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Courses</p>
            <h3 className="text-2xl font-bold text-slate-900">{metrics?.totalCourses}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Courses */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Recently Added Courses</h3>
            <Link to="/admin/courses" className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</Link>
          </div>
          <div className="p-0">
            <table className="min-w-full divide-y divide-slate-100">
              <tbody className="divide-y divide-slate-100">
                {recentCourses.map(course => (
                  <tr key={course.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{course.title}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {course.teacher ? `${course.teacher.user.firstName} ${course.teacher.user.lastName}` : 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 text-right">
                      {course._count.enrollments} Enrolled
                    </td>
                  </tr>
                ))}
                {recentCourses.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500 text-sm">No courses available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/admin/users" className="flex items-center p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 group transition-all">
              <div className="h-10 w-10 rounded bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-600 group-hover:text-blue-600 mr-3">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 group-hover:text-blue-700">Add New User</p>
                <p className="text-xs text-slate-500">Create a teacher or student</p>
              </div>
            </Link>
            
            <Link to="/admin/courses" className="flex items-center p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 group transition-all">
              <div className="h-10 w-10 rounded bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-600 group-hover:text-blue-600 mr-3">
                <FilePlus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 group-hover:text-blue-700">Create Course</p>
                <p className="text-xs text-slate-500">Draft a new class module</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
