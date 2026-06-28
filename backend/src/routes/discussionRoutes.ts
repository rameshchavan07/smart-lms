import express from 'express';
import { protect, authorize } from '../middleware/auth';
import {
  getDiscussionsByCourse,
  getDiscussionById,
  createDiscussion,
  addReply,
  togglePinDiscussion
} from '../controllers/discussionController';

const router = express.Router();

router.use(protect);

router.get('/course/:courseId', getDiscussionsByCourse);
router.post('/course/:courseId', createDiscussion);
router.get('/:id', getDiscussionById);
router.post('/:id/reply', addReply);
router.put('/:id/pin', authorize('TEACHER', 'ADMIN'), togglePinDiscussion);

export default router;
