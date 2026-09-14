import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

let pool: Pool;

export async function initPostgres(): Promise<void> {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'crimegraph_db',
    user: process.env.DB_USER || 'crimegraph',
    password: process.env.DB_PASSWORD || 'crimegraph_dev',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    logger.info('PostgreSQL connection established');
    await runMigrations(client);
  } finally {
    client.release();
  }
}

export function getPool(): Pool {
  if (!pool) throw new Error('PostgreSQL not initialized');
  return pool;
}

export async function query(text: string, params?: unknown[]): Promise<any> {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 1000) {
    logger.warn(`Slow query (${duration}ms): ${text}`);
  }
  return result;
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function runMigrations(client: PoolClient): Promise<void> {
  logger.info('Running PostgreSQL migrations...');

  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'investigator' CHECK (role IN ('investigator','senior_investigator','analyst','administrator')),
      badge_number VARCHAR(50),
      department VARCHAR(255),
      is_active BOOLEAN DEFAULT true,
      last_login TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(512) NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS investigations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      case_number VARCHAR(100) UNIQUE NOT NULL,
      title VARCHAR(500) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active','suspended','closed','archived')),
      priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
      created_by UUID REFERENCES users(id),
      assigned_to UUID REFERENCES users(id),
      tags TEXT[],
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS investigation_entities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
      entity_id VARCHAR(255) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_label VARCHAR(500),
      is_bookmarked BOOLEAN DEFAULT false,
      notes TEXT,
      added_by UUID REFERENCES users(id),
      added_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      investigation_id UUID REFERENCES investigations(id),
      filename VARCHAR(500) NOT NULL,
      original_name VARCHAR(500) NOT NULL,
      file_type VARCHAR(100),
      file_size INTEGER,
      file_path VARCHAR(1000),
      document_type VARCHAR(100) CHECK (document_type IN ('fir','police_report','intelligence_report','surveillance_report','case_notes','cdr','financial','other')),
      status VARCHAR(50) DEFAULT 'uploaded' CHECK (status IN ('uploaded','processing','analyzed','failed')),
      extracted_entities JSONB DEFAULT '[]',
      extracted_relationships JSONB DEFAULT '[]',
      analysis_metadata JSONB DEFAULT '{}',
      uploaded_by UUID REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS evidence_ledger (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      record_number BIGSERIAL,
      evidence_id VARCHAR(255) UNIQUE NOT NULL,
      evidence_type VARCHAR(100) NOT NULL,
      entity_ref VARCHAR(255),
      source_document VARCHAR(255),
      data_hash VARCHAR(64) NOT NULL,
      previous_hash VARCHAR(64),
      block_data JSONB NOT NULL,
      timestamp TIMESTAMPTZ DEFAULT NOW(),
      created_by UUID REFERENCES users(id),
      is_genesis BOOLEAN DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      alert_type VARCHAR(100) NOT NULL,
      severity VARCHAR(20) NOT NULL CHECK (severity IN ('low','medium','high','critical')),
      title VARCHAR(500) NOT NULL,
      description TEXT NOT NULL,
      entity_id VARCHAR(255),
      entity_type VARCHAR(50),
      entity_label VARCHAR(500),
      investigation_id UUID REFERENCES investigations(id),
      evidence JSONB DEFAULT '[]',
      is_acknowledged BOOLEAN DEFAULT false,
      acknowledged_by UUID REFERENCES users(id),
      acknowledged_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      username VARCHAR(100),
      action VARCHAR(100) NOT NULL,
      resource_type VARCHAR(100),
      resource_id VARCHAR(255),
      description TEXT,
      ip_address VARCHAR(45),
      user_agent TEXT,
      result VARCHAR(20) CHECK (result IN ('success','failure','error')),
      metadata JSONB DEFAULT '{}',
      data_hash VARCHAR(64),
      previous_hash VARCHAR(64),
      timestamp TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS investigation_notes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
      author_id UUID REFERENCES users(id),
      content TEXT NOT NULL,
      entity_ref VARCHAR(255),
      is_pinned BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Indexes
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_investigations_status ON investigations(status);
    CREATE INDEX IF NOT EXISTS idx_investigations_created_by ON investigations(created_by);
    CREATE INDEX IF NOT EXISTS idx_investigation_entities_inv ON investigation_entities(investigation_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
    CREATE INDEX IF NOT EXISTS idx_alerts_entity ON alerts(entity_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_evidence_ledger_evidence_id ON evidence_ledger(evidence_id);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
  `);

  logger.info('✅ PostgreSQL migrations complete');
}
