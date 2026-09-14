import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest, authorize } from '../middleware/auth';
import { query } from '../db/postgres';
import { logger } from '../utils/logger';

const router = Router();
router.use(authenticate);

// GET /api/audit — audit log (admin/senior only)
router.get('/', authorize('administrator', 'senior_investigator'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId, action, from, to, limit = 100, offset = 0 } = req.query;
    let sql = `SELECT al.*, u.full_name FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id`;
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (userId) { conditions.push(`al.user_id = $${params.length + 1}`); params.push(userId); }
    if (action) { conditions.push(`al.action = $${params.length + 1}`); params.push(action); }
    if (from) { conditions.push(`al.timestamp >= $${params.length + 1}`); params.push(from); }
    if (to) { conditions.push(`al.timestamp <= $${params.length + 1}`); params.push(to); }

    if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;
    sql += ` ORDER BY al.timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    const count = await query('SELECT COUNT(*) FROM audit_logs');

    res.json({ logs: result.rows, total: parseInt(count.rows[0].count) });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
