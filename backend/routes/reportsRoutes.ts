import express from 'express';
import { getAnalytics } from '../controllers/reportsController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/analytics', protect, getAnalytics);

export default router;
