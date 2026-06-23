import express from 'express';
import { 
  getMessages, 
  createMessage, 
  updateMessage 
} from '../controllers/messageController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', protect, getMessages);
router.post('/', protect, createMessage);
router.put('/:id', protect, updateMessage);

export default router;
