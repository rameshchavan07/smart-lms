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
  updateMyInstituteSettings,
  getMyInstitute,
  uploadMyInstituteLogo,
  getSuperAdminStats,
} from '../controllers/instituteController';
import { protect, authorize } from '../middleware/auth';
import { uploadThumbnail } from '../middleware/upload';

const router = express.Router();

// Public route — no auth needed
router.get('/by-slug/:slug', getInstituteBySlug);

// Protected routes
router.use(protect);

// Admin route
router.get('/settings', authorize('ADMIN'), getMyInstitute);
router.put('/settings', authorize('ADMIN'), updateMyInstituteSettings);
router.post('/settings/logo', authorize('ADMIN'), uploadThumbnail.single('logo'), uploadMyInstituteLogo);

// All remaining routes are restricted to SUPER_ADMIN
router.use(authorize('SUPER_ADMIN'));

// CRUD
router.get('/stats', getSuperAdminStats);
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
