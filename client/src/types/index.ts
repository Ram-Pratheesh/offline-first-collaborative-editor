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
