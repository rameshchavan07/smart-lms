import React from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const AdminAssessments: React.FC = () => {
  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['adminAssessments'],
    queryFn: async () => {
      const res = await api.get('/assignments/admin/all');
      return res.data.assessments;
    }
  });

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>System Assessments</h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Overview of all quizzes and assignments across all courses.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-500">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-[20px] font-black leading-none" style={{ color: 'var(--text-primary)' }}>{isLoading ? '-' : assessments.length}</p>
            <p className="text-[12px] font-medium mt-1" style={{ color: 'var(--text-muted)' }}>Total Assessments</p>
          </div>
        </div>
      </div>

      {/* ── List ── */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-black/5 dark:bg-white/5" style={{ borderColor: 'var(--border)' }}>
                <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Title</th>
                <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Course</th>
                <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Type</th>
                <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Submissions</th>
                <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-500" />
                  </td>
                </tr>
              ) : assessments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[13px] text-gray-500">No assessments found.</td>
                </tr>
              ) : assessments.map((a: { id: string; title: string; course: string; dueDate: string; submissions: number; total: number }, idx: number) => {
                const pct = a.total > 0 ? Math.round((a.submissions / a.total) * 100) : 0;
                return (
                  <tr key={a.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ borderBottom: idx !== assessments.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td className="py-3.5 px-5">
                      <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{a.course}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>{a.type}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold" style={{ color: 'var(--text-primary)' }}>{a.submissions}/{a.total}</span>
                        <div className="w-16 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAssessments;
