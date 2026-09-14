import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db/postgres';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
    fullName: string;
  };
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as jwt.JwtPayload;
    req.user = {
      id: payload.sub as string,
      username: payload.username,
      email: payload.email,
      role: payload.role,
      fullName: payload.fullName,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions for this action' });
      return;
    }
    next();
  };
}

export async function logAction(
  userId: string | undefined,
  username: string | undefined,
  action: string,
  resourceType: string,
  resourceId: string | null,
  description: string,
  ip: string,
  userAgent: string,
  result: 'success' | 'failure' | 'error',
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    const { generateAuditHash } = await import('../utils/crypto');
    
    // Get last audit hash for chain
    const lastAudit = await query(
      'SELECT data_hash FROM audit_logs ORDER BY timestamp DESC LIMIT 1'
    );
    const previousHash = lastAudit.rows[0]?.data_hash || 'GENESIS';
    
    const dataHash = generateAuditHash(userId || 'anonymous', action, timestamp, previousHash);

    await query(
      `INSERT INTO audit_logs (user_id, username, action, resource_type, resource_id, description, ip_address, user_agent, result, metadata, data_hash, previous_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [userId, username, action, resourceType, resourceId, description, ip, userAgent, result, JSON.stringify(metadata), dataHash, previousHash]
    );
  } catch (error) {
    logger.error('Failed to write audit log:', error);
  }
}
