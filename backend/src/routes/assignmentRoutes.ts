import express from 'express';
import { protect, authorize } from '../middleware/auth';
import {
  getAssignmentsByCourse,
  createAssignment,
  submitAssignment,
  gradeSubmission,
  getSubmissionsForAssignment,
  getMySubmissions
} from '../controllers/assignmentController';

const router = express.Router();

router.use(protect);

router.get('/course/:courseId', getAssignmentsByCourse);
router.post('/course/:courseId', authorize('TEACHER', 'ADMIN'), createAssignment);
router.post('/:id/submit', authorize('STUDENT'), submitAssignment);
router.get('/my-submissions', authorize('STUDENT'), getMySubmissions);
router.put('/submission/:id/grade', authorize('TEACHER', 'ADMIN'), gradeSubmission);
router.get('/:id/submissions', authorize('TEACHER', 'ADMIN'), getSubmissionsForAssignment);

export default router;
