import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { BookOpen, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<{totalCourses: number, totalStudents: number} | null>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/analytics/teacher');
        setMetrics(data.metrics);
        setRecentActivities(data.recentActivities || []);
      } catch (error) {
        console.error('Failed to fetch teacher analytics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.firstName}!</h1>
        <p className="text-slate-500 mt-1">Here is what is happening with your classes today.</p>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Assigned Courses</p>
            <h3 className="text-2xl font-bold text-slate-900">{metrics?.totalCourses || 0}</h3>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center">
          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-4">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Students</p>
            <h3 className="text-2xl font-bold text-slate-900">{metrics?.totalStudents || 0}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center mt-6">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Upcoming Lectures</h3>
        <p className="text-slate-500">No lectures scheduled for today. Take a break!</p>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mt-6">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Recent Class & Course Activities</h3>
        </div>
        <div className="p-6">
          <div className="flow-root">
            <ul className="-mb-8">
              {recentActivities.map((activity, idx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {idx !== recentActivities.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                          activity.entityType === 'Course' ? 'bg-indigo-100 text-indigo-600' :
                          activity.entityType === 'Lecture' ? 'bg-sky-100 text-sky-600' :
                          activity.entityType === 'Enrollment' ? 'bg-amber-100 text-amber-600' :
                          'bg-emerald-100 text-emerald-600'
                        }`}>
                          <span className="text-xs font-semibold">{activity.entityType[0]}</span>
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-slate-600">
                            {activity.action}{' '}
                            <span className="font-semibold text-slate-900">
                              by {activity.user.firstName} {activity.user.lastName} ({activity.user.role})
                            </span>
                          </p>
                        </div>
                        <div className="text-right text-xs whitespace-nowrap text-slate-400">
                          {new Date(activity.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              {recentActivities.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">No recent course activities found.</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
