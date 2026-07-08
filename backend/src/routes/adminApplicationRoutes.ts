import express from 'express';
import { protect, authorize } from '../middleware/auth';
import {
  getPendingApplications,
  approveApplication,
  rejectApplication
} from '../controllers/adminApplicationController';

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN'));

router.get('/pending', getPendingApplications);
router.patch('/:id/approve', approveApplication);
router.delete('/:id/reject', rejectApplication);

export default router;
