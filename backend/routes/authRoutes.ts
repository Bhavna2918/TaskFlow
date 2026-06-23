import express from 'express';
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  getMe, 
  forgotPassword, 
  resetPassword 
} from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { 
  registerSchema, 
  loginSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema 
} from '../validators/authValidator';

const router = express.Router();

router.post('/register', validateBody(registerSchema), registerUser);
router.post('/login', validateBody(loginSchema), loginUser);
router.post('/logout', logoutUser);
router.post('/forgot-password', validateBody(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', validateBody(resetPasswordSchema), resetPassword);
router.get('/me', protect, getMe);

export default router;
