import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  FolderOpen, Users, AlertTriangle, Activity, Network,
  TrendingUp, Shield, Clock, ChevronRight, ArrowUpRight,
  Zap, Eye
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  activeInvestigations: number;
  totalInvestigations: number;
  criticalInvestigations: number;
  unacknowledgedAlerts: number;
  criticalAlerts: number;
  totalAlerts: number;
  totalEntities: number;
}

const activityData = [
  { time: 'Jan', calls: 42, transactions: 28, alerts: 6 },
  { time: 'Feb', calls: 68, transactions: 45, alerts: 11 },
  { time: 'Mar', calls: 89, transactions: 61, alerts: 14 },
  { time: 'Apr', calls: 124, transactions: 87, alerts: 18 },
  { time: 'May', calls: 156, transactions: 109, alerts: 22 },
  { time: 'Jun', calls: 201, transactions: 134, alerts: 28 },
  { time: 'Jul', calls: 178, transactions: 118, alerts: 19 },
  { time: 'Aug', calls: 234, transactions: 156, alerts: 31 },
  { time: 'Sep', calls: 198, transactions: 142, alerts: 26 },
];

const communityData = [
  { name: 'Community C1', value: 12, color: '#3b82f6' },
  { name: 'Community C2', value: 9, color: '#8b5cf6' },
  { name: 'Community C3', value: 8, color: '#06b6d4' },
  { name: 'Uncategorized', value: 4, color: '#475569' },
];

const recentAlerts = [
  { id: 1, title: 'Potential Circular Transaction Pattern', severity: 'critical', entity: 'ACC-MH-001-2019', time: '2h ago' },
  { id: 2, title: 'Unusual Communication Spike', severity: 'high', entity: 'Ravi Kumar', time: '3h ago' },
  { id: 3, title: 'Possible Structuring Pattern', severity: 'high', entity: 'ACC-DL-002-2020', time: '5h ago' },
  { id: 4, title: 'High Network Influence Node', severity: 'medium', entity: 'Arjun Mehta', time: '6h ago' },
  { id: 5, title: 'Cross-Community Location Overlap', severity: 'medium', entity: 'Kanpur Central Station', time: '8h ago' },
];

const recentInvestigations = [
  { id: 'CASE-2026-00451', title: 'Operation Northern Web', priority: 'critical', status: 'active', entities: 14, alerts: 3 },
  { id: 'CASE-2026-00892', title: 'Hawala Financial Network', priority: 'high', status: 'active', entities: 9, alerts: 2 },
  { id: 'CASE-2026-01234', title: 'Cybercrime Extortion Ring', priority: 'high', status: 'active', entities: 7, alerts: 1 },
];

