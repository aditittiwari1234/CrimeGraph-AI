import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Network, FileText, Clock, StickyNote, Plus, Bookmark, Download } from 'lucide-react';
import api from '../lib/api';

export default function InvestigationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inv, setInv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [note, setNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/api/investigations/${id}`)
      .then(res => setInv(res.data))
      .catch(() => setInv({
        case_number: 'CASE-2026-00451', title: 'Operation Northern Web',
        description: 'Cross-state smuggling network investigation', status: 'active', priority: 'critical',
        entities: [
          { id: '1', entity_id: 'P001', entity_type: 'Person', entity_label: 'Arjun Mehta', is_bookmarked: true },
          { id: '2', entity_id: 'P009', entity_type: 'Person', entity_label: 'Ravi Kumar', is_bookmarked: false },
          { id: '3', entity_id: 'ACC001', entity_type: 'Account', entity_label: 'ACC-MH-001-2019', is_bookmarked: false },
        ],
        notes: [],
      }))
      .finally(() => setLoading(false));
  }, [id]);

  const addNote = async () => {
    if (!note.trim()) return;
    setAddingNote(true);
    try {
      await api.post(`/api/investigations/${id}/notes`, { content: note });
      setNote('');
      const res = await api.get(`/api/investigations/${id}`);
      setInv(res.data);
    } catch { }
    setAddingNote(false);
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="loading-spinner" style={{ width: 36, height: 36, borderWidth: 3 }} /></div>;
  if (!inv) return <div className="empty-state"><h3>Investigation not found</h3></div>;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-accent)' }}>{inv.case_number}</span>
          <span className={`badge badge-${inv.priority}`}>{inv.priority}</span>
          <span className="badge badge-low">{inv.status}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: '1.4rem', flex: 1 }}>{inv.title}</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/network')}>
              <Network size={14} /> Open Graph
            </button>
          </div>
        </div>
        {inv.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 6 }}>{inv.description}</p>}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {['overview', 'entities', 'notes', 'timeline'].map(t => (
          <button key={t} className={`tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid-2">
          <div className="card">
            <h4 style={{ marginBottom: 12, fontSize: '0.9rem' }}>Investigation Summary</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Entities tracked', value: inv.entities?.length || 0 },
                { label: 'Active alerts', value: '3' },
                { label: 'Documents uploaded', value: '0' },
                { label: 'Notes added', value: inv.notes?.length || 0 },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                  <span style={{ fontWeight: 600 }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h4 style={{ marginBottom: 12, fontSize: '0.9rem' }}>Quick Actions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => navigate('/network')}><Network size={14} /> Explore Network Graph</button>
              <button className="btn btn-secondary" onClick={() => navigate('/documents')}><FileText size={14} /> Upload Document for NLP</button>
              <button className="btn btn-secondary" onClick={() => navigate('/ai-assistant')}><Plus size={14} /> Ask AI Assistant</button>
              <button className="btn btn-secondary" onClick={() => navigate('/timeline')}><Clock size={14} /> View Timeline</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'entities' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h4 style={{ fontSize: '0.9rem' }}>Tracked Entities ({inv.entities?.length || 0})</h4>
          </div>
          {inv.entities?.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <h3>No entities added</h3>
              <p>Use the Network Graph to add entities to this investigation.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Entity</th><th>Type</th><th>Bookmarked</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {inv.entities?.map((e: any) => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{e.entity_label || e.entity_id}</td>
                    <td><span className={`badge badge-${e.entity_type?.toLowerCase()}`}>{e.entity_type}</span></td>
                    <td>{e.is_bookmarked ? <Bookmark size={14} color="#fbbf24" fill="#fbbf24" /> : <Bookmark size={14} color="var(--text-muted)" />}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/entities/${e.entity_type}/${e.entity_id}`)}>
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <h4 style={{ marginBottom: 12, fontSize: '0.9rem' }}><StickyNote size={14} style={{ display: 'inline', marginRight: 6 }} />Add Note</h4>
            <textarea className="form-textarea" rows={3} placeholder="Add your investigation notes here..." value={note} onChange={e => setNote(e.target.value)} style={{ marginBottom: 10 }} />
            <button className="btn btn-primary btn-sm" onClick={addNote} disabled={addingNote || !note.trim()}>
              {addingNote ? 'Saving...' : 'Save Note'}
            </button>
          </div>
          {inv.notes?.length === 0 && (
            <div className="empty-state" style={{ padding: 32 }}>
              <h3>No notes yet</h3>
              <p>Add notes to track investigation progress.</p>
            </div>
          )}
          {inv.notes?.map((n: any) => (
            <div key={n.id} className="card" style={{ borderLeft: '3px solid var(--accent-primary)' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{n.content}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                {n.author_name} · {new Date(n.created_at).toLocaleString('en-IN')}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="card">
          <h4 style={{ marginBottom: 16, fontSize: '0.9rem' }}>Investigation Timeline</h4>
          <div className="alert-box info">
            <span>Timeline view shows chronological events linked to this investigation's entities. Use the full Timeline page for entity-specific filtering.</span>
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/timeline')}>
              <Clock size={14} /> Open Full Timeline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
