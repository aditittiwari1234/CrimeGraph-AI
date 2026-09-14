import React, { useState, useEffect } from 'react';
import {
  X, Database, Shield, CheckCircle2, AlertTriangle,
  Server, Lock, Activity, ArrowRight, Zap, RefreshCw,
  Link as LinkIcon, Sliders, Copy, Check
} from 'lucide-react';
import { useDatabases, type DatabaseEngine, type DatabaseConnection } from '../../contexts/DatabaseContext';
import { useAuth } from '../../contexts/AuthContext';

const NEON_SAMPLE_URI = 'postgresql://neondb_owner:npg_macF9OxUfvC7@ep-odd-cake-b37vzncm-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const ENGINES: { id: DatabaseEngine; label: string; defaultPort: number; badgeColor: string }[] = [
  { id: 'postgres', label: 'PostgreSQL 16 / Neon / Supabase (Relational & PostGIS)', defaultPort: 5432, badgeColor: '#0284c7' },
  { id: 'neo4j', label: 'Neo4j Graph DB (Knowledge Graph)', defaultPort: 7687, badgeColor: '#2563eb' },
  { id: 'mongodb', label: 'MongoDB Enterprise (Document Store)', defaultPort: 27017, badgeColor: '#16a34a' },
  { id: 'elasticsearch', label: 'Elasticsearch / OpenSearch (Logs & CDR)', defaultPort: 9200, badgeColor: '#059669' },
  { id: 'mysql', label: 'MySQL / MariaDB (Registry & VAHAN)', defaultPort: 3306, badgeColor: '#ea580c' },
  { id: 'oracle', label: 'Oracle DB / Exadata (High-Volume DW)', defaultPort: 1521, badgeColor: '#dc2626' },
  { id: 'sqlite', label: 'SQLite / DuckDB (Local Investigative Case DB)', defaultPort: 0, badgeColor: '#7c3aed' },
  { id: 'rest_api', label: 'REST / GraphQL Inter-Agency Federated Gateway', defaultPort: 443, badgeColor: '#475569' },
];

