import React, { useState } from 'react';
import { Plus, FileText, CheckCircle, Clock } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { TableRowSkeleton } from '../../components/Skeleton';
import CreateAssignmentModal from '../../components/CreateAssignmentModal';
import CreateQuizModal from '../../components/CreateQuizModal';

const TeacherAssessments: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['teacherAssessments'],
    queryFn: async () => {
      const res = await api.get('/assignments/teacher/all');
      return res.data.assessments;
    }
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['teacherAssessments'] });
    alert('Successfully created!');
  };

  return (
    <div className="space-y-6">
      <CreateAssignmentModal 
        isOpen={isAssignmentModalOpen} 
        onClose={() => setIsAssignmentModalOpen(false)} 
        onSuccess={handleSuccess} 
      />
      <CreateQuizModal 
        isOpen={isQuizModalOpen} 
        onClose={() => setIsQuizModalOpen(false)} 
        onSuccess={handleSuccess} 
      />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Assessments</h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Manage quizzes and assignments for your courses.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsAssignmentModalOpen(true)} className="btn btn-primary btn-sm gap-2">
            <Plus size={14} /> Create Assignment
          </button>
          <button onClick={() => setIsQuizModalOpen(true)} className="btn btn-primary btn-sm gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus size={14} /> Create Quiz
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
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
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[20px] font-black leading-none" style={{ color: 'var(--text-primary)' }}>5</p>
            <p className="text-[12px] font-medium mt-1" style={{ color: 'var(--text-muted)' }}>Pending Grading</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-500">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-[20px] font-black leading-none" style={{ color: 'var(--text-primary)' }}>85%</p>
            <p className="text-[12px] font-medium mt-1" style={{ color: 'var(--text-muted)' }}>Avg Completion Rate</p>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card overflow-hidden p-0">
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>Recent Assessments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/5 dark:bg-surface/5">
              <tr className="text-[11px] uppercase tracking-wider" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th className="py-3 px-5 font-semibold">Title</th>
                <th className="py-3 px-5 font-semibold">Course</th>
                <th className="py-3 px-5 font-semibold">Type</th>
                <th className="py-3 px-5 font-semibold">Submissions</th>
                <th className="py-3 px-5 font-semibold">Status</th>
                <th className="py-3 px-5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <>
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                </>
              ) : assessments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
                    No assessments found.
                  </td>
                </tr>
              ) : assessments.map((a: { id: string; title: string; course: string; type: string; dueDate: string; submissions: number; total: number; status: string }, idx: number) => {
                const pct = a.total > 0 ? Math.round((a.submissions / a.total) * 100) : 0;
                return (
                  <tr key={a.id} className="group transition-colors hover:bg-black/5 dark:hover:bg-surface/5" style={{ borderBottom: idx !== assessments.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td className="py-3.5 px-5">
                      <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{a.course}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{a.type}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] font-bold" style={{ color: 'var(--text-primary)' }}>{a.submissions}/{a.total}</span>
                        <div className="flex-1 h-1.5 rounded-full w-16 overflow-hidden hidden sm:block" style={{ background: 'var(--border)' }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct === 100 ? '#10b981' : '#4361f0' }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        a.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' :
                        a.status === 'Draft' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button className="text-[12px] font-bold text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        Manage →
                      </button>
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

export default TeacherAssessments;
