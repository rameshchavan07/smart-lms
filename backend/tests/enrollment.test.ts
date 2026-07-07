import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../src/config/redis', () => ({
  default: {
    get:  vi.fn(async () => null),
    set:  vi.fn(async () => 'OK'),
    del:  vi.fn(async () => 1),
    scan: vi.fn(async () => ['0', []]),
  },
}));

vi.mock('../src/config/db', () => ({
  default: {
    enrollment: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
    student:    { findUnique: vi.fn() },
    course:     { findUnique: vi.fn() },
    teacher:    { findUnique: vi.fn() },
  },
}));

vi.mock('../src/utils/auditLogger', () => ({ logActivity: vi.fn() }));

// ─── Imports after mocks ──────────────────────────────────────────────────────
import prisma from '../src/config/db';
import {
  enrollStudent,
  unenrollStudent,
  getMyEnrolledCourses,
  getCourseStudents,
} from '../src/controllers/enrollmentController';
import { globalErrorHandler } from '../src/middleware/errorHandler';

// ─── Build test app ───────────────────────────────────────────────────────────
function buildApp(role: string, userId = 'user-admin-1') {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use((req: express.Request & { user?: unknown }, _res, next) => {
    req.user = { id: userId, role: role as any, firstName: 'Test', lastName: 'User', email: 'test@lms.com', instituteId: 'inst-1' } as any;
    next();
  });
  app.post('/api/enrollments', enrollStudent);
  app.delete('/api/enrollments/:courseId/:studentId', unenrollStudent);
  app.get('/api/enrollments/my', getMyEnrolledCourses);
  app.get('/api/courses/:courseId/students', getCourseStudents);
  
  // Must be after routes
  app.use(globalErrorHandler as any);
  return app;
}

// ─── Shared data ──────────────────────────────────────────────────────────────
const STUDENT = { id: 'student-1', userId: 'user-student-1', user: { instituteId: 'inst-1' } };
const COURSE  = { id: 'course-1', title: 'Math 101', teacherId: 'teacher-1', instituteId: 'inst-1' };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Enrollment Controller — enrollStudent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 when student does not exist', async () => {
    (prisma.student.findUnique as any).mockResolvedValueOnce(null);

    const res = await request(buildApp('ADMIN'))
      .post('/api/enrollments')
      .send({ studentId: 'bad-student', courseId: COURSE.id });

    expect(res.status).toBe(404);
  });

  it('returns 404 when course does not exist', async () => {
    (prisma.student.findUnique as any).mockResolvedValueOnce(STUDENT);
    (prisma.course.findUnique as any).mockResolvedValueOnce(null);

    const res = await request(buildApp('ADMIN'))
      .post('/api/enrollments')
      .send({ studentId: STUDENT.id, courseId: 'bad-course' });

    expect(res.status).toBe(404);
  });

  it('returns 400 when student is already enrolled', async () => {
    (prisma.student.findUnique as any).mockResolvedValueOnce(STUDENT);
    (prisma.course.findUnique as any).mockResolvedValueOnce(COURSE);
    (prisma.enrollment.findUnique as any).mockResolvedValueOnce({ studentId: STUDENT.id, courseId: COURSE.id });

    const res = await request(buildApp('ADMIN'))
      .post('/api/enrollments')
      .send({ studentId: STUDENT.id, courseId: COURSE.id });

    expect(res.status).toBe(400);
  });

  it('enrolls successfully and returns 201', async () => {
    (prisma.student.findUnique as any).mockResolvedValueOnce(STUDENT);
    (prisma.course.findUnique as any).mockResolvedValueOnce(COURSE);
    (prisma.enrollment.findUnique as any).mockResolvedValueOnce(null);
    (prisma.enrollment.create as any).mockResolvedValueOnce({
      id:        'enroll-1',
      studentId: STUDENT.id,
      courseId:  COURSE.id,
      student:   { user: { firstName: 'Alice', lastName: 'Smith', email: 'alice@x.com' } },
      course:    { title: 'Math 101' },
    });

    const res = await request(buildApp('ADMIN'))
      .post('/api/enrollments')
      .send({ studentId: STUDENT.id, courseId: COURSE.id });

    expect(res.status).toBe(201);
    expect(res.body.message).toContain('enrolled');
    expect(prisma.enrollment.create).toHaveBeenCalledTimes(1);
  });
});

describe('Enrollment Controller — unenrollStudent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 when course does not exist', async () => {
    (prisma.course.findUnique as any).mockResolvedValueOnce(null);

    const res = await request(buildApp('ADMIN'))
      .delete(`/api/enrollments/${COURSE.id}/bad-student`);

    expect(res.status).toBe(404);
  });

  it('returns 200 on successful unenrollment', async () => {
    (prisma.course.findUnique as any).mockResolvedValueOnce(COURSE);
    (prisma.enrollment.delete as any).mockResolvedValueOnce({
      id:      'enroll-1',
      student: { user: { firstName: 'Alice', lastName: 'Smith' } },
      course:  { title: 'Math 101' },
    });

    const res = await request(buildApp('ADMIN'))
      .delete(`/api/enrollments/${COURSE.id}/${STUDENT.id}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('unenrolled');
  });
});

describe('Enrollment Controller — getMyEnrolledCourses', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 403 when called by a non-student role', async () => {
    const res = await request(buildApp('TEACHER')).get('/api/enrollments/my');
    expect(res.status).toBe(403);
  });

  it('returns 404 when student profile does not exist', async () => {
    (prisma.student.findUnique as any).mockResolvedValueOnce(null);

    const res = await request(buildApp('STUDENT', 'user-no-profile'))
      .get('/api/enrollments/my');

    expect(res.status).toBe(404);
  });

  it('returns enrolled courses for a valid student', async () => {
    (prisma.student.findUnique as any).mockResolvedValueOnce(STUDENT);
    (prisma.enrollment.findMany as any).mockResolvedValueOnce([
      {
        courseId: COURSE.id,
        course: {
          ...COURSE,
          teacher: { user: { firstName: 'Prof', lastName: 'X' } },
          _count:  { lectures: 5 },
        },
      },
    ]);

    const res = await request(buildApp('STUDENT', 'user-student-1'))
      .get('/api/enrollments/my');

    expect(res.status).toBe(200);
    expect(res.body.enrollments).toHaveLength(1);
    expect(res.body.enrollments[0].courseId).toBe(COURSE.id);
  });
});