export default function AddDatabaseModal() {
  const { isAddModalOpen, setIsAddModalOpen, addDatabase, testConnection } = useDatabases();
  const { user } = useAuth();

  const [connectMode, setConnectMode] = useState<'uri' | 'manual'>('uri');
  const [connectionUri, setConnectionUri] = useState('');
  
  const [name, setName] = useState('');
  const [engine, setEngine] = useState<DatabaseEngine>('postgres');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(5432);
  const [databaseName, setDatabaseName] = useState('');
  const [department, setDepartment] = useState('Crime Branch Intelligence');
  const [username, setUsername] = useState('neondb_owner');
  const [password, setPassword] = useState('');
  const [authType, setAuthType] = useState<'password' | 'token' | 'certificate' | 'none'>('password');
  const [classification, setClassification] = useState<'Restricted' | 'Confidential' | 'Secret' | 'Top Secret'>('Secret');
  const [sslEnabled, setSslEnabled] = useState(true);
  const [description, setDescription] = useState('');

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs: number; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isAddModalOpen) return null;

  const isAdmin = user?.role === 'administrator';

  const parseUriAndPopulate = (val: string) => {
    setConnectionUri(val);
    if (!val.trim()) return;

    try {
      const isMongo = val.trim().startsWith('mongodb');
      const isPostgres = val.trim().startsWith('postgres');
      const isMysql = val.trim().startsWith('mysql');
      const isGraph = val.trim().startsWith('bolt') || val.trim().startsWith('neo4j');

      const normalized = val.trim()
        .replace(/^mongodb\+srv:\/\//, 'http://')
        .replace(/^mongodb:\/\//, 'http://')
        .replace(/^postgresql:\/\//, 'http://')
        .replace(/^postgres:\/\//, 'http://')
        .replace(/^mysql:\/\//, 'http://')
        .replace(/^bolt:\/\//, 'http://')
        .replace(/^neo4j:\/\//, 'http://');

      const url = new URL(normalized);
      let detectedEngine: DatabaseEngine = isMongo ? 'mongodb' : isMysql ? 'mysql' : isGraph ? 'neo4j' : 'postgres';
      let detectedPort = isMongo ? 27017 : isMysql ? 3306 : isGraph ? 7687 : 5432;
      if (url.port) detectedPort = parseInt(url.port, 10);

      setEngine(detectedEngine);
      setHost(url.hostname);
      setPort(detectedPort);

      if (url.username) setUsername(decodeURIComponent(url.username));
      if (url.password) setPassword(decodeURIComponent(url.password));
      
      const dbNameFromPath = url.pathname && url.pathname.length > 1 
        ? decodeURIComponent(url.pathname.substring(1).split('?')[0]) 
        : '';
      if (dbNameFromPath) setDatabaseName(dbNameFromPath);

      if (url.searchParams.get('sslmode') || url.search.includes('ssl=true')) {
        setSslEnabled(true);
      }

      if (!name || name.includes('Cloud') || name.includes('Neon') || name.includes('DB') || name.includes('MongoDB')) {
        if (isMongo) {
          setName(`MongoDB Atlas (${dbNameFromPath || databaseName || 'criminal_analysis'})`);
          setDepartment('Cyber & Financial Intelligence');
        } else if (url.hostname.includes('neon.tech')) {
          setName(`Neon Cloud PostgreSQL (${dbNameFromPath || 'neondb'})`);
        } else {
          setName(`${url.hostname} (${detectedEngine.toUpperCase()})`);
        }
      }
    } catch {
      // url may still be incomplete while typing
    }
  };

  const handleFillNeon = () => {
    parseUriAndPopulate(NEON_SAMPLE_URI);
    setName('Neon Cloud PostgreSQL (Live Production)');
    setDepartment('Central Cyber & Inter-Agency Crime Division');
    setDescription('Neon Serverless PostgreSQL high-availability pooler for live investigative records');
  };

  const handleEngineChange = (newEngine: DatabaseEngine) => {
    setEngine(newEngine);
    const found = ENGINES.find(e => e.id === newEngine);
    if (found) setPort(found.defaultPort);
  };

  const handleManualHostChange = (val: string) => {
    setHost(val);
    if (val.includes('://')) {
      parseUriAndPopulate(val);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    const activeUri = connectMode === 'uri' ? connectionUri.trim() : (host.includes('://') ? host.trim() : '');
    const res = await testConnection({ 
      connectionUri: activeUri || undefined,
      host: host.trim() || activeUri, 
      port, 
      type: engine, 
      databaseName 
    });
    setTestResult(res);
    setTesting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeUri = connectMode === 'uri' ? connectionUri.trim() : (host.includes('://') ? host.trim() : '');
    const finalHost = host.trim() || activeUri;

    if (!name.trim() || (!finalHost && !activeUri)) return;

    setSubmitting(true);
    try {
      await addDatabase({
        name: name.trim(),
        type: engine,
        host: finalHost,
        port,
        databaseName: databaseName.trim() || undefined,
        department: department.trim() || 'NCRB External Source',
        username: username.trim() || undefined,
        password: password.trim() || undefined,
        connectionUri: activeUri || undefined,
        authType,
        classification,
        sslEnabled,
        description: description.trim() || `External database connection for ${department}`,
      });
      setIsAddModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsAddModalOpen(false);
      }}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: 16,
      }}
    >
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 720,
        maxHeight: '92vh',
        boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(15, 23, 42, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #cbd5e1',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              border: '1px solid #bfdbfe',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#2563eb',
              boxShadow: '0 2px 5px rgba(37, 99, 235, 0.15)',
            }}>
              <Database size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                  Connect External Database
                </h2>
                <span style={{
                  background: '#fef2f2',
                  color: '#dc2626',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 4,
                  textTransform: 'uppercase',
                  border: '1px solid #fee2e2'
                }}>
                  Admin Tool
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                Connect live PostgreSQL (Neon / Supabase), MongoDB, Neo4j, or MySQL instances
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(false)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#64748b', padding: 6, borderRadius: 6,
              transition: 'all 0.15s ease',
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {!isAdmin && (
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: '0.85rem',
              color: '#92400e',
            }}>
              <AlertTriangle size={18} color="#b45309" style={{ flexShrink: 0 }} />
              <div>
                <strong>Administrator Privilege Notice:</strong> Authenticated as <em>{user?.fullName}</em> ({user?.role}). Modifying or registering databases is an administrative operation recorded in the audit log.
              </div>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: 4,
            borderRadius: 10,
            marginBottom: 20,
            gap: 4,
          }}>
            <button
              type="button"
              onClick={() => setConnectMode('uri')}
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: connectMode === 'uri' ? 700 : 500,
                color: connectMode === 'uri' ? '#1e293b' : '#64748b',
                background: connectMode === 'uri' ? '#ffffff' : 'transparent',
                boxShadow: connectMode === 'uri' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
            >
              <LinkIcon size={15} color={connectMode === 'uri' ? '#2563eb' : '#64748b'} />
              <span>⚡ Connection URI / URL (Neon, Cloud DB)</span>
            </button>

            <button
              type="button"
              onClick={() => setConnectMode('manual')}
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: connectMode === 'manual' ? 700 : 500,
                color: connectMode === 'manual' ? '#1e293b' : '#64748b',
                background: connectMode === 'manual' ? '#ffffff' : 'transparent',
                boxShadow: connectMode === 'manual' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
            >
              <Sliders size={15} color={connectMode === 'manual' ? '#2563eb' : '#64748b'} />
              <span>⚙️ Manual Parameters (Host, Port, User)</span>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {connectMode === 'uri' ? (
              /* URI MODE */
              <div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155' }}>
                      Database Connection String (URI / URL) *
                    </label>
                    <button
                      type="button"
                      onClick={handleFillNeon}
                      style={{
                        background: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Zap size={12} fill="#2563eb" />
                      <span>Fill Neon PostgreSQL Preset</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    required
                    placeholder="postgresql://neondb_owner:npg_macF9OxUfvC7@ep-odd-cake-b37vzncm-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
                    value={connectionUri}
                    onChange={e => parseUriAndPopulate(e.target.value)}
                    className="input"
                    style={{
                      width: '100%',
                      fontSize: '0.82rem',
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                      resize: 'vertical',
                      lineHeight: '1.4',
                      padding: '10px 12px',
                    }}
                  />
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 4 }}>
                    Supports <code>postgresql://...</code>, <code>mongodb://...</code>, <code>mysql://...</code>, or <code>neo4j://...</code> with automatic credential parsing.
                  </div>
                </div>

                {/* Parsed Breakdown Card */}
                {host && (
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '12px 16px',
                    marginBottom: 16,
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={14} color="#16a34a" />
                      <span>Parsed Connection Parameters</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 14px', fontSize: '0.8rem' }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Engine / Protocol</span>
                        <strong style={{ color: '#0f172a', textTransform: 'uppercase' }}>{engine}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Database</span>
                        <strong style={{ color: '#0f172a' }}>{databaseName || 'default'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Port</span>
                        <strong style={{ color: '#0f172a' }}>{port}</strong>
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>Host</span>
                        <span style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>{host}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>User</span>
                        <strong style={{ color: '#0f172a' }}>{username || 'Anonymous'}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Database Name input */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Database Name / Target Database
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. criminal_analysis, neondb, crimegraph_db"
                    value={databaseName}
                    onChange={e => setDatabaseName(e.target.value)}
                    className="input"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 4 }}>
                    Specify the database name to query (e.g. <code>criminal_analysis</code> for MongoDB or <code>neondb</code> for PostgreSQL).
                  </div>
                </div>

                {/* Name & Department */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Display Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Neon Cloud PostgreSQL (neondb)"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="input"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Department / Agency
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. State Police Crime Intelligence"
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      className="input"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                {/* Classification & SSL */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Security Classification
                    </label>
                    <select
                      value={classification}
                      onChange={e => setClassification(e.target.value as any)}
                      className="input"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    >
                      <option value="Restricted">Restricted (Internal)</option>
                      <option value="Confidential">Confidential (Law Enforcement)</option>
                      <option value="Secret">Secret (National Intelligence)</option>
                      <option value="Top Secret">Top Secret (National Security)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', paddingTop: 24 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={sslEnabled}
                        onChange={e => setSslEnabled(e.target.checked)}
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                      />
                      <span>Enforce SSL / TLS Encryption</span>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              /* MANUAL MODE */
              <div>
                {/* Engine Selection */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Database Engine / Protocol *
                  </label>
                  <select
                    value={engine}
                    onChange={e => handleEngineChange(e.target.value as DatabaseEngine)}
                    className="input"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  >
                    {ENGINES.map(eng => (
                      <option key={eng.id} value={eng.id}>
                        {eng.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* DB Name & Department */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Database Display Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Special Cell Delhi Crime DB"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="input"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Department / Agency *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. State Police Crime Branch"
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      className="input"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                {/* Host & Port */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Host / Server Address *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ep-odd-cake-b37vzncm-pooler.c-4.ap-southeast-1.aws.neon.tech"
                      value={host}
                      onChange={e => handleManualHostChange(e.target.value)}
                      className="input"
                      style={{ width: '100%', fontSize: '0.85rem', fontFamily: 'monospace' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Port
                    </label>
                    <input
                      type="number"
                      value={port || ''}
                      onChange={e => setPort(Number(e.target.value))}
                      className="input"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                {/* Database Name & Auth Type */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Database / Schema Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. neondb"
                      value={databaseName}
                      onChange={e => setDatabaseName(e.target.value)}
                      className="input"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Authentication Type
                    </label>
                    <select
                      value={authType}
                      onChange={e => setAuthType(e.target.value as any)}
                      className="input"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    >
                      <option value="password">Username & Password</option>
                      <option value="token">Bearer Token / API Key</option>
                      <option value="certificate">mTLS / X.509 Client Certificate</option>
                      <option value="none">Gov-VPN IP Whitelisted (No Auth)</option>
                    </select>
                  </div>
                </div>

                {/* Username & Password */}
                {authType === 'password' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                        Username
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="input"
                        style={{ width: '100%', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                        Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="input"
                        style={{ width: '100%', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                )}

                {/* Classification & SSL */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Security Classification
                    </label>
                    <select
                      value={classification}
                      onChange={e => setClassification(e.target.value as any)}
                      className="input"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    >
                      <option value="Restricted">Restricted (Internal)</option>
                      <option value="Confidential">Confidential (Law Enforcement)</option>
                      <option value="Secret">Secret (National Intelligence)</option>
                      <option value="Top Secret">Top Secret (National Security)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', paddingTop: 24 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={sslEnabled}
                        onChange={e => setSslEnabled(e.target.checked)}
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                      />
                      <span>Enforce SSL / TLS 1.3 Encryption</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Description / Purpose
              </label>
              <textarea
                rows={2}
                placeholder="Details about datasets hosted in this database (FIRs, CDRs, financials, etc.)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="input"
                style={{ width: '100%', fontSize: '0.82rem', resize: 'vertical' }}
              />
            </div>

            {/* Test result feedback */}
            {testResult && (
              <div style={{
                background: testResult.success ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${testResult.success ? '#bbf7d0' : '#fecaca'}`,
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: '0.82rem',
                color: testResult.success ? '#15803d' : '#b91c1c',
              }}>
                {testResult.success ? (
                  <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                ) : (
                  <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                )}
                <div>{testResult.message}</div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 14,
              borderTop: '1px solid #f1f5f9',
            }}>
              <button
                type="button"
                disabled={testing || (connectMode === 'uri' ? !connectionUri.trim() : !host.trim())}
                onClick={handleTest}
                className="btn btn-secondary"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem',
                  opacity: (testing || (connectMode === 'uri' ? !connectionUri.trim() : !host.trim())) ? 0.6 : 1,
                }}
              >
                <Zap size={14} color="#f59e0b" fill="#f59e0b" />
                <span>{testing ? 'Verifying Handshake...' : 'Test Handshake'}</span>
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name.trim() || (connectMode === 'uri' ? !connectionUri.trim() : !host.trim())}
                  className="btn btn-primary"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem',
                    opacity: (submitting || !name.trim() || (connectMode === 'uri' ? !connectionUri.trim() : !host.trim())) ? 0.6 : 1,
                  }}
                >
                  <Server size={14} />
                  <span>{submitting ? 'Registering...' : 'Register & Select Database'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
