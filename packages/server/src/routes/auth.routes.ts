import { Router } from "express";
import { register, login } from "../controllers/auth.controller";
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

router.get("/me", authMiddleware, (req, res) => {
  const user = (req as any).user;
  res.json({ message: "User profile retrieved", user });
});

export default router;
