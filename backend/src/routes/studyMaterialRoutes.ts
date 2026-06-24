import { Router } from 'express';
import { uploadMaterial, getCourseMaterials, deleteMaterial } from '../controllers/studyMaterialController';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// List materials for a course (accessible by Teachers & Students)
router.get('/course/:courseId', protect, getCourseMaterials);

// Upload material to a course (Teacher only)
router.post('/course/:courseId', protect, authorize('TEACHER'), upload.single('file'), uploadMaterial);

// Delete material (Teacher only)
router.delete('/:id', protect, authorize('TEACHER'), deleteMaterial);

export default router;