const aiInsights = [
  {
    type: 'connection',
    title: 'Potential Indirect Link Detected',
    description: 'Arjun Mehta and Ravi Kumar may be connected through 3 shared intermediaries. Confidence: 78%',
    confidence: 0.78,
    evidence: ['CDR-011', 'REL-019', 'LOC-221'],
  },
  {
    type: 'anomaly',
    title: 'Communication Spike Anomaly',
    description: 'Ravi Kumar (P009): 7 contacts in 3-hour window — 4.2x above 30-day baseline.',
    confidence: 0.85,
    evidence: ['CDR-011', 'CDR-017'],
  },
  {
    type: 'community',
    title: '3 Distinct Communities Detected',
    description: 'Louvain algorithm identified 3 clusters with key bridge nodes between communities.',
    confidence: 0.82,
    evidence: ['GRAPH-ANALYTICS-001'],
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/investigations/dashboard/stats')
      .then(res => setStats(res.data))
      .catch(() => {
        // Use synthetic fallback data
        setStats({
          activeInvestigations: 3,
          totalInvestigations: 3,
          criticalInvestigations: 1,
          unacknowledgedAlerts: 6,
          criticalAlerts: 1,
          totalAlerts: 6,
          totalEntities: 83,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const severityColor: Record<string, string> = {
    critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e',
  };

  return (
    <div className="fade-in">
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Intelligence Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Welcome back, {user?.fullName} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/network')}>
            <Network size={14} /> Open Graph
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/investigations')}>
            <FolderOpen size={14} /> Investigations
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          {
            label: 'Active Investigations', value: loading ? '...' : stats?.activeInvestigations ?? 0,
            icon: FolderOpen, color: '#3b82f6',
            sub: `${stats?.criticalInvestigations ?? 0} critical`,
            onClick: () => navigate('/investigations'),
          },
          {
            label: 'Entities Analyzed', value: loading ? '...' : stats?.totalEntities ?? 0,
            icon: Users, color: '#8b5cf6',
            sub: 'Persons, phones, vehicles +',
            onClick: () => navigate('/entities'),
          },
          {
            label: 'Active Alerts', value: loading ? '...' : stats?.unacknowledgedAlerts ?? 0,
            icon: AlertTriangle, color: '#ef4444',
            sub: `${stats?.criticalAlerts ?? 0} critical alerts`,
            onClick: () => navigate('/alerts'),
          },
          {
            label: 'Network Activity', value: '234',
            icon: Activity, color: '#22c55e',
            sub: 'CDR events this period',
            onClick: () => navigate('/network'),
          },
        ].map((kpi, i) => (
          <div key={i} className="stat-card" style={{ cursor: 'pointer' }} onClick={kpi.onClick}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="stat-label">{kpi.label}</span>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: `${kpi.color}20`, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <kpi.icon size={16} color={kpi.color} />
              </div>
            </div>
            <div className="stat-value">{kpi.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 20 }}>
        {/* Network Activity Chart */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: 2 }}>Network Activity Timeline</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Communication events, financial transactions, and alerts over time</p>
            </div>
            <div className="tabs">
              <button className="tab active">9 months</button>
              <button className="tab">30 days</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={activityData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <defs>
                <linearGradient id="gradCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradTxn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                labelStyle={{ color: '#0f172a' }}
              />
              <Area type="monotone" dataKey="calls" name="Communications" stroke="#3b82f6" strokeWidth={2} fill="url(#gradCalls)" dot={false} />
              <Area type="monotone" dataKey="transactions" name="Transactions" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradTxn)" dot={false} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Community Detection */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 4 }}>Detected Communities</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16 }}>Graph clustering analysis</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={communityData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={2} stroke="white">
                {communityData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {communityData.map(c => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{c.name}</span>
                <span style={{ color: 'var(--text-tertiary)' }}>{c.value} members</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Recent Alerts */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem' }}>Recent Alerts</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/alerts')}>
              View all <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentAlerts.map(alert => (
              <div key={alert.id} style={{
                display: 'flex', gap: 12, padding: '10px 12px',
                background: 'var(--bg-tertiary)', borderRadius: 8,
                border: '1px solid var(--border-secondary)',
                borderLeft: `3px solid ${severityColor[alert.severity]}`,
                cursor: 'pointer', transition: 'all var(--transition-fast)',
              }}
                onClick={() => navigate('/alerts')}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={e => (e.currentTarget.style.background = '#f1f5f9')}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.825rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {alert.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Entity: {alert.entity} · {alert.time}
                  </div>
                </div>
                <span className={`badge badge-${alert.severity}`}>{alert.severity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '1rem' }}>AI Insights</h3>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/ai-assistant')}>
              Open Assistant <ChevronRight size={14} />
            </button>
          </div>

          <div className="ai-disclaimer" style={{ marginBottom: 12 }}>
            ⚠️ All AI insights are analytical leads requiring investigator review. Not legal determinations.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {aiInsights.map((insight, i) => (
              <div key={i} style={{
                padding: '12px', background: 'var(--bg-tertiary)',
                borderRadius: 8, border: '1px solid var(--border-primary)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {insight.title}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {insight.description}
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                      {insight.evidence.map(e => (
                        <span key={e} style={{
                          padding: '1px 6px', background: 'var(--surface-2)',
                          borderRadius: 4, fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
                          color: 'var(--text-accent)', border: '1px solid var(--border-primary)',
                        }}>
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#22c55e' }}>
                      {Math.round(insight.confidence * 100)}%
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>confidence</div>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{
                      width: `${insight.confidence * 100}%`,
                      background: `linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))`,
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Investigations */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1rem' }}>Active Investigations</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/investigations')}>
            View all <ChevronRight size={14} />
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Case Number</th>
              <th>Title</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Entities</th>
              <th>Alerts</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recentInvestigations.map(inv => (
              <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/investigations`)}>
                <td><span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-accent)' }}>{inv.id}</span></td>
                <td><span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{inv.title}</span></td>
                <td><span className={`badge badge-${inv.priority}`}>{inv.priority}</span></td>
                <td><span className="badge badge-low">{inv.status}</span></td>
                <td><span style={{ color: 'var(--text-secondary)' }}>{inv.entities}</span></td>
                <td><span style={{ color: inv.alerts > 0 ? 'var(--color-high)' : 'var(--text-muted)' }}>{inv.alerts}</span></td>
                <td><ChevronRight size={14} color="var(--text-muted)" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
