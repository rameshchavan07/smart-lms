/**
 * Centralized cache key definitions.
 * Using functions for dynamic keys ensures consistency across get/set/invalidate operations.
 */
export const CACHE_KEYS = {
  // Analytics
  ADMIN_STATS: 'analytics:admin_stats',
  TEACHER_STATS: (teacherId: string) => `analytics:teacher_stats:${teacherId}`,
  STUDENT_STATS: (studentId: string) => `analytics:student_stats:${studentId}`,

  // Institutes
  INSTITUTE_SLUG: (slug: string) => `institute:slug:${slug}`,
  INSTITUTE_PATTERN: 'institute:*',


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

  // Lectures
  COURSE_LECTURES: (courseId: string) => `lectures:course:${courseId}`,
  COURSE_LECTURES_PATTERN: (courseId: string) => `lectures:course:${courseId}`,

  // Study Materials
  COURSE_MATERIALS: (courseId: string) => `materials:course:${courseId}`,
  COURSE_MATERIALS_PATTERN: (courseId: string) => `materials:course:${courseId}`,

  // Assignments
  COURSE_ASSIGNMENTS: (courseId: string) => `assignments:course:${courseId}`,
  COURSE_ASSIGNMENTS_PATTERN: (courseId: string) => `assignments:course:${courseId}`,
  TEACHER_ASSESSMENTS: (teacherId: string) => `assessments:teacher:${teacherId}`,
  TEACHER_ASSESSMENTS_PATTERN: (teacherId: string) => `assessments:teacher:${teacherId}`,
  STUDENT_ASSIGNMENTS: (studentId: string) => `assignments:student:${studentId}`,
  STUDENT_ASSIGNMENTS_PATTERN: (studentId: string) => `assignments:student:${studentId}`,
  MY_SUBMISSIONS: (studentId: string) => `submissions:student:${studentId}`,
  MY_SUBMISSIONS_PATTERN: (studentId: string) => `submissions:student:${studentId}`,

  // Quizzes
  COURSE_QUIZZES: (courseId: string) => `quizzes:course:${courseId}`,
  COURSE_QUIZZES_PATTERN: (courseId: string) => `quizzes:course:${courseId}`,
  QUIZ_DETAIL: (quizId: string) => `quizzes:detail:${quizId}`,
} as const;

/**
 * Default TTL values in seconds.
 */
export const CACHE_TTL = {
  ADMIN_STATS: 5 * 60,           // 5 minutes
  TEACHER_STATS: 5 * 60,         // 5 minutes
  STUDENT_STATS: 5 * 60,         // 5 minutes
  INSTITUTE_SLUG: 10 * 60,       // 10 minutes — rarely changes, high read traffic
  COURSES: 2 * 60,               // 2 minutes
  TEACHER_COURSES: 5 * 60,       // 5 minutes
  USERS: 2 * 60,                 // 2 minutes
  MY_ENROLLMENTS: 5 * 60,        // 5 minutes
  COURSE_LECTURES: 5 * 60,       // 5 minutes — updated rarely
  COURSE_MATERIALS: 5 * 60,      // 5 minutes — updated rarely
  COURSE_ASSIGNMENTS: 3 * 60,    // 3 minutes — due dates matter
  TEACHER_ASSESSMENTS: 3 * 60,   // 3 minutes — submission counts change
  STUDENT_ASSIGNMENTS: 2 * 60,   // 2 minutes — status changes on submission/grading
  MY_SUBMISSIONS: 2 * 60,        // 2 minutes — grading updates
  COURSE_QUIZZES: 5 * 60,        // 5 minutes — read-heavy, rarely changed
  QUIZ_DETAIL: 10 * 60,          // 10 minutes — very static once created
} as const;
