import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/db';
import { catchAsync } from '../utils/catchAsync';
import { AppError, NotFoundError, ForbiddenError } from '../utils/AppError';

export const getCourseProgress = catchAsync(async (req: AuthRequest, res: Response) => {
  const courseId = req.params.courseId as string;
  
  if (!req.user || req.user.role !== 'STUDENT') {
    throw new ForbiddenError('Only students can view their progress');
  }

  const student = await prisma.student.findUnique({
    where: { userId: req.user.id }
  });

  if (!student) {
    throw new NotFoundError('Student profile not found');
  }

    // Get total course requirements
    const totalLectures = await prisma.lecture.count({ where: { courseId } });
    const totalAssignments = await prisma.assignment.count({ where: { courseId } });
    const totalQuizzes = await prisma.quiz.count({ where: { courseId } });

    const totalItems = totalLectures + totalAssignments + totalQuizzes;

    // Get completed items by student
    const attendedLectures = await prisma.attendance.count({
      where: {
        studentId: student.id,
        lecture: { courseId }
      }
    });

    const submittedAssignments = await prisma.assignmentSubmission.count({
      where: {
        studentId: student.id,
        assignment: { courseId }
      }
    });

    const submittedQuizzes = await prisma.quizSubmission.count({
      where: {
        studentId: student.id,
        quiz: { courseId }
      }
    });

  const completedItems = attendedLectures + submittedAssignments + submittedQuizzes;
  
  const progressPercentage = totalItems === 0 
    ? 0 
    : Math.min(100, Math.round((completedItems / totalItems) * 100));

  res.json({
    progress: progressPercentage,
    details: {
      lectures: { completed: attendedLectures, total: totalLectures },
      assignments: { completed: submittedAssignments, total: totalAssignments },
      quizzes: { completed: submittedQuizzes, total: totalQuizzes }
    }
  });
});
