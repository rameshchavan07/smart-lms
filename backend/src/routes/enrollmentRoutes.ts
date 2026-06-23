import { Router } from 'express';
import { enrollStudent, unenrollStudent, getCourseStudents, getMyEnrolledCourses } from '../controllers/enrollmentController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Student specific routes
router.get('/my-courses', protect, authorize('STUDENT'), getMyEnrolledCourses);

// Admin / Teacher routes
router.get('/course/:courseId/students', protect, authorize('ADMIN', 'TEACHER'), getCourseStudents);

// Admin only routes
router.post('/', protect, authorize('ADMIN'), enrollStudent);
router.delete('/:courseId/students/:studentId', protect, authorize('ADMIN'), unenrollStudent);

export default router;
