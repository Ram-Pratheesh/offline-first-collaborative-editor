import mongoose, { Schema, Document } from 'mongoose';

export interface IResearchLog extends Document {
  inspectionId: mongoose.Types.ObjectId;
  eventType: string;
  data: Record<string, any>;
  timestamp: Date;
}

const researchLogSchema = new Schema<IResearchLog>(
  {
    inspectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Inspection',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        'inspection_created',
        'inspection_deleted',
        'collaborator_joined',
        'location_created',
        'location_deleted',
        'observation_created',
        'observation_updated',
        'sync_completed',
        'reconnection',
        'semantic_analysis_started',
        'semantic_analysis_completed',
        'human_decision',
        'report_finalized',
        'pdf_exported',
        'offline_start',
        'offline_end',
      ],
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

researchLogSchema.index({ inspectionId: 1, timestamp: -1 });
researchLogSchema.index({ inspectionId: 1, eventType: 1 });

export const ResearchLogModel = mongoose.model<IResearchLog>('ResearchLog', researchLogSchema);
