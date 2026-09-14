import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest, logAction } from '../middleware/auth';
import { query } from '../db/postgres';
import { generateEvidenceHash, generateBlockHash, verifyEvidenceIntegrity } from '../utils/crypto';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

const router = Router();
router.use(authenticate);

// GET /api/evidence
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { entityRef, evidenceType, limit = 50, offset = 0 } = req.query;
    let sql = `SELECT el.*, u.full_name as created_by_name FROM evidence_ledger el LEFT JOIN users u ON el.created_by = u.id`;
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (entityRef) { conditions.push(`el.entity_ref = $${params.length + 1}`); params.push(entityRef); }
    if (evidenceType) { conditions.push(`el.evidence_type = $${params.length + 1}`); params.push(evidenceType); }

    if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;
    sql += ` ORDER BY el.timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    res.json({ evidence: result.rows, total: result.rows.length });
  } catch (error) {
    logger.error('Get evidence error:', error);
    res.status(500).json({ error: 'Failed to fetch evidence' });
  }
});

// POST /api/evidence — create evidence record with hash
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { evidenceType, entityRef, sourceDocument, blockData } = req.body;
  
  try {
    const evidenceId = `EVD-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    // Get last block in chain
    const lastBlock = await query('SELECT data_hash FROM evidence_ledger ORDER BY record_number DESC LIMIT 1');
    const previousHash = lastBlock.rows[0]?.data_hash || '0000000000000000000000000000000000000000000000000000000000000000';

    const isGenesis = lastBlock.rows.length === 0;

    const dataHash = generateEvidenceHash({ ...blockData, evidenceId, timestamp });
    const blockHash = generateBlockHash(evidenceId, dataHash, previousHash, timestamp);

    const result = await query(
      `INSERT INTO evidence_ledger (evidence_id, evidence_type, entity_ref, source_document, data_hash, previous_hash, block_data, created_by, is_genesis)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [evidenceId, evidenceType, entityRef, sourceDocument, blockHash, previousHash, JSON.stringify({ ...blockData, evidenceId, timestamp }), req.user?.id, isGenesis]
    );

    await logAction(req.user?.id, req.user?.username, 'CREATE_EVIDENCE', 'evidence', evidenceId, `Created evidence record: ${evidenceId}`, req.ip || '', req.headers['user-agent'] || '', 'success');

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create evidence error:', error);
    res.status(500).json({ error: 'Failed to create evidence record' });
  }
});

// POST /api/evidence/:id/verify — verify integrity
router.post('/:id/verify', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await query('SELECT * FROM evidence_ledger WHERE evidence_id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      res.json({ status: 'UNKNOWN', message: 'Evidence record not found in ledger.' });
      return;
    }

    const record = result.rows[0];
    const blockData = typeof record.block_data === 'string' ? JSON.parse(record.block_data) : record.block_data;
    
    // Recompute hash from stored block data
    const computedDataHash = generateEvidenceHash(blockData);
    const recomputedBlockHash = generateBlockHash(
      blockData.evidenceId || record.evidence_id,
      computedDataHash,
      record.previous_hash,
      blockData.timestamp || record.timestamp
    );

    const isValid = recomputedBlockHash === record.data_hash;

    // Also verify chain continuity
    let chainValid = true;
    if (!record.is_genesis) {
      const prevBlock = await query(
        'SELECT data_hash FROM evidence_ledger WHERE data_hash = $1',
        [record.previous_hash]
      );
      chainValid = prevBlock.rows.length > 0;
    }

    const status = isValid && chainValid ? 'VALID' : 'MODIFIED';

    await logAction(
      req.user?.id, req.user?.username, 'VERIFY_EVIDENCE', 'evidence', req.params.id,
      `Evidence verification: ${status}`, req.ip || '', req.headers['user-agent'] || '', 'success',
      { evidenceId: req.params.id, result: status }
    );

    res.json({
      status,
      evidenceId: record.evidence_id,
      storedHash: record.data_hash,
      computedHash: recomputedBlockHash,
      previousHash: record.previous_hash,
      chainValid,
      timestamp: record.timestamp,
      message: isValid && chainValid
        ? 'Evidence integrity VERIFIED — hash matches stored record and chain is intact.'
        : !isValid
          ? 'Evidence integrity FAILED — computed hash does not match. Data may have been tampered with.'
          : 'Chain integrity FAILED — previous block not found. Chain may have been modified.',
      disclaimer: 'This verification checks cryptographic hash integrity of stored metadata, not the contents of the original evidence file.',
    });
  } catch (error) {
    logger.error('Evidence verify error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

export default router;
