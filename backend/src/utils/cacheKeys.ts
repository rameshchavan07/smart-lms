/**
 * Centralized cache key definitions.
 * Using functions for dynamic keys ensures consistency across get/set/invalidate operations.
 */
export const CACHE_KEYS = {
  // Analytics
  ADMIN_STATS: 'analytics:admin_stats',
  TEACHER_STATS: (teacherId: string) => `analytics:teacher_stats:${teacherId}`,
  STUDENT_STATS: (studentId: string) => `analytics:student_stats:${studentId}`,

  // Courses
  COURSES: (instituteId: string | null, page: number, limit: number, search: string) =>
    `courses:inst:${instituteId ?? 'all'}:page:${page}:limit:${limit}:search:${search ?? ''}`,
  TEACHER_COURSES: (teacherId: string) => `courses:teacher:${teacherId}`,
  COURSE_PATTERN: 'courses:*',

  // Users
  USERS: (page: number, limit: number, role: string, search: string) =>
    `users:page:${page}:limit:${limit}:role:${role ?? ''}:search:${search ?? ''}`,
  USERS_PATTERN: 'users:*',

  // Enrollments
  MY_ENROLLMENTS: (userId: string, page: number, limit: number) =>
    `enrollments:user:${userId}:page:${page}:limit:${limit}`,
  MY_ENROLLMENTS_PATTERN: (userId: string) => `enrollments:user:${userId}:*`,
} as const;

/**
 * Default TTL values in seconds.
 */
export const CACHE_TTL = {
  ADMIN_STATS: 5 * 60,         // 5 minutes
  TEACHER_STATS: 5 * 60,       // 5 minutes
  STUDENT_STATS: 5 * 60,       // 5 minutes
  COURSES: 2 * 60,             // 2 minutes
  TEACHER_COURSES: 5 * 60,     // 5 minutes
  USERS: 2 * 60,               // 2 minutes
  MY_ENROLLMENTS: 5 * 60,      // 5 minutes
} as const;
