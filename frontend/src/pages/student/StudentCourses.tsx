import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { CourseCard, ErrorState, PageHeader } from '../../components';
import { CourseCardSkeleton } from '../../components/Skeleton';
import { Search, Grid, List, BookOpen } from 'lucide-react';

interface EnrollmentData {
  course: {
    id: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    teacher?: { user: { firstName: string; lastName: string } };
    _count: { lectures: number };
  };
  progress?: number;
}

const StudentCourses: React.FC = () => {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['student-enrollments'],
    queryFn: () => api.get('/enrollments/my-courses').then(r => r.data.enrollments as EnrollmentData[]),
    staleTime: 60_000,
  });

  const enrollments = data ?? [];
  const filtered = enrollments.filter(e =>
    e.course.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.course.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Courses"
        subtitle={`${enrollments.length} enrolled course${enrollments.length !== 1 ? 's' : ''}`}
      />

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search your courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9 py-2 text-[13px] h-9"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <button onClick={() => setView('grid')}
            className="p-1.5 rounded-md transition-colors"
            style={{ background: view === 'grid' ? '#4361f0' : 'transparent', color: view === 'grid' ? 'white' : 'var(--text-muted)' }}
            aria-label="Grid view">
            <Grid size={15} />
          </button>
          <button onClick={() => setView('list')}
            className="p-1.5 rounded-md transition-colors"
            style={{ background: view === 'list' ? '#4361f0' : 'transparent', color: view === 'list' ? 'white' : 'var(--text-muted)' }}
            aria-label="List view">
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Error */}
      {isError && <ErrorState message="Could not load your courses" onRetry={refetch} />}

      {/* Loading */}
      {isLoading && (
        <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5' : 'flex flex-col gap-3'}>
          {[...Array(6)].map((_, i) => <CourseCardSkeleton key={i} />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="card flex flex-col items-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(67,97,240,0.1)' }}>
            <BookOpen size={26} color="#4361f0" />
          </div>
          <h3 className="text-[16px] font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {search ? 'No matching courses' : 'No courses enrolled yet'}
          </h3>
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {search ? 'Try a different search term' : 'Your enrolled courses will appear here once an admin assigns them.'}
          </p>
        </div>
      )}

      {/* Grid View */}
      {!isLoading && !isError && filtered.length > 0 && view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((e, idx) => (
            <CourseCard
              key={e.course.id}
              course={e.course}
              role="student"
              progress={e.progress}
              colorIndex={idx}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {!isLoading && !isError && filtered.length > 0 && view === 'list' && (
        <div className="card p-0 overflow-hidden">
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {filtered.map((e, idx) => {
              const course = e.course;
              const lectures = course._count?.lectures ?? 0;
              const teacherName = course.teacher
                ? `${course.teacher.user.firstName} ${course.teacher.user.lastName}` : null;
              return (
                <div key={course.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-white/2 transition-colors">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${
                    ['from-blue-500 to-indigo-600','from-emerald-500 to-teal-600','from-violet-500 to-purple-600','from-orange-500 to-amber-600'][idx % 4]
                  }`}>
                    <BookOpen size={18} color="white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>{course.title}</p>
                    {teacherName && (
                      <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{teacherName}</p>
                    )}
                    {typeof e.progress === 'number' && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden max-w-[120px]" style={{ background: 'var(--border)' }}>
                          <div className="h-full rounded-full" style={{ width: `${e.progress}%`, background: '#4361f0' }} />
                        </div>
                        <span className="text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>{e.progress}%</span>
                      </div>
                    )}
                  </div>
                  <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>{lectures}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Lectures</p>
                    </div>
                  </div>
                  <a href={`/student/courses/${course.id}`} className="btn btn-secondary btn-sm">Continue</a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCourses;
