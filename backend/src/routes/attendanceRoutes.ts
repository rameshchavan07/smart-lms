import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import { markAttendance, getLectureAttendance, getMyAttendance, exportLectureAttendance } from '../controllers/attendanceController';

const router = Router();

router.use(protect);

router.post('/lecture/:lectureId/mark', authorize('STUDENT'), markAttendance);
router.get('/lecture/:lectureId/export', authorize('ADMIN', 'TEACHER'), exportLectureAttendance);
router.get('/lecture/:lectureId', authorize('ADMIN', 'TEACHER'), getLectureAttendance);
router.get('/my-attendance', authorize('STUDENT'), getMyAttendance);

export default router;
