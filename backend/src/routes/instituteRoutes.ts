import express from 'express';
import { getInstitutes, createInstitute, updateInstitute, deleteInstitute } from '../controllers/instituteController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// All institute routes are protected and restricted to SUPER_ADMIN
router.use(protect);
router.use(authorize('SUPER_ADMIN'));

router.get('/', getInstitutes);
router.post('/', createInstitute);
router.put('/:id', updateInstitute);
router.delete('/:id', deleteInstitute);

export default router;
