import React, { useState } from 'react';
import { Search, Filter, MoreVertical, GraduationCap, Mail, Ban, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const TeacherEnrollments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('All Courses');

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['teacherEnrollments'],
    queryFn: async () => {
      const res = await api.get('/enrollments/teacher');
      return res.data.enrollments;
    }
  });

  const courses = ['All Courses', ...Array.from(new Set(enrollments.map((e: any) => e.course?.title)))];

  const filteredEnrollments = enrollments.filter((e: any) => {
    const studentName = `${e.student?.user?.firstName} ${e.student?.user?.lastName}`.toLowerCase();
    const email = e.student?.user?.email?.toLowerCase() || '';
    const courseName = e.course?.title || '';
    
    const matchesSearch = studentName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
    const matchesCourse = filterCourse === 'All Courses' || courseName === filterCourse;
    return matchesSearch && matchesCourse;
  });

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Student Enrollments</h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Manage and track student progress across your courses.</p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <GraduationCap size={14} style={{ color: 'var(--text-muted)' }} />
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{enrollments.length} Total</span>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="card flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search students..."
            className="input pl-9 py-2 text-[13px] h-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full sm:w-48">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <select
            className="input pl-9 py-2 text-[13px] h-10 w-full appearance-none"
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
          >
            {courses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/5 dark:bg-white/5">
              <tr className="text-[11px] uppercase tracking-wider" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th className="py-3 px-5 font-semibold">Student</th>
                <th className="py-3 px-5 font-semibold">Course</th>
                <th className="py-3 px-5 font-semibold">Progress</th>
                <th className="py-3 px-5 font-semibold">Status</th>
                <th className="py-3 px-5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: 'var(--brand-500)' }} />
                  </td>
                </tr>
              ) : filteredEnrollments.map((e: any, idx: number) => (
                <tr key={e.id} className="group transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ borderBottom: idx !== filteredEnrollments.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td className="py-3.5 px-5">
                    <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{e.student?.user?.firstName} {e.student?.user?.lastName}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{e.student?.user?.email}</p>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{e.course?.title}</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full w-24 overflow-hidden" style={{ background: 'var(--border)' }}>
                        <div className="h-full rounded-full" style={{ width: `${e.progress || 0}%`, background: e.progress === 100 ? '#10b981' : '#4361f0' }} />
                      </div>
                      <span className="text-[12px] font-bold" style={{ color: 'var(--text-primary)' }}>{e.progress || 0}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${e.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {e.status || 'Active'}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-brand-500" title="Message">
                        <Mail size={14} />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-red-500" title="Revoke Access">
                        <Ban size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredEnrollments.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
                    No enrollments found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherEnrollments;
