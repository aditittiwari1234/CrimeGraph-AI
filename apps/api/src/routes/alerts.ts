import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { query } from '../db/postgres';
import { logger } from '../utils/logger';

const router = Router();
router.use(authenticate);

// GET /api/alerts
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { severity, acknowledged, limit = 50, offset = 0 } = req.query;
    let sql = `SELECT a.*, u.full_name as acknowledged_by_name 
               FROM alerts a LEFT JOIN users u ON a.acknowledged_by = u.id`;
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (severity) { conditions.push(`a.severity = $${params.length + 1}`); params.push(severity); }
    if (acknowledged !== undefined) { conditions.push(`a.is_acknowledged = $${params.length + 1}`); params.push(acknowledged === 'true'); }

    if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;
    sql += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    const countResult = await query('SELECT COUNT(*) FROM alerts');
    
    res.json({ alerts: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (error) {
    logger.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// PATCH /api/alerts/:id/acknowledge
router.patch('/:id/acknowledge', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `UPDATE alerts SET is_acknowledged = true, acknowledged_by = $1, acknowledged_at = NOW()
       WHERE id = $2 RETURNING *`,
      [req.user?.id, req.params.id]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Alert not found' }); return; }
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Acknowledge alert error:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

export default router;
