import mongoose, { Schema, Document } from 'mongoose';

export type SemanticRelationship = 'DUPLICATE' | 'COMPLEMENTARY' | 'CONTRADICTORY' | 'INDEPENDENT';
export type HumanDecision = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'KEPT_BOTH' | 'KEPT_ONE' | 'EDITED';

export interface ISemanticResult extends Document {
  inspectionId: mongoose.Types.ObjectId;
  locationId: string;
  observationIds: string[];
  contentHashes: string[];
  relationship: SemanticRelationship;
  confidence: number;
  reason: string;
  suggestedAction: string;
  suggestedText: string | null;
  humanDecision: HumanDecision;
  decidedBy: mongoose.Types.ObjectId | null;
  decidedAt: Date | null;
  aiProcessingTimeMs: number;
  createdAt: Date;
}

const semanticResultSchema = new Schema<ISemanticResult>(
  {
    inspectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Inspection',
      required: true,
      index: true,
    },
    locationId: {
      type: String,
      required: true,
    },
    observationIds: [
      {
        type: String,
        required: true,
      },
    ],
    contentHashes: [
      {
        type: String,
        required: true,
      },
    ],
    relationship: {
      type: String,
      enum: ['DUPLICATE', 'COMPLEMENTARY', 'CONTRADICTORY', 'INDEPENDENT'],
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    suggestedAction: {
      type: String,
      required: true,
    },
    suggestedText: {
      type: String,
      default: null,
      maxlength: 5000,
    },
    humanDecision: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'KEPT_BOTH', 'KEPT_ONE', 'EDITED'],
      default: 'PENDING',
    },
    decidedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    decidedAt: {
      type: Date,
      default: null,
    },
    aiProcessingTimeMs: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

semanticResultSchema.index({ inspectionId: 1, locationId: 1 });
semanticResultSchema.index({ inspectionId: 1, humanDecision: 1 });

export const SemanticResultModel = mongoose.model<ISemanticResult>('SemanticResult', semanticResultSchema);
