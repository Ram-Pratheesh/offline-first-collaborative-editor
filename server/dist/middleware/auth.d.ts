import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User.js';
export interface AuthRequest extends Request {
    user?: IUser;
}
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuth: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map