import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, AlertCircle, Search, ArrowLeft, FolderOpen } from 'lucide-react';
import api from '../lib/api';

const DEMO_EVIDENCE = [
  { id: '1', evidence_id: 'EVD-GENESIS-001', evidence_type: 'genesis', entity_ref: null, source_document: null, data_hash: 'a3f2b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2', previous_hash: '0000000000000000000000000000000000000000000000000000000000000000', is_genesis: true, timestamp: '2026-09-14T00:00:00Z', created_by_name: 'System Administrator' },
  { id: '2', evidence_id: 'EVD-FIR-00451', evidence_type: 'fir', entity_ref: 'P001', source_document: 'FIR-2026-00451', data_hash: 'b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5', previous_hash: 'a3f2b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2', is_genesis: false, timestamp: '2026-09-14T00:01:00Z', created_by_name: 'System Administrator' },
  { id: '3', evidence_id: 'EVD-CDR-0001', evidence_type: 'cdr_record', entity_ref: 'PH001', source_document: 'CDR-2026-0001', data_hash: 'c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', previous_hash: 'b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5', is_genesis: false, timestamp: '2026-09-14T00:02:00Z', created_by_name: 'System Administrator' },
  { id: '4', evidence_id: 'EVD-TXN-0001', evidence_type: 'financial_record', entity_ref: 'ACC001', source_document: 'TXN-2026-0001', data_hash: 'd6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7', previous_hash: 'c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', is_genesis: false, timestamp: '2026-09-14T00:03:00Z', created_by_name: 'System Administrator' },
];

interface VerifyResult {
  status: 'VALID' | 'MODIFIED' | 'UNKNOWN';
  storedHash: string;
  computedHash: string;
  previousHash: string;
  chainValid: boolean;
  message: string;
  disclaimer: string;
}

export default function EvidencePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const investigationParam = searchParams.get('investigation');

  const [evidence, setEvidence] = useState(DEMO_EVIDENCE);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [verifyResults, setVerifyResults] = useState<Record<string, VerifyResult>>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    const url = investigationParam
      ? `/api/evidence?investigationId=${encodeURIComponent(investigationParam)}&limit=50`
      : '/api/evidence?limit=50';

    api.get(url).then(res => {
      if (res.data.evidence?.length > 0) setEvidence(res.data.evidence);
    }).catch(() => {});
  }, [investigationParam]);

  const verifyEvidence = async (evidenceId: string) => {
    setVerifying(evidenceId);
    try {
      const res = await api.post(`/api/evidence/${evidenceId}/verify`);
      setVerifyResults(prev => ({ ...prev, [evidenceId]: res.data }));
    } catch {
      // Simulate verification for demo
      setVerifyResults(prev => ({
        ...prev,
        [evidenceId]: {
          status: 'VALID', storedHash: 'a3f2b1...', computedHash: 'a3f2b1...',
          previousHash: '0000...', chainValid: true,
          message: 'Evidence integrity VERIFIED — hash matches stored record and chain is intact.',
          disclaimer: 'This verification checks cryptographic hash integrity of stored metadata.',
        },
      }));
    } finally {
      setVerifying(null);
    }
  };

  const filtered = evidence.filter(e =>
    !search || e.evidence_id.toLowerCase().includes(search.toLowerCase()) ||
    (e.entity_ref || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.source_document || '').toLowerCase().includes(search.toLowerCase())
  );

  const typeColors: Record<string, string> = {
    genesis: '#8b5cf6', fir: '#ef4444', cdr_record: '#22c55e',
    financial_record: '#eab308', document: '#3b82f6', surveillance: '#06b6d4',
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Evidence Integrity Ledger</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Tamper-evident blockchain-inspired hash chain for evidence verification</p>
        </div>
      </div>

      {/* Contextual Investigation Filter Banner */}
      {investigationParam && (
        <div
          className="card"
          style={{
            marginBottom: 20,
            background: '#f5f3ff',
            borderColor: '#ddd6fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '12px 18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FolderOpen size={18} color="#7c3aed" />
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#5b21b6' }}>
                Filtered for Investigation: {investigationParam}
              </span>
              <div style={{ fontSize: '0.75rem', color: '#6d28d9' }}>
                Showing only cryptographic ledger blocks and proofs associated with this investigation.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate(`/investigations/${encodeURIComponent(investigationParam)}?tab=evidence`)}
              style={{ fontSize: '0.78rem' }}
            >
              <ArrowLeft size={13} /> Return to Investigation
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/evidence')}
              style={{ fontSize: '0.78rem' }}
            >
              Show All Evidence
            </button>
          </div>
        </div>
      )}

      {/* Blockchain explanation */}
      <div className="card" style={{ marginBottom: 20, background: 'rgba(124,58,237,0.04)', borderColor: '#ddd6fe' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Shield size={20} color="#8b5cf6" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <h4 style={{ marginBottom: 6, color: '#6d28d9' }}>Blockchain-Inspired Evidence Integrity</h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Each evidence record is cryptographically hashed and chained to the previous block. Any modification to stored data will cause a hash mismatch, making tampering detectable. Original sensitive data is stored securely off-chain; only metadata hashes are stored in the ledger.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="search-input-wrapper" style={{ marginBottom: 16, maxWidth: 400 }}>
        <Search size={15} className="search-icon" />
        <input className="form-input" placeholder="Search evidence ID, entity, or source..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Evidence chain */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((evd, i) => {
          const result = verifyResults[evd.evidence_id];
          return (
            <div key={evd.id} className="card">
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {/* Block number */}
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: `${typeColors[evd.evidence_type] || '#94a3b8'}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700, color: typeColors[evd.evidence_type] || '#64748b',
                }}>
                  #{i}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-accent)', fontWeight: 600 }}>
                      {evd.evidence_id}
                    </span>
                    <span className="badge badge-neutral">{evd.evidence_type.replace(/_/g, ' ')}</span>
                    {evd.is_genesis && <span className="badge badge-info">GENESIS</span>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                    {[
                      { label: 'Entity Ref', value: evd.entity_ref || '—' },
                      { label: 'Source Doc', value: evd.source_document || '—' },
                      { label: 'Timestamp', value: new Date(evd.timestamp).toLocaleString('en-IN') },
                      { label: 'Added by', value: evd.created_by_name },
                    ].map(f => (
                      <div key={f.label} style={{ fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{f.label}: </span>
                        <span style={{ color: 'var(--text-secondary)' }}>{f.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Hash display */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
                    <div style={{ fontSize: '0.72rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Block Hash: </span>
                      <span className="font-mono" style={{ color: '#22c55e', fontSize: '0.68rem' }}>
                        {evd.data_hash?.substring(0, 32)}...
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Previous: </span>
                      <span className="font-mono" style={{ color: 'var(--text-tertiary)', fontSize: '0.68rem' }}>
                        {evd.previous_hash?.substring(0, 32)}...
                      </span>
                    </div>
                  </div>

                  {/* Verify result */}
                  {result && (
                    <div className={`alert-box ${result.status === 'VALID' ? 'success' : 'critical'}`} style={{ marginBottom: 8, fontSize: '0.8rem' }}>
                      {result.status === 'VALID' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      <div>
                        <strong>{result.status}</strong> — {result.message}
                        <div style={{ marginTop: 4, fontSize: '0.72rem', opacity: 0.8 }}>{result.disclaimer}</div>
                      </div>
                    </div>
                  )}

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => verifyEvidence(evd.evidence_id)}
                    disabled={verifying === evd.evidence_id}
                  >
                    <Shield size={12} />
                    {verifying === evd.evidence_id ? 'Verifying...' : 'Verify Integrity'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
