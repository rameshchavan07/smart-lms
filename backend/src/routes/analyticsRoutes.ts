import { Router } from 'express';
import { getAdminStats, getTeacherStats, getStudentStats } from '../controllers/analyticsController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/admin', authorize('ADMIN'), getAdminStats);
router.get('/teacher', authorize('TEACHER'), getTeacherStats);
router.get('/student', authorize('STUDENT'), getStudentStats);

export default router;
