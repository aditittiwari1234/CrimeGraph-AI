import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest, logAction } from '../middleware/auth';
import { query } from '../db/postgres';
import { runCypherQuery } from '../db/neo4j';
import { generateEvidenceHash } from '../utils/crypto';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

const router = Router();
router.use(authenticate);

// POST /api/documents/upload — simulate document upload with NLP extraction
router.post('/upload', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { investigationId, documentType, content, originalName } = req.body;

  try {
    const documentId = uuidv4();
    const filename = `DOC-${Date.now()}-${documentId.slice(0, 8)}`;

    // Simulate NLP entity extraction
    const { entities, relationships } = await performNLPExtraction(content || '');

    const result = await query(
      `INSERT INTO documents (id, investigation_id, filename, original_name, document_type, status, extracted_entities, extracted_relationships, analysis_metadata, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, 'analyzed', $6, $7, $8, $9) RETURNING *`,
      [
        documentId, investigationId, filename, originalName || filename,
        documentType || 'other', JSON.stringify(entities), JSON.stringify(relationships),
        JSON.stringify({ extractionMethod: 'NLP-NER-v1', language: 'en', processedAt: new Date().toISOString() }),
        req.user?.id,
      ]
    );

    // Create evidence ledger entry
    const evidenceHash = generateEvidenceHash({ documentId, filename, content: content?.substring(0, 100) || '' });
    await query(
      `INSERT INTO evidence_ledger (evidence_id, evidence_type, entity_ref, source_document, data_hash, previous_hash, block_data, created_by)
       SELECT $1, 'document', $2, $3, $4,
         COALESCE((SELECT data_hash FROM evidence_ledger ORDER BY record_number DESC LIMIT 1), '0000000000000000000000000000000000000000000000000000000000000000'),
         $5, $6`,
      [
        `EVD-DOC-${documentId.slice(0, 8).toUpperCase()}`, documentId, filename, evidenceHash,
        JSON.stringify({ documentId, filename, type: documentType, extractedAt: new Date().toISOString() }),
        req.user?.id,
      ]
    );

    await logAction(req.user?.id, req.user?.username, 'UPLOAD_DOCUMENT', 'document', documentId, `Uploaded document: ${originalName}`, req.ip || '', req.headers['user-agent'] || '', 'success');

    res.status(201).json({
      document: result.rows[0],
      extractedEntities: entities,
      extractedRelationships: relationships,
      evidenceId: `EVD-DOC-${documentId.slice(0, 8).toUpperCase()}`,
    });
  } catch (error) {
    logger.error('Document upload error:', error);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

// Simulate NLP entity extraction
async function performNLPExtraction(text: string): Promise<{ entities: Record<string, unknown>[], relationships: Record<string, unknown>[] }> {
  const entities: Record<string, unknown>[] = [];
  const relationships: Record<string, unknown>[] = [];

  // Simple regex-based extraction for demo (would be spaCy in production)
  const personRegex = /(?:Mr\.?\s|Mrs\.?\s|Dr\.?\s|Inspector\s)?([A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2})/g;
  const phoneRegex = /(?:\+91[\s-]?)?[6-9]\d{9}|\d{10}/g;
  const dateRegex = /\b\d{1,2}\s(?:January|February|March|April|May|June|July|August|September|October|November|December)\s?\d{0,4}\b|\d{4}-\d{2}-\d{2}/gi;
  const locationRegex = /(?:at|near|in|from|to)\s+([A-Z][a-zA-Z\s]{2,30})(?:,|\.|;|\s)/g;

  const personMatches = [...text.matchAll(personRegex)];
  const phoneMatches = [...text.matchAll(phoneRegex)];
  const dateMatches = [...text.matchAll(dateRegex)];
  const locationMatches = [...text.matchAll(locationRegex)];

  const persons: string[] = [];

  personMatches.forEach((match, i) => {
    if (match[1] && match[1].length > 2) {
      entities.push({
        id: `NLP-PERSON-${i}`,
        type: 'Person',
        value: match[1],
        confidence: 0.82,
        method: 'NER-PERSON',
        sourceOffset: match.index,
      });
      persons.push(match[1]);
    }
  });

  phoneMatches.forEach((match, i) => {
    entities.push({
      id: `NLP-PHONE-${i}`,
      type: 'Phone',
      value: match[0],
      confidence: 0.95,
      method: 'REGEX-PHONE',
      sourceOffset: match.index,
    });
  });

  dateMatches.forEach((match, i) => {
    entities.push({
      id: `NLP-DATE-${i}`,
      type: 'Date',
      value: match[0],
      confidence: 0.90,
      method: 'REGEX-DATE',
      sourceOffset: match.index,
    });
  });

  locationMatches.forEach((match, i) => {
    if (match[1] && match[1].trim().length > 2) {
      entities.push({
        id: `NLP-LOC-${i}`,
        type: 'Location',
        value: match[1].trim(),
        confidence: 0.75,
        method: 'NER-LOCATION',
        sourceOffset: match.index,
      });
    }
  });

  // Extract relationships from consecutive persons
  for (let i = 0; i < persons.length - 1; i++) {
    relationships.push({
      id: `NLP-REL-${i}`,
      source: persons[i],
      target: persons[i + 1],
      type: 'ASSOCIATED_WITH',
      confidence: 0.65,
      method: 'PROXIMITY-EXTRACTION',
      note: 'Co-occurrence in text suggests potential association — requires verification',
      disclaimer: 'Extracted relationship — not a confirmed association',
    });
  }

  return { entities, relationships };
}

// GET /api/documents — list documents
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { investigationId, documentType, status } = req.query;
    let sql = 'SELECT d.*, u.full_name as uploaded_by_name FROM documents d LEFT JOIN users u ON d.uploaded_by = u.id';
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (investigationId) { conditions.push(`d.investigation_id = $${params.length + 1}`); params.push(investigationId); }
    if (documentType) { conditions.push(`d.document_type = $${params.length + 1}`); params.push(documentType); }
    if (status) { conditions.push(`d.status = $${params.length + 1}`); params.push(status); }

    if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;
    sql += ' ORDER BY d.created_at DESC LIMIT 100';

    const result = await query(sql, params);
    res.json({ documents: result.rows, total: result.rows.length });
  } catch (error) {
    logger.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// GET /api/documents/:id
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      'SELECT * FROM documents WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Document not found' }); return; }
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

export default router;
