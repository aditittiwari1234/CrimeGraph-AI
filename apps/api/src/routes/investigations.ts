import { Router, Response } from 'express';
import { body, param, query as expressQuery, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/postgres';
import { authenticate, AuthenticatedRequest, logAction } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
router.use(authenticate);

// GET /api/investigations
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, priority, limit = 20, offset = 0 } = req.query;
    let sql = `
      SELECT i.*, 
        u1.full_name as created_by_name, 
        u2.full_name as assigned_to_name,
        COUNT(DISTINCT ie.id) as entity_count,
        COUNT(DISTINCT a.id) as alert_count
      FROM investigations i
      LEFT JOIN users u1 ON i.created_by = u1.id
      LEFT JOIN users u2 ON i.assigned_to = u2.id
      LEFT JOIN investigation_entities ie ON ie.investigation_id = i.id
      LEFT JOIN alerts a ON a.investigation_id = i.id AND a.is_acknowledged = false
    `;
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (status) { conditions.push(`i.status = $${params.length + 1}`); params.push(status); }
    if (priority) { conditions.push(`i.priority = $${params.length + 1}`); params.push(priority); }

    // Non-admins can only see their own or assigned investigations
    if (req.user?.role === 'investigator') {
      conditions.push(`(i.created_by = $${params.length + 1} OR i.assigned_to = $${params.length + 1})`);
      params.push(req.user.id);
    }

    if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;
    sql += ` GROUP BY i.id, u1.full_name, u2.full_name ORDER BY i.updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    const countResult = await query('SELECT COUNT(*) FROM investigations');

    res.json({
      investigations: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    logger.error('Get investigations error:', error);
    res.status(500).json({ error: 'Failed to fetch investigations' });
  }
});

// GET /api/investigations/officers — active officers available for case assignment
router.get('/officers', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT id, username, full_name, role, badge_number, department
       FROM users
       WHERE is_active = true AND role IN ('investigator', 'senior_investigator')
       ORDER BY full_name`
    );
    res.json({ officers: result.rows });
  } catch (error) {
    logger.error('Get officers error:', error);
    res.status(500).json({ error: 'Failed to fetch officers' });
  }
});

// GET /api/investigations/:id
router.get('/:id', param('id').trim().notEmpty(), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }
  
  try {
    const result = await query(
      `SELECT i.*, u1.full_name as created_by_name, u2.full_name as assigned_to_name
       FROM investigations i
       LEFT JOIN users u1 ON i.created_by = u1.id
       LEFT JOIN users u2 ON i.assigned_to = u2.id
      WHERE i.id::text = $1 OR i.case_number = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) { res.status(404).json({ error: 'Investigation not found' }); return; }

    const investigationId = result.rows[0].id;

    const entities = await query(
      'SELECT * FROM investigation_entities WHERE investigation_id = $1 ORDER BY added_at DESC',
      [investigationId]
    );

    const notes = await query(
      `SELECT n.*, u.full_name as author_name FROM investigation_notes n
       LEFT JOIN users u ON n.author_id = u.id
      WHERE n.investigation_id = $1 ORDER BY n.created_at DESC`,
          [investigationId]
    );

    await logAction(req.user?.id, req.user?.username, 'VIEW_INVESTIGATION', 'investigation', req.params.id, `Viewed investigation ${req.params.id}`, req.ip || '', req.headers['user-agent'] || '', 'success');

    res.json({
      ...result.rows[0],
      entities: entities.rows,
      notes: notes.rows,
    });
  } catch (error) {
    logger.error('Get investigation error:', error);
    res.status(500).json({ error: 'Failed to fetch investigation' });
  }
});

// POST /api/investigations
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title required').isLength({ max: 500 }),
    body('description').optional().trim(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('tags').optional().isArray(),
    body('assignedTo').optional({ values: 'falsy' }).isUUID().withMessage('Assigned officer must be valid'),
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

    const { title, description, priority = 'medium', tags = [], assignedTo } = req.body;
    const caseNumber = `CASE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;

    try {
      const result = await query(
        `INSERT INTO investigations (case_number, title, description, priority, tags, created_by, assigned_to, status)
         VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, $6), 'active')
         RETURNING *`,
        [caseNumber, title, description, priority, tags, req.user?.id, assignedTo || null]
      );

      await logAction(req.user?.id, req.user?.username, 'CREATE_INVESTIGATION', 'investigation', result.rows[0].id, `Created investigation: ${title}`, req.ip || '', req.headers['user-agent'] || '', 'success');
      res.status(201).json(result.rows[0]);
    } catch (error) {
      logger.error('Create investigation error:', error);
      res.status(500).json({ error: 'Failed to create investigation' });
    }
  }
);

