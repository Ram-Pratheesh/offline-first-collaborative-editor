import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
export declare const register: (req: AuthRequest, res: Response) => Promise<void>;
export declare const login: (req: AuthRequest, res: Response) => Promise<void>;
export declare const googleAuth: (req: AuthRequest, res: Response) => Promise<void>;
export declare const refreshToken: (req: AuthRequest, res: Response) => Promise<void>;
export declare const logout: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMe: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateProfile: (req: AuthRequest, res: Response) => Promise<void>;
export declare const changePassword: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=authController.d.ts.map