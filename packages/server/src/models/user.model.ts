import mongoose, { Document, Schema } from 'mongoose';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  refreshTokens: string[];
  isActive: boolean;
  lastLogin?: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    refreshTokens: [{ type: String }],
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
