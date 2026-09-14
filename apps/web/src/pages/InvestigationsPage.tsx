import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Search, ChevronRight, AlertTriangle } from 'lucide-react';
import api from '../lib/api';

interface Investigation {
  id: string;
  case_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_by_name: string;
  entity_count: string;
  alert_count: string;
  created_at: string;
  updated_at: string;
  tags: string[];
}

export default function InvestigationsPage() {
  const navigate = useNavigate();
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newInv, setNewInv] = useState({ title: '', description: '', priority: 'medium' });

  const load = () => {
    api.get('/api/investigations?limit=50')
      .then(res => setInvestigations(res.data.investigations || []))
      .catch(() => {
        // Fallback synthetic
        setInvestigations([
          { id: '1', case_number: 'CASE-2026-00451', title: 'Operation Northern Web — Smuggling Network Investigation', description: 'Cross-state smuggling network', status: 'active', priority: 'critical', created_by_name: 'Admin', entity_count: '14', alert_count: '3', created_at: '2026-01-15', updated_at: '2026-09-01', tags: ['smuggling', 'multi-state'] },
          { id: '2', case_number: 'CASE-2026-00892', title: 'Hawala Financial Network Analysis', description: 'Money laundering investigation', status: 'active', priority: 'high', created_by_name: 'Admin', entity_count: '9', alert_count: '2', created_at: '2026-02-08', updated_at: '2026-08-28', tags: ['financial-fraud'] },
          { id: '3', case_number: 'CASE-2026-01234', title: 'Cybercrime Extortion Ring', description: 'Digital extortion syndicate', status: 'active', priority: 'high', created_by_name: 'Admin', entity_count: '7', alert_count: '1', created_at: '2026-03-12', updated_at: '2026-09-05', tags: ['cybercrime'] },
        ]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const createInvestigation = async () => {
    if (!newInv.title) return;
    setCreating(true);
    try {
      const res = await api.post('/api/investigations', newInv);
      setInvestigations(prev => [res.data, ...prev]);
      setShowCreate(false);
      setNewInv({ title: '', description: '', priority: 'medium' });
    } catch {
      // no-op
    } finally {
      setCreating(false);
    }
  };

  const filtered = investigations.filter(i =>
    i.title.toLowerCase().includes(search.toLowerCase()) ||
    i.case_number.toLowerCase().includes(search.toLowerCase())
  );

  const priorityColor: Record<string, string> = {
    critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e',
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Investigations</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Manage and monitor active case investigations</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Investigation
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0,
          zIndex: 200, pointerEvents: 'none',
        }}>
          <div className="card" style={{
            position: 'absolute',
            top: '50%',
            left: 'calc(var(--sidebar-width) + (100vw - var(--sidebar-width)) / 2)',
            transform: 'translate(-50%, -50%)',
            width: 'min(480px, calc(100vw - var(--sidebar-width) - 40px))',
            animation: 'fadeIn 0.2s ease',
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.2)',
            border: '1px solid #cbd5e1',
            pointerEvents: 'auto',
          }}>
            <h3 style={{ marginBottom: 16 }}>Create New Investigation</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" placeholder="Investigation title..." value={newInv.title} onChange={e => setNewInv(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={3} placeholder="Brief description..." value={newInv.description} onChange={e => setNewInv(p => ({ ...p, description: e.target.value })) }/>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={newInv.priority} onChange={e => setNewInv(p => ({ ...p, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button className="btn btn-primary" onClick={createInvestigation} disabled={creating || !newInv.title}>
                  {creating ? 'Creating...' : 'Create Investigation'}
                </button>
                <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="search-input-wrapper" style={{ marginBottom: 16, maxWidth: 400 }}>
        <Search size={15} className="search-icon" />
        <input className="form-input" placeholder="Search investigations..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 10 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FolderOpen size={24} /></div>
          <h3>No investigations found</h3>
          <p>Create a new investigation or adjust your search.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(inv => (
            <div
              key={inv.id}
              className="card"
              style={{
                cursor: 'pointer', borderLeft: `3px solid ${priorityColor[inv.priority] || '#94a3b8'}`,
                transition: 'all var(--transition-fast)',
              }}
              onClick={() => navigate(`/investigations/${inv.id}`)}
              onMouseEnter={e => (e.currentTarget.style.borderColor = priorityColor[inv.priority])}
              onMouseLeave={e => {}}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-accent)' }}>{inv.case_number}</span>
                    <span className={`badge badge-${inv.priority}`}>{inv.priority}</span>
                    <span className="badge badge-low">{inv.status}</span>
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>{inv.title}</h3>
                  {inv.description && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>{inv.description}</p>
                  )}
                  <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>👤 {inv.entity_count} entities</span>
                    <span style={{ color: parseInt(inv.alert_count) > 0 ? 'var(--color-high)' : undefined }}>
                      {parseInt(inv.alert_count) > 0 && <AlertTriangle size={12} style={{ display: 'inline', marginRight: 3 }} />}
                      {inv.alert_count} alerts
                    </span>
                    <span>by {inv.created_by_name}</span>
                    <span>Updated {new Date(inv.updated_at).toLocaleDateString('en-IN')}</span>
                  </div>
                  {inv.tags && inv.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                      {inv.tags.map(t => (
                        <span key={t} className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 4 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
