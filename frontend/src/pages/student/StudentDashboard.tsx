import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { 
  BookOpen, 
  Award, 
  CheckCircle, 
  Trophy, 
  Calendar, 
  ChevronRight, 
  Play, 
  ChevronLeft, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Card } from '../../components';
import { motion } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444'];

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<{totalEnrollments: number} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/analytics/student');
        setMetrics(data.metrics);
      } catch (error) {
        console.error('Failed to fetch student analytics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-16 w-80 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-2xl" />
          ))}
        </div>
        <div className="h-60 skeleton rounded-2xl" />
      </div>
    );
  }

  const progressData = [
    { name: 'Excellent', value: 4 },
    { name: 'Good', value: 1 },
    { name: 'Average', value: 1 },
    { name: 'Needs Improvement', value: 0 },
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
      {/* Welcome Banner */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100">
            Welcome back, {user?.firstName || 'Alex'}! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Let's continue your learning journey.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs font-bold shadow-sm text-slate-700 dark:text-slate-200 cursor-pointer">
          <Calendar className="w-4 h-4 text-slate-400 mr-1.5" />
          This Week
        </div>
      </motion.div>

      {/* Progress Cards */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card hover className="flex items-center">
          <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-955/20 flex items-center justify-center text-[#2563eb] mr-4 shadow-sm border border-blue-100/50 dark:border-blue-955/20">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Enrolled Courses</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">{metrics?.totalEnrollments || 6}</h3>
            <span className="text-[10px] text-slate-450 font-semibold">Active courses</span>
          </div>
        </Card>
        
        <Card hover className="flex items-center">
          <div className="h-12 w-12 rounded-xl bg-green-50 dark:bg-green-955/20 flex items-center justify-center text-[#22c55e] mr-4 shadow-sm border border-green-100/50 dark:border-green-955/20">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Completed Assignments</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">12</h3>
            <span className="text-[10px] text-slate-450 font-semibold">This week</span>
          </div>
        </Card>

        <Card hover className="flex items-center">
          <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-955/20 flex items-center justify-center text-[#8b5cf6] mr-4 shadow-sm border border-purple-100/50 dark:border-purple-955/20">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Quiz Average</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">87%</h3>
            <span className="text-[10px] text-slate-450 font-semibold">Across all quizzes</span>
          </div>
        </Card>

        <Card hover className="flex items-center">
          <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-955/20 flex items-center justify-center text-amber-600 mr-4 shadow-sm border border-amber-100/50 dark:border-amber-955/20">
            <Trophy className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Badges earned</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5">5</h3>
            <span className="text-[10px] text-slate-450 font-semibold">Keep it up!</span>
          </div>
        </Card>
      </motion.div>

      {/* Middle Grid - Continue Learning + Calendar */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Continue Learning Course Cards */}
        <Card className="lg:col-span-2 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">Continue Learning</h3>
              <Link to="/student/courses" className="text-xs text-[#2563eb] font-bold hover:underline">View all courses</Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { 
                  title: 'Data Structures & Algorithms', 
                  prof: 'Professor John Doe', 
                  progress: 75,
                  bg: 'from-violet-900 to-indigo-950',
                  icon: (
                    <svg className="w-8 h-8 text-white opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                  )
                },
                { 
                  title: 'Web Development', 
                  prof: 'Professor Jane Smith', 
                  progress: 60,
                  bg: 'from-blue-900 to-sky-950',
                  icon: (
                    <svg className="w-8 h-8 text-white opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <line x1="2" y1="20" x2="22" y2="20" />
                      <circle cx="5" cy="6" r="1" />
                    </svg>
                  )
                },
                { 
                  title: 'Database Management Systems', 
                  prof: 'Professor Robert Brown', 
                  progress: 45,
                  bg: 'from-emerald-900 to-teal-950',
                  icon: (
                    <svg className="w-8 h-8 text-white opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <ellipse cx="12" cy="5" rx="9" ry="3" />
                      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
                    </svg>
                  )
                },
                { 
                  title: 'Python Programming', 
                  prof: 'Professor Emily Davis', 
                  progress: 80,
                  bg: 'from-amber-900 to-orange-950',
                  icon: (
                    <svg className="w-8 h-8 text-white opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  )
                }
              ].map((c, i) => (
                <div key={i} className="flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                  {/* Pattern Header */}
                  <div className={`h-24 bg-gradient-to-br ${c.bg} flex items-center justify-center relative p-3 text-center`}>
                    <div className="absolute top-2 right-2">
                      <Sparkles className="w-3.5 h-3.5 text-white/50" />
                    </div>
                    {c.icon}
                  </div>
                  
                  {/* Card Details */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 min-h-[2rem] leading-snug">{c.title}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold truncate">{c.prof}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                        <span>Progress</span>
                        <span>{c.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-[#2563eb] h-full rounded-full" style={{ width: `${c.progress}%` }} />
                      </div>
                      
                      <button onClick={() => toast.success(`Resuming ${c.title}`)} className="w-full py-1.5 bg-slate-50 hover:bg-blue-50 dark:bg-slate-850 dark:hover:bg-slate-800 text-[10px] font-bold text-[#2563eb] rounded-lg transition-colors border border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1 cursor-pointer">
                        Continue
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Monthly Calendar View */}
        <Card className="shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#2563eb]" />
              Calendar
            </h3>
            <span className="text-[10px] text-[#2563eb] font-bold hover:underline cursor-pointer">View full calendar</span>
          </div>

          <div className="text-center bg-[#f8fafc]/50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
            {/* Calendar header */}
            <div className="flex justify-between items-center mb-3 text-xs font-bold text-slate-800 dark:text-slate-200">
              <ChevronLeft className="w-4 h-4 text-slate-450 hover:text-slate-800 cursor-pointer" />
              <span>May 2025</span>
              <ChevronRight className="w-4 h-4 text-slate-450 hover:text-slate-800 cursor-pointer" />
            </div>
            
            {/* Week days */}
            <div className="grid grid-cols-7 gap-1 text-[9px] font-bold text-slate-400 mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 text-[10px] font-semibold text-slate-700 dark:text-slate-350">
              {/* Padding days for May 2025 start (starts on Thursday, so 3 empty days) */}
              {[28, 29, 30].map(d => (
                <div key={`p-${d}`} className="py-1 text-slate-300 dark:text-slate-800">{d}</div>
              ))}
              
              {/* Days list */}
              {[...Array(31)].map((_, i) => {
                const day = i + 1;
                const isSelected = day === 27; // May 27, 2025 active day
                const hasEvent = [8, 16, 22].includes(day);
                return (
                  <div 
                    key={day} 
                    className={`py-1.5 rounded-lg flex flex-col items-center justify-center relative cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                      isSelected ? 'bg-[#2563eb] text-white font-extrabold shadow-sm' : ''
                    }`}
                  >
                    <span>{day}</span>
                    {hasEvent && !isSelected && (
                      <span className="absolute bottom-0.5 h-1 w-1 bg-emerald-500 rounded-full" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Bottom Row - Progress Donut + Recent Activity + Tasks + Announcements */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Progress Donut Chart */}
        <Card className="flex flex-col shadow-sm text-left">
          <div className="mb-4">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100">My Progress</h3>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-36 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={progressData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={58}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {progressData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <p className="text-xl font-black text-slate-900 dark:text-slate-100">87%</p>
                <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none mt-1">Overall Progress</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-[10px] font-bold text-slate-650 dark:text-slate-350">
              {progressData.map((role, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                  <span>{role.name}</span>
                  <span className="text-slate-400">({role.value} Course{role.value !== 1 ? 's' : ''})</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Tasks and Announcements */}
        <div className="flex flex-col gap-6">
          {/* My Tasks with Priorities */}
          <Card className="shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100">My Tasks</h3>
              <span className="text-[10px] text-[#2563eb] font-bold hover:underline cursor-pointer">View all</span>
            </div>
            <div className="space-y-2.5 text-xs font-semibold">
              {[
                { title: 'Web Development Assignment', due: 'Due tomorrow, 11:59 PM', priority: 'High', color: 'bg-red-500/10 text-red-600 border-red-500/15' },
                { title: 'DBMS Quiz', due: 'Due May 29, 2025', priority: 'Medium', color: 'bg-amber-500/10 text-amber-600 border-amber-500/15' },
                { title: 'Python Lab Submission', due: 'Due May 31, 2025', priority: 'Low', color: 'bg-green-500/10 text-green-600 border-green-500/15' }
              ].map((t, i) => (
                <div key={i} className="flex justify-between items-start p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-[#f8fafc]/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                  <div className="space-y-0.5 text-left">
                    <p className="text-slate-800 dark:text-slate-200 font-bold leading-tight">{t.title}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{t.due}</p>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-md border font-extrabold uppercase tracking-wide ${t.color}`}>
                    {t.priority}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Announcements Card */}
          <Card className="shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100">Announcements</h3>
              <span className="text-[10px] text-[#2563eb] font-bold hover:underline cursor-pointer">View all</span>
            </div>
            <div className="space-y-3.5 text-xs font-semibold">
              {[
                { title: 'Midterm Exams Schedule Released', detail: 'May 26, 2025', hasBadge: true },
                { title: 'Web Development Workshop', detail: 'Join us on May 30, 2025 at 4:00 PM', hasBadge: false },
                { title: 'System Maintenance', detail: 'May 28, 2025 (10:00 PM - 2:00 AM)', hasBadge: false }
              ].map((a, i) => (
                <div key={i} className="space-y-1 text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="text-slate-800 dark:text-slate-200 font-bold leading-tight">{a.title}</p>
                    {a.hasBadge && (
                      <span className="text-[8px] bg-[#2563eb] text-white px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider">New</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold">{a.detail}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Activity Card */}
        <Card className="shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100">Recent Activity</h3>
            <span className="text-[10px] text-[#2563eb] font-bold hover:underline cursor-pointer">View all</span>
          </div>
          <div className="space-y-4">
            {[
              { title: 'Completed Quiz: Data Structures - Quiz 2', desc: '2 hours ago', icon: <CheckCircle className="w-4 h-4 text-[#22c55e]" /> },
              { title: 'Submitted Assignment: Web Development', desc: 'Yesterday', icon: <Award className="w-4 h-4 text-[#2563eb]" /> },
              { title: 'Watched: Python Functions Lecture', desc: '2 days ago', icon: <Play className="w-4 h-4 text-[#ef4444] fill-current" /> },
              { title: 'Participated in Discussion: DBMS Indexing', desc: '3 days ago', icon: <MessageSquare className="w-4 h-4 text-[#8b5cf6]" /> },
              { title: 'Earned Badge: Quiz Master', desc: '3 days ago', icon: <Trophy className="w-4 h-4 text-amber-500" /> }
            ].map((a, i) => (
              <div key={i} className="flex gap-3 text-left">
                <div className="h-8 w-8 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-100 dark:border-slate-800">
                  {a.icon}
                </div>
                <div className="space-y-0.5 flex-1 min-w-0 pt-0.5">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight">{a.title}</p>
                  <p className="text-[10px] text-slate-450 font-semibold">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default StudentDashboard;
