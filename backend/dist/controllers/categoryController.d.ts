import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
export declare const getCategories: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const createCategory: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateCategory: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const deleteCategory: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=categoryController.d.ts.map