import { Router } from 'express';
import { createLecture, getCourseLectures, getLectureDetails } from '../controllers/lectureController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

router.post('/course/:courseId', authorize('TEACHER'), createLecture);
router.get('/course/:courseId', authorize('TEACHER', 'STUDENT', 'ADMIN'), getCourseLectures);
router.get('/:id', authorize('TEACHER', 'STUDENT', 'ADMIN'), getLectureDetails);

export default router;
