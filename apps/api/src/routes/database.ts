import { Router, Request, Response } from 'express';
import { query } from '../db/postgres';
import { logger } from '../utils/logger';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Helper to resolve SRV records when Node's internal c-ares fails on mobile hotspots or strict DNS
function tryResolveSrvUri(srvUri: string): string | null {
  try {
    if (!srvUri.startsWith('mongodb+srv://')) return null;
    const { execSync } = require('child_process');
    const withoutScheme = srvUri.replace('mongodb+srv://', '');
    const atIndex = withoutScheme.indexOf('@');
    if (atIndex === -1) return null;
    const authPart = withoutScheme.substring(0, atIndex);
    const rest = withoutScheme.substring(atIndex + 1);
    const slashIndex = rest.indexOf('/');
    const questionIndex = rest.indexOf('?');
    let hostPart = rest;
    let pathAndQuery = '';
    if (slashIndex !== -1) {
      hostPart = rest.substring(0, slashIndex);
      pathAndQuery = rest.substring(slashIndex);
    } else if (questionIndex !== -1) {
      hostPart = rest.substring(0, questionIndex);
      pathAndQuery = '/' + rest.substring(questionIndex);
    }

    const srvOutput = execSync(`nslookup -type=SRV _mongodb._tcp.${hostPart}`, { encoding: 'utf8', timeout: 5000 });
    const hosts = [...srvOutput.matchAll(/svr hostname\s+=\s+([^\s\r\n]+)/g)].map(m => m[1].replace(/\.$/, ''));
    if (hosts.length === 0) return null;

    const hostList = hosts.map(h => `${h}:27017`).join(',');
    const hasQuery = pathAndQuery.includes('?');
    const separator = hasQuery ? '&' : '?';
    const cleanPathAndQuery = pathAndQuery || '/';
    return `mongodb://${authPart}@${hostList}${cleanPathAndQuery}${separator}ssl=true&authSource=admin`;
  } catch {
    return null;
  }
}

// GET /api/database/mongo-data
// Connects to a MongoDB URI, discovers all collections and returns live documents
router.get('/mongo-data', async (req: Request, res: Response): Promise<void> => {
  const uri = (req.query.uri as string) || (req.headers['x-database-uri'] as string);
  const dbName = (req.query.db as string) || undefined;

  if (!uri || !uri.startsWith('mongodb')) {
    res.status(400).json({ success: false, error: 'Valid MongoDB URI required (must start with mongodb:// or mongodb+srv://)' });
    return;
  }

  let client: any = null;
  try {
    const { MongoClient } = await import('mongodb');

    let effectiveUri = uri;
    try {
      client = new MongoClient(effectiveUri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
      });
      await client.connect();
    } catch (initialErr: any) {
      // If Node DNS fails with querySrv ECONNREFUSED on mobile hotspot, auto-resolve with nslookup
      if (initialErr.message?.includes('querySrv') || initialErr.message?.includes('ECONNREFUSED')) {
        const fallbackUri = tryResolveSrvUri(uri);
        if (fallbackUri) {
          logger.info('Retrying MongoDB Atlas connection using resolved replica set nodes...');
          client = new MongoClient(fallbackUri, {
            serverSelectionTimeoutMS: 8000,
            connectTimeoutMS: 8000,
          });
          await client.connect();
          effectiveUri = fallbackUri;
        } else {
          throw initialErr;
        }
      } else {
        throw initialErr;
      }
    }

    // Pick DB: from param, or first in URI path, or 'test'
    let targetDbName = dbName;
    if (!targetDbName) {
      try {
        // Extract dbname from URI path e.g. mongodb://host/mydb
        const uriObj = new URL(effectiveUri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'https://'));
        const pathDb = uriObj.pathname.replace(/^\//, '').split('?')[0];
        if (pathDb && pathDb !== '') targetDbName = pathDb;
      } catch {}
    }
    if (!targetDbName) targetDbName = 'test';

    const db = client.db(targetDbName);

    // Discover all collections
    const collectionInfos = await db.listCollections().toArray();
    const collectionNames: string[] = collectionInfos.map((c: any) => c.name);

    // Fetch documents: allow limit query param (default 1000, max 10000)
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 1000, 10000);
    const collectionsData: Record<string, any[]> = {};
    const counts: Record<string, number> = {};

    await Promise.all(
      collectionNames.map(async (name: string) => {
        try {
          const coll = db.collection(name);
          const [totalDocs, docs] = await Promise.all([
            coll.countDocuments(),
            coll.find({}).limit(limit).toArray()
          ]);

          // Convert ObjectId/Date to strings for JSON serialization
          collectionsData[name] = docs.map((d: any) => {
            const clean: Record<string, any> = {};
            for (const k of Object.keys(d)) {
              const v = d[k];
              if (v && typeof v === 'object' && v.constructor?.name === 'ObjectId') {
                clean[k] = v.toString();
              } else if (v instanceof Date) {
                clean[k] = v.toISOString();
              } else {
                clean[k] = v;
              }
            }
            return clean;
          });
          counts[name] = totalDocs;
        } catch {
          collectionsData[name] = [];
          counts[name] = 0;
        }
      })
    );

    await client.close();

    const totalDocs = Object.values(counts).reduce((a, b) => a + b, 0);

    res.json({
      success: true,
      database: targetDbName,
      discoveredCollections: collectionNames,
      counts,
      totalRows: totalDocs,
      limit,
      data: collectionsData,
    });
  } catch (error: any) {
    logger.error('MongoDB connection error:', error);
    if (client) {
      try { await client.close(); } catch {}
    }

    let userMsg = error.message || 'Failed to connect to MongoDB';
    if (userMsg.includes('Server selection timed out')) {
      userMsg = 'Connection timed out: Please ensure your current IP address is whitelisted in MongoDB Atlas under "Network Access" (click "Add IP Address" -> choose "Allow Access from Anywhere" / 0.0.0.0/0).';
    } else if (userMsg.includes('querySrv') || userMsg.includes('ECONNREFUSED')) {
      userMsg = 'DNS SRV query refused by local network or mobile hotspot. Please whitelist IP (0.0.0.0/0) in MongoDB Atlas Network Access or connect via non-SRV replica set string.';
    }

    res.status(500).json({ success: false, error: userMsg });
  }
});

