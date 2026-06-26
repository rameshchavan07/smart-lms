import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  UserPlus, 
  FilePlus, 
  ArrowUpRight, 
  Activity, 
  Calendar, 
  ClipboardList, 
  ChevronRight,
  Database,
  HardDrive,
  Mail,
  Server,
  Bell,
  FileText
} from 'lucide-react';
import { Card } from '../../components';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface AdminMetrics {
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalCourses: number;
  totalEnrollments: number;
}

const COLORS = ['#2563eb', '#22c55e', '#8b5cf6', '#f59e0b'];

const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = React.useCallback(async () => {
    try {
      const { data } = await api.get('/analytics/admin');
      setMetrics(data.metrics);
    } catch (error) {
      console.error('Failed to fetch admin analytics', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchAnalytics();
    });
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="skeleton h-8 w-48 rounded-lg" />
          <div className="skeleton h-10 w-24 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 skeleton rounded-2xl" />
          <div className="h-72 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  const enrollmentTrendData = [
    { name: 'Mon', enrollments: 400 },
    { name: 'Tue', enrollments: 750 },
    { name: 'Wed', enrollments: 650 },
    { name: 'Thu', enrollments: 1245 },
    { name: 'Fri', enrollments: 1050 },
    { name: 'Sat', enrollments: 1180 },
    { name: 'Sun', enrollments: 1390 },
  ];

  const roleDistributionData = [
    { name: 'Students', value: metrics?.totalStudents || 1842, countText: `${metrics?.totalStudents || 1842} (71.7%)` },
    { name: 'Teachers', value: metrics?.totalTeachers || 456, countText: `${metrics?.totalTeachers || 456} (17.8%)` },
    { name: 'Admins', value: 120, countText: '120 (4.7%)' },
    { name: 'Parents', value: 150, countText: '150 (5.8%)' },
  ];

  const totalUserValue = (metrics?.totalStudents || 1842) + (metrics?.totalTeachers || 456) + 120 + 150;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 text-left"
    >
      {/* Greetings Header */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100">
            Welcome back, Admin! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
            Here's what's happening with your learning platform today.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold shadow-sm text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
          <Calendar className="w-4 h-4 text-slate-400 mr-1.5" />
          May 26 - Jun 1, 2025
        </div>
      </motion.div>
      
      {/* KPI Cards */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card hover className="flex items-center">
          <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-955/20 flex items-center justify-center text-[#2563eb] mr-4 shadow-sm border border-blue-100/50 dark:border-blue-955/20">
            <Users className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Total Users</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{metrics?.totalUsers || 2568}</h3>
            <span className="flex items-center text-[10px] font-bold text-emerald-500 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +12.5% vs last week
            </span>
          </div>
        </Card>
        
        <Card hover className="flex items-center">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-955/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mr-4 shadow-sm border border-emerald-100/50 dark:border-emerald-955/20">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Total Courses</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{metrics?.totalCourses || 184}</h3>
            <span className="flex items-center text-[10px] font-bold text-emerald-500 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +8.3% vs last week
            </span>
          </div>
        </Card>

        <Card hover className="flex items-center">
          <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-955/20 flex items-center justify-center text-purple mr-4 shadow-sm border border-purple-100/50 dark:border-purple-955/20">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Enrollments</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{metrics?.totalEnrollments || 4789}</h3>
            <span className="flex items-center text-[10px] font-bold text-emerald-500 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +15.7% vs last week
            </span>
          </div>
        </Card>

        <Card hover className="flex items-center">
          <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-955/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mr-4 shadow-sm border border-amber-100/50 dark:border-amber-955/20">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Assessments</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">362</h3>
            <span className="flex items-center text-[10px] font-bold text-emerald-500 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +10.1% vs last week
            </span>
          </div>
        </Card>
      </motion.div>

      {/* Graphical Insights Grid */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Enrollments overview line chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">Enrollments Overview</h3>
            </div>
            <select className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none">
              <option>This Week</option>
              <option>Last Week</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={enrollmentTrendData}>
                <defs>
                  <linearGradient id="enrollmentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    fontWeight: 600
                  }} 
                />
                <Area type="monotone" dataKey="enrollments" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#enrollmentGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Courses */}
        <Card className="flex flex-col shadow-sm justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100">Top Courses</h3>
              <Link to="/admin/courses" className="text-xs text-[#2563eb] font-bold hover:underline">View all</Link>
            </div>
            
            <div className="space-y-3.5">
              {[
                { name: 'Data Structures & Algorithms', enrolls: '1,245 Enrollments', percent: 78 },
                { name: 'Web Development Bootcamp', enrolls: '987 Enrollments', percent: 65 },
                { name: 'UI/UX Design Principles', enrolls: '876 Enrollments', percent: 60 },
                { name: 'Python for Beginners', enrolls: '765 Enrollments', percent: 55 },
                { name: 'Database Management Systems', enrolls: '654 Enrollments', percent: 48 }
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8.5 w-8.5 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-[#2563eb]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs font-bold text-slate-900 dark:text-slate-150 mb-1">
                      <p className="truncate mr-2">{c.name}</p>
                      <span>{c.percent}%</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                      <span>{c.enrolls}</span>
                    </div>
                    {/* Blue progress bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-[#2563eb] h-full rounded-full" style={{ width: `${c.percent}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* System Health + User Role Distribution + Quick Actions */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* System Health Card */}
        <Card className="shadow-sm">
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-[#2563eb]" />
            System Health
          </h3>
          <div className="space-y-4">
            {[
              { name: 'Server Status', status: 'Operational', icon: Server },
              { name: 'Database', status: 'Operational', icon: Database },
              { name: 'Storage', status: 'Operational', icon: HardDrive },
              { name: 'Backup', status: 'Operational', icon: Activity },
              { name: 'Email Service', status: 'Operational', icon: Mail }
            ].map((s, i) => (
              <div key={i} className="flex justify-between items-center p-2 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-955/15 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <s.icon className="w-4 h-4 text-[#2563eb]" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{s.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* User Role Distribution Card */}
        <Card className="flex flex-col shadow-sm text-left">
          <div className="mb-4">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100">User Role Distribution</h3>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-36 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={58}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {roleDistributionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <p className="text-xl font-black text-slate-900 dark:text-slate-100">{totalUserValue}</p>
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none mt-1">Total Users</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 text-[11px] font-bold text-slate-650 dark:text-slate-350">
              {roleDistributionData.map((role, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                  <span>{role.name}</span>
                  <span className="text-slate-400">({role.value})</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Quick Actions & Recent Activities split list */}
        <div className="flex flex-col gap-6">
          {/* Quick Actions Grid */}
          <Card className="shadow-sm">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/admin/courses" className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-[#f8fafc]/50 dark:bg-slate-900/50 hover:bg-blue-50/20 dark:hover:bg-blue-955/10 transition-colors group">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-955/20 text-[#2563eb] flex items-center justify-center">
                    <FilePlus className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-850 dark:text-slate-200">Add Course</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              
              <Link to="/admin/users" className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-[#f8fafc]/50 dark:bg-slate-900/50 hover:bg-green-50/20 dark:hover:bg-green-955/10 transition-colors group">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-green-50 dark:bg-green-955/20 text-emerald-600 flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-850 dark:text-slate-200">Add User</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <button onClick={() => toast.success('Announcement Prompt Opened')} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-[#f8fafc]/50 dark:bg-slate-900/50 hover:bg-purple-50/20 dark:hover:bg-purple-955/10 transition-colors group cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-purple-50 dark:bg-purple-955/20 text-[#8b5cf6] flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-850 dark:text-slate-200">Announce</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button onClick={() => toast.success('Report generation started')} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-[#f8fafc]/50 dark:bg-slate-900/50 hover:bg-amber-50/20 dark:hover:bg-amber-955/10 transition-colors group cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-amber-50 dark:bg-amber-955/20 text-amber-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-850 dark:text-slate-200">Get Report</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </Card>

          {/* Recent Activities List */}
          <Card className="shadow-sm flex-1">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#2563eb]" />
              Recent Activities
            </h3>
            <div className="space-y-3.5 text-xs font-medium">
              {[
                { txt: 'New user registered: John Doe', time: '2 minutes ago', color: 'border-l-blue-500' },
                { txt: 'Course published: React for Beginners', time: '15 minutes ago', color: 'border-l-emerald-500' },
                { txt: 'New enrollment in Data Structures', time: '1 hour ago', color: 'border-l-purple-500' },
                { txt: 'Assessment created: Midterm Exam', time: '2 hours ago', color: 'border-l-amber-500' },
                { txt: 'System backup completed successfully', time: '3 hours ago', color: 'border-l-slate-400' }
              ].map((act, idx) => (
                <div key={idx} className={`pl-2.5 border-l-2 ${act.color} flex flex-col gap-0.5`}>
                  <p className="text-slate-800 dark:text-slate-250 font-bold leading-tight">{act.txt}</p>
                  <span className="text-[10px] text-slate-450 font-semibold">{act.time}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;
