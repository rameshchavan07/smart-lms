import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import {
  Users, BookOpen, GraduationCap, ClipboardList,
  Plus, UserPlus, Megaphone, FileText,
  Activity, Server, Database, HardDrive, Mail, HistoryIcon
} from 'lucide-react';
import { StatCard, ErrorState } from '../../components';
import { StatCardSkeleton } from '../../components/Skeleton';


/* ── Types ── */
interface SystemService { name: string; status: 'operational' | 'degraded' | 'down'; icon: React.ElementType }

const PIE_COLORS = ['#4361f0', '#10b981', '#8b5cf6', '#f59e0b'];

const SYSTEM_SERVICES: SystemService[] = [
  { name: 'API Server',     status: 'operational', icon: Server },
  { name: 'Database',       status: 'operational', icon: Database },
  { name: 'Storage',        status: 'operational', icon: HardDrive },
  { name: 'Email Service',  status: 'operational', icon: Mail },
  { name: 'Backups',        status: 'operational', icon: HistoryIcon },
];

const STATUS_CONFIG = {
  operational: { label: 'Operational', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  degraded:    { label: 'Degraded',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  down:        { label: 'Down',        color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

/* ── Component ── */
const AdminDashboard: React.FC = () => {
  const { data: metrics, isLoading: metricsLoading, isError: metricsError, refetch } = useQuery({
    queryKey: ['adminMetrics'],
    queryFn: () => api.get(API_ENDPOINTS.ANALYTICS.ADMIN_STATS).then(res => res.data as any),
    refetchInterval: 300000,
  });

  const { data: trendData } = useQuery({
    queryKey: ['adminEnrollmentTrend'],
    queryFn: () => api.get(API_ENDPOINTS.ANALYTICS.ADMIN_ENROLLMENT_TREND).then(res => res.data as any[]),
    refetchInterval: 300000,
  });

  const { data: topCourses } = useQuery({
    queryKey: ['adminRecentCourses'],
    queryFn: () => api.get(`${API_ENDPOINTS.COURSES.BASE}?limit=5&sort=desc`).then(res => res.data.courses as any[]),
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['adminRecentActivity'],
    queryFn: () => api.get(API_ENDPOINTS.ACTIVITY.ADMIN_RECENT).then(res => res.data as any[]),
  });

  const roleBreakdown = metrics?.roleBreakdown
    ? [
        { name: 'Students', value: metrics.roleBreakdown.students },
        { name: 'Teachers', value: metrics.roleBreakdown.teachers },
        { name: 'Admins',   value: metrics.roleBreakdown.admins },
        { name: 'Parents',  value: metrics.roleBreakdown.parents },
      ]
    : [
        { name: 'Students', value: metrics?.totalStudents ?? 0 },
        { name: 'Teachers', value: metrics?.totalTeachers ?? 0 },
        { name: 'Admins',   value: 0 },
        { name: 'Parents',  value: 0 },
      ];

  const totalPie = roleBreakdown.reduce((a, b) => a + b.value, 0);
  const courses = topCourses ?? [];
  const maxEnrollments = courses.length > 0 ? Math.max(...courses.map(c => c.enrollments)) : 1;
  const activities = recentActivity ?? [];

  const dateLabel = (() => {
    const now = new Date();
    const mon = new Date(now); mon.setDate(now.getDate() - now.getDay() + 1);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return `${mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sun.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  })();

  if (metricsError) return <ErrorState message="Failed to load admin dashboard" onRetry={refetch} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Admin Dashboard 🛡️
          </h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Platform overview — {dateLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/courses" className="btn btn-primary btn-sm gap-1.5">
            <Plus size={14} /> Add Course
          </Link>
          <Link to="/admin/users" className="btn btn-secondary btn-sm gap-1.5">
            <UserPlus size={14} /> Add User
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsLoading ? (
          [...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Total Users" value={(metrics?.totalUsers ?? 0).toLocaleString()}
              icon={Users} color="#4361f0" bg="rgba(67,97,240,0.1)"
              trend={metrics?.growth?.users !== undefined ? { value: metrics.growth.users, positive: metrics.growth.users >= 0, label: 'vs last week' } : undefined}
              linkTo="/admin/users" linkLabel="Manage users"
            />
            <StatCard title="Total Courses" value={(metrics?.totalCourses ?? 0).toLocaleString()}
              icon={BookOpen} color="#10b981" bg="rgba(16,185,129,0.1)"
              trend={metrics?.growth?.courses !== undefined ? { value: metrics.growth.courses, positive: metrics.growth.courses >= 0 } : undefined}
              linkTo="/admin/courses" linkLabel="Manage courses"
            />
            <StatCard title="Enrollments" value={(metrics?.totalEnrollments ?? 0).toLocaleString()}
              icon={GraduationCap} color="#8b5cf6" bg="rgba(139,92,246,0.1)"
              trend={metrics?.growth?.enrollments !== undefined ? { value: metrics.growth.enrollments, positive: metrics.growth.enrollments >= 0 } : undefined}
              linkTo="/admin/enrollments" linkLabel="View enrollments"
            />
            <StatCard title="Assessments" value={(metrics?.totalAssessments ?? 0).toLocaleString()}
              icon={ClipboardList} color="#f59e0b" bg="rgba(245,158,11,0.1)"
              trend={metrics?.growth?.assessments !== undefined ? { value: metrics.growth.assessments, positive: metrics.growth.assessments >= 0 } : undefined}
            />
          </>
        )}
      </div>

      {/* Chart + Top Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>Enrollment Overview</h2>
            <span className="text-[12px] px-3 py-1 rounded-lg font-medium" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              This Week
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4361f0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4361f0" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-disabled)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-disabled)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }} />
                <Area type="monotone" dataKey="enrollments" name="Enrollments"
                  stroke="#4361f0" strokeWidth={2.5} fillOpacity={1} fill="url(#adminGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>Top Courses</h2>
            <Link to="/admin/courses" className="text-[12px] font-semibold" style={{ color: 'var(--brand-500)' }}>View all</Link>
          </div>
          {courses.length === 0 ? (
            <p className="text-[13px] text-center py-8" style={{ color: 'var(--text-muted)' }}>No courses yet</p>
          ) : (
            <div className="space-y-4">
              {courses.map(c => {
                const pct = maxEnrollments > 0 ? Math.round((c.enrollments / maxEnrollments) * 100) : 0;
                return (
                  <div key={c.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(67,97,240,0.1)' }}>
                      <BookOpen size={15} color="#4361f0" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[12px] font-semibold truncate mr-2" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                        <span className="text-[12px] font-black flex-shrink-0" style={{ color: 'var(--text-primary)' }}>{pct}%</span>
                      </div>
                      <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>{c.enrollments.toLocaleString()} enrollments</p>
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#4361f0' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* System Health + Pie + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <div className="card">
          <h2 className="text-[16px] font-bold flex items-center gap-2 mb-5" style={{ color: 'var(--text-primary)' }}>
            <Server size={16} color="#4361f0" /> System Health
          </h2>
          <div className="space-y-2">
            {SYSTEM_SERVICES.map(s => {
              const cfg = STATUS_CONFIG[s.status];
              const Icon = s.icon;
              return (
                <div key={s.name} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(67,97,240,0.1)' }}>
                      <Icon size={15} color="#4361f0" />
                    </div>
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5"
                    style={{ color: cfg.color, background: cfg.bg }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Role Donut */}
        <div className="card">
          <h2 className="text-[16px] font-bold mb-5" style={{ color: 'var(--text-primary)' }}>User Distribution</h2>
          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleBreakdown} cx="50%" cy="50%" innerRadius={52} outerRadius={72}
                  paddingAngle={3} dataKey="value">
                  {roleBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[24px] font-black" style={{ color: 'var(--text-primary)' }}>{totalPie.toLocaleString()}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total Users</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {roleBreakdown.map((r, i) => (
              <div key={r.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{r.name}</span>
                <span className="text-[12px] font-bold ml-auto" style={{ color: 'var(--text-primary)' }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions + Recent Activity */}
        <div className="space-y-5">
          <div className="card">
            <h2 className="text-[16px] font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Add Course', icon: Plus,       color: '#4361f0', bg: 'rgba(67,97,240,0.1)',  to: '/admin/courses' },
                { label: 'Add User',   icon: UserPlus,   color: '#10b981', bg: 'rgba(16,185,129,0.1)', to: '/admin/users' },
                { label: 'Announce',   icon: Megaphone,  color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', to: '#' },
                { label: 'Report',     icon: FileText,   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', to: '#' },
              ].map(a => {
                const Icon = a.icon;
                return (
                  <Link key={a.label} to={a.to}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all hover:-translate-y-0.5"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = a.bg; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: a.bg }}>
                      <Icon size={15} color={a.color} />
                    </div>
                    <span className="text-[12px] font-semibold" style={{ color: 'var(--text-primary)' }}>{a.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="card">
            <h2 className="text-[16px] font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
              <Activity size={15} color="#4361f0" /> Recent Activity
            </h2>
            {activities.length === 0 ? (
              <p className="text-[12px] text-center py-4" style={{ color: 'var(--text-muted)' }}>No recent activity</p>
            ) : (
              <div className="space-y-3">
                {activities.map(a => (
                  <div key={a.id} className="pl-3 border-l-2 flex flex-col gap-0.5"
                    style={{ borderColor: a.color }}>
                    <p className="text-[12px] font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>{a.text}</p>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{a.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
