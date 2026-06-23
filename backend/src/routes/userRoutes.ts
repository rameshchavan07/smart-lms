import { Router } from 'express';
import { getUsers, createTeacher, createStudent, updateUserStatus } from '../controllers/userController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Apply protection to all routes
router.use(protect);

router.get('/', authorize('ADMIN', 'TEACHER'), getUsers);
router.post('/teacher', authorize('ADMIN'), createTeacher);
router.post('/student', authorize('ADMIN', 'TEACHER'), createStudent);
router.patch('/:id/status', authorize('ADMIN'), updateUserStatus);

export default router;
