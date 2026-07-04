import { Response } from 'express';
import { z } from 'zod';
import { getIO } from '../utils/socket';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../utils/AppError';
import { getCache, setCache, invalidateCache } from '../utils/cache';
import { CACHE_KEYS, CACHE_TTL } from '../utils/cacheKeys';

import prisma from '../config/db';
import { sendNotification } from '../services/notifications.service';

const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  dueDate: z.coerce.date(),
  totalMarks: z.number().positive(),
  rubric: z.any().optional(),
});

const gradeSubmissionSchema = z.object({
  marks: z.number().min(0),
  feedback: z.string().optional(),
  rubricEvaluation: z.any().optional(),
});

export const getAssignmentsByCourse = catchAsync(async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;

  const cacheKey = CACHE_KEYS.COURSE_ASSIGNMENTS(courseId as string);
  const cached = await getCache<object>(cacheKey);
  if (cached) return res.json(cached);

  const assignments = await prisma.assignment.findMany({
    where: { courseId: courseId as string },
    include: {
      _count: { select: { submissions: true } },
    },
    orderBy: { dueDate: 'asc' },
  });

  const payload = { assignments };
  await setCache(cacheKey, payload, CACHE_TTL.COURSE_ASSIGNMENTS);
  res.json(payload);
});

export const createAssignment = catchAsync(async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const parsed = createAssignmentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0].message);
  }
  const { title, description, dueDate, totalMarks, rubric } = parsed.data;

  const assignment = await prisma.assignment.create({
    data: {
      courseId: courseId as string,
      title,
      description,
      dueDate: new Date(dueDate),
      totalMarks,
      rubric: rubric || null,
    },
  });

  getIO().to(`course_${courseId}`).emit('new_assignment', { courseId, assignment });

  // Invalidate course assignments and teacher assessments caches
  await invalidateCache(CACHE_KEYS.COURSE_ASSIGNMENTS(courseId as string));

  // Notify enrolled students
  const course = await prisma.course.findUnique({
    where: { id: courseId as string },
    select: { title: true }
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: courseId as string },
    include: { student: { select: { userId: true } } }
  });

  await Promise.all(
    enrollments.map(e =>
      sendNotification(
        e.student.userId,
        'New Assignment Posted',
        `A new assignment "${title}" has been posted in course "${course?.title || ''}".`
      ).catch(err => console.error('Assignment notification error:', err))
    )
  );

  res.status(201).json({ message: 'Assignment created', assignment });
});

export const submitAssignment = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // assignmentId
  const userId = req.user!.id;
  const { fileUrl } = req.body;

  if (!fileUrl) {
    throw new ValidationError('File URL is required');
  }

  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) {
    throw new NotFoundError('Student not found');
  }

  const submission = await prisma.assignmentSubmission.create({
    data: {
      assignmentId: id as string,
      studentId: student.id,
      fileUrl,
    },
  });

  // Invalidate student-specific assignment and submission caches
  await invalidateCache(CACHE_KEYS.STUDENT_ASSIGNMENTS(student.id));
  await invalidateCache(CACHE_KEYS.MY_SUBMISSIONS(student.id));

  res.status(201).json({ message: 'Assignment submitted successfully', submission });
});

export const gradeSubmission = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // submissionId
  const parsed = gradeSubmissionSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0].message);
  }

  const { marks, feedback, rubricEvaluation } = parsed.data;

  const submission = await prisma.assignmentSubmission.update({
    where: { id: id as string },
    data: { marks, feedback, rubricEvaluation: rubricEvaluation || null },
    include: {
      student: { select: { userId: true } },
      assignment: { select: { courseId: true, title: true } },
    }
  });

  // Notify student that their assignment was graded
  const studentUser = await prisma.user.findFirst({ where: { student: { id: submission.studentId } } });
  if (studentUser) {
    getIO().to(studentUser.id).emit('assignment_graded', {
      courseId: submission.assignment.courseId,
      assignmentTitle: submission.assignment.title,
      marks,
      submissionId: id
    });
  }

  await sendNotification(
    submission.student.userId,
    'Assignment Graded',
    `Your submission for "${submission.assignment.title}" has been graded: ${marks} marks.`
  ).catch(err => console.error('Grading notification error:', err));

  // Invalidate student assignment/submission caches (status changes) and teacher assessments (submission counts change)
  await invalidateCache(CACHE_KEYS.STUDENT_ASSIGNMENTS(submission.studentId));
  await invalidateCache(CACHE_KEYS.MY_SUBMISSIONS(submission.studentId));

  res.json({ message: 'Submission graded', submission });
});

export const getSubmissionsForAssignment = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const submissions = await prisma.assignmentSubmission.findMany({
    where: { assignmentId: id as string },
    include: {
      student: {
        include: { user: { select: { firstName: true, lastName: true, email: true } } }
      }
    },
    orderBy: { submittedAt: 'desc' }
  });
  res.json({ submissions });
});

