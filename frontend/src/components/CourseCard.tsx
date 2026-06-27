import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Video, Users, PlayCircle, ArrowRight } from 'lucide-react';
import { getDirectDriveUrl } from '../utils/drive';

export interface CourseCardCourse {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  teacher?: { user: { firstName: string; lastName: string } };
  _count?: { lectures?: number; enrollments?: number };
}

interface CourseCardProps {
  course: CourseCardCourse;
  role: 'student' | 'teacher' | 'admin';
  progress?: number;      // student: 0-100
  colorIndex?: number;    // for gradient variety
  href?: string;          // override link target
}

const GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-orange-500 to-amber-600',
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-sky-600',
];

export const CourseCard: React.FC<CourseCardProps> = ({
  course, role, progress, colorIndex = 0, href
}) => {
  const gradient = GRADIENTS[colorIndex % GRADIENTS.length];
  const linkTo = href ?? `/${role}/courses/${course.id}`;
  const lectures = course._count?.lectures ?? 0;
  const enrollments = course._count?.enrollments ?? 0;
  const teacherName = course.teacher
    ? `${course.teacher.user.firstName} ${course.teacher.user.lastName}`
    : null;

  return (
    <div className="course-card group flex flex-col">
      {/* Thumbnail */}
      <div className={`relative h-40 bg-gradient-to-br ${gradient} flex-shrink-0 overflow-hidden`}>
        {course.thumbnailUrl && (
          <img
            src={getDirectDriveUrl(course.thumbnailUrl)}
            alt={course.title}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        {/* Lecture badge */}
        <div className="absolute bottom-3 left-3">
          <span className="badge badge-blue text-[10px]">
            {lectures} Lecture{lectures !== 1 ? 's' : ''}
          </span>
        </div>
        {/* Enrollment badge for admin/teacher */}
        {role !== 'student' && enrollments > 0 && (
          <div className="absolute bottom-3 right-3">
            <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', fontSize: 10 }}>
              {enrollments} Students
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        {teacherName && (
          <p className="text-[11px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {teacherName}
          </p>
        )}
        <h3 className="font-bold text-[15px] mb-1.5 line-clamp-1 leading-snug" style={{ color: 'var(--text-primary)' }}>
          {course.title}
        </h3>
        <p className="text-[13px] line-clamp-2 flex-1 mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {course.description || 'No description provided.'}
        </p>

        {/* Progress bar for students */}
        {role === 'student' && typeof progress === 'number' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Progress</span>
              <span className="text-[12px] font-bold" style={{ color: 'var(--text-primary)' }}>{progress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: 'var(--brand-500)' }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            {role === 'student' ? (
              <div className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                <Video size={13} />
                <span>{lectures} Lectures</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  <Users size={13} />
                  <span>{enrollments}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  <BookOpen size={13} />
                  <span>{lectures}</span>
                </div>
              </>
            )}
          </div>
          <Link
            to={linkTo}
            className="flex items-center gap-1 text-[12px] font-bold transition-colors"
            style={{ color: 'var(--brand-500)' }}
          >
            {role === 'student' ? (
              <><PlayCircle size={14} /> Continue</>
            ) : (
              <>Manage <ArrowRight size={13} /></>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
