import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
export declare const createDocument: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getDocuments: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getDocument: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateDocument: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deleteDocument: (req: AuthRequest, res: Response) => Promise<void>;
export declare const shareDocument: (req: AuthRequest, res: Response) => Promise<void>;
export declare const removeCollaborator: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Link-based join: any authenticated user who knows the document ID
 * can join as a collaborator (editor by default).
 */
export declare const joinDocument: (req: AuthRequest, res: Response) => Promise<void>;
export declare const toggleStar: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getVersions: (req: AuthRequest, res: Response) => Promise<void>;
export declare const saveVersion: (req: AuthRequest, res: Response) => Promise<void>;
export declare const restoreVersion: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getYjsState: (req: AuthRequest, res: Response) => Promise<void>;
export declare const saveYjsState: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=documentController.d.ts.map