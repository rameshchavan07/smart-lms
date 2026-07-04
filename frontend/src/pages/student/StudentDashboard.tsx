import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import {
  BookOpen, TrendingUp, Star, Award,
  CheckCircle2, PlayCircle, FileText, ChevronRight,
  Megaphone, ListTodo
} from 'lucide-react';
import { StatCard, ErrorState, CourseCard } from '../../components';
import { StatCardSkeleton, CourseCardSkeleton } from '../../components/Skeleton';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/* ── API Types ─────────────────────────── */
interface StudentMetrics {
  totalEnrollments: number;
  totalCompleted: number;
  quizAverage: number;
  badgesEarned: number;
  overallProgress: number;
  progressBreakdown?: { excellent: number; good: number; average: number };
}

interface EnrollmentWithProgress {
  course: {
    id: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    teacher?: { user: { firstName: string; lastName: string } };
    _count: { lectures: number };
  };
  progress?: number;
}

interface ActivityItem {
  id: string;
  type: 'quiz' | 'assignment' | 'lecture' | 'enrollment';
  title: string;
  courseTitle?: string;
  timestamp: string;
}

interface TaskItem {
  id: string;
  title: string;
  courseTitle: string;
  dueDate: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  completed: boolean;
}

interface Announcement {
  id: string;
  title: string;
  message?: string;
  createdAt: string;
  isNew?: boolean;
}

