import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../src/config/redis', () => ({
  default: {
    get:  vi.fn(async () => null),
    set:  vi.fn(async () => 'OK'),
    del:  vi.fn(async () => 1),
    scan: vi.fn(async () => ['0', []]),
  },
}));

vi.mock('../src/config/db', () => ({
  default: {
    course:         { findUnique: vi.fn() },
    quiz:           { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    quizSubmission: { findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn() },
    student:        { findUnique: vi.fn(), update: vi.fn() },
  },
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────
import prisma from '../src/config/db';
import { getCourseQuizzes, getQuizById, submitQuiz } from '../src/controllers/quizController';
import { globalErrorHandler } from '../src/middleware/errorHandler';

// ─── Build test app ───────────────────────────────────────────────────────────
function buildApp(role: string, userId = 'user-1') {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use((req: express.Request & { user?: unknown }, _res, next) => {
    req.user = { id: userId, role: role as any } as any;
    next();
  });
  app.get('/api/courses/:courseId/quizzes', getCourseQuizzes);
  app.get('/api/quizzes/:id', getQuizById);
  app.post('/api/quizzes/:id/submit', submitQuiz);
  
  // Must be after routes
  app.use(globalErrorHandler as any);
  return app;
}

// ─── Shared test data ─────────────────────────────────────────────────────────
const STUDENT = { id: 'student-1', userId: 'user-student-1' };

const MOCK_QUIZ = {
  id:         'quiz-1',
  courseId:   'course-1',
  title:      'Week 1 Quiz',
  totalMarks: 10,
  questions: [
    {
      id:    'q-1',
      text:  'What is 2+2?',
      marks: 5,
      options: [
        { id: 'opt-wrong',  text: '3', isCorrect: false, questionId: 'q-1' },
        { id: 'opt-right',  text: '4', isCorrect: true,  questionId: 'q-1' },
      ],
    },
    {
      id:    'q-2',
      text:  'What is 3+3?',
      marks: 5,
      options: [
        { id: 'opt-right2', text: '6', isCorrect: true,  questionId: 'q-2' },
        { id: 'opt-wrong2', text: '7', isCorrect: false, questionId: 'q-2' },
      ],
    },
  ],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Quiz Controller — getCourseQuizzes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns quiz list for a course', async () => {
    (prisma.quiz.findMany as any).mockResolvedValueOnce([
      { id: 'quiz-1', title: 'Week 1 Quiz', _count: { questions: 2, submissions: 0 } },
    ]);

    const res = await request(buildApp('TEACHER')).get('/api/courses/course-1/quizzes');

    expect(res.status).toBe(200);
    expect(res.body.quizzes).toHaveLength(1);
    expect(res.body.quizzes[0].id).toBe('quiz-1');
  });

  it('returns empty array when no quizzes exist', async () => {
    (prisma.quiz.findMany as any).mockResolvedValueOnce([]);

    const res = await request(buildApp('TEACHER')).get('/api/courses/course-1/quizzes');

    expect(res.status).toBe(200);
    expect(res.body.quizzes).toHaveLength(0);
  });
});

describe('Quiz Controller — getQuizById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 when quiz does not exist', async () => {
    (prisma.quiz.findUnique as any).mockResolvedValueOnce(null);

    const res = await request(buildApp('TEACHER')).get('/api/quizzes/nonexistent');
    expect(res.status).toBe(404);
  });

  it('returns full quiz WITH isCorrect for a TEACHER', async () => {
    (prisma.quiz.findUnique as any).mockResolvedValueOnce(MOCK_QUIZ);

    const res = await request(buildApp('TEACHER')).get('/api/quizzes/quiz-1');

    expect(res.status).toBe(200);
    expect(res.body.quiz.questions[0].options[0]).toHaveProperty('isCorrect');
  });

  it('strips isCorrect from options for a STUDENT', async () => {
    (prisma.quiz.findUnique as any).mockResolvedValueOnce(MOCK_QUIZ);

    const res = await request(buildApp('STUDENT', 'user-student-1')).get('/api/quizzes/quiz-1');

    expect(res.status).toBe(200);
    const firstOption = res.body.quiz.questions[0].options[0];
    expect(firstOption).not.toHaveProperty('isCorrect');
    expect(firstOption).toHaveProperty('id');
    expect(firstOption).toHaveProperty('text');
  });
});

