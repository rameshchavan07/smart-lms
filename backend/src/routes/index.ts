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
import communicationRoutes from './communicationRoutes';
import integrationRoutes from './integrationRoutes';
import notificationRoutes from './notificationRoutes';
import attendanceRoutes from './attendanceRoutes';
import progressRoutes from './progressRoutes';
import certificateRoutes from './certificateRoutes';
import instituteRoutes from './instituteRoutes';

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
router.use('/communications', communicationRoutes);
router.use('/integrations', integrationRoutes);
router.use('/notifications', notificationRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/progress', progressRoutes);
router.use('/certificates', certificateRoutes);
router.use('/institutes', instituteRoutes);

export default router;
