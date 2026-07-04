import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Users, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';

export const AttendanceTab: React.FC<{ courseId: string }> = ({ courseId }) => {
  const { user } = useAuth();
  
  if (user?.role === 'TEACHER') {
    return <TeacherAttendanceView courseId={courseId} />;
  }
  
  return <StudentAttendanceView courseId={courseId} />;
};

const TeacherAttendanceView: React.FC<{ courseId: string }> = ({ courseId }) => {
  const [selectedLecture, setSelectedLecture] = useState<string>('');

  // Fetch all lectures for this course to populate the dropdown
  const { data: lectures = [], isLoading: loadingLectures } = useQuery({
    queryKey: ['course-lectures-attendance', courseId],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.LECTURES.BY_COURSE(courseId!));
      return res.data.lectures;
    }
  });

  // Fetch attendance report for the selected lecture
  const { data: attendanceReport = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ['lecture-attendance', selectedLecture],
    queryFn: async () => {
      if (!selectedLecture) return [];
      const res = await api.get(API_ENDPOINTS.ATTENDANCE.BY_LECTURE(selectedLecture));
      return res.data.attendance;
    },
    enabled: !!selectedLecture
  });

  // Select the most recent past lecture by default
  useEffect(() => {
    if (lectures.length > 0 && !selectedLecture) {
      const pastLectures = lectures.filter((l: { endTime: string }) => new Date(l.endTime) < new Date());
      if (pastLectures.length > 0) {
        // Sort by most recent
        pastLectures.sort((a: { startTime: string }, b: { startTime: string }) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        setSelectedLecture(pastLectures[0].id);
      } else {
        setSelectedLecture(lectures[0].id);
      }
    }
  }, [lectures, selectedLecture]);

  if (loadingLectures) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-lg font-bold">Attendance Reports</h2>
        
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-secondary" />
          <select 
            className="input text-sm py-2 px-3 border-border bg-bg text-primary rounded-lg focus:border-brand-500"
            value={selectedLecture}
            onChange={(e) => setSelectedLecture(e.target.value)}
          >
            <option value="" disabled>Select a lecture...</option>
            {lectures.map((lecture: { id: string; title: string; startTime: string; endTime: string }) => (
              <option key={lecture.id} value={lecture.id}>
                {new Date(lecture.startTime).toLocaleDateString()} - {lecture.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedLecture ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <Users size={32} className="mx-auto mb-3 text-secondary opacity-50" />
          <p className="text-secondary text-sm">Please select a lecture to view attendance.</p>
        </div>
      ) : loadingAttendance ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      ) : attendanceReport ? (
        <div className="bg-bg border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-bg-subtle text-secondary border-b border-border">
                  <th className="px-6 py-3 font-semibold">Student Name</th>
                  <th className="px-6 py-3 font-semibold">Enrollment #</th>
                  <th className="px-6 py-3 font-semibold text-center">Status</th>
                  <th className="px-6 py-3 font-semibold">Join Time</th>
                  <th className="px-6 py-3 font-semibold">Leave Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attendanceReport.map((record: { studentId: string; firstName: string; lastName: string; status: string; joinTime?: string; leaveTime?: string; enrollmentNumber?: string }) => (
                  <tr key={record.studentId} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3 font-medium text-primary">
                      {record.firstName} {record.lastName}
                    </td>
                    <td className="px-6 py-3 text-secondary font-mono text-xs">
                      {record.enrollmentNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {record.status === 'PRESENT' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600">
                          <CheckCircle2 size={12} /> Present
                        </span>
                      ) : record.status === 'LATE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600">
                          <Clock size={12} /> Late
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600">
                          <XCircle size={12} /> Absent
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-secondary text-xs">
                      {record.joinTime ? new Date(record.joinTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                    </td>
                    <td className="px-6 py-3 text-secondary text-xs">
                      {record.leaveTime ? new Date(record.leaveTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                    </td>
                  </tr>
                ))}
                {attendanceReport.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-secondary">
                      No students enrolled in this course.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const StudentAttendanceView: React.FC<{ courseId: string }> = ({ courseId }) => {
  const { data: myAttendance = [], isLoading } = useQuery({
    queryKey: ['my-attendance', courseId],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.ATTENDANCE.MY);
      // Filter by course in frontend for now
      return res.data.attendance.filter((a: { lecture: { courseId: string } }) => a.lecture.courseId === courseId);
    }
  });

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  // Calculate stats
  const totalAttended = myAttendance.length;
  const totalLate = myAttendance.filter((a: { status: string }) => a.status === 'LATE').length;
  const totalPresent = myAttendance.filter((a: { status: string }) => a.status === 'PRESENT').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-lg font-bold">My Attendance Record</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bg border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-500/10 text-brand-500 rounded-full flex items-center justify-center shrink-0">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-primary">{totalAttended}</p>
            <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Total Classes Joined</p>
          </div>
        </div>
        
        <div className="bg-bg border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-primary">{totalPresent}</p>
            <p className="text-xs font-semibold text-secondary uppercase tracking-wider">On Time</p>
          </div>
        </div>
        
        <div className="bg-bg border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-primary">{totalLate}</p>
            <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Late Arrivals</p>
          </div>
        </div>
      </div>

      <div className="bg-bg border border-border rounded-xl overflow-hidden mt-6">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-bg-subtle text-secondary border-b border-border">
              <th className="px-6 py-3 font-semibold">Date</th>
              <th className="px-6 py-3 font-semibold">Lecture Title</th>
              <th className="px-6 py-3 font-semibold text-center">Status</th>
              <th className="px-6 py-3 font-semibold">Join Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {myAttendance.map((record: { id: string; lecture: { title: string; startTime: string }; status: string; joinTime?: string; leaveTime?: string }) => (
              <tr key={record.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <td className="px-6 py-3 font-medium text-primary">
                  {new Date(record.lecture.startTime).toLocaleDateString()}
                </td>
                <td className="px-6 py-3 text-secondary">
                  {record.lecture.title}
                </td>
                <td className="px-6 py-3 text-center">
                  {record.status === 'PRESENT' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600">
                      <CheckCircle2 size={12} /> Present
                    </span>
                  ) : record.status === 'LATE' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600">
                      <Clock size={12} /> Late
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600">
                      <XCircle size={12} /> Absent
                    </span>
                  )}
                </td>
                <td className="px-6 py-3 text-secondary text-xs font-mono">
                  {new Date(record.joinTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </td>
              </tr>
            ))}
            {myAttendance.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-secondary">
                  You haven't attended any lectures yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
