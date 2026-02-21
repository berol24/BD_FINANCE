import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
export declare const getTransactions: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createTransaction: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateTransaction: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteTransaction: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=transactionController.d.ts.map