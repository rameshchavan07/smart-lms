import { Router } from 'express';
import { createLecture, getCourseLectures, getLectureDetails, uploadLectureThumbnail } from '../controllers/lectureController';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(protect);

router.post('/course/:courseId', authorize('TEACHER'), createLecture);
router.get('/course/:courseId', authorize('TEACHER', 'STUDENT', 'ADMIN'), getCourseLectures);
router.get('/:id', authorize('TEACHER', 'STUDENT', 'ADMIN'), getLectureDetails);
router.put('/:id/thumbnail', authorize('TEACHER'), upload.single('thumbnail'), uploadLectureThumbnail);

export default router;
