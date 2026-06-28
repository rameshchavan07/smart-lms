import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import { getIO } from '../utils/socket';

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
    const targetId = req.params.id as string; // this could be receiverId or groupId

    // Check if targetId is a group
    const group = await prisma.chatGroup.findUnique({ where: { id: targetId } });

    let messages;
    if (group) {
      messages = await prisma.message.findMany({
        where: { groupId: targetId },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, role: true, profileImage: true } }
        },
        orderBy: { createdAt: 'asc' }
      });
    } else {
      messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: targetId },
            { senderId: targetId, receiverId: userId }
          ]
        },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, role: true, profileImage: true } },
          receiver: { select: { id: true, firstName: true, lastName: true, role: true, profileImage: true } }
        },
        orderBy: { createdAt: 'asc' }
      });
    }

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId, groupId, content } = req.body;
    const senderId = req.user!.id;

    if (!receiverId && !groupId) {
      return res.status(400).json({ message: 'Must provide receiverId or groupId' });
    }

    let fileUrl: string | undefined;
    let fileType: string | undefined;
    let fileName: string | undefined;

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileType = req.file.mimetype;
      fileName = req.file.originalname;
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId: receiverId || null,
        groupId: groupId || null,
        content,
        fileUrl,
        fileType,
        fileName
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true, profileImage: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, role: true, profileImage: true } }
      }
    });

    const io = getIO();
    if (groupId) {
      io.to(`group_${groupId}`).emit('receive_message', message);
    } else if (receiverId) {
      io.to(receiverId).emit('receive_message', message);
      io.to(senderId).emit('receive_message', message);
    }

    res.status(201).json({ message: 'Message sent', data: message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

export const getContacts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    let peers: any[] = [];
    let teachers: any[] = [];
    let students: any[] = [];
    let groups: any[] = [];

    // Fetch groups user is part of
    groups = await prisma.chatGroup.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: { include: { user: { select: { id: true, firstName: true, lastName: true, profileImage: true } } } }
      }
    });

    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (student) {
        const enrollments = await prisma.enrollment.findMany({ where: { studentId: student.id } });
        const courseIds = enrollments.map(e => e.courseId);

        // Fetch teachers of these courses
        const courses = await prisma.course.findMany({
          where: { id: { in: courseIds } },
          include: { teacher: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true, profileImage: true } } } } }
        });
        
        courses.forEach(c => {
          if (c.teacher?.user && !teachers.some(t => t.id === c.teacher!.user.id)) {
            teachers.push(c.teacher.user);
          }
        });

        // Fetch other students in these courses
        const peerEnrollments = await prisma.enrollment.findMany({
          where: { courseId: { in: courseIds }, studentId: { not: student.id } },
          include: { student: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true, profileImage: true } } } } }
        });

        peerEnrollments.forEach(e => {
          if (e.student?.user && !peers.some(p => p.id === e.student!.user.id)) {
            peers.push(e.student.user);
          }
        });
      }
    } else if (role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId } });
      if (teacher) {
        const courses = await prisma.course.findMany({ where: { teacherId: teacher.id } });
        const courseIds = courses.map(c => c.id);

        const enrollments = await prisma.enrollment.findMany({
          where: { courseId: { in: courseIds } },
          include: { student: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true, profileImage: true } } } } }
        });

        enrollments.forEach(e => {
          if (e.student?.user && !students.some(s => s.id === e.student!.user.id)) {
            students.push(e.student.user);
          }
        });
      }
    }

    res.json({ contacts: { peers, teachers, students, groups } });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Failed to fetch contacts' });
  }
};

export const createGroupChat = async (req: AuthRequest, res: Response) => {
  try {
    const { name, courseId, memberIds } = req.body;
    const userId = req.user!.id;

    if (!name || !memberIds || memberIds.length === 0) {
      return res.status(400).json({ message: 'Name and memberIds are required' });
    }

    const membersData = memberIds.map((id: string) => ({ userId: id }));
    if (!membersData.some((m: any) => m.userId === userId)) {
      membersData.push({ userId }); // add creator
    }

    const group = await prisma.chatGroup.create({
      data: {
        name,
        courseId: courseId || null,
        members: {
          create: membersData
        }
      },
      include: {
        members: { include: { user: { select: { id: true, firstName: true, lastName: true, profileImage: true } } } }
      }
    });

    res.status(201).json({ message: 'Group chat created', group });
  } catch (error) {
    console.error('Create group chat error:', error);
    res.status(500).json({ message: 'Failed to create group chat' });
  }
};
