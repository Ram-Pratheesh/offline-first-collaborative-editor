import api from './api';
import type { Document, ChangeSummary, ChangeEvent } from '../types';

export const documentService = {
  async create(title?: string, icon?: string): Promise<Document> {
    const { data } = await api.post('/documents', { title, icon });
    return data.document;
  },

  async getAll(filter?: string, search?: string): Promise<Document[]> {
    const params = new URLSearchParams();
    if (filter) params.set('filter', filter);
    if (search) params.set('search', search);
    const { data } = await api.get(`/documents?${params}`);
    return data.documents;
  },

  async getById(id: string): Promise<Document> {
    const { data } = await api.get(`/documents/${id}`);
    return data.document;
  },

  async update(id: string, updates: Partial<Document>): Promise<Document> {
    const { data } = await api.patch(`/documents/${id}`, updates);
    return data.document;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },

  async share(id: string, email: string, permission: 'editor' | 'viewer'): Promise<Document> {
    const { data } = await api.post(`/documents/${id}/share`, { email, permission });
    return data.document;
  },

  async joinDocument(id: string): Promise<Document> {
    const { data } = await api.post(`/documents/${id}/join`);
    return data.document;
  },

  async removeCollaborator(docId: string, userId: string): Promise<void> {
    await api.delete(`/documents/${docId}/share/${userId}`);
  },

  async toggleStar(id: string): Promise<boolean> {
    const { data } = await api.post(`/documents/${id}/star`);
    return data.isStarred;
  },


  async summarizeChanges(changes: ChangeEvent[], documentTitle: string): Promise<ChangeSummary> {
    const { data } = await api.post('/ai/summarize-changes', { changes, documentTitle });
    return data.summary;
  },

  async getDocumentSummary(id: string): Promise<string> {
    const { data } = await api.get(`/ai/document-summary/${id}`);
    return data.summary;
  },

  async getTrackedSummary(id: string): Promise<ChangeSummary> {
    const { data } = await api.get(`/ai/document-changes/${id}`);
    return data.summary;
  },
};
