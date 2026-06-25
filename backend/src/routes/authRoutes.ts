import { Router } from 'express';
import { registerUser, loginUser, getMe, refresh, logoutUser } from '../controllers/authController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../utils/validationSchemas';

const router = Router();

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.post('/refresh', refresh);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);

export default router;
