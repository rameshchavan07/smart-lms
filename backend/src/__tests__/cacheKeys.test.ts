import { describe, it, expect } from 'vitest';
import { CACHE_KEYS, CACHE_TTL } from '../utils/cacheKeys';

describe('CACHE_KEYS', () => {
  describe('Analytics keys', () => {
    it('ADMIN_STATS is a fixed string', () => {
      expect(CACHE_KEYS.ADMIN_STATS).toBe('analytics:admin_stats');
    });

    it('TEACHER_STATS generates a key scoped to teacherId', () => {
      expect(CACHE_KEYS.TEACHER_STATS('t-123')).toBe('analytics:teacher_stats:t-123');
    });

    it('STUDENT_STATS generates a key scoped to studentId', () => {
      expect(CACHE_KEYS.STUDENT_STATS('s-456')).toBe('analytics:student_stats:s-456');
    });

    it('TEACHER_STATS is unique per teacher', () => {
      expect(CACHE_KEYS.TEACHER_STATS('t-1')).not.toBe(CACHE_KEYS.TEACHER_STATS('t-2'));
    });
  });

  describe('Institute keys', () => {
    it('INSTITUTE_SLUG is scoped to slug', () => {
      expect(CACHE_KEYS.INSTITUTE_SLUG('test-institute')).toBe('institute:slug:test-institute');
    });

    it('INSTITUTE_PATTERN is a glob for all institute keys', () => {
      expect(CACHE_KEYS.INSTITUTE_PATTERN).toBe('institute:*');
    });
  });

  describe('Course keys', () => {
    it('COURSES encodes all params into the key', () => {
      const key = CACHE_KEYS.COURSES('inst-1', 1, 10, 'math');
      expect(key).toContain('inst-1');
      expect(key).toContain('page:1');
      expect(key).toContain('limit:10');
      expect(key).toContain('search:math');
    });

    it('COURSES with null instituteId uses "all"', () => {
      const key = CACHE_KEYS.COURSES(null, 1, 10, '');
      expect(key).toContain('inst:all');
    });

    it('TEACHER_COURSES is scoped to teacherId', () => {
      expect(CACHE_KEYS.TEACHER_COURSES('teacher-99')).toBe('courses:teacher:teacher-99');
    });
  });

  describe('User keys', () => {
    it('USERS encodes page, limit, role, and search', () => {
      const key = CACHE_KEYS.USERS(2, 20, 'STUDENT', 'alice');
      expect(key).toContain('page:2');
      expect(key).toContain('limit:20');
      expect(key).toContain('role:STUDENT');
      expect(key).toContain('search:alice');
    });

    it('USERS_PATTERN is a glob for all user keys', () => {
      expect(CACHE_KEYS.USERS_PATTERN).toBe('users:*');
    });
  });

  describe('Enrollment keys', () => {
    it('MY_ENROLLMENTS encodes userId, page, and limit', () => {
      const key = CACHE_KEYS.MY_ENROLLMENTS('user-1', 1, 100);
      expect(key).toContain('user-1');
      expect(key).toContain('page:1');
      expect(key).toContain('limit:100');
    });

    it('MY_ENROLLMENTS_PATTERN matches all pages for a user', () => {
      const pattern = CACHE_KEYS.MY_ENROLLMENTS_PATTERN('user-1');
      expect(pattern).toContain('user-1');
      expect(pattern).toContain('*');
    });
  });

  describe('Lecture keys', () => {
    it('COURSE_LECTURES is scoped to courseId', () => {
      expect(CACHE_KEYS.COURSE_LECTURES('course-abc')).toBe('lectures:course:course-abc');
    });

    it('COURSE_LECTURES is unique per course', () => {
      expect(CACHE_KEYS.COURSE_LECTURES('c-1')).not.toBe(CACHE_KEYS.COURSE_LECTURES('c-2'));
    });
  });

  describe('Study Material keys', () => {
    it('COURSE_MATERIALS is scoped to courseId', () => {
      expect(CACHE_KEYS.COURSE_MATERIALS('course-xyz')).toBe('materials:course:course-xyz');
    });
  });

  describe('Assignment keys', () => {
    it('COURSE_ASSIGNMENTS is scoped to courseId', () => {
      expect(CACHE_KEYS.COURSE_ASSIGNMENTS('c-1')).toBe('assignments:course:c-1');
    });

    it('TEACHER_ASSESSMENTS is scoped to teacherId', () => {
      expect(CACHE_KEYS.TEACHER_ASSESSMENTS('t-1')).toBe('assessments:teacher:t-1');
    });

    it('STUDENT_ASSIGNMENTS is scoped to studentId', () => {
      expect(CACHE_KEYS.STUDENT_ASSIGNMENTS('s-1')).toBe('assignments:student:s-1');
    });

    it('MY_SUBMISSIONS is scoped to studentId', () => {
      expect(CACHE_KEYS.MY_SUBMISSIONS('s-2')).toBe('submissions:student:s-2');
    });
  });

  describe('Quiz keys', () => {
    it('COURSE_QUIZZES is scoped to courseId', () => {
      expect(CACHE_KEYS.COURSE_QUIZZES('c-99')).toBe('quizzes:course:c-99');
    });

    it('QUIZ_DETAIL is scoped to quizId', () => {
      expect(CACHE_KEYS.QUIZ_DETAIL('quiz-42')).toBe('quizzes:detail:quiz-42');
    });

    it('QUIZ_DETAIL is unique per quiz', () => {
      expect(CACHE_KEYS.QUIZ_DETAIL('q-1')).not.toBe(CACHE_KEYS.QUIZ_DETAIL('q-2'));
    });
  });
});

describe('CACHE_TTL', () => {
  it('all TTL values are positive integers', () => {
    Object.entries(CACHE_TTL).forEach(([key, value]) => {
      expect(value, `${key} should be a positive number`).toBeGreaterThan(0);
      expect(Number.isInteger(value), `${key} should be an integer`).toBe(true);
    });
  });

  it('QUIZ_DETAIL has the longest TTL (most static data)', () => {
    expect(CACHE_TTL.QUIZ_DETAIL).toBeGreaterThanOrEqual(CACHE_TTL.COURSE_QUIZZES);
    expect(CACHE_TTL.QUIZ_DETAIL).toBeGreaterThanOrEqual(CACHE_TTL.COURSE_ASSIGNMENTS);
  });

  it('STUDENT_ASSIGNMENTS has a short TTL (changes frequently)', () => {
    expect(CACHE_TTL.STUDENT_ASSIGNMENTS).toBeLessThanOrEqual(CACHE_TTL.COURSE_LECTURES);
  });
});
