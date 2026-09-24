import api from './api';
import type {
  Inspection,
  InspectionLocation,
  ObservationMeta,
  SemanticRelation,
  ReportStatus,
} from '../types';

export const inspectionService = {
  // ─── Inspection CRUD ───────────────────────────────────────────────────────

  async create(title: string, description?: string): Promise<Inspection> {
    const { data } = await api.post('/inspections', { title, description });
    return data.inspection;
  },

  async getAll(): Promise<Inspection[]> {
    const { data } = await api.get('/inspections');
    return data.inspections;
  },

  async getById(id: string): Promise<Inspection> {
    const { data } = await api.get(`/inspections/${id}`);
    return data.inspection;
  },

  async update(id: string, updates: Partial<Inspection>): Promise<Inspection> {
    const { data } = await api.patch(`/inspections/${id}`, updates);
    return data.inspection;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/inspections/${id}`);
  },

  async share(
    id: string,
    email: string,
    permission: 'editor' | 'viewer' = 'editor'
  ): Promise<Inspection> {
    const { data } = await api.post(`/inspections/${id}/share`, { email, permission });
    return data.inspection;
  },

  async removeCollaborator(id: string, userId: string): Promise<Inspection> {
    const { data } = await api.delete(`/inspections/${id}/collaborators/${userId}`);
    return data.inspection;
  },

  async join(id: string): Promise<Inspection> {
    const { data } = await api.post(`/inspections/${id}/join`);
    return data.inspection;
  },

  // ─── Locations ─────────────────────────────────────────────────────────────

  async createLocation(
    inspectionId: string,
    location: { locationId: string; name: string; parentId?: string | null }
  ): Promise<InspectionLocation[]> {
    const { data } = await api.post(`/inspections/${inspectionId}/locations`, location);
    return data.locations;
  },

  async getLocations(inspectionId: string): Promise<InspectionLocation[]> {
    const { data } = await api.get(`/inspections/${inspectionId}/locations`);
    return data.locations;
  },

  async deleteLocation(inspectionId: string, locationId: string): Promise<InspectionLocation[]> {
    const { data } = await api.delete(`/inspections/${inspectionId}/locations/${locationId}`);
    return data.locations;
  },

  // ─── Observations ──────────────────────────────────────────────────────────

  async snapshotObservations(
    inspectionId: string,
    observations: Array<{
      observationId: string;
      locationId: string;
      authorId: string;
      authorName: string;
      plainTextContent: string;
      connectivityState: 'online' | 'offline';
    }>
  ): Promise<void> {
    await api.post(`/inspections/${inspectionId}/observations/snapshot`, { observations });
  },

  async getObservations(inspectionId: string): Promise<ObservationMeta[]> {
    const { data } = await api.get(`/inspections/${inspectionId}/observations`);
    return data.observations;
  },

  // ─── Semantic Analysis ─────────────────────────────────────────────────────

  async triggerSemanticAnalysis(
    inspectionId: string,
    locationId: string
  ): Promise<SemanticRelation[]> {
    const { data } = await api.post(`/inspections/${inspectionId}/semantic-analysis`, {
      locationId,
    });
    return data.results;
  },

  async getSemanticResults(inspectionId: string): Promise<SemanticRelation[]> {
    const { data } = await api.get(`/inspections/${inspectionId}/semantic-results`);
    return data.results;
  },

  async recordDecision(
    inspectionId: string,
    resultId: string,
    decision: string
  ): Promise<SemanticRelation> {
    const { data } = await api.post(
      `/inspections/${inspectionId}/semantic-results/${resultId}/decide`,
      { decision }
    );
    return data.result;
  },

  // ─── Report ────────────────────────────────────────────────────────────────

  async getReportStatus(inspectionId: string): Promise<{
    status: ReportStatus;
    pendingReviews: number;
    totalSemanticResults: number;
  }> {
    const { data } = await api.get(`/inspections/${inspectionId}/report-status`);
    return data;
  },

  async finalizeReport(inspectionId: string): Promise<Inspection> {
    const { data } = await api.post(`/inspections/${inspectionId}/finalize`);
    return data.inspection;
  },

  async getExportData(inspectionId: string): Promise<any> {
    const { data } = await api.get(`/inspections/${inspectionId}/export-data`);
    return data;
  },

  // ─── Research ──────────────────────────────────────────────────────────────

  async getResearchLogs(inspectionId: string): Promise<any[]> {
    const { data } = await api.get(`/inspections/${inspectionId}/research-logs`);
    return data.logs;
  },
};
