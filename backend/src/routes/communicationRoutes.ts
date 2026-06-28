import { Router } from 'express';
import { getAnnouncements, createAnnouncement, getMessages, sendMessage } from '../controllers/communicationController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect);

// Announcements
router.get('/announcements', getAnnouncements);
router.post('/announcements', authorize('TEACHER'), createAnnouncement);

// Messages
router.get('/messages', getMessages);
router.post('/messages', sendMessage);

export default router;
