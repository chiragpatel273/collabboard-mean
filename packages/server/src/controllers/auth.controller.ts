import { Request, Response } from "express";
import { register as registerUser, login as loginUser } from "../services/auth.service";
import { asyncHandler } from "../middleware/error.middleware";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const user = await registerUser(name, email, password);
  
  res.status(201).json({
    message: "User registered successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { token, user } = await loginUser(email, password);
  
  res.json({
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  });
});