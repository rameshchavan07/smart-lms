import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  BookOpen, Users, ClipboardList, TrendingUp,
  Video, Calendar, GraduationCap
} from 'lucide-react';
import { StatCard, ErrorState } from '../../components';
import { StatCardSkeleton } from '../../components/Skeleton';

/* ── Types ──────────────────────────────── */
interface TeacherMetrics {
  totalCourses: number;
  totalStudents: number;
  pendingAssignments?: number;
  avgClassProgress?: number;
  progressDelta?: number;
}

interface WeeklyData {
  day: string;
  progress: number;
  submissions?: number;
}

interface UpcomingClass {
  id: string;
  title: string;
  courseTitle: string;
  startTime: string;
  duration: number; // minutes
}

interface RecentAssignment {
  id: string;
  title: string;
  courseTitle: string;
  dueDate: string;
  submitted: number;
  total: number;
}

interface CourseProgress {
  id: string;
  title: string;
  progress: number;
  studentCount: number;
  color: string;
}

/* ── Fallback data (while new endpoints are added) ── */
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const fallbackWeeklyData: WeeklyData[] = WEEK_DAYS.map(day => ({
  day, progress: 0, submissions: 0
}));

const PROGRESS_COLORS = ['#4361f0', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];

/* ── Component ──────────────────────────── */
const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: metrics, isLoading: metricsLoading, isError: metricsError, refetch } = useQuery({
    queryKey: ['teacher-analytics'],
    queryFn: () => api.get('/analytics/teacher').then(r => r.data.metrics as TeacherMetrics),
    staleTime: 60_000,
  });

  const { data: weeklyData } = useQuery({
    queryKey: ['teacher-weekly-progress'],
    queryFn: () => api.get('/analytics/teacher/weekly').then(r => r.data.data as WeeklyData[]),
    staleTime: 60_000,
    retry: false,
  });

  const { data: upcomingClasses } = useQuery({
    queryKey: ['teacher-upcoming-classes'],
    queryFn: () => api.get('/live-classes/upcoming?limit=3').then(r => r.data.classes as UpcomingClass[]),
    staleTime: 60_000,
    retry: false,
  });

  const { data: recentAssignments } = useQuery({
    queryKey: ['teacher-recent-assignments'],
    queryFn: () => api.get('/assignments/teacher/recent?limit=3').then(r => r.data.assignments as RecentAssignment[]),
    staleTime: 60_000,
    retry: false,
  });

  const { data: courseProgressData } = useQuery({
    queryKey: ['teacher-course-progress'],
    queryFn: () => api.get('/courses/my-courses?limit=4').then(r =>
      (r.data.courses as { id: string; title: string; avgProgress?: number; _count: { enrollments: number } }[])
        .map((c, i) => ({
          id: c.id,
          title: c.title,
          progress: c.avgProgress ?? 0,
          studentCount: c._count.enrollments,
          color: PROGRESS_COLORS[i % PROGRESS_COLORS.length],
        } as CourseProgress))
    ),
    staleTime: 60_000,
    retry: false,
  });

  const chartData = weeklyData ?? fallbackWeeklyData;
  const classes = upcomingClasses ?? [];
  const assignments = recentAssignments ?? [];
  const courseProgress = courseProgressData ?? [];

  const dateLabel = (() => {
    const now = new Date();
    const mon = new Date(now);
    mon.setDate(now.getDate() - now.getDay() + 1);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return `${mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sun.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  })();

  if (metricsError) {
    return <ErrorState message="Failed to load teacher dashboard" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Welcome back, {user?.firstName || 'Teacher'} 👋
          </h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Here's what's happening in your courses today
          </p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{dateLabel}</span>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsLoading ? (
          [...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="My Courses" value={metrics?.totalCourses ?? 0}
              icon={BookOpen} color="#4361f0" bg="rgba(67,97,240,0.1)"
              subtitle="Active courses" linkTo="/teacher/courses" linkLabel="View courses"
            />
            <StatCard
              title="Total Students" value={metrics?.totalStudents ?? 0}
              icon={Users} color="#10b981" bg="rgba(16,185,129,0.1)"
              subtitle="Across all courses" linkTo="/teacher/students" linkLabel="View students"
            />
            <StatCard
              title="Pending Assignments" value={metrics?.pendingAssignments ?? 0}
              icon={ClipboardList} color="#8b5cf6" bg="rgba(139,92,246,0.1)"
              subtitle="Need grading"
            />
            <StatCard
              title="Class Progress" value={`${metrics?.avgClassProgress ?? 0}%`}
              icon={TrendingUp} color="#f59e0b" bg="rgba(245,158,11,0.1)"
              trend={metrics?.progressDelta !== undefined
                ? { value: metrics.progressDelta, positive: metrics.progressDelta >= 0, label: 'this week' }
                : undefined}
            />
          </>
        )}
      </div>

      {/* ── Chart + Upcoming Classes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Area Chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>Weekly Class Overview</h2>
            <span className="text-[12px] px-3 py-1 rounded-lg font-medium" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              This Week
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="teacherGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4361f0" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4361f0" stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--text-disabled)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-disabled)" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12, border: '1px solid var(--border)',
                    background: 'var(--surface)', color: 'var(--text-primary)',
                    fontSize: 12, fontWeight: 600, boxShadow: 'var(--shadow-md)'
                  }}
                  itemStyle={{ color: 'var(--text-secondary)' }}
                />
                <Area type="monotone" dataKey="progress" name="Avg Progress (%)"
                  stroke="#4361f0" strokeWidth={2.5} fillOpacity={1} fill="url(#teacherGrad)" />
                {chartData.some(d => d.submissions) && (
                  <Area type="monotone" dataKey="submissions" name="Submissions"
                    stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#subGrad)" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Classes */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>Upcoming Classes</h2>
            <Link to="#" className="text-[12px] font-semibold" style={{ color: 'var(--brand-500)' }}>Calendar</Link>
          </div>
          {classes.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={28} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>No upcoming classes scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {classes.map((cls) => {
                const start = new Date(cls.startTime);
                const isToday = start.toDateString() === new Date().toDateString();
                const timeLabel = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                const dayLabel = isToday ? 'Today' : start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                return (
                  <div key={cls.id} className="flex items-start gap-3 p-3 rounded-xl border transition-colors hover:bg-bg-subtle"
                    style={{ borderColor: isToday ? '#4361f030' : 'var(--border)', background: isToday ? 'rgba(67,97,240,0.04)' : 'transparent' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: isToday ? 'rgba(67,97,240,0.1)' : 'var(--bg-subtle)' }}>
                      <Video size={16} color={isToday ? '#4361f0' : 'var(--text-muted)'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{cls.courseTitle}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {dayLabel}, {timeLabel} · {cls.duration}min
                      </p>
                    </div>
                    {isToday && (
                      <Link to={`/live/${cls.id}`} className="btn btn-primary btn-sm text-[11px] px-2 py-1">Join</Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <Link to="#" className="text-[12px] font-semibold w-full flex items-center justify-center gap-1" style={{ color: 'var(--brand-500)' }}>
              <GraduationCap size={13} /> Schedule a class
            </Link>
          </div>
        </div>
      </div>

      {/* ── Course Progress + Assignments ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Progress bars */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>Course Progress</h2>
            <Link to="/teacher/courses" className="text-[12px] font-semibold" style={{ color: 'var(--brand-500)' }}>View all</Link>
          </div>
          {courseProgress.length === 0 ? (
            <p className="text-[13px] text-center py-8" style={{ color: 'var(--text-muted)' }}>No course data available</p>
          ) : (
            <div className="space-y-5">
              {courseProgress.map(c => (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-semibold truncate mr-2" style={{ color: 'var(--text-primary)' }}>{c.title}</span>
                    <span className="text-[13px] font-black flex-shrink-0" style={{ color: c.color }}>{c.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${c.progress}%`, background: c.color }} />
                  </div>
                  <p className="text-[11px] mt-1 text-right" style={{ color: 'var(--text-muted)' }}>
                    {c.studentCount} students
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Assignments Table */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>Recent Assignments</h2>
            <Link to="#" className="text-[12px] font-semibold" style={{ color: 'var(--brand-500)' }}>View all</Link>
          </div>
          {assignments.length === 0 ? (
            <div className="text-center py-10">
              <ClipboardList size={28} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>No assignments yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th className="pb-3 px-5 font-semibold">Assignment</th>
                    <th className="pb-3 px-5 font-semibold hidden sm:table-cell">Course</th>
                    <th className="pb-3 px-5 font-semibold text-right">Submitted</th>
                    <th className="pb-3 px-5 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(a => {
                    const pct = a.total > 0 ? Math.round((a.submitted / a.total) * 100) : 0;
                    const due = new Date(a.dueDate);
                    const isOverdue = due < new Date();
                    return (
                      <tr key={a.id} className="group border-b" style={{ borderColor: 'var(--border)' }}>
                        <td className="py-3.5 px-5">
                          <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                          <p className="text-[11px] mt-0.5 font-medium" style={{ color: isOverdue ? '#ef4444' : 'var(--text-muted)' }}>
                            {isOverdue ? 'Overdue' : `Due ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                          </p>
                        </td>
                        <td className="py-3.5 px-5 hidden sm:table-cell">
                          <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{a.courseTitle}</span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <span className="text-[13px] font-black" style={{ color: 'var(--text-primary)' }}>{a.submitted}</span>
                          <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>/{a.total}</span>
                          <div className="w-16 h-1 rounded-full ml-auto mt-1" style={{ background: 'var(--border)' }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#4361f0' }} />
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button className="text-[12px] font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--brand-500)' }}>
                            Grade →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
