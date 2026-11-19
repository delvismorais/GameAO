import type { Request, Response } from 'express';
import type { AuthUser } from '../auth';
import type { Capability } from '../security';

export interface RouteDeps {
  requireDatabase(response: Response): boolean;
  requireAdmin(request: Request, response: Response, capability?: Capability): Promise<AuthUser | null>;
  recordAudit(userId: number, action: string, entityType: string, entityId: string | null, metadata?: unknown): Promise<void>;
}
