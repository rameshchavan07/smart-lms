import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import courseRoutes from './courseRoutes';
import enrollmentRoutes from './enrollmentRoutes';
import analyticsRoutes from './analyticsRoutes';
import lectureRoutes from './lectureRoutes';
import studyMaterialRoutes from './studyMaterialRoutes';
import mediaRoutes from './mediaRoutes';
import quizRoutes from './quizRoutes';
import discussionRoutes from './discussionRoutes';
import assignmentRoutes from './assignmentRoutes';

const router = Router();

// Define your routes here
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/courses', courseRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/lectures', lectureRoutes);
router.use('/study-materials', studyMaterialRoutes);
router.use('/media', mediaRoutes);
router.use('/quizzes', quizRoutes);
router.use('/discussions', discussionRoutes);
router.use('/assignments', assignmentRoutes);

export default router;