// GET /api/database/live-data
// Dynamically discovers ALL tables in the connected PostgreSQL database and returns their rows
router.get('/live-data', async (req: Request, res: Response): Promise<void> => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const customUri = (req.query.uri as string) || (req.headers['x-database-uri'] as string);
  let client: any = null;
  let isDedicated = false;

  try {
    if (customUri && (customUri.startsWith('postgres://') || customUri.startsWith('postgresql://'))) {
      const sanitizedUri = customUri.replace(/([?&])channel_binding=[^&]*(&|$)/g, '$1').replace(/[?&]$/, '');
      const { Client } = await import('pg');
      client = new Client({
        connectionString: sanitizedUri,
        ssl: { rejectUnauthorized: false },
        statement_timeout: 10000,
      });
      await client.connect();
      isDedicated = true;
    } else {
      client = await (await import('../db/postgres')).getPool().connect();
    }

    const safeQuery = async (sql: string, params?: any[]) => {
      try {
        return await client.query(sql, params);
      } catch {
        return { rows: [] as any[] };
      }
    };

    // Discover ALL tables in the public schema
    const schemaRes = await safeQuery(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name"
    );
    const discoveredTables: string[] = schemaRes.rows.map((r: any) => r.table_name);

    // Fetch rows: allow limit query param (default 1000, max 10000)
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 1000, 10000);
    const tablesData: Record<string, any[]> = {};
    const counts: Record<string, number> = {};

    await Promise.all(
      discoveredTables.map(async (tableName: string) => {
        // Sanitize table name to prevent SQL injection (only allow alphanumeric + underscore)
        if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
          tablesData[tableName] = [];
          counts[tableName] = 0;
          return;
        }
        const [countRes, res] = await Promise.all([
          safeQuery(`SELECT COUNT(*) AS total FROM "${tableName}"`),
          safeQuery(`SELECT * FROM "${tableName}" LIMIT ${limit}`)
        ]);
        tablesData[tableName] = res.rows;
        counts[tableName] = parseInt(countRes.rows[0]?.total || `${res.rows.length}`, 10);
      })
    );

    const totalRows = Object.values(counts).reduce((a, b) => a + b, 0);

    res.json({
      success: true,
      discoveredTables,
      counts,
      totalRows,
      limit,
      data: tablesData,
    });
  } catch (error) {
    logger.error('Error fetching live database records:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  } finally {
    if (client) {
      if (isDedicated) {
        try { await client.end(); } catch {}
      } else {
        try { client.release(); } catch {}
      }
    }
  }
});

