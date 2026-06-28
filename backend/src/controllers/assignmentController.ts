import { Response } from 'express';
import { z } from 'zod';
import { getIO } from '../utils/socket';
import { AuthRequest } from '../middleware/auth';

import prisma from '../config/db';

const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  dueDate: z.string().datetime(),
  totalMarks: z.number().positive(),
});

const gradeSubmissionSchema = z.object({
  marks: z.number().min(0),
  feedback: z.string().optional(),
});

export const getAssignmentsByCourse = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const assignments = await prisma.assignment.findMany({
      where: { courseId: courseId as string },
      include: {
        _count: { select: { submissions: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
    res.json({ assignments });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ message: 'Failed to fetch assignments' });
  }
};

export const createAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const parsed = createAssignmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }
    const { title, description, dueDate, totalMarks } = parsed.data;

    const assignment = await prisma.assignment.create({
      data: {
        courseId: courseId as string,
        title,
        description,
        dueDate: new Date(dueDate),
        totalMarks,
      },
    });

    getIO().to(`course_${courseId}`).emit('new_assignment', { courseId, assignment });
    res.status(201).json({ message: 'Assignment created', assignment });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: 'Failed to create assignment' });
  }
};

export const submitAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // assignmentId
    const userId = req.user!.id;
    const { fileUrl } = req.body;

    if (!fileUrl) return res.status(400).json({ message: 'File URL is required' });

    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId: id as string,
        studentId: student.id,
        fileUrl,
      },
    });

    res.status(201).json({ message: 'Assignment submitted successfully', submission });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ message: 'Failed to submit assignment' });
  }
};

export const gradeSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // submissionId
    const parsed = gradeSubmissionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });

    const { marks, feedback } = parsed.data;

    const submission = await prisma.assignmentSubmission.update({
      where: { id: id as string },
      data: { marks, feedback },
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

    res.json({ message: 'Submission graded', submission });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ message: 'Failed to grade submission' });
  }
};

export const getSubmissionsForAssignment = async (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Failed to get submissions' });
  }
};

export const getMySubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { studentId: student.id },
      include: { assignment: true },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({ submissions });
  } catch (error) {
    console.error('Get my submissions error:', error);
    res.status(500).json({ message: 'Failed to fetch my submissions' });
  }
};
