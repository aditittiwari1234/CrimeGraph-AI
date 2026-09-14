import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest, logAction } from '../middleware/auth';
import { runCypherQuery } from '../db/neo4j';
import { logger } from '../utils/logger';

const router = Router();
router.use(authenticate);

// GET /api/entities/search?q=&type=&limit=
router.get('/search', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { q = '', type, limit = 20 } = req.query;
  const searchTerm = String(q).toLowerCase();
  
  try {
    let cypher: string;
    let params: Record<string, unknown>;

    if (type) {
      cypher = `
        MATCH (n:${type})
        WHERE toLower(n.name) CONTAINS $search 
          OR toLower(coalesce(n.alias, '')) CONTAINS $search
          OR toLower(coalesce(n.number, '')) CONTAINS $search
          OR toLower(coalesce(n.accountNumber, '')) CONTAINS $search
          OR toLower(coalesce(n.licensePlate, '')) CONTAINS $search
        RETURN n, labels(n) as types
        LIMIT $limit
      `;
      params = { search: searchTerm, limit: parseInt(String(limit)) };
    } else {
      cypher = `
        MATCH (n)
        WHERE (n:Person OR n:Phone OR n:Vehicle OR n:Organization OR n:Location OR n:Account OR n:Case OR n:Event)
          AND (
            toLower(n.name) CONTAINS $search 
            OR toLower(coalesce(n.alias, '')) CONTAINS $search
            OR toLower(coalesce(n.number, '')) CONTAINS $search
            OR toLower(coalesce(n.accountNumber, '')) CONTAINS $search
            OR toLower(coalesce(n.licensePlate, '')) CONTAINS $search
            OR toLower(coalesce(n.caseNumber, '')) CONTAINS $search
          )
        RETURN n, labels(n) as types
        LIMIT $limit
      `;
      params = { search: searchTerm, limit: parseInt(String(limit)) };
    }

    const result = await runCypherQuery(cypher, params);

    await logAction(req.user?.id, req.user?.username, 'SEARCH_ENTITIES', 'entity', null, `Search: "${q}"`, req.ip || '', req.headers['user-agent'] || '', 'success', { query: q, type });

    const entities = result.records.map(record => ({
      ...record.get('n').properties,
      nodeType: record.get('types')[0],
      matchReason: getMatchReason(record.get('n').properties, searchTerm),
    }));

    res.json({ entities, total: entities.length, query: q });
  } catch (error) {
    logger.error('Entity search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

function getMatchReason(props: Record<string, unknown>, search: string): string {
  if (String(props.name || '').toLowerCase().includes(search)) return `Name matches "${search}"`;
  if (String(props.alias || '').toLowerCase().includes(search)) return `Alias matches "${search}"`;
  if (String(props.number || '').toLowerCase().includes(search)) return `Phone number matches`;
  if (String(props.accountNumber || '').toLowerCase().includes(search)) return `Account number matches`;
  if (String(props.licensePlate || '').toLowerCase().includes(search)) return `Vehicle plate matches`;
  return `Partial match on "${search}"`;
}

// GET /api/entities/:type/:id
router.get('/:type/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { type, id } = req.params;
  const validTypes = ['Person', 'Phone', 'Vehicle', 'Organization', 'Location', 'Account', 'Case', 'Event'];
  if (!validTypes.includes(type)) { res.status(400).json({ error: 'Invalid entity type' }); return; }

  try {
    const nodeResult = await runCypherQuery(`MATCH (n:${type} {id: $id}) RETURN n`, { id });
    if (nodeResult.records.length === 0) { res.status(404).json({ error: 'Entity not found' }); return; }

    const node = nodeResult.records[0].get('n').properties;

    // Get relationships
    const relResult = await runCypherQuery(`
      MATCH (n:${type} {id: $id})-[r]-(m)
      RETURN r, m, labels(m) as targetType, type(r) as relType
      LIMIT 100
    `, { id });

    const relationships = relResult.records.map(r => ({
      type: r.get('relType'),
      target: {
        ...r.get('m').properties,
        nodeType: r.get('targetType')[0],
      },
      properties: r.get('r').properties,
    }));

    await logAction(req.user?.id, req.user?.username, 'VIEW_ENTITY', 'entity', id, `Viewed ${type}: ${id}`, req.ip || '', req.headers['user-agent'] || '', 'success');

    res.json({ entity: { ...node, nodeType: type }, relationships, totalRelationships: relationships.length });
  } catch (error) {
    logger.error('Get entity error:', error);
    res.status(500).json({ error: 'Failed to fetch entity' });
  }
});

// GET /api/entities/:type/:id/network — neighbors for graph expansion
router.get('/:type/:id/network', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { type, id } = req.params;
  const { depth = 1, limit = 50 } = req.query;

  try {
    const result = await runCypherQuery(`
      MATCH path = (n:${type} {id: $id})-[*1..${Math.min(parseInt(String(depth)), 3)}]-(m)
      WITH n, m, relationships(path) as rels, nodes(path) as pathNodes
      UNWIND range(0, size(pathNodes)-2) as i
      WITH pathNodes[i] as source, pathNodes[i+1] as target, rels[i] as rel
      RETURN DISTINCT
        source.id as sourceId, labels(source)[0] as sourceType, source as sourceProps,
        type(rel) as relType, rel.confidence as confidence, rel.timestamp as timestamp,
        rel.source as relSource, rel.recordRef as recordRef, rel.evidenceId as evidenceId,
        target.id as targetId, labels(target)[0] as targetType, target as targetProps
      LIMIT $limit
    `, { id, limit: parseInt(String(limit)) });

    const nodes = new Map<string, Record<string, unknown>>();
    const edges: Record<string, unknown>[] = [];

    result.records.forEach(r => {
      const sourceId = r.get('sourceId');
      const targetId = r.get('targetId');
      
      if (!nodes.has(sourceId)) {
        nodes.set(sourceId, {
          id: sourceId,
          nodeType: r.get('sourceType'),
          ...r.get('sourceProps').properties,
        });
      }
      if (!nodes.has(targetId)) {
        nodes.set(targetId, {
          id: targetId,
          nodeType: r.get('targetType'),
          ...r.get('targetProps').properties,
        });
      }

      edges.push({
        source: sourceId,
        target: targetId,
        type: r.get('relType'),
        confidence: r.get('confidence'),
        timestamp: r.get('timestamp'),
        relSource: r.get('relSource'),
        recordRef: r.get('recordRef'),
        evidenceId: r.get('evidenceId'),
      });
    });

    res.json({
      nodes: Array.from(nodes.values()),
      edges,
      centerNode: { id, nodeType: type },
    });
  } catch (error) {
    logger.error('Get entity network error:', error);
    res.status(500).json({ error: 'Failed to fetch entity network' });
  }
});

// GET /api/entities/:type/:id/timeline
router.get('/:type/:id/timeline', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { type, id } = req.params;
  try {
    const result = await runCypherQuery(`
      MATCH (n:${type} {id: $id})-[r]-(m)
      WHERE r.timestamp IS NOT NULL
      RETURN r, type(r) as relType, m, labels(m)[0] as targetType
      ORDER BY r.timestamp DESC
      LIMIT 200
    `, { id });

    const events = result.records.map(r => ({
      timestamp: r.get('r').properties.timestamp,
      type: r.get('relType'),
      target: { ...r.get('m').properties, nodeType: r.get('targetType') },
      properties: r.get('r').properties,
    }));

    res.json({ events, entityId: id, entityType: type });
  } catch (error) {
    logger.error('Get entity timeline error:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

export default router;
