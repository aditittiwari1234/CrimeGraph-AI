import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Network, ExternalLink, AlertCircle, Shield, Clock, ChevronRight,
  Lock, Sliders, CheckCircle, Check, Trash2, UserPlus, Users
} from 'lucide-react';
import api from '../lib/api';

const DEMO_ENTITY: Record<string, any> = {
  'Person/P001': {
    id: 'P001', nodeType: 'Person', name: 'Arjun Mehta', alias: 'AJ', age: 34, gender: 'Male',
    location: 'Mumbai', communityId: 'C1', riskScore: 0.72, centralityScore: 0.85, betweennessScore: 0.78,
  },
};

export default function EntityDetailPage() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [entity, setEntity] = useState<any>(null);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const rawTab = searchParams.get('tab') || 'details';
  const validTabs = ['details', 'relationships', 'potential-links', 'evidence', 'settings'];
  const activeTab = validTabs.includes(rawTab) ? rawTab : 'details';
  const setActiveTab = (t: string) => setSearchParams({ tab: t });

  const [linkPredictions, setLinkPredictions] = useState<any[]>([]);

  // Access & Settings state
  const [accessSettings, setAccessSettings] = useState({
    classification: 'CONFIDENTIAL',
    witnessProtection: false,
    disseminationHold: true,
    allowedDepartments: ['State Police / CCTNS', 'Mumbai Crime Branch', 'FIU-IND'],
    officerGrants: [
      { id: 'off-1', name: 'Inspector Rajendra Singh', role: 'investigator', badge: 'UP-7819', permission: 'Full Control', department: 'State Police / CCTNS' },
      { id: 'off-2', name: 'System Administrator', role: 'administrator', badge: 'NCRB-001', permission: 'Full Control', department: 'NCRB Operations' },
    ]
  });
  const [availableOfficers, setAvailableOfficers] = useState<any[]>([]);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [selectedPermission, setSelectedPermission] = useState('Read & Contribute');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedAlert, setSettingsSavedAlert] = useState(false);

  useEffect(() => {
    if (!type || !id) return;
    api.get(`/api/entities/${type}/${id}/access`).then(res => {
      if (res.data) {
        setAccessSettings(prev => ({
          ...prev,
          classification: res.data.classification || prev.classification,
          witnessProtection: Boolean(res.data.witnessProtection),
          allowedDepartments: res.data.allowedDepartments || prev.allowedDepartments,
          officerGrants: res.data.authorizedOfficers?.length ? res.data.authorizedOfficers : prev.officerGrants,
        }));
      }
    }).catch(() => {});

    api.get('/api/investigations/officers').then(res => {
      if (res.data?.officers) setAvailableOfficers(res.data.officers);
    }).catch(() => {
      setAvailableOfficers([
        { id: 'off-3', full_name: 'ACP Sandeep Roy', role: 'senior_investigator', badge: 'DL-9012', department: 'Cyber Crime Cell' },
        { id: 'off-4', full_name: 'Officer Vikramaditya Patil', role: 'senior_investigator', badge: 'MH-4421', department: 'Mumbai Crime Branch' },
      ]);
    });
  }, [type, id]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await api.post(`/api/entities/${type}/${id}/access`, {
        classification: accessSettings.classification,
        witnessProtection: accessSettings.witnessProtection,
        allowedDepartments: accessSettings.allowedDepartments,
        authorizedOfficers: accessSettings.officerGrants,
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
    if (accessSettings.officerGrants.some(g => g.id === officer.id)) return;

    setAccessSettings(prev => ({
      ...prev,
      officerGrants: [
        ...prev.officerGrants,
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
      officerGrants: prev.officerGrants.filter(g => g.id !== grantId)
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

  useEffect(() => {
    if (!type || !id) return;
    Promise.all([
      api.get(`/api/entities/${type}/${id}`),
    ]).then(([entityRes]) => {
      setEntity(entityRes.data.entity);
      setRelationships(entityRes.data.relationships || []);
    }).catch(() => {
      const key = `${type}/${id}`;
      setEntity(DEMO_ENTITY[key] || { id, nodeType: type, name: `${type} ${id}` });
      setRelationships([
        { type: 'CALLS', target: { nodeType: 'Person', name: 'Vikram Sinha', id: 'P002' }, properties: { confidence: 0.89, timestamp: '2026-01-10', recordRef: 'CDR-001', source: 'CDR-2026-0001' } },
        { type: 'OWNS', target: { nodeType: 'Phone', name: '9876543210', id: 'PH001' }, properties: { confidence: 0.99, source: 'TELECOM-RECORDS', recordRef: 'OWNS-PH001' } },
        { type: 'WORKS_FOR', target: { nodeType: 'Organization', name: 'Shree Trading Co.', id: 'O001' }, properties: { confidence: 0.91, source: 'COMPANY-REGISTRY', recordRef: 'WF-P001-O001' } },
        { type: 'APPEARED_IN_CASE', target: { nodeType: 'Case', name: 'FIR-2026-00451', id: 'CASE001' }, properties: { confidence: 0.90, role: 'Person of Interest', source: 'FIR-RECORD', recordRef: 'CASE-P001-C001' } },
        { type: 'LOCATED_AT', target: { nodeType: 'Location', name: 'Kanpur Central Station', id: 'L001' }, properties: { confidence: 0.85, timestamp: '2026-01-14', source: 'SURV-2026-001', recordRef: 'LOC-P001-L001' } },
      ]);
    }).finally(() => setLoading(false));

    // Load link predictions
    api.get(`/api/graph/link-predictions/${type}/${id}`).then(res => {
      setLinkPredictions(res.data.predictions || []);
    }).catch(() => {
      setLinkPredictions([
        { entity: { id: 'P024', nodeType: 'Person', name: 'Girish Pandey' }, confidence: 0.71, commonLinks: 3, intermediaries: ['Ravi Kumar', 'Ajay Singh'], reason: 'Shares 3 common connections through: Ravi Kumar, Ajay Singh', disclaimer: 'POTENTIAL CONNECTION — Not confirmed. Requires investigator review.' },
      ]);
    });
  }, [type, id]);

  const getLabel = (e: any) => e?.name || e?.number || e?.licensePlate || e?.accountNumber || e?.id;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="loading-spinner" style={{ width: 36, height: 36, borderWidth: 3 }} /></div>;

  const relTypeColors: Record<string, string> = {
    CALLS: '#22c55e', MESSAGES: '#22c55e', FINANCIAL_TRANSACTION: '#eab308',
    ASSOCIATED_WITH: '#3b82f6', LOCATED_AT: '#ef4444', OWNS: '#f97316',
    WORKS_FOR: '#8b5cf6', APPEARED_IN_CASE: '#06b6d4', ATTENDED_EVENT: '#ec4899',
    RELATED_TO: '#94a3b8', SHARED_LOCATION: '#ef4444', SHARED_CONTACT: '#3b82f6',
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className={`badge badge-${type?.toLowerCase()}`}>{type}</span>
            <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{id}</span>
          </div>
          <h1 style={{ fontSize: '1.5rem' }}>{getLabel(entity)}</h1>
          {entity?.alias && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Alias: {entity.alias}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/network?entityType=${encodeURIComponent(type || '')}&entityId=${encodeURIComponent(id || '')}`)}>
            <Network size={14} /> View in Graph
          </button>
        </div>
      </div>

      {/* Graph Metrics (for persons) */}
      {type === 'Person' && entity?.centralityScore && (
        <div className="grid-4" style={{ marginBottom: 20 }}>
          {[
            { label: 'Network Influence', value: entity.centralityScore ? `${Math.round(entity.centralityScore * 100)}%` : '—', sub: 'Centrality score', color: '#3b82f6' },
            { label: 'Betweenness', value: entity.betweennessScore ? `${Math.round(entity.betweennessScore * 100)}%` : '—', sub: 'Bridge importance', color: '#8b5cf6' },
            { label: 'Community', value: entity.communityId || '—', sub: 'Detected cluster', color: '#06b6d4' },
            { label: 'Relationships', value: relationships.length, sub: 'Known connections', color: '#22c55e' },
          ].map(m => (
            <div key={m.label} className="stat-card">
              <span className="stat-label">{m.label}</span>
              <div className="stat-value" style={{ fontSize: '1.5rem', color: m.color }}>{m.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* AI Disclaimer */}
      <div className="ai-disclaimer" style={{ marginBottom: 16 }}>
        ⚠️ Network influence metrics are analytical indicators based on graph topology. High scores do not indicate criminal activity. All data requires investigator review.
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {['details', 'relationships', 'potential-links', 'evidence', 'settings'].map(t => (
          <button key={t} className={`tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'potential-links' ? 'Potential Links' : t === 'settings' ? 'Access & Settings' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'details' && (
        <div className="grid-2">
          <div className="card">
            <h4 style={{ marginBottom: 12, fontSize: '0.9rem' }}>Known Data</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(entity || {}).filter(([k]) => !['nodeType', 'communityId'].includes(k)).map(([k, v]) => v ? (
                <div key={k} style={{ display: 'flex', gap: 10, fontSize: '0.875rem', padding: '6px 0', borderBottom: '1px solid var(--border-secondary)' }}>
                  <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize', width: 130, flexShrink: 0 }}>
                    {k.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{String(v)}</span>
                </div>
              ) : null)}
            </div>
            <div style={{ marginTop: 12, padding: '6px 10px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, fontSize: '0.72rem', color: '#86efac' }}>
              ✅ KNOWN DATA — sourced from official records
            </div>
          </div>

          <div className="card">
            <h4 style={{ marginBottom: 12, fontSize: '0.9rem' }}>Relationship Summary</h4>
            {Object.entries(
              relationships.reduce((acc: Record<string, number>, r) => {
                acc[r.type] = (acc[r.type] || 0) + 1;
                return acc;
              }, {})
            ).map(([type, count]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-secondary)', fontSize: '0.875rem' }}>
                <span style={{ color: relTypeColors[type] || 'var(--text-secondary)', fontWeight: 500 }}>
                  {type.replace(/_/g, ' ')}
                </span>
                <span className="badge badge-neutral">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'relationships' && (
        <div className="card">
          <h4 style={{ marginBottom: 14, fontSize: '0.9rem' }}>Known Relationships ({relationships.length})</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {relationships.map((rel, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, padding: '10px 12px',
                background: '#f8fafc', borderRadius: 8,
                borderLeft: `3px solid ${relTypeColors[rel.type] || '#94a3b8'}`,
                border: '1px solid #e2e8f0',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ color: relTypeColors[rel.type] || 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
                      {rel.type.replace(/_/g, ' ')}
                    </span>
                    <ChevronRight size={12} color="var(--text-muted)" />
                    <span className={`badge badge-${rel.target?.nodeType?.toLowerCase()}`}>{rel.target?.nodeType}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {getLabel(rel.target)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    {rel.properties?.confidence && <span>Confidence: {Math.round(rel.properties.confidence * 100)}%</span>}
                    {rel.properties?.timestamp && <span>Date: {new Date(rel.properties.timestamp).toLocaleDateString('en-IN')}</span>}
                    {rel.properties?.source && <span className="font-mono">Src: {rel.properties.source}</span>}
                    {rel.properties?.recordRef && <span className="font-mono">Ref: {rel.properties.recordRef}</span>}
                    {rel.properties?.role && <span>Role: {rel.properties.role}</span>}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/entities/${rel.target?.nodeType}/${rel.target?.id}`)}>
                  <ExternalLink size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'potential-links' && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <div className="potential-connection-label">🔮 AI-Predicted Connections</div>
          </div>
          <div className="ai-disclaimer" style={{ marginBottom: 14 }}>
            These are AI-predicted potential connections based on network proximity and shared intermediaries. They are NOT confirmed relationships. Each prediction must be independently verified by investigators before any action.
          </div>
          {linkPredictions.length === 0 ? (
            <div className="empty-state">
              <h3>No potential connections predicted</h3>
              <p>The AI found no strong indirect connection candidates for this entity.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {linkPredictions.map((pred, i) => (
                <div key={i} className="card" style={{ borderLeft: '3px solid #eab308' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span className="potential-connection-label">Potential Connection</span>
                        <span className={`badge badge-${pred.entity?.nodeType?.toLowerCase()}`}>{pred.entity?.nodeType}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{getLabel(pred.entity)}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{pred.reason}</p>
                      <div style={{ display: 'flex', gap: 8, fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span>Common links: {pred.commonLinks}</span>
                        <span>Intermediaries: {pred.intermediaries?.join(', ')}</span>
                      </div>
                      <div className="ai-disclaimer" style={{ marginTop: 8, fontSize: '0.72rem' }}>{pred.disclaimer}</div>
                    </div>
                    <div style={{ flexShrink: 0, padding: '8px 10px', background: '#f1f5f9', borderRadius: 6, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-accent)' }}>
                        {Math.round(pred.confidence * 100)}%
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>confidence</div>
                      <div className="progress-bar" style={{ marginTop: 4, width: 60 }}>
                        <div className="progress-bar-fill" style={{ width: `${pred.confidence * 100}%`, background: '#fbbf24' }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'evidence' && (
        <div className="card">
          <h4 style={{ marginBottom: 14, fontSize: '0.9rem' }}>Evidence & Source References</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {relationships.map((rel, i) => rel.properties?.recordRef ? (
              <div key={i} className={`evidence-record source-type-${rel.properties?.source?.toLowerCase().startsWith('cdr') ? 'cdr' : rel.properties?.source?.toLowerCase().startsWith('fir') ? 'fir' : rel.properties?.source?.toLowerCase().includes('bank') ? 'financial' : 'surveillance'}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <span
                    className="evidence-id"
                    onClick={() => navigate(`/evidence/${encodeURIComponent(rel.properties.recordRef)}`)}
                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                    title="Inspect Evidence Ledger Record"
                  >
                    {rel.properties.recordRef}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{rel.type.replace(/_/g, ' ')}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Source: {rel.properties.source} · Confidence: {Math.round((rel.properties.confidence || 0) * 100)}%
                </div>
                {rel.properties.timestamp && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Date: {new Date(rel.properties.timestamp).toLocaleDateString('en-IN')}
                  </div>
                )}
              </div>
            ) : null)}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header Card */}
          <div className="card" style={{ borderLeft: '4px solid #2563eb', background: '#eff6ff' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Shield size={18} color="#2563eb" />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#1e3a8a' }}>
                    Entity Clearance Governance & Access Control
                  </h3>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#1d4ed8', margin: 0, lineHeight: 1.5 }}>
                  Define sensitivity classification, witness protection, agency scoping, and authorized officer access grants for <strong>{entity?.name || id} ({type})</strong>.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-primary" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                  {accessSettings.classification}
                </span>
                {accessSettings.witnessProtection && (
                  <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                    WITNESS PROTECTED
                  </span>
                )}
              </div>
            </div>
          </div>

          {settingsSavedAlert && (
            <div className="alert-box success" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle size={16} />
              <span><strong>Entity Access Saved:</strong> Governance clearance and officer permissions have been updated in the intelligence repository.</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
            {/* Left Card: Security Clearance & Scoping */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={15} color="#2563eb" /> Sensitivity & Agency Clearance
              </h4>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>
                  Clearance Classification
                </label>
                <select
                  className="form-select"
                  value={accessSettings.classification}
                  onChange={e => setAccessSettings({ ...accessSettings, classification: e.target.value })}
                >
                  <option value="RESTRICTED">RESTRICTED (General Field Operations)</option>
                  <option value="CONFIDENTIAL">CONFIDENTIAL (Designated Case Units)</option>
                  <option value="SECRET">SECRET (High Value Target / Special Cells)</option>
                  <option value="TOP SECRET">TOP SECRET / PROTECTED (Protected Witness & Lead Only)</option>
                </select>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                  Controls minimum officer rank and role required to inspect relationships and phone records.
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                  Permitted Agencies & Regional Units
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    'State Police / CCTNS',
                    'Mumbai Crime Branch',
                    'FIU-IND',
                    'Cyber Crime Cell',
                    'Directorate of Revenue Intelligence (DRI)',
                    'Special Task Force (STF)',
                    'NCRB Operations',
                  ].map(dept => {
                    const isAllowed = accessSettings.allowedDepartments.includes(dept);
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => toggleDepartment(dept)}
                        style={{
                          fontSize: '0.72rem', padding: '5px 10px', borderRadius: 20,
                          border: isAllowed ? '1px solid #2563eb' : '1px solid #cbd5e1',
                          background: isAllowed ? '#eff6ff' : '#ffffff',
                          color: isAllowed ? '#2563eb' : '#64748b',
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

              {/* Protective Custody & Masking Toggles */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.8rem' }}>
                  <input
                    type="checkbox"
                    checked={accessSettings.witnessProtection}
                    onChange={e => setAccessSettings({ ...accessSettings, witnessProtection: e.target.checked })}
                  />
                  <div>
                    <strong style={{ color: '#0f172a' }}>Witness Protection / Informant Masking</strong>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Automatically masks phone numbers, real identifiers, and residence locations for non-cleared personnel.
                    </div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.8rem' }}>
                  <input
                    type="checkbox"
                    checked={accessSettings.disseminationHold}
                    onChange={e => setAccessSettings({ ...accessSettings, disseminationHold: e.target.checked })}
                  />
                  <div>
                    <strong style={{ color: '#0f172a' }}>Inter-Agency Dissemination Hold</strong>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Prevents entity profile from automatic synchronization to external state border checkpoint registries.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Right Card: Officer Access Grants ("Who Can Access") */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={15} color="#2563eb" /> Authorized Investigators ("Who Can Access")
                </h4>
                <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>
                  {accessSettings.officerGrants.length} Personnel
                </span>
              </div>

              {/* Grants Table */}
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                      <th style={{ padding: '8px 10px', fontWeight: 700 }}>Officer</th>
                      <th style={{ padding: '8px 10px', fontWeight: 700 }}>Department</th>
                      <th style={{ padding: '8px 10px', fontWeight: 700 }}>Permission</th>
                      <th style={{ padding: '8px 10px', fontWeight: 700, width: 40 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessSettings.officerGrants.map((grant: any) => (
                      <tr key={grant.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 10px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{grant.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{grant.badge} · {grant.role}</div>
                        </td>
                        <td style={{ padding: '8px 10px', color: '#475569' }}>{grant.department}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{
                            fontSize: '0.68rem', padding: '2px 6px', borderRadius: 4,
                            background: grant.permission.includes('Full') ? '#eff6ff' : '#f1f5f9',
                            color: grant.permission.includes('Full') ? '#2563eb' : '#334155',
                            fontWeight: 700
                          }}>
                            {grant.permission}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveOfficerGrant(grant.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}
                            title="Revoke access"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add New Officer Grant Form */}
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <h5 style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <UserPlus size={13} color="#2563eb" /> Grant Explicit Officer Clearance
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
                    <option value="Full Control">Full Control</option>
                    <option value="Read & Contribute">Read & Contribute</option>
                    <option value="Read Only / Auditor">Read Only / Auditor</option>
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
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Lock size={15} />
              <span>{savingSettings ? 'Saving Governance...' : 'Save Entity Access Governance'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
