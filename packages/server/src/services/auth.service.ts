import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { AppError } from '../middleware/error.middleware';
import { UserRepository } from '../repositories';
import { IUser, UserRole } from '../models/user.model';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  private generateAccessToken(userId: string, email: string, role: string): string {
    return jwt.sign(
      { id: userId, email, role },
      config.accessTokenSecret,
      { expiresIn: '15m' } // Short-lived access token
    );
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { id: userId, type: 'refresh' },
      config.refreshTokenSecret,
      { expiresIn: '7d' } // Long-lived refresh token
    );
  }

  private async cleanupExpiredTokens(user: IUser): Promise<number> {
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
      await this.userRepository.updateRefreshTokens(user._id as string, validTokens);
    }

    return validTokens.length;
  }

  async register(name: string, email: string, password: string, role: UserRole = UserRole.USER) {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('User already exists with this email', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      role,
      refreshTokens: [],
      isActive: true,
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(user._id as string, user.email, user.role);
    const refreshToken = this.generateRefreshToken(user._id as string);

    // Save refresh token to user
    await this.userRepository.updateRefreshTokens(user._id as string, [refreshToken]);

    return { user, accessToken, refreshToken };
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account has been deactivated', 401);
    }

    // Update last login
    await this.userRepository.updateLastLogin(user._id as string);

    // Clean up expired tokens before adding new one
    await this.cleanupExpiredTokens(user);

    // Generate tokens
    const accessToken = this.generateAccessToken(user._id as string, user.email, user.role);
    const refreshToken = this.generateRefreshToken(user._id as string);

    // Add refresh token to user's existing tokens
    const currentTokens = user.refreshTokens || [];
    await this.userRepository.updateRefreshTokens(user._id as string, [
      ...currentTokens,
      refreshToken,
    ]);

    return { user, accessToken, refreshToken };
  }

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, config.refreshTokenSecret) as { id: string; type: string };

      if (decoded.type !== 'refresh') {
        throw new AppError('Invalid token type', 401);
      }

      const user = await this.userRepository.findById(decoded.id);
      if (!user || !user.isActive) {
        throw new AppError('User not found or inactive', 401);
      }

      if (!user.refreshTokens.includes(token)) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Clean up expired tokens
      await this.cleanupExpiredTokens(user);

      // Generate new access token
      const accessToken = this.generateAccessToken(user._id as string, user.email, user.role);

      return { user, accessToken };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid refresh token', 401);
      }
      throw error;
    }
  }

  async logout(userId: string, refreshToken: string) {
    await this.userRepository.removeRefreshToken(userId, refreshToken);
    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string) {
    await this.userRepository.clearAllRefreshTokens(userId);
    return { message: 'Logged out from all devices successfully' };
  }

  async validateAccessToken(token: string): Promise<{ id: string; email: string; role: string }> {
    try {
      const decoded = jwt.verify(token, config.accessTokenSecret) as {
        id: string;
        email: string;
        role: string;
      };
      return decoded;
    } catch (error) {
      throw new AppError('Invalid or expired access token', 401);
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await this.userRepository.findByIdAndUpdate(userId, {
      password: hashedNewPassword,
      refreshTokens: [], // Clear all refresh tokens to force re-login
    });

    return { message: 'Password changed successfully' };
  }

  async getUserProfile(userId: string) {
    const user = await this.userRepository.findById(userId, '-password -refreshTokens');
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  async updateProfile(userId: string, updateData: { name?: string; email?: string }) {
    if (updateData.email) {
      const existingUser = await this.userRepository.findByEmail(updateData.email);
      if (existingUser && (existingUser._id as string).toString() !== userId) {
        throw new AppError('Email already in use', 400);
      }
    }

    const user = await this.userRepository.findByIdAndUpdate(userId, updateData, {
      select: '-password -refreshTokens',
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async cleanupAllExpiredTokens() {
    const users = await this.userRepository.find({
      refreshTokens: { $exists: true, $not: { $size: 0 } },
    });
    let totalCleaned = 0;
    let usersAffected = 0;

    for (const user of users) {
      const originalCount = user.refreshTokens.length;
      const validTokensCount = await this.cleanupExpiredTokens(user);

      if (validTokensCount < originalCount) {
        usersAffected++;
        totalCleaned += originalCount - validTokensCount;
      }
    }

    return {
      usersAffected,
      totalTokensRemoved: totalCleaned,
      message: `Cleaned up ${totalCleaned} expired tokens from ${usersAffected} users`,
    };
  }
}

// Export singleton instance for backward compatibility
export const authService = new AuthService();

// Export individual functions for backward compatibility
export const register = authService.register.bind(authService);
export const login = authService.login.bind(authService);
export const refreshToken = authService.refreshToken.bind(authService);
export const logout = authService.logout.bind(authService);
export const logoutAll = authService.logoutAll.bind(authService);
export const cleanupAllExpiredTokens = authService.cleanupAllExpiredTokens.bind(authService);
