import mongoose, { Document, Schema } from "mongoose";

export interface IProject extends Document {
  name: string;
  description?: string;
  ownerId: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500 },
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date }
}, {
  timestamps: true
});

// Indexes for common queries
projectSchema.index({ ownerId: 1, isActive: 1 });
projectSchema.index({ members: 1, isActive: 1 });
projectSchema.index({ name: "text", description: "text" }); // For search

export const Project = mongoose.model<IProject>("Project", projectSchema);
