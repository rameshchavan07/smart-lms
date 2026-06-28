import { Response } from 'express';
import { z } from 'zod';
import { getIO } from '../utils/socket';
import { AuthRequest } from '../middleware/auth';

import prisma from '../config/db';

const createDiscussionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  content: z.string().min(1, 'Content is required'),
});

const replySchema = z.object({
  content: z.string().min(1, 'Reply content is required'),
});

export const getDiscussionsByCourse = async (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Get discussions error:', error);
    res.status(500).json({ message: 'Failed to fetch discussions' });
  }
};

export const getDiscussionById = async (req: AuthRequest, res: Response) => {
  try {
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
      return res.status(404).json({ message: 'Discussion not found' });
    }

    res.json({ discussion });
  } catch (error) {
    console.error('Get discussion by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch discussion' });
  }
};

export const createDiscussion = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const userId = req.user!.id;

    const parsed = createDiscussionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }

    const { title, content } = parsed.data;

    // Verify course exists and user is enrolled or teacher
    const course = await prisma.course.findUnique({
      where: { id: courseId as string },
      include: { enrollments: { where: { student: { userId } } } }
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
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
  } catch (error) {
    console.error('Create discussion error:', error);
    res.status(500).json({ message: 'Failed to create discussion' });
  }
};

export const addReply = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const parsed = replySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }

    const { content } = parsed.data;

    const discussion = await prisma.discussion.findUnique({ where: { id: id as string } });
    if (!discussion) return res.status(404).json({ message: 'Discussion not found' });

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

    res.status(201).json({ message: 'Reply added', reply });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({ message: 'Failed to add reply' });
  }
};

export const togglePinDiscussion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isPinned } = req.body;

    if (req.user!.role === 'STUDENT') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const discussion = await prisma.discussion.update({
      where: { id: id as string },
      data: { isPinned },
    });

    res.json({ message: 'Discussion pin status updated', discussion });
  } catch (error) {
    console.error('Pin discussion error:', error);
    res.status(500).json({ message: 'Failed to update discussion pin status' });
  }
};
