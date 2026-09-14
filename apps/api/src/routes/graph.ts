import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { runCypherQuery } from '../db/neo4j';
import { logger } from '../utils/logger';

const router = Router();
router.use(authenticate);

// POST /api/graph/path — find shortest path between two entities
router.post('/path', [
  body('fromId').notEmpty(),
  body('fromType').notEmpty(),
  body('toId').notEmpty(),
  body('toType').notEmpty(),
], async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

  const { fromId, fromType, toId, toType, maxHops = 6 } = req.body;

  try {
    const result = await runCypherQuery(`
      MATCH (start:${fromType} {id: $fromId}), (end:${toType} {id: $toId})
      MATCH path = shortestPath((start)-[*..${maxHops}]-(end))
      WITH path, nodes(path) as pathNodes, relationships(path) as pathRels
      RETURN 
        [n in pathNodes | {id: n.id, nodeType: labels(n)[0], name: n.name, number: n.number, licensePlate: n.licensePlate, accountNumber: n.accountNumber}] as nodes,
        [r in pathRels | {type: type(r), confidence: r.confidence, timestamp: r.timestamp, recordRef: r.recordRef, source: r.source, evidenceId: r.evidenceId}] as relationships,
        length(path) as pathLength
      LIMIT 5
    `, { fromId, toId });

    if (result.records.length === 0) {
      res.json({ paths: [], message: 'No path found within the specified hop limit.' });
      return;
    }

    const paths = result.records.map(r => ({
      nodes: r.get('nodes'),
      relationships: r.get('relationships'),
      length: r.get('pathLength').toNumber ? r.get('pathLength').toNumber() : r.get('pathLength'),
    }));

    // Generate explanation
    const explanations = paths.map(p => {
      const nodeNames = p.nodes.map((n: Record<string, unknown>) => n.name || n.number || n.accountNumber || n.licensePlate || n.id).join(' → ');
      return {
        ...p,
        explanation: `Path (${p.length} hops): ${nodeNames}`,
        disclaimer: 'This is an analytical lead based on available data. This path does not confirm criminal activity and requires investigator review.',
      };
    });

    res.json({ paths: explanations, total: paths.length });
  } catch (error) {
    logger.error('Graph path error:', error);
    res.status(500).json({ error: 'Failed to find path' });
  }
});

// POST /api/graph/expand — expand a node's neighborhood
router.post('/expand', [
  body('nodeId').notEmpty(),
  body('nodeType').notEmpty(),
], async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

  const { nodeId, nodeType, relationshipTypes, entityTypes, limit = 30, depth = 1 } = req.body;

  try {
    let relFilter = '';
    if (relationshipTypes && relationshipTypes.length > 0) {
      relFilter = `:${relationshipTypes.join('|')}`;
    }

    let typeFilter = '';
    if (entityTypes && entityTypes.length > 0) {
      typeFilter = `WHERE ${entityTypes.map((t: string) => `m:${t}`).join(' OR ')}`;
    }

    const result = await runCypherQuery(`
      MATCH (n:${nodeType} {id: $nodeId})-[r${relFilter}]-(m)
      ${typeFilter}
      RETURN DISTINCT
        n.id as sourceId, labels(n)[0] as sourceType, n as sourceProps,
        type(r) as relType, r as relProps,
        m.id as targetId, labels(m)[0] as targetType, m as targetProps
      LIMIT $limit
    `, { nodeId, limit: parseInt(String(limit)) });

    const nodes = new Map<string, Record<string, unknown>>();
    const edges: Record<string, unknown>[] = [];

    result.records.forEach(r => {
      const sId = r.get('sourceId');
      const tId = r.get('targetId');

      if (!nodes.has(sId)) nodes.set(sId, { id: sId, nodeType: r.get('sourceType'), ...r.get('sourceProps').properties });
      if (!nodes.has(tId)) nodes.set(tId, { id: tId, nodeType: r.get('targetType'), ...r.get('targetProps').properties });

      edges.push({
        id: `${sId}-${r.get('relType')}-${tId}`,
        source: sId,
        target: tId,
        type: r.get('relType'),
        ...r.get('relProps').properties,
      });
    });

    res.json({ nodes: Array.from(nodes.values()), edges });
  } catch (error) {
    logger.error('Graph expand error:', error);
    res.status(500).json({ error: 'Failed to expand node' });
  }
});

