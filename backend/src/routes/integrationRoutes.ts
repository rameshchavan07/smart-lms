import { Router } from 'express';
import { getIntegrations, updateIntegration, seedIntegrations } from '../controllers/integrationController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);
router.use(authorize('ADMIN'));

router.get('/', getIntegrations);
router.put('/:id', updateIntegration);
router.post('/seed', seedIntegrations);

export default router;
