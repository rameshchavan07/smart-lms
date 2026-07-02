import { Router } from 'express';
import { getCourseProgress } from '../controllers/progressController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/course/:courseId', protect, getCourseProgress);

export default router;