export const getMySubmissions = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) {
    throw new NotFoundError('Student not found');
  }

  const cacheKey = CACHE_KEYS.MY_SUBMISSIONS(student.id);
  const cached = await getCache<object>(cacheKey);
  if (cached) return res.json(cached);

  const submissions = await prisma.assignmentSubmission.findMany({
    where: { studentId: student.id },
    include: { assignment: true },
    orderBy: { submittedAt: 'desc' }
  });

  const payload = { submissions };
  await setCache(cacheKey, payload, CACHE_TTL.MY_SUBMISSIONS);
  res.json(payload);
});

export const getTeacherAssessments = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) {
    throw new NotFoundError('Teacher not found');
  }

  const cacheKey = CACHE_KEYS.TEACHER_ASSESSMENTS(teacher.id);
  const cached = await getCache<object>(cacheKey);
  if (cached) return res.json(cached);

  const assignments = await prisma.assignment.findMany({
    where: { course: { teacherId: teacher.id } },
    include: {
      course: { select: { title: true, _count: { select: { enrollments: true } } } },
      _count: { select: { submissions: true } }
    }
  });

  const quizzes = await prisma.quiz.findMany({
    where: { course: { teacherId: teacher.id } },
    include: {
      course: { select: { title: true, _count: { select: { enrollments: true } } } },
      _count: { select: { submissions: true } }
    }
  });

  const formattedAssignments = assignments.map(a => ({
    id: a.id,
    title: a.title,
    type: 'Assignment',
    course: a.course.title,
    submissions: a._count.submissions,
    total: a.course._count.enrollments,
    status: a.dueDate > new Date() ? 'Active' : 'Completed',
    createdAt: a.createdAt
  }));

  const formattedQuizzes = quizzes.map(q => ({
    id: q.id,
    title: q.title,
    type: 'Quiz',
    course: q.course.title,
    submissions: q._count.submissions,
    total: q.course._count.enrollments,
    status: 'Active',
    createdAt: q.createdAt
  }));

  const allAssessments = [...formattedAssignments, ...formattedQuizzes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const payload = { assessments: allAssessments };
  await setCache(cacheKey, payload, CACHE_TTL.TEACHER_ASSESSMENTS);
  res.json(payload);
});

export const getAdminAssessments = catchAsync(async (req: AuthRequest, res: Response) => {
  const assignments = await prisma.assignment.findMany({
    include: {
      course: { select: { title: true, _count: { select: { enrollments: true } } } },
      _count: { select: { submissions: true } }
    }
  });

  const quizzes = await prisma.quiz.findMany({
    include: {
      course: { select: { title: true, _count: { select: { enrollments: true } } } },
      _count: { select: { submissions: true } }
    }
  });

  const formattedAssignments = assignments.map(a => ({
    id: a.id,
    title: a.title,
    type: 'Assignment',
    course: a.course.title,
    submissions: a._count.submissions,
    total: a.course._count.enrollments,
    status: a.dueDate > new Date() ? 'Active' : 'Completed',
    createdAt: a.createdAt
  }));

  const formattedQuizzes = quizzes.map(q => ({
    id: q.id,
    title: q.title,
    type: 'Quiz',
    course: q.course.title,
    submissions: q._count.submissions,
    total: q.course._count.enrollments,
    status: 'Active',
    createdAt: q.createdAt
  }));

  const allAssessments = [...formattedAssignments, ...formattedQuizzes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json({ assessments: allAssessments });
});

export const getStudentAssignments = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) {
    throw new NotFoundError('Student not found');
  }

  const cacheKey = CACHE_KEYS.STUDENT_ASSIGNMENTS(student.id);
  const cached = await getCache<object>(cacheKey);
  if (cached) return res.json(cached);

  const enrollments = await prisma.enrollment.findMany({ where: { studentId: student.id } });
  const courseIds = enrollments.map(e => e.courseId);

  const assignments = await prisma.assignment.findMany({
    where: { courseId: { in: courseIds } },
    include: {
      course: { select: { title: true } },
      submissions: {
        where: { studentId: student.id },
        select: { id: true, marks: true }
      }
    }
  });

  const formatted = assignments.map(a => {
    const submission = a.submissions[0];
    let currentStatus = 'Pending';
    if (submission) {
      currentStatus = submission.marks !== null ? 'GRADED' : 'SUBMITTED';
    }
    
    return {
      id: a.id,
      title: a.title,
      course: a.course.title,
      courseId: a.courseId,
      dueDate: a.dueDate,
      status: currentStatus,
      grade: submission?.marks || null,
      maxGrade: a.totalMarks,
      createdAt: a.createdAt
    };
  });

  const payload = { assignments: formatted };
  await setCache(cacheKey, payload, CACHE_TTL.STUDENT_ASSIGNMENTS);
  res.json(payload);
});
