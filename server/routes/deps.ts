import type { Request, Response } from 'express';
import type { AuthUser } from '../auth';

export interface RouteDeps {
  requireDatabase(response: Response): boolean;
  requireAdmin(request: Request, response: Response): Promise<AuthUser | null>;
  recordAudit(userId: number, action: string, entityType: string, entityId: string | null, metadata?: unknown): Promise<void>;
}
