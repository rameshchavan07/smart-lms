import { Router } from 'express';
import { createQuiz, getCourseQuizzes, getQuizById, submitQuiz, getQuizSubmissions } from '../controllers/quizController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Get quizzes for a course
router.get('/course/:courseId', protect, getCourseQuizzes);

// Create a new quiz for a course (TEACHER only)
router.post('/course/:courseId', protect, authorize('TEACHER', 'ADMIN'), createQuiz);

// Get quiz details by ID
router.get('/:id', protect, getQuizById);

// Submit a quiz (STUDENT only)
router.post('/:id/submit', protect, authorize('STUDENT'), submitQuiz);

// Get submissions for a quiz (TEACHER/ADMIN only)
router.get('/:id/submissions', protect, authorize('TEACHER', 'ADMIN'), getQuizSubmissions);

export default router;
