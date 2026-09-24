import mongoose, { Schema, Document } from 'mongoose';

export interface IObservation extends Document {
  inspectionId: mongoose.Types.ObjectId;
  observationId: string;
  locationId: string;
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  plainTextContent: string;
  connectivityState: 'online' | 'offline';
  createdAt: Date;
  updatedAt: Date;
}

const observationSchema = new Schema<IObservation>(
  {
    inspectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Inspection',
      required: true,
      index: true,
    },
    observationId: {
      type: String,
      required: true,
    },
    locationId: {
      type: String,
      required: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    plainTextContent: {
      type: String,
      default: '',
      maxlength: 10000,
    },
    connectivityState: {
      type: String,
      enum: ['online', 'offline'],
      default: 'online',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying
observationSchema.index({ inspectionId: 1, locationId: 1 });
observationSchema.index({ inspectionId: 1, observationId: 1 }, { unique: true });

export const ObservationModel = mongoose.model<IObservation>('Observation', observationSchema);
