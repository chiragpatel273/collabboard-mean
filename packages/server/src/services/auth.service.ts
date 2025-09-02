import { User, IUser } from "../models/user.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../config/config";
import { AppError } from "../middleware/error.middleware";

const generateAccessToken = (userId: string, email: string) => {
  return jwt.sign(
    { id: userId, email },
    config.accessTokenSecret,
    { expiresIn: "15m" } // Short-lived access token
  );
};

const generateRefreshToken = (userId: string) => {
  return jwt.sign(
    { id: userId, type: "refresh" },
    config.refreshTokenSecret,
    { expiresIn: "7d" } // Long-lived refresh token
  );
};

const cleanupExpiredTokens = async (user: IUser) => {
  const validTokens: string[] = [];
  
  for (const token of user.refreshTokens) {
    try {
      jwt.verify(token, config.refreshTokenSecret);
      validTokens.push(token); // Token is still valid
    } catch (error) {
      // Token is expired or invalid, don't include it
      console.log(`Removed expired refresh token for user ${user.email}`);
    }
  }
  
  // Update user with only valid tokens
  if (validTokens.length !== user.refreshTokens.length) {
    user.refreshTokens = validTokens;
    await user.save();
  }
  
  return validTokens.length;
};

export const register = async (name: string, email: string, password: string) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("User already exists with this email", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = new User({ name, email, password: hashedPassword, refreshTokens: [] });
  await user.save();

  // Generate tokens
  const accessToken = generateAccessToken(user._id as string, user.email);
  const refreshToken = generateRefreshToken(user._id as string);

  // Save refresh token to user
  user.refreshTokens.push(refreshToken);
  await user.save();

  return { user, accessToken, refreshToken };
};

export const login = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  // Clean up expired tokens before adding new one
  await cleanupExpiredTokens(user);

  // Generate tokens
  const accessToken = generateAccessToken(user._id as string, user.email);
  const refreshToken = generateRefreshToken(user._id as string);

  // Save refresh token to user
  user.refreshTokens.push(refreshToken);
  await user.save();

  return { user, accessToken, refreshToken };
};

export const refreshToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, config.refreshTokenSecret) as any;
    
    if (decoded.type !== "refresh") {
      throw new AppError("Invalid refresh token", 401);
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokens.includes(token)) {
      throw new AppError("Invalid refresh token", 401);
    }

    // Clean up expired tokens while we're here
    await cleanupExpiredTokens(user);

    // Generate new access token
    const accessToken = generateAccessToken(user._id as string, user.email);
    
    return { accessToken, user };
  } catch (error) {
    throw new AppError("Invalid refresh token", 401);
  }
};

export const logout = async (userId: string, refreshToken: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Remove the refresh token
  user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
  await user.save();

  return { message: "Logged out successfully" };
};

export const logoutAll = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Remove all refresh tokens
  user.refreshTokens = [];
  await user.save();

  return { message: "Logged out from all devices successfully" };
};

export const cleanupAllExpiredTokens = async () => {
  const users = await User.find({ refreshTokens: { $exists: true, $not: { $size: 0 } } });
  let totalCleaned = 0;
  let usersAffected = 0;

  for (const user of users) {
    const originalCount = user.refreshTokens.length;
    const validTokensCount = await cleanupExpiredTokens(user);
    
    if (validTokensCount < originalCount) {
      usersAffected++;
      totalCleaned += (originalCount - validTokensCount);
    }
  }

  return { 
    usersAffected, 
    totalTokensRemoved: totalCleaned,
    message: `Cleaned up ${totalCleaned} expired tokens from ${usersAffected} users`
  };
};
