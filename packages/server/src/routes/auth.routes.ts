import { Router } from "express";
import { register, login, refresh, logoutUser, logoutAllDevices, cleanupExpiredTokens } from "../controllers/auth.controller";
import { authMiddleware } from "middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import { registerSchema, loginSchema } from "../schemas/user.schemas";
// import { authLimiter } from "../middleware/security.middleware";

const router = Router();

// Apply rate limiting to auth routes
// router.use(authLimiter);

router.post("/register", 
  validate(registerSchema), 
  register
);

router.post("/login", 
  validate(loginSchema), 
  login
);

router.post("/refresh", refresh);

router.post("/logout", authMiddleware, logoutUser);

router.post("/logout-all", authMiddleware, logoutAllDevices);

router.get("/me", authMiddleware, (req, res) => {
  const user = (req as any).user;
  res.json({ message: "User profile retrieved", user });
});

// Admin endpoint for manual token cleanup (you might want to add admin auth middleware)
router.post("/admin/cleanup-tokens", cleanupExpiredTokens);

export default router;
