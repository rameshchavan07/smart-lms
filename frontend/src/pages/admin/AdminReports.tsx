import React from 'react';
import { BarChart3, Users, BookOpen, GraduationCap, Loader2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const AdminReports: React.FC = () => {
  const { data: reports, isLoading } = useQuery({
    queryKey: ['adminReports'],
    queryFn: async () => {
      const res = await api.get('/analytics/admin/reports');
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand-500)' }} />
      </div>
    );
  }

  const { metrics, engagementData, coursePerformance } = reports || {};

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>System Reports</h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Platform-wide analytics and performance metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><Users size={16} /></div>
            <p className="text-[13px] font-semibold" style={{ color: 'var(--text-muted)' }}>Total Students</p>
          </div>
          <p className="text-[24px] font-black" style={{ color: 'var(--text-primary)' }}>{metrics?.totalStudents || 0}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500"><Users size={16} /></div>
            <p className="text-[13px] font-semibold" style={{ color: 'var(--text-muted)' }}>Total Teachers</p>
          </div>
          <p className="text-[24px] font-black" style={{ color: 'var(--text-primary)' }}>{metrics?.totalTeachers || 0}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500"><BookOpen size={16} /></div>
            <p className="text-[13px] font-semibold" style={{ color: 'var(--text-muted)' }}>Total Courses</p>
          </div>
          <p className="text-[24px] font-black" style={{ color: 'var(--text-primary)' }}>{metrics?.totalCourses || 0}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500"><GraduationCap size={16} /></div>
            <p className="text-[13px] font-semibold" style={{ color: 'var(--text-muted)' }}>Total Enrollments</p>
          </div>
          <p className="text-[24px] font-black" style={{ color: 'var(--text-primary)' }}>{metrics?.totalEnrollments || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card flex flex-col">
          <h2 className="text-[16px] font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Platform Engagement</h2>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEngageAdmin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4361f0" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4361f0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Area type="monotone" dataKey="engagement" stroke="#4361f0" strokeWidth={3} fillOpacity={1} fill="url(#colorEngageAdmin)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card flex flex-col">
          <h2 className="text-[16px] font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Top Courses Performance</h2>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coursePerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} domain={[0, 100]} />
                <Tooltip 
                  cursor={{ fill: 'var(--border)', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="avgScore" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
