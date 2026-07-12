import { Router } from 'express';
import { createLecture, getCourseLectures, getLectureDetails, uploadLectureThumbnail, uploadLectureRecording, updateLecture, deleteLectureRecording, deleteLecture, getRecordingUploadUrl, confirmRecordingUpload } from '../controllers/lectureController';
import { protect, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uploadThumbnail, uploadRecording } from '../middleware/upload';
import { createLectureSchema } from '../utils/validationSchemas';

const router = Router();

router.use(protect);

router.post('/course/:courseId', authorize('TEACHER'), validate(createLectureSchema), createLecture);
router.get('/course/:courseId', authorize('TEACHER', 'STUDENT', 'ADMIN'), getCourseLectures);
router.get('/:id', authorize('TEACHER', 'STUDENT', 'ADMIN'), getLectureDetails);
router.put('/:id', authorize('TEACHER'), updateLecture);
router.delete('/:id', authorize('TEACHER'), deleteLecture);
router.put('/:id/thumbnail', authorize('TEACHER'), uploadThumbnail.single('thumbnail'), uploadLectureThumbnail);
router.put('/:id/recording', authorize('TEACHER'), uploadRecording.single('recording'), uploadLectureRecording);
router.delete('/:id/recording', authorize('TEACHER'), deleteLectureRecording);
router.post('/:id/recording/upload-url', authorize('TEACHER'), getRecordingUploadUrl);
router.post('/:id/recording/confirm', authorize('TEACHER'), confirmRecordingUpload);

export default router;
