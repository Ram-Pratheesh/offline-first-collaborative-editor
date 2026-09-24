import mongoose, { Schema, Document } from 'mongoose';

export interface IInspectionCollaborator {
  user: mongoose.Types.ObjectId;
  permission: 'editor' | 'viewer';
  addedAt: Date;
}

export type InspectionStatus =
  | 'DRAFT'
  | 'SYNCHRONIZING'
  | 'REVIEW_REQUIRED'
  | 'READY_TO_FINALIZE'
  | 'FINALIZED';

export interface ILocationBackup {
  locationId: string;
  name: string;
  parentId: string | null;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IInspection extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  owner: mongoose.Types.ObjectId;
  collaborators: IInspectionCollaborator[];
  status: InspectionStatus;
  yjsState: Buffer | null;
  locations: ILocationBackup[];
  isDeleted: boolean;
  finalizedAt: Date | null;
  finalizedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const inspectionCollaboratorSchema = new Schema<IInspectionCollaborator>(
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

const locationBackupSchema = new Schema<ILocationBackup>(
  {
    locationId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    parentId: {
      type: String,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const inspectionSchema = new Schema<IInspection>(
  {
    title: {
      type: String,
      default: 'Untitled Inspection',
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collaborators: [inspectionCollaboratorSchema],
    status: {
      type: String,
      enum: ['DRAFT', 'SYNCHRONIZING', 'REVIEW_REQUIRED', 'READY_TO_FINALIZE', 'FINALIZED'],
      default: 'DRAFT',
    },
    yjsState: {
      type: Buffer,
      default: null,
    },
    locations: [locationBackupSchema],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    finalizedAt: {
      type: Date,
      default: null,
    },
    finalizedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

inspectionSchema.index({ owner: 1, isDeleted: 1 });
inspectionSchema.index({ 'collaborators.user': 1, isDeleted: 1 });
inspectionSchema.index({ status: 1 });

export const InspectionModel = mongoose.model<IInspection>('Inspection', inspectionSchema);
