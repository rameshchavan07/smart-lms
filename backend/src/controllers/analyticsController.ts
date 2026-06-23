import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Admin Dashboard Analytics
export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await prisma.user.count();
    const totalTeachers = await prisma.user.count({ where: { role: 'TEACHER' } });
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
    const totalCourses = await prisma.course.count();
    const totalEnrollments = await prisma.enrollment.count();

    const recentCourses = await prisma.course.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        _count: { select: { enrollments: true } }
      }
    });

    res.json({
      metrics: {
        totalUsers,
        totalTeachers,
        totalStudents,
        totalCourses,
        totalEnrollments
      },
      recentCourses
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Teacher Dashboard Analytics
export const getTeacherStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user!.id }
    });

    if (!teacher) {
      res.status(404).json({ message: 'Teacher record not found' });
      return;
    }

    const totalCourses = await prisma.course.count({
      where: { teacherId: teacher.id }
    });

    const totalStudents = await prisma.enrollment.count({
      where: { course: { teacherId: teacher.id } }
    });

    res.json({
      metrics: {
        totalCourses,
        totalStudents
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Student Dashboard Analytics
export const getStudentStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id }
    });

    if (!student) {
      res.status(404).json({ message: 'Student record not found' });
      return;
    }

    const totalEnrollments = await prisma.enrollment.count({
      where: { studentId: student.id }
    });

    // In the future: active assignments, upcoming lectures
    res.json({
      metrics: {
        totalEnrollments
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
