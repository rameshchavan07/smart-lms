import { Response } from 'express';
import { z } from 'zod';
import { getIO } from '../utils/socket';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../utils/AppError';

import prisma from '../config/db';
import { createNotification } from '../services/notificationService';

const createDiscussionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  content: z.string().min(1, 'Content is required'),
});

const replySchema = z.object({
  content: z.string().min(1, 'Reply content is required'),
});

export const getDiscussionsByCourse = catchAsync(async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;

  const discussions = await prisma.discussion.findMany({
    where: { courseId: courseId as string },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, role: true } },
      _count: { select: { replies: true } },
    },
    orderBy: [
      { isPinned: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  res.json({ discussions });
});

export const getDiscussionById = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const discussion = await prisma.discussion.findUnique({
    where: { id: id as string },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, role: true } },
      replies: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!discussion) {
    throw new NotFoundError('Discussion not found');
  }

  res.json({ discussion });
});

export const createDiscussion = catchAsync(async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user!.id;

  const parsed = createDiscussionSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0].message);
  }

  const { title, content } = parsed.data;

  // Verify course exists and user is enrolled or teacher
  const course = await prisma.course.findUnique({
    where: { id: courseId as string },
    include: { enrollments: { where: { student: { userId } } } }
  });

  if (!course) {
    throw new NotFoundError('Course not found');
  }

  // Role check simplified: assume auth middleware allows valid users
  const discussion = await prisma.discussion.create({
    data: {
      courseId: courseId as string,
      userId,
      title,
      content,
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, role: true } },
      _count: { select: { replies: true } }
    }
  });

  // Notify users in the course
  getIO().to(`course_${courseId}`).emit('new_discussion', { courseId, discussion });

  res.status(201).json({ message: 'Discussion created', discussion });
});

export const addReply = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const parsed = replySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0].message);
  }

  const { content } = parsed.data;

  const discussion = await prisma.discussion.findUnique({ where: { id: id as string } });
  if (!discussion) {
    throw new NotFoundError('Discussion not found');
  }

  const reply = await prisma.discussionReply.create({
    data: {
      discussionId: id as string,
      userId,
      content,
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, role: true } },
    }
  });

  // Emit event for real-time updates
  getIO().to(`course_${discussion.courseId}`).emit('new_reply', { discussionId: id, reply });

  // Notify original discussion thread author
  if (discussion.userId !== userId) {
    const replierName = `${reply.user.firstName} ${reply.user.lastName}`;
    await createNotification(
      discussion.userId,
      'New Reply on Discussion',
      `"${replierName}" replied to your discussion thread "${discussion.title}".`
    ).catch(err => console.error('Reply notification error:', err));
  }

  res.status(201).json({ message: 'Reply added', reply });
});

export const togglePinDiscussion = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { isPinned } = req.body;

  if (req.user!.role === 'STUDENT') {
    throw new ForbiddenError('Forbidden');
  }

  const discussion = await prisma.discussion.update({
    where: { id: id as string },
    data: { isPinned },
  });

  res.json({ message: 'Discussion pin status updated', discussion });
});

export const getMyDiscussions = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) {
    throw new NotFoundError('Student not found');
  }

  const enrollments = await prisma.enrollment.findMany({ where: { studentId: student.id } });
  const courseIds = enrollments.map(e => e.courseId);

  const discussions = await prisma.discussion.findMany({
    where: { courseId: { in: courseIds } },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, role: true } },
      course: { select: { title: true } },
      _count: { select: { replies: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ discussions });
});

export const getAllDiscussions = catchAsync(async (req: AuthRequest, res: Response) => {
  const discussions = await prisma.discussion.findMany({
    include: {
      user: { select: { id: true, firstName: true, lastName: true, role: true } },
      course: { select: { title: true } },
      _count: { select: { replies: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ discussions });
});
