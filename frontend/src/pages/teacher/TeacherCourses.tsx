import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Video, Search, Grid, List, Layers } from 'lucide-react';
import { getDirectDriveUrl } from '../../utils/drive';

interface CourseData {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  createdAt: string;
  _count: {
    enrollments: number;
    lectures: number;
  };
}

const COURSE_COLORS = [
  { bg: 'from-blue-500 to-indigo-600',   light: 'bg-blue-50',   icon: 'text-blue-600'   },
  { bg: 'from-emerald-500 to-teal-600',  light: 'bg-emerald-50', icon: 'text-emerald-600' },
  { bg: 'from-violet-500 to-purple-600', light: 'bg-violet-50', icon: 'text-violet-600'  },
  { bg: 'from-orange-500 to-amber-600',  light: 'bg-orange-50', icon: 'text-orange-600'  },
  { bg: 'from-pink-500 to-rose-600',     light: 'bg-pink-50',   icon: 'text-pink-600'   },
  { bg: 'from-cyan-500 to-sky-600',      light: 'bg-cyan-50',   icon: 'text-cyan-600'   },
];

const TeacherCourses: React.FC = () => {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(API_ENDPOINTS.COURSES.MY_COURSES);
        setCourses(data.courses);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-0 overflow-hidden">
              <div className="skeleton h-40 rounded-none" />
              <div className="p-5 space-y-3">
                <div className="skeleton h-5 w-3/4" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Courses</h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Manage and view {courses.length} course{courses.length !== 1 ? 's' : ''} assigned to you
          </p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          {/* Removed Add Course button for teachers */}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 py-2 text-[13px] h-9"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <button
            onClick={() => setView('grid')}
            className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-brand-500 text-white' : ''}`}
            style={{ color: view === 'grid' ? undefined : 'var(--text-muted)' }}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-brand-500 text-white' : ''}`}
            style={{ color: view === 'list' ? undefined : 'var(--text-muted)' }}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mb-4">
            <Layers className="w-8 h-8 text-brand-500" />
          </div>
          <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {search ? 'No matching courses' : 'No courses yet'}
          </h3>
          <p className="text-[14px]" style={{ color: 'var(--text-muted)' }}>
            {search ? 'Try a different search term' : 'Contact your administrator to be assigned to a course.'}
          </p>
        </div>
      )}

      {/* Course Grid */}
      {view === 'grid' && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((course, idx) => {
            const color = COURSE_COLORS[idx % COURSE_COLORS.length];
            return (
              <div key={course.id} className="course-card group">
                {/* Thumbnail */}
                <div className={`relative h-40 bg-gradient-to-br ${color.bg} overflow-hidden`}>
                  {course.thumbnailUrl && (
                    <img
                      src={getDirectDriveUrl(course.thumbnailUrl)}
                      alt={course.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                    <span className="badge badge-blue" style={{ fontSize: '10px' }}>
                      {course._count.lectures} Lectures
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5">
                  <h3 className="font-bold text-[15px] mb-1.5 truncate" style={{ color: 'var(--text-primary)' }}>
                    {course.title}
                  </h3>
                  <p className="text-[13px] line-clamp-2 mb-4 h-10" style={{ color: 'var(--text-muted)' }}>
                    {course.description || 'No description provided.'}
                  </p>

                  <Link
                      to={`${course.id}`}
                    className="text-[13px] font-semibold text-brand-500 hover:text-brand-600 transition-colors inline-flex items-center gap-1 mb-4"
                  >
                    View Lectures <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
                  </Link>

                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      <Users className="w-3.5 h-3.5" />
                      <span>{course._count.enrollments} Students</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      <Video className="w-3.5 h-3.5" />
                      <span>{course._count.lectures} Lectures</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Course List */}
      {view === 'list' && filtered.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {filtered.map((course, idx) => {
              const color = COURSE_COLORS[idx % COURSE_COLORS.length];
              return (
                <div key={course.id} className="flex items-center gap-4 p-4 hover:bg-bg-subtle transition-colors">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color.bg} flex items-center justify-center flex-shrink-0`}>
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[14px] truncate" style={{ color: 'var(--text-primary)' }}>{course.title}</h3>
                    <p className="text-[12px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {course.description || 'No description provided.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-center hidden sm:block">
                      <p className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>{course._count.enrollments}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Students</p>
                    </div>
                    <div className="text-center hidden sm:block">
                      <p className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>{course._count.lectures}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Lectures</p>
                    </div>
                    <Link
                        to={`${course.id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherCourses;
