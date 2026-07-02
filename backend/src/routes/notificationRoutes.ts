import express from 'express';
import { protect } from '../middleware/auth';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getVapidPublicKey,
  subscribeToPush,
} from '../controllers/notificationController';

const router = express.Router();

router.use(protect);

router.get('/', getMyNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

router.get('/vapid-public-key', getVapidPublicKey);
router.post('/subscribe', subscribeToPush);

export default router;