describe('Quiz Controller — submitQuiz (score calculation)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 403 when a non-student tries to submit', async () => {
    (prisma.student.findUnique as any).mockResolvedValueOnce(null);

    const res = await request(buildApp('TEACHER'))
      .post('/api/quizzes/quiz-1/submit')
      .send({ answers: [] });

    expect(res.status).toBe(403);
  });

  it('returns 400 when quiz has already been submitted', async () => {
    (prisma.student.findUnique as any).mockResolvedValueOnce(STUDENT);
    (prisma.quizSubmission.findUnique as any).mockResolvedValueOnce({ id: 'existing-sub' });

    const res = await request(buildApp('STUDENT', 'user-student-1'))
      .post('/api/quizzes/quiz-1/submit')
      .send({ answers: [] });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already submitted/i);
  });

  it('returns 404 when quiz does not exist at submission time', async () => {
    (prisma.student.findUnique as any).mockResolvedValueOnce(STUDENT);
    (prisma.quizSubmission.findUnique as any).mockResolvedValueOnce(null);
    (prisma.quiz.findUnique as any).mockResolvedValueOnce(null);

    const res = await request(buildApp('STUDENT', 'user-student-1'))
      .post('/api/quizzes/nonexistent/submit')
      .send({ answers: [] });

    expect(res.status).toBe(404);
  });

  it('correctly calculates score when ALL answers are correct (10/10)', async () => {
    (prisma.student.findUnique as any).mockResolvedValueOnce(STUDENT);
    (prisma.quizSubmission.findUnique as any).mockResolvedValueOnce(null);
    (prisma.quiz.findUnique as any).mockResolvedValueOnce(MOCK_QUIZ);
    (prisma.quizSubmission.create as any).mockImplementationOnce(
      ({ data }: { data: { totalScore: number } }) =>
        Promise.resolve({ id: 'sub-1', totalScore: data.totalScore })
    );

    const res = await request(buildApp('STUDENT', 'user-student-1'))
      .post('/api/quizzes/quiz-1/submit')
      .send({
        answers: [
          { questionId: 'q-1', selectedOptionId: 'opt-right'  }, // +5
          { questionId: 'q-2', selectedOptionId: 'opt-right2' }, // +5
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.score).toBe(10);
    expect(res.body.totalMarks).toBe(10);
  });

  it('correctly calculates score when ALL answers are wrong (0/10)', async () => {
    (prisma.student.findUnique as any).mockResolvedValueOnce(STUDENT);
    (prisma.quizSubmission.findUnique as any).mockResolvedValueOnce(null);
    (prisma.quiz.findUnique as any).mockResolvedValueOnce(MOCK_QUIZ);
    (prisma.quizSubmission.create as any).mockImplementationOnce(
      ({ data }: { data: { totalScore: number } }) =>
        Promise.resolve({ id: 'sub-2', totalScore: data.totalScore })
    );

    const res = await request(buildApp('STUDENT', 'user-student-1'))
      .post('/api/quizzes/quiz-1/submit')
      .send({
        answers: [
          { questionId: 'q-1', selectedOptionId: 'opt-wrong'  }, // +0
          { questionId: 'q-2', selectedOptionId: 'opt-wrong2' }, // +0
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.score).toBe(0);
  });

  it('correctly calculates PARTIAL score (5/10)', async () => {
    (prisma.student.findUnique as any).mockResolvedValueOnce(STUDENT);
    (prisma.quizSubmission.findUnique as any).mockResolvedValueOnce(null);
    (prisma.quiz.findUnique as any).mockResolvedValueOnce(MOCK_QUIZ);
    (prisma.quizSubmission.create as any).mockImplementationOnce(
      ({ data }: { data: { totalScore: number } }) =>
        Promise.resolve({ id: 'sub-3', totalScore: data.totalScore })
    );

    const res = await request(buildApp('STUDENT', 'user-student-1'))
      .post('/api/quizzes/quiz-1/submit')
      .send({
        answers: [
          { questionId: 'q-1', selectedOptionId: 'opt-right'  }, // +5
          { questionId: 'q-2', selectedOptionId: 'opt-wrong2' }, // +0
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.score).toBe(5);
    expect(res.body.totalMarks).toBe(10);
  });
});
