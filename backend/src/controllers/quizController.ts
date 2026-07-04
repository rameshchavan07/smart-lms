import { Request, Response } from 'express';
// Cache bust comment
import { catchAsync } from '../utils/catchAsync';
import { AppError, NotFoundError, ValidationError, ForbiddenError, UnauthorizedError } from '../utils/AppError';

import prisma from '../config/db';

// Create a new quiz for a course
export const createQuiz = catchAsync(async (req: Request, res: Response) => {
  const courseId = req.params.courseId as string;
  const { title, description, durationMins, totalMarks, questions } = req.body;

  // Verify course exists
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new NotFoundError('Course not found');
  }

  // Create the quiz with nested questions and options
  const quiz = await prisma.quiz.create({
    data: {
      courseId,
      title,
      description,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      durationMins: durationMins ? parseInt(durationMins as any) : null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      totalMarks: parseInt(totalMarks as any),
      questions: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        create: questions.map((q: any) => ({
          text: q.text,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          marks: parseInt(q.marks as any),
          options: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            create: q.options.map((o: any) => ({
              text: o.text,
              isCorrect: o.isCorrect
            }))
          }
        }))
      }
    },
    include: {
      questions: {
        include: {
          options: true
        }
      }
    }
  });

  res.status(201).json({ message: 'Quiz created successfully', quiz });
});

// Get all quizzes for a specific course
export const getCourseQuizzes = catchAsync(async (req: Request, res: Response) => {
  const courseId = req.params.courseId as string;
  
  const quizzes = await prisma.quiz.findMany({
    where: { courseId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { questions: true, submissions: true }
      }
    }
  });

  res.json({ quizzes });
});

// Get quiz details (by ID)
export const getQuizById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  // Assuming req.user is set by auth middleware
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (req as any).user?.role;

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: {
        include: {
          options: true
        }
      }
    }
  });

  if (!quiz) {
    throw new NotFoundError('Quiz not found');
  }

  // If student, strip out isCorrect field
  if (userRole === 'STUDENT') {
    const sanitizedQuiz = {
      ...quiz,
      questions: (quiz as any).questions.map((q: any) => ({
        ...q,
        options: q.options.map((o: any) => ({
          id: o.id,
          text: o.text,
          questionId: o.questionId
          // excluding isCorrect
        }))
      }))
    };
    return res.json({ quiz: sanitizedQuiz });
  }

  res.json({ quiz });
});

// Submit a quiz
export const submitQuiz = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { answers } = req.body; // Array of { questionId, selectedOptionId }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (req as any).user?.id;
  if (!userId) {
    throw new UnauthorizedError('Unauthorized');
  }

  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) {
    throw new ForbiddenError('Only students can submit quizzes');
  }

  const existingSubmission = await prisma.quizSubmission.findUnique({
    where: {
      quizId_studentId: {
        quizId: id,
        studentId: student.id
      }
    }
  });

  if (existingSubmission) {
    throw new ValidationError('You have already submitted this quiz');
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: {
        include: {
          options: true
        }
      }
    }
  });

  if (!quiz) {
    throw new NotFoundError('Quiz not found');
  }

  let totalScore = 0;
  const formattedAnswers = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const ans of answers as any[]) {
    const question = (quiz as any).questions.find((q: any) => q.id === ans.questionId);
    if (!question) continue;

    const selectedOption = question.options.find((o: any) => o.id === ans.selectedOptionId);
    if (selectedOption?.isCorrect) {
      totalScore += question.marks;
    }

    formattedAnswers.push({
      questionId: question.id,
      selectedOptionId: selectedOption?.id || null
    });
  }

  const submission = await prisma.quizSubmission.create({
    data: {
      quizId: id,
      studentId: student.id,
      totalScore,
      answers: {
        create: formattedAnswers
      }
    }
  });

  res.status(201).json({ message: 'Quiz submitted successfully', score: totalScore, totalMarks: quiz.totalMarks, submission });
});

// Get quiz submissions (for teachers)
export const getQuizSubmissions = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  
  const submissions = await prisma.quizSubmission.findMany({
    where: { quizId: id },
    include: {
      student: {
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true }
          }
        }
      }
    },
    orderBy: { totalScore: 'desc' }
  });

  res.json({ submissions });
});
