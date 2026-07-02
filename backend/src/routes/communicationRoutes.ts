import { Router } from 'express';
import { getAnnouncements, createAnnouncement, getMessages, sendMessage, getContacts, createGroupChat, deleteGroup, deleteMessage } from '../controllers/communicationController';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(protect);

// Announcements
router.get('/announcements', getAnnouncements);
router.post('/announcements', authorize('TEACHER'), createAnnouncement);

// Messages
router.get('/contacts', getContacts);
router.get('/messages/:id', getMessages);
router.post('/messages', upload.single('file'), sendMessage);

// Groups
router.post('/groups', createGroupChat);
router.delete('/groups/:id', authorize('TEACHER', 'ADMIN'), deleteGroup);

router.delete('/messages/:id', deleteMessage);

export default router;
