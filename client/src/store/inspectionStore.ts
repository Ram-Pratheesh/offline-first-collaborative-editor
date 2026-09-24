import { create } from 'zustand';
import type {
  Inspection,
  InspectionLocation,
  ObservationMeta,
  SemanticRelation,
  ReportStatus,
  ReconnectionSummary,
} from '../types';

export interface CollaboratorStatus {
  userId: string;
  userName: string;
  email?: string;
  isOnline: boolean;
  color: string;
  isOwner?: boolean;
  permission?: 'editor' | 'viewer';
}

interface InspectionState {
  // Inspection metadata
  inspection: Inspection | null;
  isLoading: boolean;

  // Locations (synced via Yjs Y.Map, this is the reactive mirror)
  locations: InspectionLocation[];
  selectedLocationId: string | null;

  // Observations (synced via Yjs Y.Map)
  observations: ObservationMeta[];

  // Collaborator status
  collaborators: CollaboratorStatus[];

  // Semantic analysis
  semanticResults: SemanticRelation[];
  isAnalyzing: boolean;

  // Report status
  reportStatus: ReportStatus | null;

  // Reconnection
  reconnectionSummary: ReconnectionSummary | null;
  showReconnectionModal: boolean;

  // Actions
  setInspection: (inspection: Inspection | null) => void;
  setLoading: (loading: boolean) => void;
  setLocations: (locations: InspectionLocation[]) => void;
  addLocation: (location: InspectionLocation) => void;
  setSelectedLocationId: (id: string | null) => void;
  setObservations: (observations: ObservationMeta[]) => void;
  addObservation: (obs: ObservationMeta) => void;
  updateObservation: (obsId: string, updates: Partial<ObservationMeta>) => void;
  setCollaborators: (collaborators: CollaboratorStatus[]) => void;
  setSemanticResults: (results: SemanticRelation[]) => void;
  updateSemanticResult: (resultId: string, updates: Partial<SemanticRelation>) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setReportStatus: (status: ReportStatus | null) => void;
  setReconnectionSummary: (summary: ReconnectionSummary | null) => void;
  setShowReconnectionModal: (show: boolean) => void;
  reset: () => void;

  // Computed helpers
  getObservationsForLocation: (locationId: string) => ObservationMeta[];
  getSemanticResultsForLocation: (locationId: string) => SemanticRelation[];
  getPendingReviewCount: () => number;
}

export const COLLABORATOR_COLORS = [
  '#f87171', '#fb923c', '#4ade80', '#22d3ee',
  '#60a5fa', '#a78bfa', '#f472b6', '#e879f9',
];

const initialState = {
  inspection: null,
  isLoading: true,
  locations: [],
  selectedLocationId: null,
  observations: [],
  collaborators: [],
  semanticResults: [],
  isAnalyzing: false,
  reportStatus: null,
  reconnectionSummary: null,
  showReconnectionModal: false,
};

export const useInspectionStore = create<InspectionState>((set, get) => ({
  ...initialState,

  setInspection: (inspection) => set({ inspection }),
  setLoading: (isLoading) => set({ isLoading }),

  setLocations: (locations) => set({ locations }),
  addLocation: (location) =>
    set((s) => ({
      locations: s.locations.some((l) => l.locationId === location.locationId)
        ? s.locations
        : [...s.locations, location],
    })),
  setSelectedLocationId: (id) => set({ selectedLocationId: id }),

  setObservations: (observations) => set({ observations }),
  addObservation: (obs) =>
    set((s) => ({
      observations: s.observations.some((o) => o.observationId === obs.observationId)
        ? s.observations
        : [...s.observations, obs],
    })),
  updateObservation: (obsId, updates) =>
    set((s) => ({
      observations: s.observations.map((o) =>
        o.observationId === obsId ? { ...o, ...updates } : o
      ),
    })),

  setCollaborators: (collaborators) => set({ collaborators }),

  setSemanticResults: (semanticResults) => set({ semanticResults }),
  updateSemanticResult: (resultId, updates) =>
    set((s) => ({
      semanticResults: s.semanticResults.map((r) =>
        r._id === resultId ? { ...r, ...updates } : r
      ),
    })),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

  setReportStatus: (reportStatus) => set({ reportStatus }),

  setReconnectionSummary: (reconnectionSummary) => set({ reconnectionSummary }),
  setShowReconnectionModal: (showReconnectionModal) => set({ showReconnectionModal }),

  reset: () => set(initialState),

  // Computed helpers
  getObservationsForLocation: (locationId) => {
    return get().observations.filter((o) => o.locationId === locationId);
  },
  getSemanticResultsForLocation: (locationId) => {
    return get().semanticResults.filter((r) => r.locationId === locationId);
  },
  getPendingReviewCount: () => {
    return get().semanticResults.filter(
      (r) => r.humanDecision === 'PENDING' && r.relationship !== 'INDEPENDENT'
    ).length;
  },
}));
