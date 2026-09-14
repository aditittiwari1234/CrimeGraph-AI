import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Network, ExternalLink, AlertCircle, Shield, Clock, ChevronRight } from 'lucide-react';
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
  const validTabs = ['details', 'relationships', 'potential-links', 'evidence'];
  const activeTab = validTabs.includes(rawTab) ? rawTab : 'details';
  const setActiveTab = (t: string) => setSearchParams({ tab: t });

  const [linkPredictions, setLinkPredictions] = useState<any[]>([]);

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
        {['details', 'relationships', 'potential-links', 'evidence'].map(t => (
          <button key={t} className={`tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'potential-links' ? 'Potential Links' : t.charAt(0).toUpperCase() + t.slice(1)}
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
    </div>
  );
}
