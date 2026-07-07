import express from 'express';
import {
  getInstitutes,
  getInstituteById,
  getInstituteBySlug,
  createInstitute,
  updateInstitute,
  deleteInstitute,
  approveInstitute,
  rejectInstitute,
  suspendInstitute,
  reactivateInstitute,
} from '../controllers/instituteController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public route — no auth needed
router.get('/by-slug/:slug', getInstituteBySlug);

// All remaining routes are protected and restricted to SUPER_ADMIN
router.use(protect);
router.use(authorize('SUPER_ADMIN'));

// CRUD
router.get('/', getInstitutes);
router.get('/:id', getInstituteById);
router.post('/', createInstitute);
router.put('/:id', updateInstitute);
router.delete('/:id', deleteInstitute);

// Lifecycle management
router.patch('/:id/approve', approveInstitute);
router.patch('/:id/reject', rejectInstitute);
router.patch('/:id/suspend', suspendInstitute);
router.patch('/:id/reactivate', reactivateInstitute);

export default router;
