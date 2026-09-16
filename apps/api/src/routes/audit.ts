import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest, authorize } from '../middleware/auth';
import { query } from '../db/postgres';
import { logger } from '../utils/logger';

const router = Router();
router.use(authenticate);

// GET /api/audit — list all audit logs with filters & search
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId, username, action, result: resultFilter, from, to, limit = 1000, offset = 0, search } = req.query;
    let sql = `SELECT al.*, u.full_name FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id`;
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (userId) { conditions.push(`al.user_id = $${params.length + 1}`); params.push(userId); }
    if (username) { conditions.push(`al.username = $${params.length + 1}`); params.push(username); }
    if (action) { conditions.push(`al.action = $${params.length + 1}`); params.push(action); }
    if (resultFilter) { conditions.push(`al.result = $${params.length + 1}`); params.push(resultFilter); }
    if (from) { conditions.push(`al.timestamp >= $${params.length + 1}`); params.push(from); }
    if (to) { conditions.push(`al.timestamp <= $${params.length + 1}`); params.push(to); }
    if (search) {
      conditions.push(`(
        al.username ILIKE $${params.length + 1} OR
        al.action ILIKE $${params.length + 1} OR
        al.resource_type ILIKE $${params.length + 1} OR
        al.resource_id ILIKE $${params.length + 1} OR
        al.description ILIKE $${params.length + 1} OR
        al.ip_address ILIKE $${params.length + 1} OR
        al.data_hash ILIKE $${params.length + 1}
      )`);
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;
    sql += ` ORDER BY al.timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    const countRes = await query('SELECT COUNT(*) FROM audit_logs');

    res.json({ logs: result.rows, total: parseInt(countRes.rows[0].count, 10) });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
