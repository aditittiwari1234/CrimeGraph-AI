import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Filter, Bell } from 'lucide-react';
import api from '../lib/api';

const DEMO_ALERTS = [
  { id: '1', alert_type: 'CIRCULAR_TRANSACTION', severity: 'critical', title: 'Potential Circular Financial Transaction Pattern', description: 'Multi-hop transaction chain: ACC001 → ACC007 → ACC004 → ACC005 → ACC011 → ACC003 → ACC001 totaling ₹2.43M over 6 days. Pattern resembles potential fund cycling.', entity_id: 'ACC001', entity_type: 'Account', entity_label: 'ACC-MH-001-2019', evidence: [{ ref: 'TXN-2026-0001', type: 'BANK' }, { ref: 'TXN-2026-0006', type: 'BANK' }], is_acknowledged: false, created_at: '2026-09-13T20:00:00Z' },
  { id: '2', alert_type: 'COMMUNICATION_SPIKE', severity: 'high', title: 'Unusual Communication Spike Detected', description: 'Entity Ravi Kumar (P009) shows 7 communication contacts within a 3-hour window — approximately 4.2x above the 30-day baseline. Potentially unusual coordination activity.', entity_id: 'P009', entity_type: 'Person', entity_label: 'Ravi Kumar', evidence: [{ ref: 'CDR-2026-0011', type: 'CDR' }], is_acknowledged: false, created_at: '2026-09-13T17:30:00Z' },
  { id: '3', alert_type: 'STRUCTURING_PATTERN', severity: 'high', title: 'Possible Structuring Pattern — Multiple Small Deposits', description: 'Account ACC-DL-002-2020 shows 4 deposits of ₹85,000–₹90,000 within 3 hours. Pattern may indicate structured deposits to avoid reporting threshold.', entity_id: 'ACC002', entity_type: 'Account', entity_label: 'ACC-DL-002-2020', evidence: [{ ref: 'TXN-2026-0007', type: 'BANK' }], is_acknowledged: false, created_at: '2026-09-13T15:00:00Z' },
  { id: '4', alert_type: 'HIGH_CENTRALITY', severity: 'medium', title: 'High Network Influence Node Identified', description: 'Arjun Mehta (P001) identified as a high-centrality network node with 12+ direct connections spanning 3 detected communities.', entity_id: 'P001', entity_type: 'Person', entity_label: 'Arjun Mehta', evidence: [{ ref: 'GRAPH-ANALYTICS-001', type: 'GRAPH' }], is_acknowledged: false, created_at: '2026-09-13T10:00:00Z' },
  { id: '5', alert_type: 'LOCATION_OVERLAP', severity: 'medium', title: 'Multiple Persons of Interest at Common Location', description: 'Three persons (P001, P002, P003) from separate community clusters were observed at Kanpur Central Station simultaneously on 2026-01-14.', entity_id: 'L001', entity_type: 'Location', entity_label: 'Kanpur Central Station', evidence: [{ ref: 'SURV-2026-001', type: 'SURVEILLANCE' }], is_acknowledged: false, created_at: '2026-09-12T08:00:00Z' },
  { id: '6', alert_type: 'UNREGISTERED_PHONE', severity: 'low', title: 'Unregistered Phone Linked to Person of Interest', description: 'Phone PH016 (7777888899) has communication links to P001 and P009 despite having no registered owner.', entity_id: 'PH016', entity_type: 'Phone', entity_label: '7777888899', evidence: [{ ref: 'CDR-2026-0020', type: 'CDR' }], is_acknowledged: false, created_at: '2026-09-11T16:00:00Z' },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(DEMO_ALERTS);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get('/api/alerts?limit=50').then(res => {
      if (res.data.alerts?.length > 0) setAlerts(res.data.alerts);
    }).catch(() => {});
  }, []);

  const acknowledge = async (id: string) => {
    try { await api.patch(`/api/alerts/${id}/acknowledge`); } catch {}
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_acknowledged: true } : a));
  };

  const filtered = filter ? alerts.filter(a => a.severity === filter) : alerts;
  const counts = { critical: alerts.filter(a => a.severity === 'critical' && !a.is_acknowledged).length, high: alerts.filter(a => a.severity === 'high' && !a.is_acknowledged).length, medium: alerts.filter(a => a.severity === 'medium' && !a.is_acknowledged).length, low: alerts.filter(a => a.severity === 'low' && !a.is_acknowledged).length };

  const severityIcon: Record<string, string> = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Alerts & Anomalies</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>AI-detected suspicious patterns requiring investigator review</p>
        </div>
      </div>

      <div className="ai-disclaimer" style={{ marginBottom: 20 }}>
        ⚠️ All alerts are AI-generated indicators based on statistical and graph analysis. They are analytical leads only — not evidence of criminal activity. Each alert requires independent investigator review before any action.
      </div>

      {/* Severity summary */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {['critical', 'high', 'medium', 'low'].map(s => (
          <div key={s} className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setFilter(filter === s ? '' : s)}>
            <span className="stat-label">{s.charAt(0).toUpperCase() + s.slice(1)}</span>
            <div className="stat-value" style={{ fontSize: '2rem' }}>{counts[s as keyof typeof counts]}</div>
            <span className={`badge badge-${s}`}>Unacknowledged</span>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className={`btn btn-sm ${!filter ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('')}>All</button>
        {['critical', 'high', 'medium', 'low'].map(s => (
          <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(filter === s ? '' : s)}>
            {severityIcon[s]} {s}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(alert => (
          <div key={alert.id} className="card" style={{
            background: '#f1f5f9',
            borderLeft: `3px solid ${alert.severity === 'critical' ? '#dc2626' : alert.severity === 'high' ? '#ea580c' : alert.severity === 'medium' ? '#ca8a04' : '#16a34a'}`,
            opacity: alert.is_acknowledged ? 0.6 : 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span className={`badge badge-${alert.severity}`}>{alert.severity}</span>
                  <span className="badge badge-neutral">{alert.alert_type.replace(/_/g, ' ')}</span>
                  {alert.is_acknowledged && <span className="badge badge-low">Acknowledged</span>}
                </div>
                <h3 style={{ fontSize: '0.95rem', marginBottom: 6 }}>{alert.title}</h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>{alert.description}</p>
                <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  <span>Entity: <strong style={{ color: 'var(--text-secondary)' }}>{alert.entity_label}</strong> ({alert.entity_type})</span>
                  <span>{new Date(alert.created_at).toLocaleString('en-IN')}</span>
                </div>
                {/* Evidence refs */}
                <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                  {(alert.evidence as any[])?.map((e: any) => (
                    <span key={e.ref} style={{ padding: '1px 6px', background: 'var(--surface-2)', borderRadius: 4, fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', border: '1px solid var(--border-primary)' }}>
                      {e.ref}
                    </span>
                  ))}
                </div>
              </div>
              {!alert.is_acknowledged && (
                <button className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }} onClick={() => acknowledge(alert.id)}>
                  <CheckCircle size={14} /> Acknowledge
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
