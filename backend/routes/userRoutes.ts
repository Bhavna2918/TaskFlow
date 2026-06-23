import express from 'express';
import { 
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} from '../controllers/userController';
import { registerUser } from '../controllers/authController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { registerSchema } from '../validators/authValidator';
import { updateUserSchema } from '../validators/userValidator';

const router = express.Router();

router.get('/', protect, getUsers);
router.post('/', protect, authorizeRoles('admin'), validateBody(registerSchema), registerUser);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, validateBody(updateUserSchema), updateUser);
router.delete('/:id', protect, authorizeRoles('admin'), deleteUser);

export default router;