/* ── Helpers ────────────────────────────── */
const PRIORITY_CONFIG = {
  HIGH:   { label: 'High',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  MEDIUM: { label: 'Med',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  LOW:    { label: 'Low',    color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
};

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  quiz: CheckCircle2,
  assignment: FileText,
  lecture: PlayCircle,
  enrollment: BookOpen,
};
const ACTIVITY_COLORS: Record<string, string> = {
  quiz: '#10b981', assignment: '#4361f0', lecture: '#f59e0b', enrollment: '#8b5cf6',
};

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDue(iso: string) {
  const d = new Date(iso);
  const diff = d.getTime() - Date.now();
  const days = Math.floor(diff / 86400000);
  if (days < 0) return { label: 'Overdue', color: '#ef4444' };
  if (days === 0) return { label: 'Due today', color: '#ef4444' };
  if (days === 1) return { label: 'Due tomorrow', color: '#f59e0b' };
  return { label: `Due ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, color: 'var(--text-muted)' };
}

/* ── Fallback data (shown when API returns partial data) ── */
const FALLBACK_ACTIVITY: ActivityItem[] = [
  { id: '1', type: 'quiz',       title: 'Completed Quiz',       courseTitle: 'Data Structures', timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: '2', type: 'assignment', title: 'Submitted Assignment',  courseTitle: 'Web Development', timestamp: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', type: 'lecture',    title: 'Watched Lecture',       courseTitle: 'Python Programming', timestamp: new Date(Date.now() - 172800000).toISOString() },
];

// PERFORMANCE_DATA removed, now fetched dynamically

/* ── Component ──────────────────────────── */
const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: metrics, isLoading: metricsLoading, isError: metricsError, refetch: refetchMetrics } = useQuery({
    queryKey: ['student-metrics'],
    queryFn: () => api.get(API_ENDPOINTS.ANALYTICS.STUDENT_BASE).then(r => r.data.metrics as StudentMetrics),
    staleTime: 60_000,
  });

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['student-courses'],
    queryFn: () => api.get(`${API_ENDPOINTS.ENROLLMENTS.MY_COURSES}?limit=4`).then(r => r.data.enrollments as EnrollmentWithProgress[]),
    staleTime: 60_000,
  });

  const { data: activityData, isLoading: loadingActivities } = useQuery({
    queryKey: ['student-activities'],
    queryFn: () => api.get(`${API_ENDPOINTS.ACTIVITY.RECENT}?limit=5`).then(r => r.data.activities as ActivityItem[]),
    staleTime: 30_000,
    retry: false,
  });

  const { data: tasksData, isLoading: loadingTasks } = useQuery({
    queryKey: ['student-tasks'],
    queryFn: () => api.get(`${API_ENDPOINTS.ASSIGNMENTS.MY_TASKS}?limit=5`).then(r => r.data.tasks as TaskItem[]),
    staleTime: 60_000,
    retry: false,
  });

  const { data: announcementsData, isLoading: loadingAnnouncements } = useQuery({
    queryKey: ['student-announcements'],
    queryFn: () => api.get(`${API_ENDPOINTS.COMMUNICATIONS.MY_ANNOUNCEMENTS}?limit=3`).then(r => r.data.announcements as Announcement[]),
    staleTime: 120_000,
    retry: false,
  });

  const { data: performanceData, isLoading: loadingPerformance } = useQuery({
    queryKey: ['student-performance'],
    queryFn: () => api.get(API_ENDPOINTS.PROGRESS.STUDENT_PERFORMANCE).then(r => r.data.data as { name: string, score: number }[]),
    staleTime: 60_000,
    retry: false,
  });

  const enrollmentsList = enrollments ?? [];
  const activity = activityData ?? FALLBACK_ACTIVITY;
  const tasks = tasksData ?? [];
  const announcements = announcementsData ?? [];

  const progressPct = metrics?.overallProgress ?? 0;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (progressPct / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Welcome back, {user?.firstName || 'there'} 👋
          </h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Here's your learning summary for today
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/student/courses" className="btn btn-primary btn-sm gap-2">
            <BookOpen size={14} /> Browse Courses
          </Link>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      {metricsError ? (
        <ErrorState message="Could not load analytics" onRetry={refetchMetrics} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metricsLoading ? (
            [...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            <>
              <StatCard title="Enrolled Courses" value={metrics?.totalEnrollments ?? 0}
                icon={BookOpen} color="#4361f0" bg="rgba(67,97,240,0.1)"
                subtitle="Active enrollments" linkTo="/student/courses" linkLabel="View all" />
              <StatCard title="Completed" value={metrics?.totalCompleted ?? 0}
                icon={TrendingUp} color="#10b981" bg="rgba(16,185,129,0.1)"
                subtitle="Courses finished" />
              <StatCard title="Quiz Average" value={`${metrics?.quizAverage ?? 0}%`}
                icon={Star} color="#8b5cf6" bg="rgba(139,92,246,0.1)"
                trend={metrics?.quizAverage ? { value: 3, positive: true, label: 'vs last month' } : undefined} />
              <StatCard title="Badges Earned" value={metrics?.badgesEarned ?? 0}
                icon={Award} color="#f59e0b" bg="rgba(245,158,11,0.1)"
                subtitle="Achievement badges" />
            </>
          )}
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Continue Learning */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>Continue Learning</h2>
              <Link to="/student/courses" className="text-[12px] font-semibold flex items-center gap-1" style={{ color: 'var(--brand-500)' }}>
                View all <ChevronRight size={14} />
              </Link>
            </div>
            {enrollmentsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => <CourseCardSkeleton key={i} />)}
              </div>
            ) : enrollmentsList.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(67,97,240,0.1)' }}>
                  <BookOpen size={22} color="#4361f0" />
                </div>
                <p className="font-semibold text-[14px] mb-1" style={{ color: 'var(--text-primary)' }}>No courses yet</p>
                <p className="text-[13px] mb-4" style={{ color: 'var(--text-muted)' }}>Your enrolled courses will appear here</p>
                <Link to="/student/courses" className="btn btn-primary btn-sm">Browse Courses</Link>
              </div>
            ) : enrollmentsList.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(67,97,240,0.1)' }}>
                  <BookOpen size={22} color="#4361f0" />
                </div>
                <h3 className="text-[15px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No courses yet</h3>
                <p className="text-[13px] mb-4" style={{ color: 'var(--text-muted)' }}>Your enrolled courses will appear here</p>
                <Link to="/student/courses" className="btn btn-primary btn-sm">Browse Courses</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {enrollmentsList.slice(0, 4).map((e: any, idx: number) => (
                  <CourseCard
                    key={e.course.id}
                    course={e.course}
                    role="student"
                    progress={e.progress}
                    colorIndex={idx}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Progress + Activity row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Progress Ring */}
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>Overall Progress</h2>
                <Link to="#" className="text-[12px] font-semibold" style={{ color: 'var(--brand-500)' }}>Report</Link>
              </div>
              <div className="flex items-center justify-center relative w-44 h-44 mx-auto">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="12" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke="#4361f0" strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={metricsLoading ? circumference : offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[30px] font-black" style={{ color: 'var(--text-primary)' }}>
                    {metricsLoading ? '…' : `${progressPct}%`}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Overall</span>
                </div>
              </div>
              {metrics?.progressBreakdown && (
                <div className="mt-5 space-y-2">
                  {[
                    { label: 'Excellent (90-100%)', count: metrics.progressBreakdown.excellent, color: '#10b981' },
                    { label: 'Good (75-89%)',       count: metrics.progressBreakdown.good,      color: '#4361f0' },
                    { label: 'Average (<75%)',      count: metrics.progressBreakdown.average,   color: '#f59e0b' },
                  ].map(r => (
                    <div key={r.label} className="flex items-center justify-between text-[12px]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                        <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                      </div>
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{r.count} Courses</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Performance Chart */}
            <div className="card md:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>Performance Analytics</h2>
              </div>
              <div className="h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4361f0" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4361f0" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                      itemStyle={{ color: 'var(--brand-500)' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#4361f0" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>Recent Activity</h2>
                <Link to="#" className="text-[12px] font-semibold" style={{ color: 'var(--brand-500)' }}>View all</Link>
              </div>
              <div className="space-y-4">
                {activity.length === 0 ? (
                  <p className="text-[13px] text-center py-6" style={{ color: 'var(--text-muted)' }}>No recent activity</p>
                ) : activity.map(item => {
                  const Icon = ACTIVITY_ICONS[item.type] ?? CheckCircle2;
                  const color = ACTIVITY_COLORS[item.type] ?? '#4361f0';
                  return (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `${color}15` }}>
                        <Icon size={14} color={color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                          {item.title}
                        </p>
                        {item.courseTitle && (
                          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.courseTitle}</p>
                        )}
                      </div>
                      <span className="text-[11px] flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {formatRelative(item.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right col (1/3) */}
        <div className="space-y-6">
          {/* My Tasks */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <ListTodo size={16} color="#4361f0" /> My Tasks
              </h2>
              <Link to="#" className="text-[12px] font-semibold" style={{ color: 'var(--brand-500)' }}>View all</Link>
            </div>
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 size={32} color="#10b981" className="mx-auto mb-2 opacity-50" />
                <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>All caught up! No pending tasks.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map(task => {
                  const due = formatDue(task.dueDate);
                  const prio = PRIORITY_CONFIG[task.priority];
                  return (
                    <div key={task.id} className="flex items-start gap-3 p-2.5 rounded-xl border hover:bg-bg-subtle transition-colors"
                      style={{ borderColor: 'var(--border)' }}>
                      <div className="w-4 h-4 rounded border-2 mt-0.5 flex-shrink-0 cursor-pointer"
                        style={{ borderColor: task.completed ? '#10b981' : 'var(--border)', background: task.completed ? '#10b981' : 'transparent' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
                        <p className="text-[11px] mt-1 font-medium" style={{ color: due.color }}>{due.label}</p>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ color: prio.color, background: prio.bg }}>{prio.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Announcements */}
          <div className="card">
            <div className="flex items-center gap-2 mb-5">
              <Megaphone size={16} color="#f59e0b" />
              <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>Announcements</h2>
            </div>
            {announcements.length === 0 ? (
              <p className="text-[13px] text-center py-6" style={{ color: 'var(--text-muted)' }}>No announcements yet</p>
            ) : (
              <div className="space-y-4">
                {announcements.map(a => (
                  <div key={a.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(67,97,240,0.1)' }}>
                      <Megaphone size={14} color="#4361f0" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                        {a.isNew && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Motivational Card */}
          <div className="rounded-2xl p-5 text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #4361f0, #8b5cf6)' }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
              style={{ background: 'rgba(255,255,255,0.1)', filter: 'blur(30px)', transform: 'translate(30%, -30%)' }} />
            <div className="relative">
              <div className="text-3xl mb-2">🏆</div>
              <h3 className="text-[15px] font-bold text-white">Keep it up!</h3>
              <p className="text-[12px] text-white/70 mt-1">
                {metrics?.totalCompleted ? `${metrics.totalCompleted} courses completed!` : "You're on a great track."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
