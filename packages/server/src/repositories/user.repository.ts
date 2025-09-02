import { FilterQuery } from 'mongoose';
import { IUser, User } from '../models/user.model';
import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return await this.findOne({ email: email.toLowerCase() });
  }

  async findByUsername(username: string): Promise<IUser | null> {
    return await this.findOne({ username });
  }

  async findActiveUsers(filter: FilterQuery<IUser> = {}): Promise<IUser[]> {
    return await this.find({ ...filter, isActive: true });
  }

  async findByRole(role: 'user' | 'admin', filter: FilterQuery<IUser> = {}): Promise<IUser[]> {
    return await this.find({ ...filter, role });
  }

  async searchUsers(
    searchTerm: string,
    options: {
      limit?: number;
      skip?: number;
      excludeId?: string;
    } = {}
  ): Promise<IUser[]> {
    const filter: FilterQuery<IUser> = {};
    if (options.excludeId) {
      filter._id = { $ne: options.excludeId };
    }

    return await this.textSearch(searchTerm, filter, {
      limit: options.limit,
      skip: options.skip,
      populate: [],
    });
  }

  async findUsersWithPagination(
    filter: FilterQuery<IUser> = {},
    page: number = 1,
    limit: number = 10,
    options: {
      role?: 'user' | 'admin';
      isActive?: boolean;
    } = {}
  ) {
    // Build filter based on options
    const searchFilter: FilterQuery<IUser> = { ...filter };
    if (options.role !== undefined) searchFilter.role = options.role;
    if (options.isActive !== undefined) searchFilter.isActive = options.isActive;

    return await this.findWithPagination(searchFilter, page, limit, {
      select: '-password -refreshTokens',
      sort: { createdAt: -1 },
    });
  }

  async deactivateUser(userId: string): Promise<IUser | null> {
    return await this.findByIdAndUpdate(
      userId,
      { isActive: false, refreshTokens: [] },
      {
        new: true,
        runValidators: true,
        select: '-password -refreshTokens',
      }
    );
  }

  async activateUser(userId: string): Promise<IUser | null> {
    return await this.findByIdAndUpdate(
      userId,
      { isActive: true },
      {
        new: true,
        runValidators: true,
        select: '-password -refreshTokens',
      }
    );
  }

  async updateRefreshTokens(userId: string, refreshTokens: string[]): Promise<IUser | null> {
    return await this.findByIdAndUpdate(userId, { refreshTokens });
  }

  async removeRefreshToken(userId: string, tokenToRemove: string): Promise<IUser | null> {
    return await this.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: tokenToRemove },
    });
  }

  async clearAllRefreshTokens(userId: string): Promise<IUser | null> {
    return await this.findByIdAndUpdate(userId, { refreshTokens: [] });
  }

  async updateLastLogin(userId: string): Promise<IUser | null> {
    return await this.findByIdAndUpdate(userId, { lastLogin: new Date() });
  }

  async updateRole(userId: string, role: 'user' | 'admin'): Promise<IUser | null> {
    return await this.findByIdAndUpdate(
      userId,
      { role },
      {
        new: true,
        runValidators: true,
        select: '-password -refreshTokens',
      }
    );
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    recentUsers: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalUsers, activeUsers, adminUsers, recentUsers] = await Promise.all([
      this.countDocuments(),
      this.countDocuments({ isActive: true }),
      this.countDocuments({ role: 'admin' }),
      this.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      adminUsers,
      recentUsers,
    };
  }
}
