import { useState } from 'react';
import { Clock, Phone, DollarSign, MapPin, Users } from 'lucide-react';

const TIMELINE_EVENTS = [
  { id: 1, date: '2026-01-14', time: '10:30', type: 'surveillance', title: 'Meeting at Kanpur Central Station', description: 'Arjun Mehta, Vikram Sinha, and Ramesh Gupta observed at Kanpur Central Station. Duration: ~45 minutes.', entities: ['P001', 'P002', 'P003'], location: 'Kanpur Central Station', severity: 'high', source: 'SURV-2026-001' },
  { id: 2, date: '2026-01-15', time: '09:00', type: 'fir', title: 'FIR Filed — Case CASE-2026-00451', description: 'FIR-2026-00451 registered at Kanpur Central Police Station regarding suspected smuggling activity.', entities: ['P001'], severity: 'critical', source: 'FIR-2026-00451' },
  { id: 3, date: '2026-01-20', time: '14:25', type: 'financial', title: 'Large Financial Transfer Detected', description: 'Transaction of ₹5,00,000 from Shree Trading Co. account to Apex Logistics account.', entities: ['ACC001', 'O001', 'O002'], severity: 'high', source: 'TXN-2026-0001' },
  { id: 4, date: '2026-01-22', time: '11:10', type: 'cdr', title: 'Call Burst — Unusual Activity', description: '9876543210 (P001) makes 7 calls to 5 different numbers within 90 minutes. Simultaneous activity with P009.', entities: ['PH001', 'P001', 'P009'], severity: 'high', source: 'CDR-2026-0011' },
  { id: 5, date: '2026-02-03', time: '19:00', type: 'surveillance', title: 'Multi-Party Meeting at Lotus Hotel', description: 'P001, P002, P003, and P014 observed at Lotus Hotel, Mumbai. Deepak Patel (unregistered) also present.', entities: ['P001', 'P002', 'P003', 'P014'], location: 'Lotus Hotel, Mumbai', severity: 'critical', source: 'SURV-2026-004' },
  { id: 6, date: '2026-02-15', time: '10:00', type: 'financial', title: 'Circular Transaction Pattern Detected', description: 'Funds traced through 6-hop circular route: ACC001 → ACC007 → ACC004 → ACC005 → ACC011 → ACC003 → ACC001', entities: ['ACC001', 'ACC011'], severity: 'critical', source: 'TXN-CHAIN-001' },
  { id: 7, date: '2026-03-01', time: '14:00', type: 'financial', title: 'Structuring Pattern — Multiple Deposits', description: 'ACC-DL-002-2020 receives 4 deposits of ₹85K–₹90K in 3-hour window — may indicate structured deposits.', entities: ['ACC002'], severity: 'high', source: 'TXN-2026-0007' },
  { id: 8, date: '2026-04-10', time: '16:30', type: 'cdr', title: 'New Phone Contact Network Identified', description: 'Ravi Kumar (P009) shows 12 new contacts established within 2-week period. Overlap with existing network.', entities: ['P009'], severity: 'medium', source: 'CDR-2026-0017' },
];

const TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  surveillance: { icon: Users, color: '#3b82f6', label: 'Surveillance' },
  fir: { icon: Clock, color: '#ef4444', label: 'FIR / Case' },
  financial: { icon: DollarSign, color: '#eab308', label: 'Financial' },
  cdr: { icon: Phone, color: '#22c55e', label: 'CDR / Telecom' },
  location: { icon: MapPin, color: '#f97316', label: 'Location' },
};

export default function TimelinePage() {
  const [typeFilter, setTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const filtered = TIMELINE_EVENTS.filter(e =>
    (!typeFilter || e.type === typeFilter) &&
    (!severityFilter || e.severity === severityFilter)
  );

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Investigation Timeline</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Chronological view of all relevant events across the investigation dataset</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className={`btn btn-sm ${!typeFilter ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTypeFilter('')}>All Types</button>
          {Object.entries(TYPE_CONFIG).map(([type, config]) => (
            <button key={type} className={`btn btn-sm ${typeFilter === type ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTypeFilter(typeFilter === type ? '' : type)}>
              {config.label}
            </button>
          ))}
        </div>
        <div style={{ width: 1, background: 'var(--border-primary)' }} />
        <div style={{ display: 'flex', gap: 6 }}>
          <button className={`btn btn-sm ${!severityFilter ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSeverityFilter('')}>All Severity</button>
          {['critical', 'high', 'medium', 'low'].map(s => (
            <button key={s} className={`btn btn-sm ${severityFilter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSeverityFilter(severityFilter === s ? '' : s)}>
              <span className={`badge badge-${s}`}>{s}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative', paddingLeft: 32 }}>
        {/* Vertical line */}
        <div style={{ position: 'absolute', left: 14, top: 0, bottom: 0, width: 2, background: '#e2e8f0' }} />

        {filtered.map((event, i) => {
          const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.surveillance;
          const Icon = config.icon;
          const severityBorder: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };

          return (
            <div key={event.id} style={{ position: 'relative', marginBottom: 20 }} className="fade-in">
              {/* Timeline dot */}
              <div style={{
                position: 'absolute', left: -32, top: 14, width: 28, height: 28,
                borderRadius: '50%', background: `${config.color}15`, border: `2px solid ${config.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1,
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              }}>
                <Icon size={12} color={config.color} />
              </div>

              <div className="card" style={{ borderLeft: `3px solid ${severityBorder[event.severity] || '#94a3b8'}`, background: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-accent)' }}>
                        {event.date} {event.time && `· ${event.time}`}
                      </span>
                      <span className="badge badge-neutral" style={{ background: `${config.color}15`, color: config.color, borderColor: `${config.color}30` }}>
                        {config.label}
                      </span>
                      <span className={`badge badge-${event.severity}`}>{event.severity}</span>
                    </div>

                    <h3 style={{ fontSize: '0.95rem', marginBottom: 6 }}>{event.title}</h3>
                    <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>{event.description}</p>

                    <div style={{ display: 'flex', gap: 16, fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      {event.location && <span>📍 {event.location}</span>}
                      <span>📄 {event.source}</span>
                      <span>Entities: {event.entities.join(', ')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="empty-state">
            <h3>No events match filters</h3>
            <p>Try different type or severity filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
