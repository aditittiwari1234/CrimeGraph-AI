import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { runCypherQuery } from '../db/neo4j';
import { query } from '../db/postgres';
import { logger } from '../utils/logger';

const router = Router();
router.use(authenticate);

// GET /api/timeline — investigation or entity timeline
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { entityId, entityType, investigationId, from, to, eventTypes, limit = 100 } = req.query;

  try {
    const events: Record<string, unknown>[] = [];

    if (entityId && entityType) {
      // Neo4j entity timeline
      let dateFilter = '';
      if (from) dateFilter += ` AND r.timestamp >= '${from}'`;
      if (to) dateFilter += ` AND r.timestamp <= '${to}'`;

      const result = await runCypherQuery(`
        MATCH (n:${entityType} {id: $entityId})-[r]-(m)
        WHERE r.timestamp IS NOT NULL ${dateFilter}
        RETURN r, type(r) as relType, m, labels(m)[0] as targetType
        ORDER BY r.timestamp DESC
        LIMIT $limit
      `, { entityId, limit: parseInt(String(limit)) });

      result.records.forEach(r => {
        events.push({
          id: `neo4j-${Math.random()}`,
          timestamp: r.get('r').properties.timestamp,
          type: r.get('relType'),
          category: mapRelToCategory(r.get('relType')),
          source: 'graph',
          target: { ...r.get('m').properties, nodeType: r.get('targetType') },
          properties: r.get('r').properties,
          recordRef: r.get('r').properties.recordRef,
        });
      });
    }

    if (investigationId) {
      // Get document events
      const docs = await query(
        'SELECT * FROM documents WHERE investigation_id = $1 ORDER BY created_at DESC LIMIT 50',
        [investigationId]
      );
      docs.rows.forEach(d => {
        events.push({
          id: `doc-${d.id}`,
          timestamp: d.created_at,
          type: 'DOCUMENT_UPLOADED',
          category: 'document',
          source: 'investigation',
          target: { name: d.original_name, documentType: d.document_type },
          properties: {},
        });
      });
    }

    // Sort by timestamp descending
    events.sort((a, b) => {
      const ta = new Date(String(a.timestamp || 0)).getTime();
      const tb = new Date(String(b.timestamp || 0)).getTime();
      return tb - ta;
    });

    res.json({ events: events.slice(0, parseInt(String(limit))), total: events.length });
  } catch (error) {
    logger.error('Timeline error:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

function mapRelToCategory(relType: string): string {
  const categories: Record<string, string> = {
    CALLS: 'communication', MESSAGES: 'communication', FINANCIAL_TRANSACTION: 'financial',
    LOCATED_AT: 'location', SHARED_LOCATION: 'location', APPEARED_IN_CASE: 'case',
    ATTENDED_EVENT: 'event', OWNS: 'association', WORKS_FOR: 'association',
    ASSOCIATED_WITH: 'association', RELATED_TO: 'association',
  };
  return categories[relType] || 'other';
}

export default router;
