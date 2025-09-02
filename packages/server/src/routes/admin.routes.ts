import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/rbac.middleware';
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  createAdminUser,
  getUserStats,
  searchUsers,
} from '../controllers/admin.controller';
import { validate } from '../middleware/validation.middleware';
import {
  registerSchema,
  updateUserRoleSchema,
  toggleUserStatusSchema,
} from '../schemas/user.schemas';

const router = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(requireAdmin);

// User management routes
router.get('/users', getAllUsers);
router.get('/users/search', searchUsers);
router.get('/users/stats', getUserStats);
router.get('/users/:userId', getUserById);

router.put('/users/:userId/role', validate(updateUserRoleSchema), updateUserRole);
router.put('/users/:userId/status', validate(toggleUserStatusSchema), toggleUserStatus);
router.delete('/users/:userId', deleteUser);

// Admin user creation (protected route)
router.post('/users/admin', validate(registerSchema), createAdminUser);

export default router;
