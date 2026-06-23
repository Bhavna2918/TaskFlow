import express from 'express';
import { 
  getTasks, 
  getTaskById, 
  createTask, 
  updateTask, 
  deleteTask 
} from '../controllers/taskController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { createTaskSchema, updateTaskSchema } from '../validators/taskValidator';

const router = express.Router();

router.get('/', protect, getTasks);
router.get('/:id', protect, getTaskById);
router.post('/', protect, authorizeRoles('admin', 'manager'), validateBody(createTaskSchema), createTask);
router.put('/:id', protect, validateBody(updateTaskSchema), updateTask);
router.delete('/:id', protect, authorizeRoles('admin', 'manager'), deleteTask);

export default router;
