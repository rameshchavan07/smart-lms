import { Router } from 'express';
import { registerUser, loginUser, getMe, refresh } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refresh);
router.get('/me', protect, getMe);

export default router;
