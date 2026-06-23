import express from 'express';
import { 
  createProject, 
  getProjects, 
  getProjectById, 
  updateProject, 
  deleteProject 
} from '../controllers/projectController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { createProjectSchema, updateProjectSchema } from '../validators/projectValidator';

const router = express.Router();

router.get('/', protect, getProjects);
router.post('/', protect, authorizeRoles('admin', 'manager'), validateBody(createProjectSchema), createProject);
router.get('/:id', protect, getProjectById);
router.put('/:id', protect, authorizeRoles('admin', 'manager'), validateBody(updateProjectSchema), updateProject);
router.delete('/:id', protect, authorizeRoles('admin', 'manager'), deleteProject);

export default router;
