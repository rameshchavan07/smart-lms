import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/auditLogger';
import { catchAsync } from '../utils/catchAsync';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../utils/AppError';
import { getCache, setCache, invalidateCacheByPattern } from '../utils/cache';
import { CACHE_KEYS, CACHE_TTL } from '../utils/cacheKeys';

import prisma from '../config/db';

// Enroll a student in a course (Admin / Teacher)
export const enrollStudent = catchAsync(async (req: AuthRequest, res: Response) => {
  const { studentId, courseId } = req.body;

  // Verify student exists and belongs to institute
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true }
  });
  if (!student) throw new NotFoundError('Student not found');
  if (req.user!.role !== 'SUPER_ADMIN' && student.user.instituteId !== req.user!.instituteId) {
    throw new ForbiddenError('Permission denied');
  }

  // Verify course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId }
  });
  if (!course) throw new NotFoundError('Course not found');
  if (req.user!.role !== 'SUPER_ADMIN' && course.instituteId !== req.user!.instituteId) {
    throw new ForbiddenError('Permission denied');
  }

  // Teacher authorization check
  if (req.user!.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user!.id }
    });
    if (!teacher || course.teacherId !== teacher.id) {
      throw new ForbiddenError('You are not authorized to enroll students in this course');
    }
  }

  // Check if already enrolled
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: { studentId, courseId }
    }
  });

  if (existingEnrollment) {
    throw new ValidationError('Student is already enrolled in this course');
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      studentId,
      courseId
    },
    include: {
      student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      course: { select: { title: true } }
    }
  });

  await logActivity(req.user!.id, `Enrolled student: ${enrollment.student.user.firstName} ${enrollment.student.user.lastName} in ${enrollment.course.title}`, 'Enrollment', enrollment.id);
  // Invalidate the student's enrollment cache so next read reflects new enrollment
  await invalidateCacheByPattern(CACHE_KEYS.MY_ENROLLMENTS_PATTERN(enrollment.studentId));
  res.status(201).json({ message: 'Student enrolled successfully', enrollment });
});

// Unenroll a student from a course (Admin / Teacher)
export const unenrollStudent = catchAsync(async (req: AuthRequest, res: Response) => {
  const { courseId, studentId } = req.params;

  // Verify course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId as string }
  });
  if (!course) throw new NotFoundError('Course not found');
  if (req.user!.role !== 'SUPER_ADMIN' && course.instituteId !== req.user!.instituteId) {
    throw new ForbiddenError('Permission denied');
  }

  // Teacher authorization check
  if (req.user!.role === 'TEACHER') {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user!.id }
    });
    if (!teacher || course.teacherId !== teacher.id) {
      throw new ForbiddenError('You are not authorized to unenroll students from this course');
    }
  }

  try {
    const deleted = await prisma.enrollment.delete({
      where: {
        studentId_courseId: { studentId: studentId as string, courseId: courseId as string }
      },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        course: { select: { title: true } }
      }
    });

    await logActivity(req.user!.id, `Unenrolled student: ${deleted.student.user.firstName} ${deleted.student.user.lastName} from ${deleted.course.title}`, 'Enrollment', deleted.id);

    res.json({ message: 'Student unenrolled successfully' });
  } catch (error) {
    // If record not found, Prisma throws an error
    throw new ValidationError('Failed to unenroll student or record not found');
  }
});

// Get students enrolled in a specific course
export const getCourseStudents = catchAsync(async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;

  const course = await prisma.course.findUnique({ where: { id: courseId as string } });
  if (!course) throw new NotFoundError('Course not found');
  if (req.user!.role !== 'SUPER_ADMIN' && course.instituteId !== req.user!.instituteId) {
    throw new ForbiddenError('Permission denied');
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: courseId as string },
    include: {
      student: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phoneNumber: true, address: true } }
        }
      }
    },
    orderBy: { enrolledAt: 'desc' }
  });

  res.json({ enrollments });
});

// Get courses enrolled by the current student
export const getMyEnrolledCourses = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'STUDENT') {
    throw new ForbiddenError('Access denied');
  }

  const student = await prisma.student.findUnique({
    where: { userId: req.user.id }
  });

  if (!student) {
    throw new NotFoundError('Student record not found');
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 100;
  const cacheKey = CACHE_KEYS.MY_ENROLLMENTS(req.user.id, page, limit);
  const cached = await getCache<object>(cacheKey);
  if (cached) return res.json(cached);

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: student.id },
    include: {
      course: {
        include: {
          teacher: {
            include: { user: { select: { firstName: true, lastName: true } } }
          },
          _count: { select: { lectures: true } }
        }
      }
    },
    orderBy: { enrolledAt: 'desc' }
  });

  const payload = { enrollments };
  await setCache(cacheKey, payload, CACHE_TTL.MY_ENROLLMENTS);
  res.json(payload);
});

// Get all enrollments across all courses for the current teacher
export const getTeacherEnrollments = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'TEACHER') {
    throw new ForbiddenError('Access denied');
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: req.user.id }
  });

  if (!teacher) {
    throw new NotFoundError('Teacher record not found');
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      course: { teacherId: teacher.id }
    },
    include: {
      student: {
        include: { user: { select: { firstName: true, lastName: true, email: true } } }
      },
      course: { select: { title: true, id: true } }
    },
    orderBy: { enrolledAt: 'desc' }
  });

  // Mock progress calculation just to satisfy UI requirements
  const enrollmentsWithProgress = enrollments.map(e => ({
    ...e,
    progress: Math.floor(Math.random() * 100), 
    status: 'Active'
  }));

  res.json({ enrollments: enrollmentsWithProgress });
});
