import type { Request, Response, NextFunction } from 'express';
export type AuthenticatedRequest = Request & {
    userId?: string;
};
export declare const authenticateAccessToken: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map