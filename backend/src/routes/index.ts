import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import courseRoutes from './courseRoutes';
import enrollmentRoutes from './enrollmentRoutes';
import analyticsRoutes from './analyticsRoutes';
import lectureRoutes from './lectureRoutes';

const router = Router();

// Define your routes here
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/courses', courseRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/lectures', lectureRoutes);

export default router;
