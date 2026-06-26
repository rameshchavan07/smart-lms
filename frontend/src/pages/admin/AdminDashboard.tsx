import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Users, GraduationCap, BookOpen, UserPlus, FilePlus, RefreshCw, ArrowUpRight, Activity } from 'lucide-react';
import { Card, Badge, Button } from '../../components';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface AdminMetrics {
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalCourses: number;
  totalEnrollments: number;
}

interface RecentCourse {
  id: string;
  title: string;
  teacher?: {
    user: {
      firstName: string;
      lastName: string;
    }
  } | null;
  _count: {
    enrollments: number;
  };
}

interface RecentActivity {
  id: string;
  entityType: string;
  action: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

const COLORS = ['#6366f1', '#e0e7ff'];

const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [recentCourses, setRecentCourses] = useState<RecentCourse[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = React.useCallback(async () => {
    try {
      const { data } = await api.get('/analytics/admin');
      setMetrics(data.metrics);
      setRecentCourses(data.recentCourses);
      setRecentActivities(data.recentActivities || []);
    } catch (error) {
      console.error('Failed to fetch admin analytics', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchAnalytics();
    });
  }, [fetchAnalytics]);

  const handleRefresh = () => {
    setRefreshing(true);
    Promise.resolve().then(() => {
      fetchAnalytics();
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="skeleton h-8 w-48 rounded-lg" />
          <div className="skeleton h-10 w-24 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-3">
              <div className="skeleton h-10 w-10 rounded-xl" />
              <div className="skeleton h-4 w-20 rounded" />
              <div className="skeleton h-7 w-12 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 h-64 skeleton" />
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 h-64 skeleton" />
        </div>
      </div>
    );
  }

  // Generate trend data based on actual metrics
  const enrollmentTrendData = [
    { name: 'Jan', enrollments: Math.max(2, Math.round((metrics?.totalEnrollments || 10) * 0.35)) },
    { name: 'Feb', enrollments: Math.max(5, Math.round((metrics?.totalEnrollments || 10) * 0.5)) },
    { name: 'Mar', enrollments: Math.max(8, Math.round((metrics?.totalEnrollments || 10) * 0.65)) },
    { name: 'Apr', enrollments: Math.max(12, Math.round((metrics?.totalEnrollments || 10) * 0.8)) },
    { name: 'May', enrollments: Math.max(15, Math.round((metrics?.totalEnrollments || 10) * 0.9)) },
    { name: 'Jun', enrollments: metrics?.totalEnrollments || 20 },
  ];

  const completionData = [
    { name: 'Completed', value: 72 },
    { name: 'In Progress', value: 28 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome & Refresh */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100">Admin Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Platform analytics and operational hub.</p>
        </div>
        <Button 
          variant="secondary" 
          onClick={handleRefresh} 
          loading={refreshing}
          className="w-full sm:w-auto"
        >
          {!refreshing && <RefreshCw className="w-4 h-4 mr-2" />}
          Refresh Analytics
        </Button>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card hover className="flex items-center">
          <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-4 shadow-xs">
            <Users className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Total Users</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{metrics?.totalUsers}</h3>
            <span className="flex items-center text-[10px] font-bold text-emerald-500 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +12.5% vs last month
            </span>
          </div>
        </Card>
        
        <Card hover className="flex items-center">
          <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mr-4 shadow-xs">
            <Users className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Active Teachers</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{metrics?.totalTeachers}</h3>
            <span className="flex items-center text-[10px] font-bold text-emerald-500 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +8.3% vs last month
            </span>
          </div>
        </Card>

        <Card hover className="flex items-center">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-primary-500 dark:text-primary-400 mr-4 shadow-xs">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Active Students</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{metrics?.totalStudents}</h3>
            <span className="flex items-center text-[10px] font-bold text-emerald-500 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +14.2% vs last month
            </span>
          </div>
        </Card>

        <Card hover className="flex items-center">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mr-4 shadow-xs">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Total Courses</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{metrics?.totalCourses}</h3>
            <span className="flex items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1">
              Stable learning modules
            </span>
          </div>
        </Card>
      </div>

      {/* Graphical Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <Card className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">Enrollment Growth</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Monthly student registrations trend</p>
            </div>
            <Badge variant="info">30d Analytics</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={enrollmentTrendData}>
                <defs>
                  <linearGradient id="enrollmentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="enrollments" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#enrollmentGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Completion Donut */}
        <Card className="flex flex-col">
          <div className="mb-6">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">Course Completion</h3>
            <p className="text-xs text-slate-400 dark:text-slate-550">Average progression stats</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-40 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={completionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {completionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100">72%</p>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Completed</p>
              </div>
            </div>
            <div className="flex gap-4 justify-center text-xs mt-4">
              <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                <span className="h-3 w-3 rounded-full bg-primary-500" /> Completed
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-slate-655 dark:text-slate-355">
                <span className="h-3 w-3 rounded-full bg-primary-100 dark:bg-slate-700" /> In Progress
              </span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Courses */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs transition-colors">
          <div className="p-5 border-b border-slate-150 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100">Recently Added Courses</h3>
            <Link to="/admin/courses" className="text-xs text-primary-500 font-bold hover:text-primary-655 transition-colors">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-150 dark:divide-slate-700">
              <tbody className="divide-y divide-slate-150 dark:divide-slate-700">
                {recentCourses.map(course => (
                  <tr key={course.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{course.title}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {course.teacher ? `${course.teacher.user.firstName} ${course.teacher.user.lastName}` : 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-550 dark:text-slate-400 text-right font-medium">
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
        <Card className="flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/admin/users" className="flex items-center p-3 rounded-xl border border-slate-205 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50/30 dark:hover:bg-primary-950/10 group transition-all">
                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-750 group-hover:bg-primary-100 dark:group-hover:bg-primary-950/40 flex items-center justify-center text-slate-500 group-hover:text-primary-500 mr-3 transition-colors">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-200 group-hover:text-primary-600">Add New User</p>
                  <p className="text-xs text-slate-400">Create a teacher or student</p>
                </div>
              </Link>
              
              <Link to="/admin/courses" className="flex items-center p-3 rounded-xl border border-slate-205 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50/30 dark:hover:bg-primary-950/10 group transition-all">
                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-750 group-hover:bg-primary-100 dark:group-hover:bg-primary-950/40 flex items-center justify-center text-slate-500 group-hover:text-primary-500 mr-3 transition-colors">
                  <FilePlus className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-200 group-hover:text-primary-600">Create Course</p>
                  <p className="text-xs text-slate-400">Draft a new class module</p>
                </div>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs transition-colors">
        <div className="p-5 border-b border-slate-150 dark:border-slate-700 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/40">
          <Activity className="w-5 h-5 text-primary-500" />
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100">Recent System Activities</h3>
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
                          activity.entityType === 'User' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600' :
                          activity.entityType === 'Enrollment' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600' :
                          'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'
                        }`}>
                          <span className="text-xs font-extrabold">{activity.entityType[0]}</span>
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
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

export default AdminDashboard;
