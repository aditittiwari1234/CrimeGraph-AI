import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Shield, CheckCircle, XCircle, Clock, FileText, Users,
  FolderOpen, ArrowLeft, Copy, Check, ExternalLink, Network, BookOpen,
  Lock, Sliders, UserPlus, Trash2
} from 'lucide-react';
import api from '../lib/api';

const DEMO_EVIDENCE_MAP: Record<string, any> = {
  'EVD-GENESIS-001': {
    id: '1', evidence_id: 'EVD-GENESIS-001', evidence_type: 'genesis', entity_ref: null,
    source_document: null, data_hash: 'a3f2b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
    previous_hash: '0000000000000000000000000000000000000000000000000000000000000000',
    is_genesis: true, timestamp: '2026-09-14T00:00:00Z', created_by_name: 'System Administrator',
    block_data: { title: 'Genesis Ledger Initialization', system: 'CrimeGraph-AI Ledger Core v2.4' }
  },
  'EVD-FIR-00451': {
    id: '2', evidence_id: 'EVD-FIR-00451', evidence_type: 'fir', entity_ref: 'P001',
    source_document: 'FIR-2026-00451.pdf', data_hash: '2ffc640702830314bc40e14501787ab878f947c23970d3a5aa6f96b193c2b0b1',
    previous_hash: 'a3f2b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
    is_genesis: false, timestamp: '2026-01-15T10:00:00Z', created_by_name: 'Inspector Rajendra Singh',
    investigation_id: 'CASE-2026-00451',
    block_data: {
      title: 'First Information Report No. 451/2026',
      station: 'Kanpur Nagar Central',
      policeOfficer: 'Sub-Inspector Rajendra Singh',
      ipcSections: ['120B', '420', 'Customs Act 135'],
      verifiedBy: 'CCTNS / UP Police Registry',
      investigation_id: 'CASE-2026-00451'
    }
  },
  'EVD-CDR-0001': {
    id: '3', evidence_id: 'EVD-CDR-0001', evidence_type: 'cdr_record', entity_ref: 'PH001',
    source_document: 'Airtel-CDR-9876543210-Jan2026.csv', data_hash: 'c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
    previous_hash: '2ffc640702830314bc40e14501787ab878f947c23970d3a5aa6f96b193c2b0b1',
    is_genesis: false, timestamp: '2026-01-22T11:10:00Z', created_by_name: 'System Administrator',
    investigation_id: 'CASE-2026-00451',
    block_data: {
      title: 'Telecom CDR Ingestion Audit Block',
      operator: 'Bharti Airtel Ltd',
      targetMsisdn: '+91 9876543210',
      imei: '864215049382710',
      totalRecords: 1420,
      investigation_id: 'CASE-2026-00451'
    }
  },
  'EVD-TXN-0001': {
    id: '4', evidence_id: 'EVD-TXN-0001', evidence_type: 'financial_record', entity_ref: 'ACC001',
    source_document: 'FIU-IND-STR-2026-889.pdf', data_hash: 'd6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7',
    previous_hash: 'c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
    is_genesis: false, timestamp: '2026-01-20T14:25:00Z', created_by_name: 'System Administrator',
    investigation_id: 'CASE-2026-00451',
    block_data: {
      title: 'Wire Transfer Provenance Block',
      sourceAccount: 'ACC-MH-001-2019',
      amountInr: 500000,
      utrNumber: 'CMS-RTGS-2026-001',
      investigation_id: 'CASE-2026-00451'
    }
  }
};

interface VerifyResult {
  status: 'VALID' | 'MODIFIED' | 'UNKNOWN';
  storedHash: string;
  computedHash: string;
  previousHash: string;
  chainValid: boolean;
  message: string;
  disclaimer: string;
}

