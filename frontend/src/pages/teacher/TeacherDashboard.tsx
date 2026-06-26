import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { BookOpen, Users, Video, Award, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Badge, Button } from '../../components';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

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

  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 h-28 skeleton" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 skeleton rounded-xl" />
          <div className="h-72 skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  // Mock grade distribution data
  const gradeDistribution = [
    { grade: 'A', students: 18 },
    { grade: 'B', students: 29 },
    { grade: 'C', students: 12 },
    { grade: 'D', students: 5 },
    { grade: 'F', students: 2 },
  ];

  return (
    <div className="space-y-6">
      {/* Greetings Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-primary-500/10 to-indigo-650/10 dark:from-primary-950/20 dark:to-indigo-950/20 p-6 rounded-2xl border border-primary-500/10">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {getTimeOfDayGreeting()}, Dr. {user?.lastName || user?.firstName}! 🌅
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Here is what is happening with your classes today.</p>
        </div>
        <Badge variant="live" className="text-sm py-1 px-3">Next Class: in 2 hours</Badge>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card hover className="flex items-center">
          <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-4 shadow-xs">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Assigned Courses</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{metrics?.totalCourses || 0}</h3>
          </div>
        </Card>
        
        <Card hover className="flex items-center">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-primary-500 dark:text-primary-400 mr-4 shadow-xs">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Total Students</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{metrics?.totalStudents || 0}</h3>
          </div>
        </Card>

        <Card hover className="flex items-center">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mr-4 shadow-xs">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Avg Attendance</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">91.4%</h3>
          </div>
        </Card>

        <Card hover className="flex items-center">
          <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mr-4 shadow-xs">
            <Video className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Pending Tasks</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">8</h3>
          </div>
        </Card>
      </div>

      {/* Main Charts & Schedules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Grade Distribution Chart */}
        <Card className="lg:col-span-2">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">Student Grade Spread</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Overview of student score distributions</p>
            </div>
            <Badge variant="success">Pass Rate: 96.8%</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" dark-stroke="#334155" />
                <XAxis dataKey="grade" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="students" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Weekly Schedule */}
        <Card className="flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 mb-4">Today's Schedule</h3>
            <div className="space-y-4">
              <div className="flex gap-4 items-start p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <span className="text-xs font-bold text-slate-400 pt-1">09:00 AM</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-200">Weekly Faculty Meeting</p>
                  <p className="text-xs text-slate-450 dark:text-slate-400">Board Room</p>
                </div>
              </div>
              <div className="flex gap-4 items-start p-3 rounded-xl bg-primary-50/30 dark:bg-primary-950/10 border border-primary-100 dark:border-primary-900/20 transition-colors">
                <span className="text-xs font-bold text-primary-500 pt-1">02:00 PM</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-primary-600 dark:text-primary-400">Advanced React Programming</p>
                  <p className="text-xs text-slate-450 dark:text-slate-400">Batch B • Lecture Room 4</p>
                </div>
              </div>
            </div>
          </div>
          <Button variant="secondary" className="w-full mt-4 justify-between">
            View Complete Calendar
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Card>
      </div>

      {/* Activity Feed */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs transition-colors">
        <div className="p-5 border-b border-slate-150 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40">
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100">Recent Class & Course Activities</h3>
        </div>
        <div className="p-6">
          <div className="flow-root">
            <ul className="-mb-8">
              {recentActivities.map((activity, idx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {idx !== recentActivities.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-slate-800 ${
                          activity.entityType === 'Course' ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650' :
                          activity.entityType === 'Lecture' ? 'bg-sky-50 dark:bg-sky-950/20 text-sky-600' :
                          activity.entityType === 'Enrollment' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600' :
                          'bg-emerald-55 dark:bg-emerald-950/20 text-emerald-600'
                        }`}>
                          <span className="text-xs font-bold">{activity.entityType[0]}</span>
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-slate-655 dark:text-slate-305">
                            {activity.action}{' '}
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              by {activity.user.firstName} {activity.user.lastName} ({activity.user.role})
                            </span>
                          </p>
                        </div>
                        <div className="text-right text-xs whitespace-nowrap text-slate-400 dark:text-slate-500">
                          {new Date(activity.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              {recentActivities.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">No recent activities found.</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
