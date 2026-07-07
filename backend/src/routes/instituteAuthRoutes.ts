import { Router } from 'express';
import {
  registerInstitute,
  registerStudentForInstitute,
  loginForInstitute,
} from '../controllers/instituteAuthController';

const router = Router();

// Public routes — no auth required

// Register a new institute (creates institute + admin user)
router.post('/register', registerInstitute);

// Institute-scoped auth
router.post('/:slug/auth/register', registerStudentForInstitute);
router.post('/:slug/auth/login', loginForInstitute);

export default router;
