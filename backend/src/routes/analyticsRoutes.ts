import { Router } from 'express';
import { getAdminStats, getTeacherStats, getStudentStats, getTeacherReports, getAdminReports } from '../controllers/analyticsController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/admin', authorize('ADMIN'), getAdminStats);
router.get('/admin/reports', authorize('ADMIN'), getAdminReports);
router.get('/teacher', authorize('TEACHER'), getTeacherStats);
router.get('/teacher/reports', authorize('TEACHER'), getTeacherReports);
router.get('/student', authorize('STUDENT'), getStudentStats);

export default router;
