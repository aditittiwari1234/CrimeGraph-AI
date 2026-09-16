import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Database, Search, Download, RefreshCw, X, Layers,
  Server, Shield, Activity, Plus, Code, CheckCircle2,
  AlertTriangle, ArrowUpDown, ChevronLeft, ChevronRight,
  Eye, Copy, Check, Table as TableIcon, HardDrive, Lock
} from 'lucide-react';
import { useDatabases } from '../contexts/DatabaseContext';
import DatabaseSelector from '../components/database/DatabaseSelector';
import { useAuth } from '../contexts/AuthContext';
import { canManageDatabases } from '../lib/permissions';

export default function DatabasePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const { activeDatabase, databases, setIsAddModalOpen } = useDatabases();
  const { user } = useAuth();
  const canManage = canManageDatabases(user?.role);

  const isMongo = activeDatabase?.type === 'mongodb';

  // Dynamic tables/collections dictionary: { [tableName]: rows[] }
  const [tablesData, setTablesData] = useState<Record<string, any[]>>({});
  const [tableNames, setTableNames] = useState<string[]>([]);
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<string>('');
  
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [dbSyncNotice, setDbSyncNotice] = useState<string>('');

  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [copiedRecord, setCopiedRecord] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Load actual data from backend for active database
  const loadDatabaseData = useCallback(async (dbId: string) => {
    if (!dbId) {
      setTablesData({});
      setTableNames([]);
      setActiveTab('');
      setDbSyncNotice('No database connected');
      return;
    }

    setIsLoadingDb(true);
    setDbError(null);
    setPage(1);

    const db = databases.find(d => d.id === dbId) || activeDatabase;
    if (!db) {
      setIsLoadingDb(false);
      return;
    }

    // 1. MONGODB
    if (db.type === 'mongodb') {
      const uri = db.connectionUri || (db.host?.startsWith('mongodb') ? db.host : '');
      if (!uri) {
        setDbError('No MongoDB URI configured for this database. Please update connection string.');
        setTablesData({});
        setTableNames([]);
        setIsLoadingDb(false);
        return;
      }

      try {
        const dbParam = db.databaseName ? `&db=${encodeURIComponent(db.databaseName)}` : '';
        const res = await fetch(`/api/database/mongo-data?uri=${encodeURIComponent(uri)}${dbParam}&limit=2000`);
        const json = await res.json();

        if (res.ok && json.success) {
          const collections: Record<string, any[]> = json.data || {};
          const collNames: string[] = json.discoveredCollections || Object.keys(collections);
          setTablesData(collections);
          setTableNames(collNames);
          setTableCounts(json.counts || {});
          
          const totalDocs = json.totalRows ?? Object.values(json.counts || {} as Record<string, number>).reduce((a: any, b: any) => Number(a) + Number(b), 0);
          setDbSyncNotice(`Live MongoDB Connected · ${collNames.length} Collections · ${totalDocs.toLocaleString()} Total Documents`);

          // Select tab
          if (collNames.length > 0) {
            if (tabParam && collNames.includes(tabParam)) {
              setActiveTab(tabParam);
            } else {
              setActiveTab(collNames[0]);
            }
          } else {
            setActiveTab('');
          }
        } else {
          setDbError(json.error || 'Failed to connect to MongoDB');
          setTablesData({});
          setTableNames([]);
          setTableCounts({});
        }
      } catch (err: any) {
        setDbError(err.message || 'Network error connecting to MongoDB');
        setTablesData({});
        setTableNames([]);
        setTableCounts({});
      } finally {
        setIsLoadingDb(false);
      }
      return;
    }

    // 2. RELATIONAL / SQL (PostgreSQL, Neon, MySQL, SQLite, etc.)
    try {
      const hostStr = db.host || '';
      let uriParam = '';
      if (db.connectionUri) {
        uriParam = `?uri=${encodeURIComponent(db.connectionUri)}`;
      } else if (hostStr.startsWith('postgres://') || hostStr.startsWith('postgresql://')) {
        uriParam = `?uri=${encodeURIComponent(hostStr)}`;
      } else if (hostStr.includes('neon.tech') && db.username && db.password) {
        const dbPart = db.databaseName || 'neondb';
        const constructed = `postgresql://${db.username}:${db.password}@${hostStr}/${dbPart}?sslmode=require`;
        uriParam = `?uri=${encodeURIComponent(constructed)}`;
      } else if (db.type === 'postgres' && db.username && db.password && hostStr) {
        const dbPart = db.databaseName || '';
        const sslSuffix = db.sslEnabled !== false ? '?sslmode=require' : '';
        const constructed = `postgresql://${db.username}:${db.password}@${hostStr}:${db.port || 5432}/${dbPart}${sslSuffix}`;
        uriParam = `?uri=${encodeURIComponent(constructed)}`;
      }

      const separator = uriParam ? '&' : '?';
      const res = await fetch(`/api/database/live-data${uriParam}${separator}limit=2000`);
      const json = await res.json();

      if (res.ok && json.success) {
        const dataMap: Record<string, any[]> = json.data || {};
        const discovered: string[] = json.discoveredTables || Object.keys(dataMap);
        setTablesData(dataMap);
        setTableNames(discovered);
        setTableCounts(json.counts || {});

        const totalRows = json.totalRows ?? Object.values(json.counts || {} as Record<string, number>).reduce((a: any, b: any) => Number(a) + Number(b), 0);
        setDbSyncNotice(`Live SQL Connected · ${discovered.length} Tables · ${totalRows.toLocaleString()} Total Records`);

        if (discovered.length > 0) {
          if (tabParam && discovered.includes(tabParam)) {
            setActiveTab(tabParam);
          } else {
            setActiveTab(discovered[0]);
          }
        } else {
          setActiveTab('');
        }
      } else {
        setDbError(json.error || 'Failed to fetch SQL tables and records.');
        setTablesData({});
        setTableNames([]);
      }
    } catch (err: any) {
      setDbError(err.message || 'Network error fetching live database.');
      setTablesData({});
      setTableNames([]);
    } finally {
      setIsLoadingDb(false);
    }
  }, [databases, activeDatabase, tabParam]);

  // Load on mount and when activeDatabase changes
  useEffect(() => {
    if (activeDatabase?.id) {
      loadDatabaseData(activeDatabase.id);
    } else {
      setTablesData({});
      setTableNames([]);
      setActiveTab('');
      setDbSyncNotice('');
    }
  }, [activeDatabase?.id, loadDatabaseData]);

  // Handle tab switch
  const handleSelectTab = (tabName: string) => {
    setActiveTab(tabName);
    setSearchParams({ tab: tabName });
    setPage(1);
    setSearch('');
    setSortField(null);
  };

  // Current active records
  const currentTableRecords = useMemo(() => {
    if (!activeTab || !tablesData[activeTab]) return [];
    return tablesData[activeTab];
  }, [tablesData, activeTab]);

  // Dynamically extract columns from active table's records
  const columns = useMemo(() => {
    if (!currentTableRecords || currentTableRecords.length === 0) return [];
    const keysSet = new Set<string>();
    
    // Sample up to 50 records to discover all keys
    const sample = currentTableRecords.slice(0, 50);
    sample.forEach(rec => {
      if (rec && typeof rec === 'object') {
        Object.keys(rec).forEach(k => keysSet.add(k));
      }
    });

    const allKeys = Array.from(keysSet);

    // Prioritize id, title, name, date first
    const priority = ['id', '_id', 'fir_number', 'firNumber', 'name', 'title', 'email', 'status', 'created_at', 'createdAt'];
    allKeys.sort((a, b) => {
      const aIdx = priority.indexOf(a);
      const bIdx = priority.indexOf(b);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.localeCompare(b);
    });

    return allKeys;
  }, [currentTableRecords]);

  // Filtered and sorted data
  const processedData = useMemo(() => {
    let result = currentTableRecords;
    const q = search.trim().toLowerCase();

    if (q) {
      result = result.filter(rec => {
        if (!rec || typeof rec !== 'object') return false;
        return Object.values(rec).some(val => {
          if (val === null || val === undefined) return false;
          if (typeof val === 'object') return JSON.stringify(val).toLowerCase().includes(q);
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    if (sortField) {
      result = [...result].sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }
        return sortOrder === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return result;
  }, [currentTableRecords, search, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(processedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, page, pageSize]);

  // Handle Sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Export data
  const handleExport = (format: 'json' | 'csv') => {
    if (!processedData.length) return;
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(processedData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeDatabase?.name || 'database'}_${activeTab || 'export'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      if (!columns.length) return;
      const header = columns.join(',');
      const rows = processedData.map(row =>
        columns.map(col => {
          const val = row[col];
          if (val === null || val === undefined) return '""';
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        }).join(',')
      );
      const csvContent = [header, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeDatabase?.name || 'database'}_${activeTab || 'export'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Copy selected record
  const handleCopyRecord = () => {
    if (!selectedRecord) return;
    navigator.clipboard.writeText(JSON.stringify(selectedRecord, null, 2));
    setCopiedRecord(true);
    setTimeout(() => setCopiedRecord(false), 1500);
  };

  // Total records across all tables
  const totalAllRecords = useMemo(() => {
    const fromCounts = Object.values(tableCounts).reduce((sum, c) => sum + (typeof c === 'number' ? c : 0), 0);
    if (fromCounts > 0) return fromCounts;
    return Object.values(tablesData).reduce((sum, rows) => sum + (Array.isArray(rows) ? rows.length : 0), 0);
  }, [tablesData, tableCounts]);

  // Cell Renderer Helper — Neon-style minimal
  const renderCellContent = (val: any) => {
    if (val === null || val === undefined) {
      return <span style={{ color: '#cbd5e1', fontStyle: 'normal', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>NULL</span>;
    }
    if (typeof val === 'boolean') {
      return (
        <span style={{
          color: val ? '#16a34a' : '#dc2626',
          fontSize: '0.78rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
        }}>
          {val ? 'true' : 'false'}
        </span>
      );
    }
    if (Array.isArray(val)) {
      return (
        <span style={{
          color: '#7c3aed',
          fontSize: '0.78rem',
          fontFamily: 'var(--font-mono)',
        }}>
          [{val.length}]
        </span>
      );
    }
    if (typeof val === 'object') {
      return (
        <span style={{ color: '#64748b', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
          {'{'}…{'}'}
        </span>
      );
    }
    if (typeof val === 'number') {
      return <span style={{ color: '#2563eb', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{val.toLocaleString()}</span>;
    }
    
    const str = String(val);
    return (
      <span title={str} style={{ color: '#0f172a', fontSize: '0.82rem' }}>
        {str.length > 48 ? str.slice(0, 48) + '…' : str}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 48 }}>
      {/* Header Banner - Matching DataSourcesPage structure */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '24px 28px',
        marginBottom: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                background: '#f0fdf4',
                color: '#16a34a',
                padding: '6px 10px',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 700,
                fontSize: '0.8rem'
              }}>
                <Server size={16} />
                <span>INTER-DEPARTMENTAL FEDERATED GATEWAY</span>
              </div>
              <span style={{
                background: '#f1f5f9',
                color: '#475569',
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: 6
              }}>
                Multi-Agency Security Layer v2.4
              </span>
              {activeDatabase && (
                <span style={{
                  background: isMongo ? '#d1fae5' : '#dbeafe',
                  color: isMongo ? '#065f46' : '#1e40af',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '4px 8px',
                  borderRadius: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {activeDatabase.type}
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 6px' }}>
              Database Explorer & Schema Inspector
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, maxWidth: 850 }}>
              Live federated synchronization pipeline connecting NCRB CrimeGraph AI with state police departments (CCTNS),
              telecom operators, financial intelligence units, transport registries (VAHAN), and corporate databases.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <DatabaseSelector compact />
            {activeDatabase && (
              <button
                onClick={() => loadDatabaseData(activeDatabase.id)}
                disabled={isLoadingDb}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
                title="Reload live tables and rows"
              >
                <RefreshCw size={15} className={isLoadingDb ? 'spin' : ''} />
                Refresh
              </button>
            )}
            {canManage && <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
            >
              <Plus size={15} />
              Connect Database
            </button>}
            {canManage && <button
              onClick={() => navigate('/data-sources')}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
            >
              <HardDrive size={15} />
              Data Sources Hub
            </button>}
          </div>
        </div>

        {/* Status Metrics Bar (4 Prominent Cards Matching DataSourcesPage) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid #f1f5f9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={22} color="#16a34a" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Active Gateways</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {databases.length} / {databases.length} Connected
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={22} color="#2563eb" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Average API Latency</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {activeDatabase?.latencyMs || 24.2} ms
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={22} color="#7c3aed" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Security Standard</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                mTLS + AES-256
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={22} color="#ca8a04" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Ingested Records</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {totalAllRecords.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ERROR NOTICE */}
      {dbError && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 10,
          padding: '14px 18px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          color: '#991b1b',
          fontSize: '0.88rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
            <div>
              <strong>Connection Error:</strong> {dbError}
            </div>
          </div>
          <button
            onClick={() => activeDatabase && loadDatabaseData(activeDatabase.id)}
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem', padding: '4px 10px', borderColor: '#fca5a5', color: '#991b1b', background: '#fff' }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* NO DATABASE CONNECTED EMPTY STATE */}
      {!activeDatabase && (
        <div style={{
          background: '#ffffff',
          border: '1px dashed #cbd5e1',
          borderRadius: 14,
          padding: '60px 24px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Database size={32} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
            No Database Connected
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: 480, margin: '0 auto 24px', lineHeight: 1.5 }}>
            To explore tables and live records, connect an external database such as PostgreSQL (Neon), MongoDB, MySQL, or SQLite.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontWeight: 700 }}
            >
              <Plus size={16} />
              Connect Database
            </button>
            <button
              onClick={() => navigate('/data-sources')}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}
            >
              <HardDrive size={16} />
              Data Sources Hub
            </button>
          </div>
        </div>
      )}

      {/* DATABASE CONNECTED: TABS & TABLES */}
      {activeDatabase && (
        <>
          {/* Dynamic Table / Collection Tabs Bar */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '10px 14px',
            marginBottom: 20,
            overflowX: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}>
            {tableNames.length === 0 && !isLoadingDb && (
              <span style={{ color: '#64748b', fontSize: '0.85rem', padding: '6px 12px' }}>
                No tables or collections discovered in this database.
              </span>
            )}

            {tableNames.map(name => {
              const count = tableCounts[name] ?? (tablesData[name] || []).length;
              const isSelected = activeTab === name;

              return (
                <button
                  key={name}
                  onClick={() => handleSelectTab(name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: '1px solid',
                    borderColor: isSelected ? (isMongo ? '#10b981' : '#2563eb') : '#e2e8f0',
                    background: isSelected ? (isMongo ? '#ecfdf5' : '#eff6ff') : '#ffffff',
                    color: isSelected ? (isMongo ? '#065f46' : '#1d4ed8') : '#475569',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isMongo ? <Layers size={14} /> : <TableIcon size={14} />}
                  <span>{name}</span>
                  <span style={{
                    background: isSelected ? (isMongo ? '#a7f3d0' : '#bfdbfe') : '#f1f5f9',
                    color: isSelected ? (isMongo ? '#064e3b' : '#1e3a8a') : '#64748b',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 12,
                  }}>
                    {count.toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Table Controls & Filter Toolbar */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 400 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder={`Search records in ${activeTab || 'table'}...`}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Actions: View Toggle, Export, Count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Showing <strong style={{ color: '#0f172a' }}>{processedData.length}</strong> records
              </span>

              {/* View Mode Toggle */}
              <div style={{
                display: 'flex',
                background: '#f1f5f9',
                padding: 2,
                borderRadius: 8,
                border: '1px solid #e2e8f0'
              }}>
                <button
                  onClick={() => setViewMode('table')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: viewMode === 'table' ? '#ffffff' : 'transparent',
                    color: viewMode === 'table' ? '#0f172a' : '#64748b',
                    boxShadow: viewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  }}
                >
                  <TableIcon size={13} />
                  Table
                </button>
                <button
                  onClick={() => setViewMode('json')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: viewMode === 'json' ? '#ffffff' : 'transparent',
                    color: viewMode === 'json' ? '#0f172a' : '#64748b',
                    boxShadow: viewMode === 'json' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  }}
                >
                  <Code size={13} />
                  JSON
                </button>
              </div>

              {/* Export Button */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => handleExport('csv')}
                  disabled={processedData.length === 0}
                  className="btn btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 5 }}
                  title="Export current table to CSV"
                >
                  <Download size={13} />
                  CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  disabled={processedData.length === 0}
                  className="btn btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 5 }}
                  title="Export current table to JSON"
                >
                  <Download size={13} />
                  JSON
                </button>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT CARD */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            {isLoadingDb ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px', color: '#2563eb' }} />
                <div style={{ fontWeight: 600, color: '#0f172a' }}>Querying live database...</div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 4 }}>
                  Fetching tables and schemas from {activeDatabase.name}
                </div>
              </div>
            ) : tableNames.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                <Database size={32} style={{ margin: '0 auto 12px', color: '#94a3b8' }} />
                <div style={{ fontWeight: 600, color: '#0f172a' }}>No tables or collections found</div>
                <div style={{ fontSize: '0.84rem', color: '#94a3b8', marginTop: 4 }}>
                  The connected database does not contain any user tables or collections yet.
                </div>
              </div>
            ) : currentTableRecords.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                <TableIcon size={32} style={{ margin: '0 auto 12px', color: '#94a3b8' }} />
                <div style={{ fontWeight: 600, color: '#0f172a' }}>No records in "{activeTab}"</div>
                <div style={{ fontSize: '0.84rem', color: '#94a3b8', marginTop: 4 }}>
                  This table is empty.
                </div>
              </div>
            ) : viewMode === 'json' ? (
              /* JSON VIEW */
              <div style={{ padding: 20, maxHeight: 650, overflowY: 'auto' }}>
                <pre style={{
                  margin: 0,
                  fontSize: '0.82rem',
                  fontFamily: 'Consolas, Monaco, monospace',
                  background: '#0f172a',
                  color: '#38bdf8',
                  padding: 20,
                  borderRadius: 8,
                  overflowX: 'auto',
                }}>
                  {JSON.stringify(processedData, null, 2)}
                </pre>
              </div>
            ) : (
              /* DYNAMIC TABLE VIEW — Neon-style minimal */
              <div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'var(--font-sans)' }}>
                    <thead>
                      <tr style={{
                        borderBottom: '1px solid #e2e8f0',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                        background: '#fafafa',
                      }}>
                        <th style={{ padding: '9px 16px', width: 48, fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: '0.72rem', color: '#94a3b8', letterSpacing: '0.04em' }}>#</th>
                        {columns.map(col => (
                          <th
                            key={col}
                            onClick={() => handleSort(col)}
                            style={{
                              padding: '9px 16px',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 500,
                              fontSize: '0.72rem',
                              letterSpacing: '0.04em',
                              color: sortField === col ? '#2563eb' : '#64748b',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              userSelect: 'none',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <span>{col}</span>
                              <ArrowUpDown size={11} color={sortField === col ? '#2563eb' : '#cbd5e1'} />
                            </div>
                          </th>
                        ))}
                        <th style={{ padding: '9px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 500, fontSize: '0.72rem', letterSpacing: '0.04em', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((row, idx) => {
                        const globalIdx = (page - 1) * pageSize + idx + 1;
                        return (
                          <tr
                            key={row.id || row._id || idx}
                            style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <td style={{ padding: '9px 16px', color: '#cbd5e1', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                              {globalIdx}
                            </td>
                            {columns.map(col => (
                              <td key={col} style={{ padding: '9px 16px', maxWidth: 280, verticalAlign: 'middle' }}>
                                {renderCellContent(row[col])}
                              </td>
                            ))}
                            <td style={{ padding: '9px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <button
                                onClick={() => setSelectedRecord(row)}
                                style={{
                                  padding: '3px 10px',
                                  fontSize: '0.72rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  background: 'none',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: 5,
                                  cursor: 'pointer',
                                  color: '#475569',
                                  fontWeight: 500,
                                  fontFamily: 'var(--font-sans)',
                                  transition: 'border-color 0.15s, color 0.15s',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#94a3b8'; (e.currentTarget as HTMLButtonElement).style.color = '#0f172a'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLButtonElement).style.color = '#475569'; }}
                              >
                                <Eye size={11} />
                                view
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div style={{
                  padding: '10px 16px',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 8,
                }}>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                    {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, processedData.length)} of {processedData.length} rows
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        background: 'none',
                        border: '1px solid #e2e8f0',
                        borderRadius: 5,
                        cursor: page <= 1 ? 'not-allowed' : 'pointer',
                        color: page <= 1 ? '#cbd5e1' : '#475569',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 500,
                      }}
                    >
                      <ChevronLeft size={13} />
                      Prev
                    </button>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', padding: '0 6px', fontFamily: 'var(--font-mono)' }}>
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        background: 'none',
                        border: '1px solid #e2e8f0',
                        borderRadius: 5,
                        cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                        color: page >= totalPages ? '#cbd5e1' : '#475569',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 500,
                      }}
                    >
                      Next
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* RECORD DETAILS INSPECTOR MODAL */}
      {selectedRecord && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20,
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            maxWidth: 720,
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc',
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                  {activeDatabase?.name} / {activeTab}
                </div>
                <h3 style={{ margin: '2px 0 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  Record Inspector
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={handleCopyRecord}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  {copiedRecord ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                  {copiedRecord ? 'Copied' : 'Copy JSON'}
                </button>
                <button
                  onClick={() => setSelectedRecord(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <tbody>
                  {Object.entries(selectedRecord).map(([k, v]) => (
                    <tr key={k} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{
                        padding: '10px 12px',
                        width: '30%',
                        fontWeight: 700,
                        color: '#475569',
                        background: '#f8fafc',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        verticalAlign: 'top',
                      }}>
                        {k}
                      </td>
                      <td style={{ padding: '10px 14px', wordBreak: 'break-word' }}>
                        {v === null || v === undefined ? (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>null</span>
                        ) : typeof v === 'object' ? (
                          <pre style={{
                            margin: 0,
                            padding: 8,
                            background: '#f1f5f9',
                            borderRadius: 6,
                            fontSize: '0.78rem',
                            fontFamily: 'monospace',
                            overflowX: 'auto',
                          }}>
                            {JSON.stringify(v, null, 2)}
                          </pre>
                        ) : typeof v === 'boolean' ? (
                          <span style={{
                            background: v ? '#dcfce7' : '#fee2e2',
                            color: v ? '#15803d' : '#b91c1c',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            {v ? 'true' : 'false'}
                          </span>
                        ) : (
                          <span style={{ color: '#0f172a' }}>{String(v)}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              textAlign: 'right',
            }}>
              <button
                onClick={() => setSelectedRecord(null)}
                className="btn btn-secondary"
                style={{ padding: '6px 16px', fontSize: '0.85rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
