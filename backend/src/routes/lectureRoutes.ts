import { Router } from 'express';
import { createLecture, getCourseLectures, getLectureDetails, uploadLectureThumbnail, uploadLectureRecording, updateLecture } from '../controllers/lectureController';
import { protect, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { upload } from '../middleware/upload';
import { createLectureSchema } from '../utils/validationSchemas';

const router = Router();

router.use(protect);

router.post('/course/:courseId', authorize('TEACHER'), validate(createLectureSchema), createLecture);
router.get('/course/:courseId', authorize('TEACHER', 'STUDENT', 'ADMIN'), getCourseLectures);
router.get('/:id', authorize('TEACHER', 'STUDENT', 'ADMIN'), getLectureDetails);
router.put('/:id', authorize('TEACHER'), updateLecture);
router.put('/:id/thumbnail', authorize('TEACHER'), upload.single('thumbnail'), uploadLectureThumbnail);
router.put('/:id/recording', authorize('TEACHER'), upload.single('recording'), uploadLectureRecording);

export default router;
