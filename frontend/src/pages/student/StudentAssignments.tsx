import React from 'react';
import { ClipboardList, Calendar, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import { TableRowSkeleton } from '../../components/Skeleton';

interface StudentAssignmentData {
  id: string;
  title: string;
  course: string;
  courseId: string;
  dueDate: string;
  status: string;
  grade: number | null;
  maxGrade: number;
  createdAt: string;
}

const StudentAssignments: React.FC = () => {
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['student-assignments'],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.ASSIGNMENTS.STUDENT);
      return res.data.assignments;
    }
  });

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>My Assignments</h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Track and submit your course assignments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-500">
            <ClipboardList size={20} />
          </div>
          <div>
            <p className="text-[20px] font-black leading-none" style={{ color: 'var(--text-primary)' }}>
              {isLoading ? '-' : assignments.length}
            </p>
            <p className="text-[12px] font-medium mt-1" style={{ color: 'var(--text-muted)' }}>Total Assignments</p>
          </div>
        </div>
      </div>

      {/* ── List ── */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-black/5 dark:bg-surface/5" style={{ borderColor: 'var(--border)' }}>
                <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Assignment</th>
                <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Course</th>
                <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Due Date</th>
                <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</th>
                <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-right" style={{ color: 'var(--text-muted)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <>
                  <TableRowSkeleton cols={5} />
                  <TableRowSkeleton cols={5} />
                  <TableRowSkeleton cols={5} />
                </>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[13px] text-gray-500">No assignments found.</td>
                </tr>
              ) : assignments.map((a: StudentAssignmentData, idx: number) => {
                const isOverdue = new Date(a.dueDate) < new Date() && a.status === 'Pending';
                return (
                  <tr key={a.id} className="hover:bg-black/5 dark:hover:bg-surface/5 transition-colors" style={{ borderBottom: idx !== assignments.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td className="py-3.5 px-5">
                      <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{a.course}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1.5 text-[12px]" style={{ color: isOverdue ? '#ef4444' : 'var(--text-muted)' }}>
                        <Calendar size={14} />
                        {new Date(a.dueDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        a.status === 'GRADED' || a.status === 'SUBMITTED' 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : isOverdue 
                            ? 'bg-red-500/10 text-red-500' 
                            : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {a.status === 'Pending' ? (
                        <Link to={`/student/courses/${a.courseId}?tab=assignments`} className="btn btn-primary btn-sm rounded-lg px-3 py-1 text-[11px] h-auto">
                          Submit
                        </Link>
                      ) : a.status === 'GRADED' ? (
                        <span className="text-[12px] font-bold text-emerald-500 flex items-center justify-end gap-1">
                          <CheckCircle2 size={14} /> {a.grade}/{a.maxGrade}
                        </span>
                      ) : (
                        <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>In Review</span>
                      )}
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

export default StudentAssignments;
