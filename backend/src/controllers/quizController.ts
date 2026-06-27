import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
// Cache bust comment

const prisma = new PrismaClient();

// Create a new quiz for a course
export const createQuiz = async (req: Request, res: Response) => {
  try {
    const courseId = req.params.courseId as string;
    const { title, description, durationMins, totalMarks, questions } = req.body;

    // Verify course exists
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ message: 'Course not found' });

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
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all quizzes for a specific course
export const getCourseQuizzes = async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get quiz details (by ID)
export const getQuizById = async (req: Request, res: Response) => {
  try {
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

    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

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
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Submit a quiz
export const submitQuiz = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { answers } = req.body; // Array of { questionId, selectedOptionId }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.status(403).json({ message: 'Only students can submit quizzes' });

    const existingSubmission = await prisma.quizSubmission.findUnique({
      where: {
        quizId_studentId: {
          quizId: id,
          studentId: student.id
        }
      }
    });

    if (existingSubmission) {
      return res.status(400).json({ message: 'You have already submitted this quiz' });
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

    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

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
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get quiz submissions (for teachers)
export const getQuizSubmissions = async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
