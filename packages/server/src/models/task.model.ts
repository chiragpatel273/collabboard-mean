import mongoose, { Document, Schema } from 'mongoose';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface ITask extends Document {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;

  // Project & Assignment
  projectId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;

  // Dates
  dueDate?: Date;
  completedAt?: Date;

  // Simple features
  tags: string[];

  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.TODO,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
    },

    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },

    dueDate: { type: Date },
    completedAt: { type: Date },

    tags: [{ type: String, trim: true, lowercase: true, maxlength: 50 }],
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ title: 'text', description: 'text' }); // For search

// Middleware to set completedAt when status changes to DONE
taskSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === TaskStatus.DONE && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== TaskStatus.DONE) {
      this.completedAt = undefined;
    }
  }
  next();
});

export const Task = mongoose.model<ITask>('Task', taskSchema);
