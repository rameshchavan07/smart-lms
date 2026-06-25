import { Router } from 'express';
import { getCourses, createCourse, updateCourse, deleteCourse, getTeacherCourses, uploadCourseThumbnail } from '../controllers/courseController';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Publicly readable or accessible by any authenticated user
router.get('/', protect, getCourses);

// Teacher specific routes
router.get('/my-courses', protect, authorize('TEACHER'), getTeacherCourses);

// Admin only routes
router.use(protect);
router.use(authorize('ADMIN'));

router.post('/', createCourse);
router.put('/:id', updateCourse);
router.delete('/:id', deleteCourse);
router.put('/:id/thumbnail', upload.single('thumbnail'), uploadCourseThumbnail);

export default router;
