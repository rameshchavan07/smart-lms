import { Router } from 'express';
import { generateCertificate, getMyCertificates } from '../controllers/certificateController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/generate/:courseId', protect, generateCertificate);
router.get('/my', protect, getMyCertificates);

export default router;
