import express from 'express';
import { protect, authorize } from '../middleware/auth';
import {
  getDiscussionsByCourse,
  getDiscussionById,
  createDiscussion,
  addReply,
  togglePinDiscussion,
  getMyDiscussions,
  getAllDiscussions
} from '../controllers/discussionController';

const router = express.Router();

router.use(protect);

router.get('/my-discussions', authorize('STUDENT'), getMyDiscussions);
router.get('/admin/all', authorize('ADMIN'), getAllDiscussions);
router.get('/course/:courseId', getDiscussionsByCourse);
router.post('/course/:courseId', createDiscussion);
router.get('/:id', getDiscussionById);
router.post('/:id/reply', addReply);
router.put('/:id/pin', authorize('TEACHER', 'ADMIN'), togglePinDiscussion);

export default router;