// PATCH /api/investigations/:id
router.patch('/:id', param('id').isUUID(), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

  const { title, description, status, priority, tags } = req.body;
  try {
    const result = await query(
      `UPDATE investigations SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        priority = COALESCE($4, priority),
        tags = COALESCE($5, tags),
        updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [title, description, status, priority, tags, req.params.id]
    );

    if (result.rows.length === 0) { res.status(404).json({ error: 'Investigation not found' }); return; }
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Update investigation error:', error);
    res.status(500).json({ error: 'Failed to update investigation' });
  }
});

// POST /api/investigations/:id/entities
router.post('/:id/entities', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { entityId, entityType, entityLabel } = req.body;
  try {
    const result = await query(
      `INSERT INTO investigation_entities (investigation_id, entity_id, entity_type, entity_label, added_by)
       SELECT i.id, $2, $3, $4, $5
       FROM investigations i
       WHERE i.id::text = $1 OR i.case_number = $1
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [req.params.id, entityId, entityType, entityLabel, req.user?.id]
    );
    res.status(201).json(result.rows[0] || { message: 'Entity already in investigation' });
  } catch (error) {
    logger.error('Add entity to investigation error:', error);
    res.status(500).json({ error: 'Failed to add entity' });
  }
});

// POST /api/investigations/:id/notes
router.post('/:id/notes', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { content, entityRef } = req.body;
  try {
    const result = await query(
      `INSERT INTO investigation_notes (investigation_id, author_id, content, entity_ref)
       SELECT i.id, $2, $3, $4
       FROM investigations i
       WHERE i.id::text = $1 OR i.case_number = $1
       RETURNING *`,
      [req.params.id, req.user?.id, content, entityRef]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Add note error:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// GET /api/investigations/dashboard/stats
router.get('/dashboard/stats', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [invStats, alertStats, entityStats] = await Promise.all([
      query(`SELECT 
        COUNT(*) FILTER (WHERE status = 'active') as active_investigations,
        COUNT(*) FILTER (WHERE status = 'closed') as closed_investigations,
        COUNT(*) FILTER (WHERE priority = 'critical') as critical_investigations,
        COUNT(*) as total_investigations
        FROM investigations`),
      query(`SELECT 
        COUNT(*) FILTER (WHERE is_acknowledged = false) as unacknowledged_alerts,
        COUNT(*) FILTER (WHERE severity = 'critical' AND is_acknowledged = false) as critical_alerts,
        COUNT(*) as total_alerts
        FROM alerts`),
      query(`SELECT COUNT(DISTINCT entity_id) as total_entities FROM investigation_entities`),
    ]);

    res.json({
      activeInvestigations: parseInt(invStats.rows[0].active_investigations),
      closedInvestigations: parseInt(invStats.rows[0].closed_investigations),
      criticalInvestigations: parseInt(invStats.rows[0].critical_investigations),
      totalInvestigations: parseInt(invStats.rows[0].total_investigations),
      unacknowledgedAlerts: parseInt(alertStats.rows[0].unacknowledged_alerts),
      criticalAlerts: parseInt(alertStats.rows[0].critical_alerts),
      totalAlerts: parseInt(alertStats.rows[0].total_alerts),
      totalEntities: parseInt(entityStats.rows[0].total_entities),
    });
  } catch (error) {
    logger.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
