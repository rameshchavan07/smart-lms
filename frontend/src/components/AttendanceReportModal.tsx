import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { API_ENDPOINTS } from '../services/apiEndpoints';
import { X, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import ErrorState from './ErrorState';

interface AttendanceRecord {
  studentId: string;
  firstName: string;
  lastName: string;
  enrollmentNumber: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  joinTime: string | null;
  leaveTime: string | null;
}

interface AttendanceReportModalProps {
  lectureId: string;
  isOpen: boolean;
  onClose: () => void;
}

const AttendanceReportModal: React.FC<AttendanceReportModalProps> = ({ lectureId, isOpen, onClose }) => {
  const { data: attendanceData = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['attendanceReport', lectureId],
    queryFn: () => api.get(API_ENDPOINTS.ATTENDANCE.BY_LECTURE(lectureId)).then(r => r.data.attendance as AttendanceRecord[]),
    enabled: !!lectureId && isOpen,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--bg)] w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-[18px] font-bold" style={{ color: 'var(--text-primary)' }}>Attendance Report</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <X size={20} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-500)] mb-4" />
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Loading attendance data...</p>
            </div>
          ) : isError ? (
            <ErrorState message="Failed to load attendance report" onRetry={refetch} />
          ) : !attendanceData || attendanceData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>No students found in this course.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-black/5 dark:bg-white/5 font-semibold" style={{ color: 'var(--text-muted)' }}>
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Enrollment No.</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Join Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {attendanceData.map(record => (
                    <tr key={record.studentId} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                        {record.firstName} {record.lastName}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                        {record.enrollmentNumber}
                      </td>
                      <td className="px-4 py-3">
                        {record.status === 'PRESENT' && <span className="inline-flex items-center gap-1.5 text-green-500 font-bold text-[11px] bg-green-500/10 px-2 py-0.5 rounded-full"><CheckCircle2 size={12} /> Present</span>}
                        {record.status === 'LATE' && <span className="inline-flex items-center gap-1.5 text-yellow-500 font-bold text-[11px] bg-yellow-500/10 px-2 py-0.5 rounded-full"><Clock size={12} /> Late</span>}
                        {record.status === 'ABSENT' && <span className="inline-flex items-center gap-1.5 text-red-500 font-bold text-[11px] bg-red-500/10 px-2 py-0.5 rounded-full"><XCircle size={12} /> Absent</span>}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                        {record.joinTime ? new Date(record.joinTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AttendanceReportModal;
