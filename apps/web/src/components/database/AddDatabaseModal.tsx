import React, { useState } from 'react';
import {
  X, Database, Shield, CheckCircle2, AlertTriangle,
  Server, Lock, Activity, ArrowRight, Zap, RefreshCw
} from 'lucide-react';
import { useDatabases, type DatabaseEngine, type DatabaseConnection } from '../../contexts/DatabaseContext';
import { useAuth } from '../../contexts/AuthContext';

const ENGINES: { id: DatabaseEngine; label: string; defaultPort: number; badgeColor: string }[] = [
  { id: 'neo4j', label: 'Neo4j Graph DB (Knowledge Graph)', defaultPort: 7687, badgeColor: '#2563eb' },
  { id: 'postgres', label: 'PostgreSQL 16 (Relational & PostGIS)', defaultPort: 5432, badgeColor: '#0284c7' },
  { id: 'elasticsearch', label: 'Elasticsearch / OpenSearch (Logs & CDR)', defaultPort: 9200, badgeColor: '#059669' },
  { id: 'oracle', label: 'Oracle DB / Exadata (High-Volume DW)', defaultPort: 1521, badgeColor: '#dc2626' },
  { id: 'mongodb', label: 'MongoDB Enterprise (Document Store)', defaultPort: 27017, badgeColor: '#16a34a' },
  { id: 'mysql', label: 'MySQL / MariaDB (Registry & VAHAN)', defaultPort: 3306, badgeColor: '#ea580c' },
  { id: 'sqlite', label: 'SQLite / DuckDB (Local Investigative Case DB)', defaultPort: 0, badgeColor: '#7c3aed' },
  { id: 'rest_api', label: 'REST / GraphQL Inter-Agency Federated Gateway', defaultPort: 443, badgeColor: '#475569' },
];

export default function AddDatabaseModal() {
  const { isAddModalOpen, setIsAddModalOpen, addDatabase, testConnection } = useDatabases();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [engine, setEngine] = useState<DatabaseEngine>('postgres');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(5432);
  const [databaseName, setDatabaseName] = useState('');
  const [department, setDepartment] = useState('State Police Intelligence');
  const [username, setUsername] = useState('admin_investigator');
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

  const handleEngineChange = (newEngine: DatabaseEngine) => {
    setEngine(newEngine);
    const found = ENGINES.find(e => e.id === newEngine);
    if (found) setPort(found.defaultPort);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testConnection({ host, port, type: engine, databaseName });
    setTestResult(res);
    setTesting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !host.trim()) return;

    setSubmitting(true);
    try {
      await addDatabase({
        name: name.trim(),
        type: engine,
        host: host.trim(),
        port,
        databaseName: databaseName.trim() || undefined,
        department: department.trim() || 'NCRB External Source',
        username: username.trim() || undefined,
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
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: 16,
      }}
    >
      <div style={{
        background: '#ffffff',
        borderRadius: 14,
        width: '100%',
        maxWidth: 680,
        maxHeight: '92vh',
        boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3), 0 0 0 1px rgba(15, 23, 42, 0.12)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#2563eb',
            }}>
              <Database size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Connect External Database
                </h2>
                <span style={{
                  background: '#fef2f2',
                  color: '#dc2626',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 4,
                  textTransform: 'uppercase',
                }}>
                  Admin Feature
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                Register any department, state police, or agency database into CrimeGraph AI
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(false)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#64748b', padding: 6, borderRadius: 6,
            }}
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
                <strong>Administrator Privilege Notice:</strong> You are currently authenticated as <em>{user?.fullName}</em> ({user?.role}). Modifying or registering databases is an administrative operation recorded in the audit log.
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
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
                  Host / Connection URI *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. db.delhipolice.gov.in or 10.140.22.45"
                  value={host}
                  onChange={e => setHost(e.target.value)}
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
                  placeholder="e.g. crime_records_dw"
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
              paddingTop: 12,
              borderTop: '1px solid #f1f5f9',
            }}>
              <button
                type="button"
                disabled={testing || !host.trim()}
                onClick={handleTest}
                className="btn btn-secondary"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem',
                  opacity: (!host.trim() || testing) ? 0.6 : 1,
                }}
              >
                <Zap size={14} color="#f59e0b" />
                <span>{testing ? 'Testing Handshake...' : 'Test Handshake'}</span>
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
                  disabled={submitting || !name.trim() || !host.trim()}
                  className="btn btn-primary"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem',
                    opacity: (submitting || !name.trim() || !host.trim()) ? 0.6 : 1,
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
