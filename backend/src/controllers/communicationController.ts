import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';

export const getAnnouncements = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user!.role === 'TEACHER' 
      ? (await prisma.teacher.findUnique({ where: { userId: req.user!.id } }))?.id 
      : undefined;

    let whereClause = {};
    if (req.user!.role === 'TEACHER' && teacherId) {
      whereClause = { teacherId };
    } else if (req.user!.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
      if (student) {
        const enrollments = await prisma.enrollment.findMany({ where: { studentId: student.id } });
        const courseIds = enrollments.map(e => e.courseId);
        whereClause = {
          OR: [
            { courseId: { in: courseIds } },
            { courseId: null } // Global announcements for their courses (if mapped that way)
          ]
        };
      }
    }

    const announcements = await prisma.announcement.findMany({
      where: whereClause,
      include: {
        course: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ announcements });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ message: 'Failed to fetch announcements' });
  }
};

export const createAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, courseId } = req.body;
    let teacherId = null;

    if (req.user!.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: req.user!.id } });
      if (!teacher) return res.status(403).json({ message: 'Teacher record not found' });
      teacherId = teacher.id;
    } else if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only teachers or admins can create announcements' });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        courseId: courseId === 'All Courses' || !courseId ? null : courseId,
        teacherId
      },
      include: {
        course: { select: { title: true } }
      }
    });

    res.status(201).json({ message: 'Announcement created', announcement });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ message: 'Failed to create announcement' });
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user!.id;

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, role: true } }
      }
    });
    res.status(201).json({ message: 'Message sent', data: message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};
