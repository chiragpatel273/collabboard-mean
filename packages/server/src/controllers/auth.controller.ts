import { Request, Response } from "express";
import { register as registerUser, login as loginUser, refreshToken, logout, logoutAll, cleanupAllExpiredTokens } from "../services/auth.service";
import { asyncHandler } from "../middleware/error.middleware";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const { user, accessToken, refreshToken: newRefreshToken } = await registerUser(name, email, password);
  
  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  
  res.status(201).json({
    message: "User registered successfully",
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken: newRefreshToken } = await loginUser(email, password);
  
  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  
  res.json({
    message: "Login successful",
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshTokenFromCookie = req.cookies.refreshToken;
  
  if (!refreshTokenFromCookie) {
    return res.status(401).json({ message: "Refresh token not provided" });
  }
  
  const { accessToken, user } = await refreshToken(refreshTokenFromCookie);
  
  res.json({
    message: "Token refreshed successfully",
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  });
});

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  const refreshTokenFromCookie = req.cookies.refreshToken;
  const userId = (req as any).user.id;
  
  if (refreshTokenFromCookie) {
    await logout(userId, refreshTokenFromCookie);
  }
  
  res.clearCookie('refreshToken');
  res.json({ message: "Logged out successfully" });
});

export const logoutAllDevices = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  
  await logoutAll(userId);
  res.clearCookie('refreshToken');
  res.json({ message: "Logged out from all devices successfully" });
});

export const cleanupExpiredTokens = asyncHandler(async (req: Request, res: Response) => {
  const result = await cleanupAllExpiredTokens();
  res.json(result);
});