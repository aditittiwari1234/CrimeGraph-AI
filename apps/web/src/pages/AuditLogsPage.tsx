import { useState, useEffect } from 'react';
import { BookOpen, Search } from 'lucide-react';
import api from '../lib/api';

const DEMO_AUDIT = [
  { id: '1', actor_name: 'System Administrator', action: 'LOGIN', resource_type: 'AUTH', resource_id: null, details: {}, ip_address: '127.0.0.1', created_at: '2026-09-14T00:00:00Z', is_sensitive: false },
  { id: '2', actor_name: 'System Administrator', action: 'SEED_EXECUTED', resource_type: 'SYSTEM', resource_id: null, details: { persons: 30 }, ip_address: '127.0.0.1', created_at: '2026-09-14T00:01:00Z', is_sensitive: false },
  { id: '3', actor_name: 'System Administrator', action: 'CREATE', resource_type: 'INVESTIGATION', resource_id: '1', details: { caseNumber: 'CASE-2026-00451', title: 'Operation Northern Web' }, ip_address: '127.0.0.1', created_at: '2026-09-14T00:02:00Z', is_sensitive: false },
  { id: '4', actor_name: 'System Administrator', action: 'GRAPH_QUERY', resource_type: 'GRAPH', resource_id: 'P001', details: { query: 'getEntityNetwork', depth: 2 }, ip_address: '127.0.0.1', created_at: '2026-09-14T00:03:00Z', is_sensitive: true },
  { id: '5', actor_name: 'System Administrator', action: 'AI_QUERY', resource_type: 'AI', resource_id: null, details: { queryType: 'connection', confidence: 0.78 }, ip_address: '127.0.0.1', created_at: '2026-09-14T00:04:00Z', is_sensitive: false },
  { id: '6', actor_name: 'System Administrator', action: 'EVIDENCE_VERIFY', resource_type: 'EVIDENCE', resource_id: 'EVD-FIR-00451', details: { status: 'VALID' }, ip_address: '127.0.0.1', created_at: '2026-09-14T00:05:00Z', is_sensitive: false },
];

const ACTION_COLORS: Record<string, string> = {
  LOGIN: '#22c55e', LOGOUT: '#94a3b8', CREATE: '#3b82f6', READ: '#06b6d4',
  UPDATE: '#eab308', DELETE: '#ef4444', GRAPH_QUERY: '#8b5cf6', AI_QUERY: '#ec4899',
  EVIDENCE_VERIFY: '#22c55e', SEED_EXECUTED: '#f97316',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState(DEMO_AUDIT);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get('/api/audit?limit=50').then(res => {
      if (res.data.logs?.length > 0) setLogs(res.data.logs);
    }).catch(() => {});
  }, []);

  const filtered = logs.filter(l =>
    !search || l.actor_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.resource_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Audit Logs</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Immutable audit trail of all system access and actions</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, background: 'rgba(22,163,74,0.04)', borderColor: '#bbf7d0' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
          <BookOpen size={14} color="#22c55e" />
          <span>All audit records are stored with hash verification for tamper detection. Sensitive operations are flagged and logged with full context.</span>
        </div>
      </div>

      <div className="search-input-wrapper" style={{ marginBottom: 16, maxWidth: 400 }}>
        <Search size={15} className="search-icon" />
        <input className="form-input" placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Details</th>
              <th>IP Address</th>
              <th>Sensitivity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => (
              <tr key={log.id}>
                <td>
                  <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {new Date(log.created_at).toLocaleString('en-IN')}
                  </span>
                </td>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{log.actor_name}</td>
                <td>
                  <span style={{
                    padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700,
                    fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
                    background: `${ACTION_COLORS[log.action] || '#64748b'}20`,
                    color: ACTION_COLORS[log.action] || '#94a3b8',
                    border: `1px solid ${ACTION_COLORS[log.action] || '#64748b'}30`,
                  }}>
                    {log.action}
                  </span>
                </td>
                <td>
                  <div>
                    <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{log.resource_type}</span>
                    {log.resource_id && <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: 2 }}>{log.resource_id}</div>}
                  </div>
                </td>
                <td style={{ maxWidth: 200 }}>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                    {log.details && Object.keys(log.details).length > 0
                      ? Object.entries(log.details as Record<string, unknown>).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ').substring(0, 60)
                      : '—'}
                  </span>
                </td>
                <td><span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{log.ip_address}</span></td>
                <td>
                  {log.is_sensitive
                    ? <span className="badge badge-high">Sensitive</span>
                    : <span className="badge badge-neutral">Normal</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <span>Showing {filtered.length} of {logs.length} records</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
          <span style={{ padding: '6px 12px', background: 'var(--bg-tertiary)', borderRadius: 6, border: '1px solid var(--border-primary)' }}>
            Page {page}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)}>→</button>
        </div>
      </div>
    </div>
  );
}
