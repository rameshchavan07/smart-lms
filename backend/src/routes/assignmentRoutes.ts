import express from 'express';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';
import {
  getAssignmentsByCourse,
  createAssignment,
  submitAssignment,
  gradeSubmission,
  getSubmissionsForAssignment,
  getMySubmissions,
  getTeacherAssessments,
  getAdminAssessments,
  getStudentAssignments
} from '../controllers/assignmentController';

const router = express.Router();

router.use(protect);

router.get('/course/:courseId', getAssignmentsByCourse);

// Student routes
router.post('/:id/submit', authorize('STUDENT'), upload.single('file'), submitAssignment);
router.get('/my-submissions', authorize('STUDENT'), getMySubmissions);
router.get('/student', authorize('STUDENT'), getStudentAssignments);

// Teacher/Admin routes
router.post('/course/:courseId', authorize('TEACHER', 'ADMIN'), createAssignment);
router.put('/submission/:id/grade', authorize('TEACHER', 'ADMIN'), gradeSubmission);
router.get('/:id/submissions', authorize('TEACHER', 'ADMIN'), getSubmissionsForAssignment);
router.get('/teacher/all', authorize('TEACHER', 'ADMIN'), getTeacherAssessments);
router.get('/admin/all', authorize('ADMIN'), getAdminAssessments);

export default router;
