import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type DatabaseEngine =
  | 'neo4j'
  | 'postgres'
  | 'mongodb'
  | 'mysql'
  | 'elasticsearch'
  | 'oracle'
  | 'sqlite'
  | 'rest_api';

export interface DatabaseConnection {
  id: string;
  name: string;
  type: DatabaseEngine;
  host: string;
  port?: number;
  databaseName?: string;
  username?: string;
  authType: 'password' | 'token' | 'certificate' | 'none';
  department: string;
  classification: 'Restricted' | 'Confidential' | 'Secret' | 'Top Secret';
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  latencyMs: number;
  lastPing: string;
  recordCount: number;
  isDefault?: boolean;
  sslEnabled?: boolean;
  createdAt: string;
  description?: string;
}

interface DatabaseContextType {
  databases: DatabaseConnection[];
  activeDatabase: DatabaseConnection;
  activeDatabaseId: string;
  setActiveDatabaseId: (id: string) => void;
  addDatabase: (db: Omit<DatabaseConnection, 'id' | 'createdAt' | 'status' | 'latencyMs' | 'lastPing' | 'recordCount'>) => Promise<DatabaseConnection>;
  removeDatabase: (id: string) => void;
  testConnection: (dbConfig: Partial<DatabaseConnection>) => Promise<{ success: boolean; latencyMs: number; message: string }>;
  syncDatabase: (id: string) => Promise<void>;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

const DEFAULT_DATABASES: DatabaseConnection[] = [
  {
    id: 'db-ncrb-core',
    name: 'NCRB National Central Repository',
    type: 'neo4j',
    host: 'bolt://graph-core.ncrb.gov.in',
    port: 7687,
    databaseName: 'crimegraph_production',
    username: 'neo4j_admin',
    authType: 'token',
    department: 'National Crime Records Bureau (NCRB) HQ',
    classification: 'Secret',
    status: 'connected',
    latencyMs: 16,
    lastPing: 'Just now',
    recordCount: 1420,
    isDefault: true,
    sslEnabled: true,
    createdAt: '2026-01-01T00:00:00Z',
    description: 'Primary unified knowledge graph containing FIRs, CDR communications, financial trails, and linked entities across India.',
  },
  {
    id: 'db-cctns-state',
    name: 'CCTNS State Police Inter-Operable DB',
    type: 'postgres',
    host: 'postgres://cctns-node.state.gov.in',
    port: 5432,
    databaseName: 'cctns_fir_registry',
    username: 'cctns_sync_svc',
    authType: 'certificate',
    department: 'State Crime Records Bureau (SCRB)',
    classification: 'Restricted',
    status: 'connected',
    latencyMs: 24,
    lastPing: '2 mins ago',
    recordCount: 4850,
    sslEnabled: true,
    createdAt: '2026-02-15T00:00:00Z',
    description: 'Direct SQL replica of state police general diaries, crime occurrence reports, and chargesheet archives.',
  },
  {
    id: 'db-telecom-cms',
    name: 'DoT Central Monitoring System (CMS / LIMS)',
    type: 'elasticsearch',
    host: 'https://cms-telecom.dot.gov.in',
    port: 9200,
    databaseName: 'telecom_cdr_stream',
    username: 'lims_investigator',
    authType: 'token',
    department: 'Department of Telecommunications',
    classification: 'Top Secret',
    status: 'connected',
    latencyMs: 21,
    lastPing: '5 mins ago',
    recordCount: 18450,
    sslEnabled: true,
    createdAt: '2026-03-01T00:00:00Z',
    description: 'High-throughput cellular call detail records, cell tower geometry logs, and mobile IMEI tracking index.',
  },
  {
    id: 'db-fiu-aml',
    name: 'FIU-IND Anti-Money Laundering Lakehouse',
    type: 'oracle',
    host: 'jdbc:oracle:thin:@fiu-lakehouse.finmin.gov.in',
    port: 1521,
    databaseName: 'FIN_INTEL_DW',
    username: 'fiu_analyst',
    authType: 'password',
    department: 'Financial Intelligence Unit - India',
    classification: 'Top Secret',
    status: 'connected',
    latencyMs: 34,
    lastPing: '8 mins ago',
    recordCount: 6200,
    sslEnabled: true,
    createdAt: '2026-03-10T00:00:00Z',
    description: 'Suspicious Transaction Reports (STRs), Cash Transaction Reports (CTRs), and cross-border Hawala banking trails.',
  },
  {
    id: 'db-vahan-transport',
    name: 'MoRTH National VAHAN & SARATHI',
    type: 'mysql',
    host: 'vahan-cluster.morth.nic.in',
    port: 3306,
    databaseName: 'vahan_national_rc',
    username: 'vahan_read_agent',
    authType: 'password',
    department: 'Ministry of Road Transport & Highways',
    classification: 'Confidential',
    status: 'connected',
    latencyMs: 29,
    lastPing: '12 mins ago',
    recordCount: 8900,
    sslEnabled: true,
    createdAt: '2026-03-20T00:00:00Z',
    description: 'National vehicle registration database, chassis/engine match verification, and automated toll ANPR passage logs.',
  },
];

const STORAGE_KEY = 'crimegraph_databases_v1';
const ACTIVE_DB_KEY = 'crimegraph_active_db_id_v1';

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [databases, setDatabases] = useState<DatabaseConnection[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_DATABASES;
  });

  const [activeDatabaseId, setActiveDatabaseIdState] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(ACTIVE_DB_KEY);
      if (savedId) return savedId;
    } catch {
      // fallback
    }
    return 'db-ncrb-core';
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(databases));
    } catch {
      // ignore
    }
  }, [databases]);

  const setActiveDatabaseId = useCallback((id: string) => {
    setActiveDatabaseIdState(id);
    try {
      localStorage.setItem(ACTIVE_DB_KEY, id);
    } catch {
      // ignore
    }
  }, []);

  const activeDatabase = databases.find(d => d.id === activeDatabaseId) || databases[0] || DEFAULT_DATABASES[0];

  const testConnection = useCallback(async (dbConfig: Partial<DatabaseConnection>): Promise<{ success: boolean; latencyMs: number; message: string }> => {
    // Simulated realistic network handshake test
    return new Promise(resolve => {
      setTimeout(() => {
        const latency = Math.floor(Math.random() * 25) + 12;
        if (!dbConfig.host || dbConfig.host.trim().length < 3) {
          resolve({ success: false, latencyMs: 0, message: 'Invalid host / connection string provided.' });
        } else {
          resolve({
            success: true,
            latencyMs: latency,
            message: `Connection handshake verified over TLS 1.3 (${latency} ms latency). Schema authenticated.`,
          });
        }
      }, 900);
    });
  }, []);

  const addDatabase = useCallback(async (
    dbData: Omit<DatabaseConnection, 'id' | 'createdAt' | 'status' | 'latencyMs' | 'lastPing' | 'recordCount'>
  ): Promise<DatabaseConnection> => {
    const newDb: DatabaseConnection = {
      ...dbData,
      id: `db-custom-${Date.now()}`,
      status: 'connected',
      latencyMs: Math.floor(Math.random() * 20) + 14,
      lastPing: 'Just now',
      recordCount: Math.floor(Math.random() * 800) + 120,
      createdAt: new Date().toISOString(),
    };

    setDatabases(prev => [newDb, ...prev]);
    setActiveDatabaseId(newDb.id);
    return newDb;
  }, [setActiveDatabaseId]);

  const removeDatabase = useCallback((id: string) => {
    setDatabases(prev => {
      const filtered = prev.filter(d => d.id !== id);
      if (filtered.length === 0) return DEFAULT_DATABASES;
      return filtered;
    });
    if (activeDatabaseId === id) {
      setActiveDatabaseId(DEFAULT_DATABASES[0].id);
    }
  }, [activeDatabaseId, setActiveDatabaseId]);

  const syncDatabase = useCallback(async (id: string) => {
    setDatabases(prev => prev.map(db => {
      if (db.id === id) {
        return {
          ...db,
          status: 'connecting',
        };
      }
      return db;
    }));

    await new Promise(r => setTimeout(r, 1000));

    setDatabases(prev => prev.map(db => {
      if (db.id === id) {
        return {
          ...db,
          status: 'connected',
          lastPing: 'Just now',
          latencyMs: Math.floor(Math.random() * 15) + 12,
          recordCount: db.recordCount + Math.floor(Math.random() * 10) + 1,
        };
      }
      return db;
    }));
  }, []);

  return (
    <DatabaseContext.Provider value={{
      databases,
      activeDatabase,
      activeDatabaseId,
      setActiveDatabaseId,
      addDatabase,
      removeDatabase,
      testConnection,
      syncDatabase,
      isAddModalOpen,
      setIsAddModalOpen,
    }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabases() {
  const ctx = useContext(DatabaseContext);
  if (!ctx) {
    throw new Error('useDatabases must be used within a DatabaseProvider');
  }
  return ctx;
}
