import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requireUser } from "../middleware/rbac.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema
} from "../schemas/project.schemas";
import {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  addMemberToProject,
  removeMemberFromProject,
  deleteProject,
  searchProjects
} from "../controllers/project.controller";

const router = Router();

// All project routes require authentication
router.use(authMiddleware);
router.use(requireUser);

// Project CRUD
router.post("/", validate(createProjectSchema), createProject);
router.get("/", getUserProjects);
router.get("/search", searchProjects);
router.get("/:projectId", getProjectById);
router.put("/:projectId", validate(updateProjectSchema), updateProject);
router.delete("/:projectId", deleteProject);

// Member management
router.post("/:projectId/members", validate(addMemberSchema), addMemberToProject);
router.delete("/:projectId/members/:memberId", removeMemberFromProject);

export default router;
