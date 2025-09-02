import { Document, Model, FilterQuery, UpdateQuery, QueryOptions } from "mongoose";

export abstract class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  // Create operations
  async create(data: Partial<T>): Promise<T> {
    const document = new this.model(data);
    return await document.save();
  }

  async createMany(data: Partial<T>[]): Promise<any[]> {
    return await this.model.insertMany(data);
  }

  // Read operations
  async findById(id: string, populate?: string | string[]): Promise<T | null> {
    let query = this.model.findById(id);
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach(path => query = query.populate(path));
      } else {
        query = query.populate(populate);
      }
    }
    return await query.exec();
  }

  async findOne(filter: FilterQuery<T>, populate?: string | string[]): Promise<T | null> {
    let query = this.model.findOne(filter);
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach(path => query = query.populate(path));
      } else {
        query = query.populate(populate);
      }
    }
    return await query.exec();
  }

  async find(
    filter: FilterQuery<T> = {},
    options: {
      populate?: string | string[];
      sort?: Record<string, 1 | -1>;
      limit?: number;
      skip?: number;
      select?: string;
    } = {}
  ): Promise<T[]> {
    let query = this.model.find(filter);
    
    if (options.populate) {
      if (Array.isArray(options.populate)) {
        options.populate.forEach(path => query = query.populate(path));
      } else {
        query = query.populate(options.populate);
      }
    }
    
    if (options.sort) query = query.sort(options.sort);
    if (options.limit) query = query.limit(options.limit);
    if (options.skip) query = query.skip(options.skip);
    if (options.select) query = query.select(options.select);
    
    return await query.exec();
  }

  async findWithPagination(
    filter: FilterQuery<T> = {},
    page: number = 1,
    limit: number = 10,
    options: {
      populate?: string | string[];
      sort?: Record<string, 1 | -1>;
      select?: string;
    } = {}
  ): Promise<{
    documents: T[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalDocuments: number;
      hasMore: boolean;
    };
  }> {
    const skip = (page - 1) * limit;
    
    const [documents, totalDocuments] = await Promise.all([
      this.find(filter, { ...options, limit, skip }),
      this.countDocuments(filter)
    ]);

    return {
      documents,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalDocuments / limit),
        totalDocuments,
        hasMore: skip + limit < totalDocuments
      }
    };
  }

  // Update operations
  async findByIdAndUpdate(
    id: string,
    update: UpdateQuery<T>,
    options: QueryOptions = { new: true, runValidators: true }
  ): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, update, options);
  }

  async findOneAndUpdate(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options: QueryOptions = { new: true, runValidators: true }
  ): Promise<T | null> {
    return await this.model.findOneAndUpdate(filter, update, options);
  }

  async updateMany(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>
  ): Promise<{ modifiedCount: number; matchedCount: number }> {
    const result = await this.model.updateMany(filter, update);
    return {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    };
  }

  // Delete operations
  async findByIdAndDelete(id: string): Promise<T | null> {
    return await this.model.findByIdAndDelete(id);
  }

  async findOneAndDelete(filter: FilterQuery<T>): Promise<T | null> {
    return await this.model.findOneAndDelete(filter);
  }

  async deleteMany(filter: FilterQuery<T>): Promise<{ deletedCount: number }> {
    const result = await this.model.deleteMany(filter);
    return { deletedCount: result.deletedCount };
  }

  // Utility operations
  async countDocuments(filter: FilterQuery<T> = {}): Promise<number> {
    return await this.model.countDocuments(filter);
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const count = await this.model.countDocuments(filter).limit(1);
    return count > 0;
  }

  // Search operations
  async textSearch(
    searchTerm: string,
    filter: FilterQuery<T> = {},
    options: {
      populate?: string | string[];
      sort?: Record<string, 1 | -1>;
      limit?: number;
      skip?: number;
    } = {}
  ): Promise<T[]> {
    const searchFilter = {
      ...filter,
      $text: { $search: searchTerm }
    };

    return await this.find(searchFilter, {
      ...options,
      sort: { score: { $meta: 'textScore' } as any, ...options.sort }
    });
  }
}