// GET /api/database/sources
// Returns all registered external data sources stored safely in internal database
router.get('/sources', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT * FROM external_data_sources ORDER BY created_at DESC`
    );
    const sources = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      host: row.host || '',
      port: row.port || undefined,
      databaseName: row.database_name || undefined,
      username: row.username || undefined,
      password: row.password || undefined,
      connectionUri: row.connection_uri || undefined,
      authType: row.auth_type || 'password',
      department: row.department || 'Intelligence Bureau',
      classification: row.classification || 'Secret',
      status: row.status || 'connected',
      recordCount: parseInt(row.record_count || '0', 10),
      latencyMs: parseInt(row.latency_ms || '0', 10),
      lastPing: 'Live Synchronized',
      isDefault: Boolean(row.is_default),
      sslEnabled: Boolean(row.ssl_enabled),
      description: row.description || '',
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    }));
    res.json({ success: true, sources });
  } catch (error: any) {
    logger.error('Error fetching external data sources:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/database/sources
// Registers or updates an external data source in the internal Neon database
router.post('/sources', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body;
    const id = body.id || `db-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const name = body.name || 'External Database';
    const type = body.type || 'postgres';
    const host = body.host || '';
    const port = body.port || null;
    const databaseName = body.databaseName || null;
    const username = body.username || null;
    const password = body.password || null;
    const connectionUri = body.connectionUri || null;
    const authType = body.authType || 'password';
    const department = body.department || 'Intelligence Bureau';
    const classification = body.classification || 'Secret';
    const status = body.status || 'connected';
    const recordCount = body.recordCount || 0;
    const latencyMs = body.latencyMs || 15;
    const isDefault = Boolean(body.isDefault);
    const sslEnabled = body.sslEnabled !== false;
    const description = body.description || '';

    await query(
      `INSERT INTO external_data_sources (
        id, name, type, host, port, database_name, username, password,
        connection_uri, auth_type, department, classification, status,
        record_count, latency_ms, is_default, ssl_enabled, description, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        host = EXCLUDED.host,
        port = EXCLUDED.port,
        database_name = EXCLUDED.database_name,
        username = EXCLUDED.username,
        password = EXCLUDED.password,
        connection_uri = EXCLUDED.connection_uri,
        auth_type = EXCLUDED.auth_type,
        department = EXCLUDED.department,
        classification = EXCLUDED.classification,
        status = EXCLUDED.status,
        record_count = EXCLUDED.record_count,
        latency_ms = EXCLUDED.latency_ms,
        is_default = EXCLUDED.is_default,
        ssl_enabled = EXCLUDED.ssl_enabled,
        description = EXCLUDED.description,
        updated_at = NOW()`,
      [
        id, name, type, host, port, databaseName, username, password,
        connectionUri, authType, department, classification, status,
        recordCount, latencyMs, isDefault, sslEnabled, description
      ]
    );

    res.json({
      success: true,
      source: {
        id, name, type, host, port, databaseName, username, connectionUri,
        authType, department, classification, status, recordCount, latencyMs,
        isDefault, sslEnabled, description, createdAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error('Error saving external data source:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/database/sources/:id
// Removes an external data source from the internal database
router.delete('/sources/:id', authenticate, authorize('administrator'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await query('DELETE FROM external_data_sources WHERE id = $1', [id]);
    res.json({ success: true, id });
  } catch (error: any) {
    logger.error('Error deleting external data source:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/database/sources
// Clears all external data sources
router.delete('/sources', authenticate, authorize('administrator'), async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await query('DELETE FROM external_data_sources');
    res.json({ success: true });
  } catch (error: any) {
    logger.error('Error clearing external data sources:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
