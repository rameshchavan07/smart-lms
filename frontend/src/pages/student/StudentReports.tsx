import React from 'react';
import { Target } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import { StatCardSkeleton, Skeleton } from '../../components/Skeleton';

const StudentReports: React.FC = () => {
  const { data: stats, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['student-analytics'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.ANALYTICS.STUDENT_BASE);
      return res.data.metrics;
    }
  });

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.ASSIGNMENTS.STUDENT);
      return res.data.assignments;
    }
  });

  const isLoading = loadingAnalytics || loadingAssignments;
  const gradedAssignments = assignments.filter((a: { status: string, title: string, grade: number, maxGrade: number }) => a.status === 'GRADED');
  
  // Prepare data for bar chart
  const barChartData = gradedAssignments.map((a: { status: string, title: string, grade: number, maxGrade: number }) => ({
    name: a.title,
    score: Math.round((a.grade / a.maxGrade) * 100)
  }));

  // Prepare dummy data for radar chart since we don't have skill tags yet
  const radarData = [
    { subject: 'Participation', A: 80, fullMark: 100 },
    { subject: 'Assignments', A: stats?.overallProgress || 0, fullMark: 100 },
    { subject: 'Quizzes', A: stats?.quizAverage || 0, fullMark: 100 },
    { subject: 'Punctuality', A: 90, fullMark: 100 },
    { subject: 'Communication', A: 85, fullMark: 100 },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card h-[400px]">
            <Skeleton className="h-6 w-48 mb-6" />
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
          <div className="card h-[400px]">
            <Skeleton className="h-6 w-48 mb-6" />
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Performance Reports</h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Detailed breakdown of your academic progress.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center py-6">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3">
            <Target size={24} />
          </div>
          <p className="text-[24px] font-black" style={{ color: 'var(--text-primary)' }}>{stats?.overallProgress || 0}%</p>
          <p className="text-[13px] font-medium mt-1" style={{ color: 'var(--text-muted)' }}>Overall Progress</p>
        </div>
        <div className="card text-center py-6">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-3">
            <Target size={24} />
          </div>
          <p className="text-[24px] font-black" style={{ color: 'var(--text-primary)' }}>{stats?.quizAverage || 0}%</p>
          <p className="text-[13px] font-medium mt-1" style={{ color: 'var(--text-muted)' }}>Quiz Average</p>
        </div>
        <div className="card text-center py-6">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto mb-3">
            <Target size={24} />
          </div>
          <p className="text-[24px] font-black" style={{ color: 'var(--text-primary)' }}>{stats?.badgesEarned || 0}</p>
          <p className="text-[13px] font-medium mt-1" style={{ color: 'var(--text-muted)' }}>Badges Earned</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card flex flex-col">
          <h2 className="text-[16px] font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Assignment Scores</h2>
          <div className="flex-1 min-h-[300px] w-full">
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} domain={[0, 100]} />
                  <Tooltip 
                    cursor={{ fill: 'var(--border)', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="score" fill="#4361f0" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[13px] text-gray-500">Not enough data to generate chart.</div>
            )}
          </div>
        </div>

        <div className="card flex flex-col">
          <h2 className="text-[16px] font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Skill Mastery</h2>
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--text-muted)' }} />
                <Radar name="Student" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '12px', fontSize: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentReports;
