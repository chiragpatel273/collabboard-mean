import { Router } from 'express';
import {
  addMemberToProject,
  createProject,
  deleteProject,
  getProjectById,
  getProjectOverview,
  getProjectStats,
  getUserProjects,
  removeMemberFromProject,
  searchProjects,
  updateProject,
} from '../controllers/project.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireUser } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  addMemberSchema,
  createProjectSchema,
  updateProjectSchema,
} from '../schemas/project.schemas';

const router = Router();

// All project routes require authentication
router.use(authMiddleware);
router.use(requireUser);

// Project CRUD
router.post('/', validate(createProjectSchema), createProject);
router.get('/', getUserProjects);
router.get('/search', searchProjects);
router.get('/stats', getProjectOverview);
router.get('/:projectId', getProjectById);
router.get('/:projectId/stats', getProjectStats);
router.put('/:projectId', validate(updateProjectSchema), updateProject);
router.delete('/:projectId', deleteProject);

// Member management
router.post('/:projectId/members', validate(addMemberSchema), addMemberToProject);
router.delete('/:projectId/members/:memberId', removeMemberFromProject);

export default router;