// GET /api/graph/communities — detect communities
router.get('/communities', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Use degree-based community approximation (Louvain requires GDS plugin)
    const result = await runCypherQuery(`
      MATCH (p:Person)
      OPTIONAL MATCH (p)-[r]-(neighbor:Person)
      WITH p, collect(DISTINCT neighbor.id) as neighbors, count(r) as degree
      RETURN p.id as id, p.name as name, p.communityId as communityId, neighbors, degree
      ORDER BY degree DESC
      LIMIT 100
    `);

    // Group by communityId
    const communities = new Map<string, Record<string, unknown>[]>();
    result.records.forEach(r => {
      const communityId = r.get('communityId') || 'uncategorized';
      if (!communities.has(communityId)) communities.set(communityId, []);
      communities.get(communityId)!.push({
        id: r.get('id'),
        name: r.get('name'),
        degree: r.get('degree').toNumber ? r.get('degree').toNumber() : r.get('degree'),
        neighbors: r.get('neighbors'),
      });
    });

    const communityList = Array.from(communities.entries()).map(([id, members]) => ({
      communityId: id,
      memberCount: members.length,
      members: members.slice(0, 10),
      keyNodes: members.sort((a: Record<string, unknown>, b: Record<string, unknown>) => (Number(b.degree) - Number(a.degree))).slice(0, 3),
    }));

    res.json({ communities: communityList, totalCommunities: communityList.length });
  } catch (error) {
    logger.error('Community detection error:', error);
    res.status(500).json({ error: 'Failed to detect communities' });
  }
});

// GET /api/graph/centrality — key person detection
router.get('/centrality', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await runCypherQuery(`
      MATCH (p:Person)
      OPTIONAL MATCH (p)-[r]-()
      WITH p, count(r) as degree
      OPTIONAL MATCH (p)-[:CALLS|MESSAGES]-(contact:Person)
      WITH p, degree, count(DISTINCT contact) as commsPartners
      RETURN p.id as id, p.name as name, p.alias as alias, p.riskScore as riskScore,
             degree, commsPartners, p.centralityScore as centralityScore,
             p.betweennessScore as betweennessScore, p.communityId as communityId
      ORDER BY degree DESC
      LIMIT 50
    `);

    const entities = result.records.map(r => ({
      id: r.get('id'),
      name: r.get('name'),
      alias: r.get('alias'),
      riskScore: r.get('riskScore'),
      degree: r.get('degree').toNumber ? r.get('degree').toNumber() : r.get('degree'),
      commsPartners: r.get('commsPartners').toNumber ? r.get('commsPartners').toNumber() : r.get('commsPartners'),
      centralityScore: r.get('centralityScore'),
      betweennessScore: r.get('betweennessScore'),
      communityId: r.get('communityId'),
      influenceIndicator: calculateInfluenceLabel(
        r.get('degree').toNumber ? r.get('degree').toNumber() : r.get('degree')
      ),
      disclaimer: 'Network influence indicator based on graph metrics. Does not indicate criminal activity.',
    }));

    res.json({ entities, total: entities.length });
  } catch (error) {
    logger.error('Centrality error:', error);
    res.status(500).json({ error: 'Failed to compute centrality' });
  }
});

function calculateInfluenceLabel(degree: number): string {
  if (degree > 20) return 'High Network Influence';
  if (degree > 10) return 'Moderate Network Influence';
  if (degree > 5) return 'Low-Moderate Network Influence';
  return 'Low Network Influence';
}

// GET /api/graph/link-predictions/:type/:id
router.get('/link-predictions/:type/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { type, id } = req.params;
  try {
    // Friends-of-friends who don't have a direct link
    const result = await runCypherQuery(`
      MATCH (n:${type} {id: $id})-[r1]-(intermediate)-[r2]-(potential)
      WHERE NOT (n)-[]-(potential)
        AND potential.id <> n.id
        AND (potential:Person OR potential:Organization)
      WITH potential, intermediate, count(*) as commonLinks,
           collect(DISTINCT type(r1))[0] as linkType1,
           collect(DISTINCT intermediate.name)[0..3] as intermediaries
      RETURN potential, labels(potential)[0] as potentialType,
             commonLinks, intermediaries
      ORDER BY commonLinks DESC
      LIMIT 10
    `, { id });

    const predictions = result.records.map(r => {
      const common = r.get('commonLinks').toNumber ? r.get('commonLinks').toNumber() : r.get('commonLinks');
      const confidence = Math.min(0.3 + (common * 0.08), 0.85);
      return {
        entity: { ...r.get('potential').properties, nodeType: r.get('potentialType') },
        confidence: Math.round(confidence * 100) / 100,
        commonLinks: common,
        intermediaries: r.get('intermediaries'),
        predictionType: 'POTENTIAL_CONNECTION',
        reason: `Shares ${common} common connection(s) through: ${r.get('intermediaries').join(', ')}`,
        disclaimer: 'POTENTIAL CONNECTION — This is a predicted relationship based on network proximity. NOT confirmed. Requires investigator review.',
        features: ['Common intermediary', 'Network proximity', 'Shared connections'],
      };
    });

    res.json({ predictions, disclaimer: 'All link predictions are analytical leads only, not confirmed relationships.' });
  } catch (error) {
    logger.error('Link prediction error:', error);
    res.status(500).json({ error: 'Failed to compute link predictions' });
  }
});

export default router;