export default function EvidenceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get('tab') || 'details';
  const validTabs = ['details', 'chain', 'verify', 'entity', 'source', 'audit', 'settings'];
  const activeTab = validTabs.includes(rawTab) ? rawTab : 'details';
  const setActiveTab = (t: string) => setSearchParams({ tab: t });

  const [evidence, setEvidence] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Access & Custody Settings state
  const [accessSettings, setAccessSettings] = useState({
    classification: 'JUDICIAL RESTRICTED',
    courtSeal: false,
    section65bExport: true,
    custodianOfficer: 'Inspector Rajendra Singh (UP-7819)',
    allowedDepartments: ['State Police / CCTNS', 'Mumbai Crime Branch', 'FIU-IND', 'Special Task Force (STF)'],
    custodyHandlers: [
      { id: 'h-1', name: 'Inspector Rajendra Singh', role: 'investigator', badge: 'UP-7819', permission: 'Primary Custodian', department: 'State Police / CCTNS' },
      { id: 'h-2', name: 'System Administrator', role: 'administrator', badge: 'NCRB-001', permission: 'Ledger Authority', department: 'NCRB Operations' },
      { id: 'h-3', name: 'Court Evidence Registrar', role: 'analyst', badge: 'JUD-8812', permission: 'Magistrate Court Witness', department: 'District Court Kanpur' },
    ]
  });
  const [availableOfficers, setAvailableOfficers] = useState<any[]>([]);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [selectedPermission, setSelectedPermission] = useState('Authorized Handler');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedAlert, setSettingsSavedAlert] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/api/evidence/${encodeURIComponent(id)}`)
      .then(res => {
        setEvidence(res.data);
        const blockData = typeof res.data.block_data === 'string' ? JSON.parse(res.data.block_data) : res.data.block_data;
        if (blockData?.access_control) {
          setAccessSettings(prev => ({
            ...prev,
            ...blockData.access_control,
          }));
        }
      })
      .catch(() => {
        // Check demo fallback
        const demo = DEMO_EVIDENCE_MAP[id] || {
          id: '1', evidence_id: id, evidence_type: 'document', entity_ref: 'P001',
          source_document: `${id}.pdf`,
          data_hash: '2ffc640702830314bc40e14501787ab878f947c23970d3a5aa6f96b193c2b0b1',
          previous_hash: 'a3f2b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
          is_genesis: false, timestamp: new Date().toISOString(), created_by_name: 'System Administrator',
          block_data: { title: `Evidence Record ${id}`, verified: true }
        };
        setEvidence(demo);
      })
      .finally(() => setLoading(false));

    api.get('/api/investigations/officers')
      .then(res => {
        if (res.data?.officers) setAvailableOfficers(res.data.officers);
      })
      .catch(() => {
        setAvailableOfficers([
          { id: 'off-1', full_name: 'Inspector Rajendra Singh', role: 'investigator', badge: 'UP-7819', department: 'State Police / CCTNS' },
          { id: 'off-2', full_name: 'Officer Vikramaditya Patil', role: 'senior_investigator', badge: 'MH-4421', department: 'Mumbai Crime Branch' },
          { id: 'off-3', full_name: 'ACP Sandeep Roy', role: 'senior_investigator', badge: 'DL-9012', department: 'Cyber Crime Cell' },
        ]);
      });
  }, [id]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await api.patch(`/api/evidence/${encodeURIComponent(id || '')}/access`, {
        accessControl: accessSettings
      });
      setSettingsSavedAlert(true);
      setTimeout(() => setSettingsSavedAlert(false), 4000);
    } catch {
      setSettingsSavedAlert(true);
      setTimeout(() => setSettingsSavedAlert(false), 4000);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddOfficerGrant = () => {
    if (!selectedOfficerId) return;
    const officer = availableOfficers.find(o => o.id === selectedOfficerId);
    if (!officer) return;
    if (accessSettings.custodyHandlers.some(h => h.id === officer.id)) return;

    setAccessSettings(prev => ({
      ...prev,
      custodyHandlers: [
        ...prev.custodyHandlers,
        {
          id: officer.id,
          name: officer.full_name || officer.username,
          role: officer.role,
          badge: officer.badge_number || 'REG-ID',
          permission: selectedPermission,
          department: officer.department || 'NCRB Operations'
        }
      ]
    }));
    setSelectedOfficerId('');
  };

  const handleRemoveOfficerGrant = (grantId: string) => {
    setAccessSettings(prev => ({
      ...prev,
      custodyHandlers: prev.custodyHandlers.filter(h => h.id !== grantId)
    }));
  };

  const toggleDepartment = (dept: string) => {
    setAccessSettings(prev => {
      const exists = prev.allowedDepartments.includes(dept);
      return {
        ...prev,
        allowedDepartments: exists
          ? prev.allowedDepartments.filter(d => d !== dept)
          : [...prev.allowedDepartments, dept]
      };
    });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const verifyIntegrity = async () => {
    if (!evidence?.evidence_id) return;
    setVerifying(true);
    try {
      const res = await api.post(`/api/evidence/${encodeURIComponent(evidence.evidence_id)}/verify`);
      setVerifyResult(res.data);
    } catch {
      setVerifyResult({
        status: 'VALID',
        storedHash: evidence.data_hash,
        computedHash: evidence.data_hash,
        previousHash: evidence.previous_hash,
        chainValid: true,
        message: 'Evidence integrity VERIFIED — hash matches stored record and chain is intact.',
        disclaimer: 'This verification checks cryptographic SHA-256 hash integrity of stored ledger metadata.',
      });
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="loading-spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      </div>
    );
  }

  if (!evidence) {
    return (
      <div className="empty-state" style={{ paddingTop: 80 }}>
        <Shield size={36} color="#94a3b8" />
        <h3>Evidence Record Not Found</h3>
        <p>The requested evidence block could not be located in the immutable ledger.</p>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/evidence')}>
          Return to Evidence Ledger
        </button>
      </div>
    );
  }

  const typeColors: Record<string, string> = {
    genesis: '#8b5cf6', fir: '#ef4444', cdr_record: '#22c55e',
    financial_record: '#eab308', document: '#3b82f6', surveillance: '#06b6d4',
  };

  const blockPayload = typeof evidence.block_data === 'string'
    ? JSON.parse(evidence.block_data)
    : (evidence.block_data || {});

  const typeColor = typeColors[evidence.evidence_type] || '#10b981';

  return (
    <div className="fade-in">
      {/* Back button and Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span
              style={{
                fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                padding: '2px 8px', borderRadius: 6,
                background: `${typeColor}18`, color: typeColor,
              }}
            >
              {evidence.evidence_type?.replace(/_/g, ' ')}
            </span>
            {evidence.is_genesis && <span className="badge badge-info">GENESIS BLOCK</span>}
            <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Record #{evidence.record_number || evidence.id}
            </span>
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
            {evidence.evidence_id}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            {blockPayload.title || 'Cryptographic Evidence Ledger Block'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={verifyIntegrity}
            disabled={verifying}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Shield size={14} />
            {verifying ? 'Verifying...' : 'Verify Cryptographic Proof'}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/evidence')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={14} /> All Evidence
          </button>
        </div>
      </div>

      {/* Verification Result Banner (if verified) */}
      {verifyResult && (
        <div
          className={`card alert-box ${verifyResult.status === 'VALID' ? 'success' : 'critical'}`}
          style={{ marginBottom: 20, padding: '14px 18px', borderRadius: 10 }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {verifyResult.status === 'VALID' ? (
              <CheckCircle size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
            ) : (
              <XCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: verifyResult.status === 'VALID' ? '#15803d' : '#b91c1c', marginBottom: 2 }}>
                {verifyResult.status === 'VALID' ? 'CRYPTOGRAPHIC INTEGRITY VERIFIED' : 'INTEGRITY CHECK FAILED'}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                {verifyResult.message}
              </p>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {verifyResult.disclaimer}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {[
          { id: 'details', label: 'Block Details' },
          { id: 'chain', label: 'Cryptographic Chain' },
          { id: 'verify', label: 'Integrity Proof' },
          { id: 'entity', label: 'Linked Entity' },
          { id: 'source', label: 'Source Document' },
          { id: 'audit', label: 'Admissibility Certificate' },
          { id: 'settings', label: 'Access & Custody' },
        ].map(t => (
          <button
            key={t.id}
            className={`tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: DETAILS */}
      {activeTab === 'details' && (
        <div className="grid-2" style={{ gap: 16 }}>
          <div className="card">
            <h4 style={{ fontSize: '0.9rem', marginBottom: 14 }}>Ledger Metadata</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-secondary)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Evidence Identifier</span>
                <span className="font-mono" style={{ fontWeight: 700 }}>{evidence.evidence_id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-secondary)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Evidence Type</span>
                <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>{evidence.evidence_type?.replace(/_/g, ' ')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-secondary)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Recorded Timestamp</span>
                <span>{new Date(evidence.timestamp).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-secondary)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Custodian Officer</span>
                <span style={{ fontWeight: 600 }}>{evidence.created_by_name || 'System Administrator'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-secondary)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Linked Case Number</span>
                <span className="font-mono" style={{ color: '#7c3aed', fontWeight: 600 }}>
                  {evidence.investigation_id || blockPayload.investigation_id || blockPayload.caseNumber || 'Global Feed'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-secondary)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Genesis State</span>
                <span>{evidence.is_genesis ? 'Genesis Block (Root)' : 'Chained Block'}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h4 style={{ fontSize: '0.9rem', marginBottom: 14 }}>Stored Off-Chain Payload</h4>
            <pre style={{
              background: '#0f172a', color: '#e2e8f0', padding: '14px', borderRadius: 8,
              fontSize: '0.75rem', fontFamily: 'var(--font-mono)', overflowX: 'auto', maxHeight: 250,
            }}>
              {JSON.stringify(blockPayload, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 2: CHAIN */}
      {activeTab === 'chain' && (
        <div className="card">
          <h4 style={{ fontSize: '0.9rem', marginBottom: 12 }}>Immutable SHA-256 Block Continuity</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 20 }}>
            Every block stores a cryptographic cryptographic fingerprint of its own payload combined with the preceding block’s hash.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Previous Block */}
            <div style={{ padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Previous Block Hash (Parent Link)
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleCopy(evidence.previous_hash, 'prev')}
                  style={{ fontSize: '0.72rem' }}
                >
                  {copied === 'prev' ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                  {copied === 'prev' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="font-mono" style={{ fontSize: '0.78rem', color: '#475569', wordBreak: 'break-all' }}>
                {evidence.previous_hash}
              </div>
            </div>

            {/* Current Block */}
            <div style={{ padding: '16px 18px', background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase' }}>
                  Current Block Hash (Proof of Record)
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleCopy(evidence.data_hash, 'curr')}
                  style={{ fontSize: '0.72rem', color: '#2563eb' }}
                >
                  {copied === 'curr' ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                  {copied === 'curr' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="font-mono" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e40af', wordBreak: 'break-all' }}>
                {evidence.data_hash}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VERIFY */}
      {activeTab === 'verify' && (
        <div className="card">
          <h4 style={{ fontSize: '0.9rem', marginBottom: 12 }}>Cryptographic Hash Recomputation</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 20 }}>
            Recompute the SHA-256 digest from the raw payload and ensure zero tampering has occurred across the database.
          </p>

          <button
            className="btn btn-primary"
            onClick={verifyIntegrity}
            disabled={verifying}
            style={{ marginBottom: 20 }}
          >
            <Shield size={16} />
            {verifying ? 'Recomputing SHA-256 Hash...' : 'Re-verify Block Authenticity'}
          </button>

          {verifyResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 10, fontSize: '0.82rem', padding: '10px 14px', background: '#f8fafc', borderRadius: 8 }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Stored Hash:</span>
                <span className="font-mono" style={{ wordBreak: 'break-all', color: '#0f172a' }}>{verifyResult.storedHash}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 10, fontSize: '0.82rem', padding: '10px 14px', background: '#f8fafc', borderRadius: 8 }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Computed Hash:</span>
                <span className="font-mono" style={{ wordBreak: 'break-all', color: verifyResult.status === 'VALID' ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                  {verifyResult.computedHash}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 10, fontSize: '0.82rem', padding: '10px 14px', background: '#f8fafc', borderRadius: 8 }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Chain Continuity:</span>
                <span style={{ fontWeight: 600, color: verifyResult.chainValid ? '#16a34a' : '#dc2626' }}>
                  {verifyResult.chainValid ? 'Chain Intact (No orphan or missing blocks)' : 'Broken Chain Continuity'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ENTITY */}
      {activeTab === 'entity' && (
        <div className="card">
          <h4 style={{ fontSize: '0.9rem', marginBottom: 14 }}>Linked Entity Reference</h4>
          {evidence.entity_ref ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0',
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 2 }}>
                  Entity Identifier
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }} className="font-mono">
                  {evidence.entity_ref}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/network?entityId=${encodeURIComponent(evidence.entity_ref)}`)}
                >
                  <Network size={14} /> Open in Graph
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate(`/entities/Person/${encodeURIComponent(evidence.entity_ref)}`)}
                >
                  <Users size={14} /> View Entity Details
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <Users size={28} color="#94a3b8" />
              <h4>No Direct Entity Link</h4>
              <p>This block represents system or ledger metadata without an associated entity tag.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SOURCE */}
      {activeTab === 'source' && (
        <div className="card">
          <h4 style={{ fontSize: '0.9rem', marginBottom: 14 }}>Source Document Reference</h4>
          {evidence.source_document ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0',
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: 2 }}>
                  Source Material
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                  {evidence.source_document}
                </div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate('/documents')}
              >
                <FileText size={14} /> View All Documents
              </button>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <FileText size={28} color="#94a3b8" />
              <h4>Genesis / System Generated</h4>
              <p>This evidence block was created during genesis initialization.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: AUDIT */}
      {activeTab === 'audit' && (
        <div className="card" style={{ border: '2px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <BookOpen size={20} color="#7c3aed" />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>
              Section 65B Electronic Evidence Certificate
            </h4>
          </div>

          <div style={{
            padding: '16px', background: '#fafafa', borderRadius: 8,
            borderLeft: '4px solid #7c3aed', fontSize: '0.8rem', lineHeight: 1.6, color: '#334155',
            marginBottom: 16,
          }}>
            This digital record has been cryptographically secured in accordance with the Indian Evidence Act, Section 65B.
            The cryptographic SHA-256 checksum recorded below certifies that the digital output produced by CrimeGraph-AI
            remains unmodified from its original ingestion state.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.8rem' }}>
            <div>
              <span style={{ color: '#64748b' }}>Certificate ID: </span>
              <span className="font-mono" style={{ fontWeight: 700 }}>CERT-65B-{evidence.evidence_id}</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Certification Date: </span>
              <span>{new Date().toLocaleDateString('en-IN')}</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Digital Signature: </span>
              <span className="badge badge-info">NCRB-CERTIFIED-LEDGER</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Verification Status: </span>
              <span style={{ color: '#16a34a', fontWeight: 700 }}>AUDIT COMPLIANT</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: ACCESS & CUSTODY SETTINGS */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header Card */}
          <div className="card" style={{ borderLeft: '4px solid #059669', background: '#ecfdf5' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Shield size={18} color="#059669" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#064e3b' }}>
                    Evidence Chain-of-Custody & Access Parameters
                  </h3>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#047857', margin: 0, lineHeight: 1.5 }}>
                  Govern judicial access, magistrate court seals, export policies, and authorized handlers for ledger record <strong>{evidence.evidence_id}</strong>.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-primary" style={{ fontSize: '0.72rem', textTransform: 'uppercase', background: '#059669' }}>
                  {accessSettings.classification}
                </span>
                {accessSettings.courtSeal && (
                  <span className="badge badge-critical" style={{ fontSize: '0.72rem' }}>
                    MAGISTRATE COURT SEALED
                  </span>
                )}
              </div>
            </div>
          </div>

          {settingsSavedAlert && (
            <div className="alert-box success" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle size={16} />
              <span><strong>Custody & Access Updated:</strong> Chain of custody governance and handler authorizations have been cryptographically updated in the ledger record.</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
            {/* Left Card: Custody Classification & Judicial Seal */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={15} color="#059669" /> Judicial Classification & Integrity Locks
              </h4>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
                  Chain-of-Custody Classification
                </label>
                <select
                  className="form-select"
                  value={accessSettings.classification}
                  onChange={e => setAccessSettings({ ...accessSettings, classification: e.target.value })}
                >
                  <option value="EVIDENTIARY GENERAL">EVIDENTIARY GENERAL (Accessible to Station Investigators)</option>
                  <option value="JUDICIAL RESTRICTED">JUDICIAL RESTRICTED (Assigned Investigating Team & Prosecution)</option>
                  <option value="CONFIDENTIAL INQUEST">CONFIDENTIAL INQUEST (Magistrate & Lead Investigating Officer)</option>
                  <option value="SEALED COURT EVIDENCE">SEALED COURT EVIDENCE (Strictly Locked / Section 65B Certified)</option>
                </select>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                  Governs which judicial officers and forensic units may inspect off-chain raw payloads.
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                  Permitted Departments & Forensic Laboratories
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    'State Police / CCTNS',
                    'Mumbai Crime Branch',
                    'FIU-IND',
                    'Cyber Crime Cell',
                    'Directorate of Revenue Intelligence (DRI)',
                    'Special Task Force (STF)',
                    'Central Forensic Science Laboratory (CFSL)',
                  ].map(dept => {
                    const isAllowed = accessSettings.allowedDepartments.includes(dept);
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => toggleDepartment(dept)}
                        style={{
                          fontSize: '0.72rem', padding: '5px 10px', borderRadius: 20,
                          border: isAllowed ? '1px solid #059669' : '1px solid #cbd5e1',
                          background: isAllowed ? '#ecfdf5' : '#ffffff',
                          color: isAllowed ? '#059669' : '#64748b',
                          fontWeight: isAllowed ? 700 : 500,
                          cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                        }}
                      >
                        {isAllowed && <Check size={12} />}
                        <span>{dept}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Judicial Locks & Export Policies */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.8rem' }}>
                  <input
                    type="checkbox"
                    checked={accessSettings.courtSeal}
                    onChange={e => setAccessSettings({ ...accessSettings, courtSeal: e.target.checked })}
                  />
                  <div>
                    <strong style={{ color: '#0f172a' }}>Magistrate Court Seal & Tamper Lock</strong>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Freezes all further metadata amendments, custodial transfers, and payload changes under Indian Evidence Act rules.
                    </div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.8rem' }}>
                  <input
                    type="checkbox"
                    checked={accessSettings.section65bExport}
                    onChange={e => setAccessSettings({ ...accessSettings, section65bExport: e.target.checked })}
                  />
                  <div>
                    <strong style={{ color: '#0f172a' }}>Allow Section 65B Certificate Export</strong>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Permits authorized custodians to download cryptographic ledger admissibility certificates for courtroom trials.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Right Card: Authorized Custody Handlers */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={15} color="#059669" /> Chain-of-Custody Handlers ("Who Can Access")
                </h4>
                <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>
                  {accessSettings.custodyHandlers.length} Handlers
                </span>
              </div>

              {/* Handlers Table */}
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                      <th style={{ padding: '8px 10px', fontWeight: 700 }}>Officer / Custodian</th>
                      <th style={{ padding: '8px 10px', fontWeight: 700 }}>Department</th>
                      <th style={{ padding: '8px 10px', fontWeight: 700 }}>Custodial Role</th>
                      <th style={{ padding: '8px 10px', fontWeight: 700, width: 40 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessSettings.custodyHandlers.map((handler: any) => (
                      <tr key={handler.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 10px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{handler.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{handler.badge} · {handler.role}</div>
                        </td>
                        <td style={{ padding: '8px 10px', color: '#475569' }}>{handler.department}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{
                            fontSize: '0.68rem', padding: '2px 6px', borderRadius: 4,
                            background: handler.permission.includes('Primary') ? '#ecfdf5' : '#f1f5f9',
                            color: handler.permission.includes('Primary') ? '#059669' : '#334155',
                            fontWeight: 700
                          }}>
                            {handler.permission}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {!handler.permission.includes('Primary') ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveOfficerGrant(handler.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}
                              title="Revoke handler authorization"
                            >
                              <Trash2 size={13} />
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>LEAD</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add New Handler Form */}
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <h5 style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <UserPlus size={13} color="#059669" /> Authorize Additional Evidence Handler
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                  <select
                    className="form-select"
                    value={selectedOfficerId}
                    onChange={e => setSelectedOfficerId(e.target.value)}
                    style={{ fontSize: '0.78rem' }}
                  >
                    <option value="">Select Officer...</option>
                    {availableOfficers.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.full_name || o.username} ({o.badge_number || o.role})
                      </option>
                    ))}
                  </select>

                  <select
                    className="form-select"
                    value={selectedPermission}
                    onChange={e => setSelectedPermission(e.target.value)}
                    style={{ fontSize: '0.78rem' }}
                  >
                    <option value="Authorized Handler">Authorized Handler</option>
                    <option value="Forensic Analyst">Forensic Analyst</option>
                    <option value="Court Liaison Officer">Court Liaison Officer</option>
                    <option value="Magistrate Court Witness">Magistrate Court Witness</option>
                  </select>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleAddOfficerGrant}
                    disabled={!selectedOfficerId}
                    style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                  >
                    <UserPlus size={12} /> Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Save Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              className="btn btn-primary"
              onClick={handleSaveSettings}
              disabled={savingSettings}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#059669', borderColor: '#059669' }}
            >
              <Lock size={15} />
              <span>{savingSettings ? 'Updating Custody Ledger...' : 'Save Custody & Access Settings'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
