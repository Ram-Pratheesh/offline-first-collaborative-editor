export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  googleId?: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface Collaborator {
  user: User;
  permission: 'editor' | 'viewer';
  addedAt: string;
}

export interface Document {
  _id: string;
  title: string;
  content: string;
  icon: string;
  owner: User;
  collaborators: Collaborator[];
  isStarredBy: string[];
  lastEditedBy: User;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ChangeSummary {
  summary: string;
  contributorChanges: {
    userName: string;
    changes: string[];
  }[];
  importantAdditions: string[];
  removedContent: string[];
  noEditsLost: boolean;
  totalEdits: number;
}

export interface ChangeEvent {
  userId: string;
  userName: string;
  timestamp: string;
  changeType: 'insert' | 'delete' | 'format' | 'restructure';
  affectedContent: string;
  section?: string;
}

// ─── Inspection Workspace Types ───────────────────────────────────────────────

export type InspectionStatus =
  | 'DRAFT'
  | 'SYNCHRONIZING'
  | 'REVIEW_REQUIRED'
  | 'READY_TO_FINALIZE'
  | 'FINALIZED';

export interface Inspection {
  _id: string;
  title: string;
  description: string;
  owner: User;
  collaborators: Collaborator[];
  status: InspectionStatus;
  locations: InspectionLocation[];
  isDeleted: boolean;
  finalizedAt: string | null;
  finalizedBy: User | null;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionLocation {
  locationId: string;
  name: string;
  parentId: string | null;
  createdBy: string;
  createdAt: string;
}

export interface ObservationMeta {
  observationId: string;
  locationId: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  connectivityState: 'online' | 'offline';
}

export type SemanticRelationship = 'DUPLICATE' | 'COMPLEMENTARY' | 'CONTRADICTORY' | 'INDEPENDENT';
export type HumanDecision = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'KEPT_BOTH' | 'KEPT_ONE' | 'EDITED';

export interface SemanticRelation {
  _id: string;
  inspectionId: string;
  locationId: string;
  observationIds: string[];
  relationship: SemanticRelationship;
  confidence: number;
  reason: string;
  suggestedAction: string;
  suggestedText: string | null;
  humanDecision: HumanDecision;
  decidedBy: string | null;
  decidedAt: string | null;
  aiProcessingTimeMs: number;
  createdAt: string;
}

export interface ReconnectionSummary {
  changesSynchronized: number;
  relevantObservations: number;
  semanticRelationships: {
    independent: number;
    duplicate: number;
    complementary: number;
    contradictory: number;
  };
}

export interface ReportStatus {
  synchronization: 'WAITING' | 'COMPLETE';
  semanticReview: 'WAITING' | 'COMPLETE' | 'NOT_REQUIRED';
  finalization: 'LOCKED' | 'READY' | 'FINALIZED';
  pdfExport: 'LOCKED' | 'AVAILABLE';
  totalUsers?: number;
  finalizedUsers?: number;
}
