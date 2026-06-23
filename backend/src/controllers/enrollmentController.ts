import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Enroll a student in a course (Admin)
export const enrollStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, courseId } = req.body;

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });
    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId }
      }
    });

    if (existingEnrollment) {
      res.status(400).json({ message: 'Student is already enrolled in this course' });
      return;
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

    res.status(201).json({ message: 'Student enrolled successfully', enrollment });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Unenroll a student from a course (Admin)
export const unenrollStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId, studentId } = req.params;

    await prisma.enrollment.delete({
      where: {
        studentId_courseId: { studentId: studentId as string, courseId: courseId as string }
      }
    });

    res.json({ message: 'Student unenrolled successfully' });
  } catch (error: any) {
    // If record not found, Prisma throws an error
    res.status(500).json({ message: 'Failed to unenroll student or record not found' });
  }
};

// Get students enrolled in a specific course
export const getCourseStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: courseId as string },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } }
          }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    });

    res.json({ enrollments });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get courses enrolled by the current student
export const getMyEnrolledCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'STUDENT') {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    });

    if (!student) {
      res.status(404).json({ message: 'Student record not found' });
      return;
    }

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

    res.json({ enrollments });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
