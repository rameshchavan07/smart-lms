import { Request, Response } from 'express';
// Cache bust comment
import { catchAsync } from '../utils/catchAsync';
import { AppError, NotFoundError, ValidationError, ForbiddenError, UnauthorizedError } from '../utils/AppError';
import { getCache, setCache, invalidateCache } from '../utils/cache';
import { CACHE_KEYS, CACHE_TTL } from '../utils/cacheKeys';
import { AuthRequest } from '../middleware/auth';

import { Prisma } from '@prisma/client';
import prisma from '../config/db';

type FullQuizPayload = Prisma.QuizGetPayload<{ include: { questions: { include: { options: true } } } }>;

interface QuizAnswer {
  questionId: string;
  selectedOptionId: string;
}

interface QuizQuestionInput {
  text: string;
  marks: string | number;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
}

// Create a new quiz for a course
export const createQuiz = catchAsync(async (req: AuthRequest, res: Response) => {
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
      durationMins: durationMins ? Number(durationMins) : null,
      totalMarks: Number(totalMarks),
      questions: {
        create: (questions as QuizQuestionInput[]).map((q) => ({
          text: q.text,
          marks: Number(q.marks),
          options: {
            create: q.options.map((o) => ({
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

  // Invalidate the course quiz list so the new quiz appears immediately
  await invalidateCache(CACHE_KEYS.COURSE_QUIZZES(courseId));

  res.status(201).json({ message: 'Quiz created successfully', quiz });
});

// Get all quizzes for a specific course
export const getCourseQuizzes = catchAsync(async (req: AuthRequest, res: Response) => {
  const courseId = req.params.courseId as string;

  const cacheKey = CACHE_KEYS.COURSE_QUIZZES(courseId);
  const cached = await getCache<object>(cacheKey);
  if (cached) return res.json(cached);

  const quizzes = await prisma.quiz.findMany({
    where: { courseId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { questions: true, submissions: true }
      }
    }
  });

  const payload = { quizzes };
  await setCache(cacheKey, payload, CACHE_TTL.COURSE_QUIZZES);
  res.json(payload);
});

// Get quiz details (by ID)
export const getQuizById = catchAsync(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const userRole = req.user?.role;

  const cacheKey = CACHE_KEYS.QUIZ_DETAIL(id);
  const cached = await getCache<object>(cacheKey);

  if (cached) {
    // Strip isCorrect for students at the cache-read layer
    if (userRole === 'STUDENT') {
      const cachedQuiz = (cached as { quiz?: FullQuizPayload }).quiz;
      if (cachedQuiz) {
        const sanitized = {
          ...cachedQuiz,
          questions: cachedQuiz.questions.map((q) => ({
            ...q,
            options: q.options.map((o) => ({
              id: o.id,
              text: o.text,
              questionId: o.questionId
            }))
          }))
        };
        return res.json({ quiz: sanitized });
      }
    }
    return res.json(cached);
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

  // Cache the full version (with isCorrect) — students get a stripped version
  await setCache(cacheKey, { quiz }, CACHE_TTL.QUIZ_DETAIL);

  // If student, strip out isCorrect field before responding
  if (userRole === 'STUDENT') {
    const sanitizedQuiz = {
      ...quiz,
      questions: quiz.questions.map((q) => ({
        ...q,
        options: q.options.map((o) => ({
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
export const submitQuiz = catchAsync(async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { answers } = req.body; // Array of { questionId, selectedOptionId }

  const userId = req.user?.id;
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

  for (const ans of answers as QuizAnswer[]) {
    const question = quiz.questions.find((q) => q.id === ans.questionId);
    if (!question) continue;

    const selectedOption = question.options.find((o) => o.id === ans.selectedOptionId);
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

  // Award XP
  await prisma.student.update({
    where: { id: student.id },
    data: { xpPoints: { increment: 50 } }
  });

  // Invalidate student stats so dashboard reflects updated quiz scores
  await invalidateCache(CACHE_KEYS.STUDENT_STATS(userId));

  res.status(201).json({ message: 'Quiz submitted successfully', score: totalScore, totalMarks: quiz.totalMarks, submission });
});

// Get quiz submissions (for teachers)
export const getQuizSubmissions = catchAsync(async (req: AuthRequest, res: Response) => {
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

export const generateAIQuiz = catchAsync(async (req: AuthRequest, res: Response) => {
  const { topic, text, numQuestions = 5 } = req.body;

  // Simulate LLM processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  const questions = Array.from({ length: Number(numQuestions) }).map((_, i) => ({
    text: `(AI Generated) What is a key concept related to ${topic || 'the provided text'}? (Question ${i + 1})`,
    marks: 10,
    options: [
      { text: `The primary correct concept for Q${i + 1}`, isCorrect: true },
      { text: `A common misconception for Q${i + 1}`, isCorrect: false },
      { text: `An unrelated concept for Q${i + 1}`, isCorrect: false },
      { text: `A partially true but incorrect answer for Q${i + 1}`, isCorrect: false }
    ]
  }));

  res.json({ questions });
});
