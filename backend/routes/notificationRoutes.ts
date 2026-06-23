import express from 'express';
import { 
  getNotifications, 
  markNotificationRead, 
  markAllNotificationsRead 
} from '../controllers/notificationController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, getNotifications);
router.put('/read', protect, markAllNotificationsRead);
router.put('/:id/read', protect, markNotificationRead);

export default router;
