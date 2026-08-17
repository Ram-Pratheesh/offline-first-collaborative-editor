import mongoose, { Schema, Document } from 'mongoose';

export interface IChangeLog extends Document {
  documentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  changeType: 'insert' | 'delete';
  content: string;
  timestamp: Date;
  isOffline: boolean;
}

const changeLogSchema = new Schema<IChangeLog>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    changeType: {
      type: String,
      enum: ['insert', 'delete'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    isOffline: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for efficient querying by document + time
changeLogSchema.index({ documentId: 1, timestamp: -1 });

// TTL index: auto-delete logs older than 7 days to prevent unbounded growth
changeLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export const ChangeLogModel = mongoose.model<IChangeLog>('ChangeLog', changeLogSchema);
