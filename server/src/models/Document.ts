import mongoose, { Schema, Document } from 'mongoose';

export interface ICollaborator {
  user: mongoose.Types.ObjectId;
  permission: 'editor' | 'viewer';
  addedAt: Date;
}

export interface IDocument extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  icon: string;
  owner: mongoose.Types.ObjectId;
  collaborators: ICollaborator[];
  isStarredBy: mongoose.Types.ObjectId[];
  yjsState: Buffer | null;
  lastEditedBy: mongoose.Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const collaboratorSchema = new Schema<ICollaborator>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    permission: {
      type: String,
      enum: ['editor', 'viewer'],
      default: 'editor',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const documentSchema = new Schema<IDocument>(
  {
    title: {
      type: String,
      default: 'Untitled Document',
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: '📄',
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collaborators: [collaboratorSchema],
    isStarredBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    yjsState: {
      type: Buffer,
      default: null,
    },
    lastEditedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ owner: 1, isDeleted: 1 });
documentSchema.index({ 'collaborators.user': 1, isDeleted: 1 });
documentSchema.index({ title: 'text', content: 'text' });

export const DocumentModel = mongoose.model<IDocument>('Document', documentSchema);
