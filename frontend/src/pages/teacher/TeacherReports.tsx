import React from 'react';
import { Download, TrendingUp, Users, BarChart3, BookOpen } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import { StatCardSkeleton } from '../../components/Skeleton';

const TeacherReports: React.FC = () => {
  const { data: reports, isLoading } = useQuery({
    queryKey: ['teacher-reports'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.ANALYTICS.TEACHER_REPORTS);
      return res.data.reports;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </div>
    );
  }

  const { metrics, engagementData, coursePerformance } = reports || {};
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Reports & Analytics</h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Detailed insights into student engagement and course performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-primary btn-sm gap-2">
            <Download size={14} /> Export Report
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><Users size={16} /></div>
            <p className="text-[13px] font-semibold" style={{ color: 'var(--text-muted)' }}>Total Students</p>
          </div>
          <p className="text-[24px] font-black" style={{ color: 'var(--text-primary)' }}>{metrics?.totalStudents || 0}</p>
          <p className="text-[11px] font-medium text-emerald-500 mt-1 flex items-center gap-1"><TrendingUp size={12} /> +12% vs last month</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500"><BarChart3 size={16} /></div>
            <p className="text-[13px] font-semibold" style={{ color: 'var(--text-muted)' }}>Avg. Engagement</p>
          </div>
          <p className="text-[24px] font-black" style={{ color: 'var(--text-primary)' }}>{metrics?.avgEngagement || 0}%</p>
          <p className="text-[11px] font-medium text-emerald-500 mt-1 flex items-center gap-1"><TrendingUp size={12} /> +4% vs last month</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500"><BookOpen size={16} /></div>
            <p className="text-[13px] font-semibold" style={{ color: 'var(--text-muted)' }}>Course Completion</p>
          </div>
          <p className="text-[24px] font-black" style={{ color: 'var(--text-primary)' }}>{metrics?.courseCompletion || 0}%</p>
          <p className="text-[11px] font-medium text-amber-500 mt-1 flex items-center gap-1">-2% vs last month</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500"><TrendingUp size={16} /></div>
            <p className="text-[13px] font-semibold" style={{ color: 'var(--text-muted)' }}>Avg. Quiz Score</p>
          </div>
          <p className="text-[24px] font-black" style={{ color: 'var(--text-primary)' }}>{metrics?.avgQuizScore || 0}%</p>
          <p className="text-[11px] font-medium text-emerald-500 mt-1 flex items-center gap-1"><TrendingUp size={12} /> +5% vs last month</p>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Trend */}
        <div className="card flex flex-col">
          <h2 className="text-[16px] font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Engagement Over Time</h2>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEngage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4361f0" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4361f0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--brand-500)' }}
                />
                <Area type="monotone" dataKey="engagement" name="Engagement (%)" stroke="#4361f0" strokeWidth={3} fillOpacity={1} fill="url(#colorEngage)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course Performance */}
        <div className="card flex flex-col">
          <h2 className="text-[16px] font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Average Score by Course</h2>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coursePerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  cursor={{ fill: 'var(--border)', opacity: 0.4 }}
                />
                <Bar dataKey="avgScore" name="Avg Score (%)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherReports;
