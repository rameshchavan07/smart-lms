import { Router } from 'express';
import { getUsers, createTeacher, createStudent, createAdmin, updateUserStatus, updateUser, deleteUser, updateProfile, uploadAvatar, completeOnboarding } from '../controllers/userController';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Apply protection to all routes
router.use(protect);

router.get('/', authorize('ADMIN', 'TEACHER'), getUsers);
router.post('/admin', authorize('ADMIN'), createAdmin);
router.post('/teacher', authorize('ADMIN'), createTeacher);
router.post('/student', authorize('ADMIN', 'TEACHER'), createStudent);
router.put('/profile', updateProfile);
router.patch('/me/onboarding', completeOnboarding);
router.post('/profile-image', upload.single('avatar'), uploadAvatar);
router.patch('/:id/status', authorize('ADMIN'), updateUserStatus);
router.put('/:id', authorize('ADMIN'), updateUser);
router.delete('/:id', authorize('ADMIN'), deleteUser);

export default router;
