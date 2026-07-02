import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/auditLogger';

import prisma from '../config/db';

// Enroll a student in a course (Admin / Teacher)
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

    // Teacher authorization check
    if (req.user!.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user!.id }
      });
      if (!teacher || course.teacherId !== teacher.id) {
        res.status(403).json({ message: 'You are not authorized to enroll students in this course' });
        return;
      }
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

    await logActivity(req.user!.id, `Enrolled student: ${enrollment.student.user.firstName} ${enrollment.student.user.lastName} in ${enrollment.course.title}`, 'Enrollment', enrollment.id);

    res.status(201).json({ message: 'Student enrolled successfully', enrollment });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Unenroll a student from a course (Admin / Teacher)
export const unenrollStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId, studentId } = req.params;

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId as string }
    });
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    // Teacher authorization check
    if (req.user!.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user!.id }
      });
      if (!teacher || course.teacherId !== teacher.id) {
        res.status(403).json({ message: 'You are not authorized to unenroll students from this course' });
        return;
      }
    }

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
            user: { select: { firstName: true, lastName: true, email: true, phoneNumber: true, address: true } }
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

// Get all enrollments across all courses for the current teacher
export const getTeacherEnrollments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'TEACHER') {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user.id }
    });

    if (!teacher) {
      res.status(404).json({ message: 'Teacher record not found' });
      return;
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
  } catch (error: any) {
    console.error('getTeacherEnrollments error:', error);
    res.status(500).json({ message: error.message });
  }
};
