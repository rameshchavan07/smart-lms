import { Router } from 'express';
import { enrollStudent, unenrollStudent, getCourseStudents, getMyEnrolledCourses, getTeacherEnrollments } from '../controllers/enrollmentController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Student specific routes
router.get('/my-courses', protect, authorize('STUDENT'), getMyEnrolledCourses);

// Admin / Teacher routes
router.get('/teacher', protect, authorize('TEACHER'), getTeacherEnrollments);
router.get('/course/:courseId/students', protect, authorize('ADMIN', 'TEACHER'), getCourseStudents);
router.post('/', protect, authorize('ADMIN', 'TEACHER'), enrollStudent);
router.delete('/:courseId/students/:studentId', protect, authorize('ADMIN', 'TEACHER'), unenrollStudent);

export default router;
