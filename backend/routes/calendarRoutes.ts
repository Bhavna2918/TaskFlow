import express from 'express';
import { getCalendarEvents } from '../controllers/calendarController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/events', protect, getCalendarEvents);

export default router;
