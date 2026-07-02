import React from 'react';
import { Award, Target } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Skeleton } from '../../components/Skeleton';

interface Assignment {
  id: string;
  title: string;
  course: string;
  status: string;
  grade: number;
  maxGrade: number;
}

const StudentGrades: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['studentStats'],
    queryFn: async () => {
      const res = await api.get('/analytics/student');
      return res.data.metrics;
    }
  });

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['studentAssignments'],
    queryFn: async () => {
      const res = await api.get('/assignments/student');
      return res.data.assignments;
    }
  });

  const gradedAssignments = assignments.filter((a: Assignment) => a.status === 'GRADED');

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Grades & Progress</h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Review your performance across all enrolled courses.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-brand-500/10 text-brand-500">
            <Award size={20} />
          </div>
          <div>
            <p className="text-[20px] font-black leading-none" style={{ color: 'var(--text-primary)' }}>
              {isLoading ? '-' : `${stats?.quizAverage || 0}%`}
            </p>
            <p className="text-[12px] font-medium mt-1" style={{ color: 'var(--text-muted)' }}>Average Quiz Score</p>
          </div>
        </div>
        
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-500">
            <Target size={20} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>Overall Progress</p>
              <span className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>{isLoading ? '-' : `${stats?.overallProgress || 0}%`}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-surface/10 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats?.overallProgress || 0}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Graded Assignments List ── */}
      <div className="card">
        <h2 className="text-[16px] font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Grades</h2>
        <div className="space-y-3">
          {loadingAssignments ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-surface/5">
                  <div className="flex-1">
                    <Skeleton className="h-4 w-40 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-12" />
                </div>
              ))}
            </div>
          ) : gradedAssignments.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-gray-500">No graded assignments yet.</div>
          ) : (
            gradedAssignments.map((a: Assignment) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-surface/5 border border-transparent hover:border-brand-500/30 transition-colors">
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{a.course}</p>
                </div>
                <div className="text-right">
                  <span className="text-[15px] font-black text-emerald-500">{a.grade}/{a.maxGrade}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentGrades;
