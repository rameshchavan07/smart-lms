import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { 
  BookOpen, 
  Users, 
  ClipboardList, 
  TrendingUp, 
  Calendar, 
  ChevronRight, 
  Video
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Card, Badge } from '../../components';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444'];

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<{totalCourses: number, totalStudents: number} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/analytics/teacher');
        setMetrics(data.metrics);
      } catch (error) {
        console.error('Failed to fetch teacher analytics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-14 w-80 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

  const classOverviewData = [
    { name: 'Mon', progress: 38 },
    { name: 'Tue', progress: 48 },
    { name: 'Wed', progress: 40 },
    { name: 'Thu', progress: 75 },
    { name: 'Fri', progress: 62 },
    { name: 'Sat', progress: 70 },
    { name: 'Sun', progress: 82 },
  ];

  const studentProgressData = [
    { name: 'Excellent (90-100%)', value: 56 },
    { name: 'Good (75-89%)', value: 94 },
    { name: 'Average (60-74%)', value: 68 },
    { name: 'Needs Improvement (<60%)', value: 38 },
  ];

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
            Welcome back, {user?.firstName || 'John'}! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Here's what's happening with your courses today.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold shadow-sm text-slate-700 dark:text-slate-200 cursor-pointer">
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
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">My Courses</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{metrics?.totalCourses || 8}</h3>
            <span className="text-[10px] text-slate-450 font-semibold hover:underline cursor-pointer">View all courses</span>
          </div>
        </Card>
        
        <Card hover className="flex items-center">
          <div className="h-12 w-12 rounded-xl bg-green-50 dark:bg-green-955/20 flex items-center justify-center text-[#22c55e] mr-4 shadow-sm border border-green-100/50 dark:border-green-955/20">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Students</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{metrics?.totalStudents || 256}</h3>
            <span className="text-[10px] text-slate-450 font-semibold hover:underline cursor-pointer">View students</span>
          </div>
        </Card>

        <Card hover className="flex items-center">
          <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-955/20 flex items-center justify-center text-[#8b5cf6] mr-4 shadow-sm border border-purple-100/50 dark:border-purple-955/20">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pending Assignments</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">24</h3>
            <span className="text-[10px] text-slate-450 font-semibold hover:underline cursor-pointer">View assignments</span>
          </div>
        </Card>

        <Card hover className="flex items-center">
          <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-955/20 flex items-center justify-center text-amber-600 mr-4 shadow-sm border border-amber-100/50 dark:border-amber-955/20">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Average Class Progress</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">72%</h3>
            <span className="flex items-center text-[10px] font-bold text-emerald-500 mt-0.5">
              +8% this week
            </span>
          </div>
        </Card>
      </motion.div>

      {/* Class Overview & My Courses & Upcoming Classes Grid */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Class Overview Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">Class Overview</h3>
            </div>
            <select className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none">
              <option>This Week</option>
              <option>Last Week</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={classOverviewData}>
                <defs>
                  <linearGradient id="classOverviewGrad" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="progress" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#classOverviewGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* My Courses split */}
        <Card className="shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100">My Courses</h3>
              <Link to="/teacher/courses" className="text-xs text-[#2563eb] font-bold hover:underline">View all</Link>
            </div>
            
            <div className="space-y-4">
              {[
                { name: 'Data Structures & Algorithms', students: '120 Students', percent: 75 },
                { name: 'Web Development', students: '98 Students', percent: 68 },
                { name: 'Database Management Systems', students: '85 Students', percent: 82 },
                { name: 'Python Programming', students: '110 Students', percent: 65 }
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8.5 w-8.5 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-[#2563eb]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
                      <p className="truncate mr-2">{c.name}</p>
                      <span>{c.percent}%</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                      <span>{c.students}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-[#2563eb] h-full rounded-full" style={{ width: `${c.percent}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-4">
              <Link to="/teacher/courses" className="text-xs text-slate-450 hover:text-slate-700 font-bold">+ 4 more courses</Link>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Upcoming Classes & Recent Assignments & Student Progress & Activity Feed */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Upcoming Classes */}
        <Card className="shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#2563eb]" />
              Upcoming Classes
            </h3>
            <div className="space-y-3.5">
              {[
                { title: 'Data Structures', time: 'Today, 10:00 AM - 11:00 AM' },
                { title: 'Web Development', time: 'Today, 01:00 PM - 02:00 PM' },
                { title: 'Python Programming', time: 'Tomorrow, 09:00 AM - 10:30 AM' },
                { title: 'DBMS Lab', time: 'Tomorrow, 02:00 PM - 03:30 PM' }
              ].map((c, i) => (
                <div key={i} className="flex justify-between items-center p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-[#f8fafc]/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                  <div className="space-y-0.5 text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{c.title}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{c.time}</p>
                  </div>
                  <button onClick={() => toast.success(`Starting live classroom for ${c.title}`)} className="h-7 w-7 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-955/20 text-[#2563eb] flex items-center justify-center cursor-pointer transition-colors shadow-sm">
                    <Video className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => toast.success('Redirecting to Calendar')} className="w-full mt-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-100 dark:border-slate-800 text-xs font-bold text-[#2563eb] rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
            Go to Calendar
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </Card>

        {/* Recent Assignments Table */}
        <Card className="shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100">Recent Assignments</h3>
            <span className="text-[10px] text-[#2563eb] font-bold hover:underline cursor-pointer">View all</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs font-semibold text-slate-650 dark:text-slate-350 text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                  <th className="py-2 pr-2">Assignment</th>
                  <th className="py-2 px-2 text-center">Submissions</th>
                  <th className="py-2 pl-2 text-right">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[
                  { name: 'Binary Trees Implementation', submitted: '12/120', date: 'May 30, 2025' },
                  { name: 'Responsive Portfolio Website', submitted: '45/98', date: 'Jun 02, 2025' },
                  { name: 'SQL Query Practice', submitted: '28/85', date: 'Jun 01, 2025' }
                ].map((a, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-2.5 pr-2 font-bold text-slate-800 dark:text-slate-200">{a.name}</td>
                    <td className="py-2.5 px-2 text-center text-[#2563eb] font-extrabold">{a.submitted}</td>
                    <td className="py-2.5 pl-2 text-right text-slate-400">{a.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Students Progress Overview Pie chart */}
        <Card className="flex flex-col shadow-sm text-left">
          <div className="mb-4">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100">Students Progress Overview</h3>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-36 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={studentProgressData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={58}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {studentProgressData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <p className="text-xl font-black text-slate-900 dark:text-slate-100">256</p>
                <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none mt-1">Total Students</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-[10px] font-bold text-slate-650 dark:text-slate-350">
              {studentProgressData.map((role, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                  <span className="truncate max-w-[100px]">{role.name.split(' ')[0]}</span>
                  <span className="text-slate-400">({role.value})</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Activity Feed */}
      <motion.div 
        variants={itemVariants}
        className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-sm transition-colors"
      >
        <div className="p-5 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-[#0f172a]/50 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 dark:text-slate-100">Recent Class Activities</h3>
          <Badge variant="neutral">Live Logs</Badge>
        </div>
        <div className="p-6">
          <div className="space-y-4 text-xs font-semibold">
            {[
              { txt: 'New assignment created in Data Structures', time: '2 hours ago', color: 'border-l-blue-500' },
              { txt: 'Live class conducted: Web Development', time: '4 hours ago', color: 'border-l-emerald-500' },
              { txt: 'Quiz "Python Basics" published', time: '1 day ago', color: 'border-l-purple-500' },
              { txt: 'Grades updated in DBMS', time: '1 day ago', color: 'border-l-amber-500' },
              { txt: 'New resource uploaded in Data Structures', time: '2 days ago', color: 'border-l-slate-400' }
            ].map((a, i) => (
              <div key={i} className={`pl-2.5 border-l-2 ${a.color} flex flex-col gap-0.5`}>
                <p className="text-slate-800 dark:text-slate-200 font-bold leading-tight">{a.txt}</p>
                <span className="text-[10px] text-slate-450 font-semibold">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TeacherDashboard;
