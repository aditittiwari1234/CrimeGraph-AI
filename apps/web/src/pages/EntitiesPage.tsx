import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, ChevronRight, Filter } from 'lucide-react';
import api from '../lib/api';

const NODE_TYPES = ['Person', 'Phone', 'Vehicle', 'Organization', 'Location', 'Account', 'Case', 'Event'];

const DEMO_ENTITIES = [
  { id: 'P001', nodeType: 'Person', name: 'Arjun Mehta', alias: 'AJ', location: 'Mumbai', communityId: 'C1' },
  { id: 'P002', nodeType: 'Person', name: 'Vikram Sinha', alias: 'VK', location: 'Delhi', communityId: 'C1' },
  { id: 'P003', nodeType: 'Person', name: 'Ramesh Gupta', alias: 'Ram', location: 'Kanpur', communityId: 'C1' },
  { id: 'P009', nodeType: 'Person', name: 'Ravi Kumar', alias: 'RK', location: 'Patna', communityId: 'C2' },
  { id: 'P007', nodeType: 'Person', name: 'Suresh Yadav', alias: 'SY', location: 'Varanasi', communityId: 'C2' },
  { id: 'P014', nodeType: 'Person', name: 'Ajay Singh', alias: 'AS', location: 'Chandigarh', communityId: 'C3' },
  { id: 'PH001', nodeType: 'Phone', number: '9876543210', operator: 'Airtel', location: 'Mumbai' },
  { id: 'V001', nodeType: 'Vehicle', licensePlate: 'MH02AB1234', make: 'Toyota', model: 'Innova', color: 'White' },
  { id: 'O001', nodeType: 'Organization', name: 'Shree Trading Co.', type: 'Import/Export', location: 'Mumbai' },
  { id: 'ACC001', nodeType: 'Account', accountNumber: 'ACC-MH-001-2019', bank: 'State Bank', accountType: 'Current' },
  { id: 'ACC011', nodeType: 'Account', accountNumber: 'ACC-SHELL-011', bank: 'Unknown', accountType: 'Current' },
  { id: 'L001', nodeType: 'Location', name: 'Kanpur Central Station', city: 'Kanpur', state: 'UP' },
  { id: 'CASE001', nodeType: 'Case', name: 'FIR-2026-00451', type: 'Smuggling', status: 'Active' },
];

export default function EntitiesPage() {
  const navigate = useNavigate();
  const [entities, setEntities] = useState(DEMO_ENTITIES);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (!q && !typeFilter) { setEntities(DEMO_ENTITIES); return; }
    setLoading(true);
    try {
      const res = await api.get(`/api/entities/search?q=${encodeURIComponent(q)}&type=${typeFilter}&limit=50`);
      setEntities(res.data.entities || DEMO_ENTITIES);
    } catch {
      const q_lower = q.toLowerCase();
      setEntities(DEMO_ENTITIES.filter(e =>
        (!typeFilter || e.nodeType === typeFilter) &&
        (!q || Object.values(e).some(v => String(v).toLowerCase().includes(q_lower)))
      ));
    } finally {
      setLoading(false);
    }
  };

  const filtered = entities.filter(e =>
    (!typeFilter || e.nodeType === typeFilter) &&
    (!search || Object.values(e).some(v => String(v).toLowerCase().includes(search.toLowerCase())))
  );

  const getLabel = (e: any) => e.name || e.number || e.licensePlate || e.accountNumber || e.id;
  const getSub = (e: any) => {
    if (e.nodeType === 'Person') return `${e.alias ? `Alias: ${e.alias} · ` : ''}${e.location || ''}`;
    if (e.nodeType === 'Phone') return `${e.operator || ''} · ${e.location || ''}`;
    if (e.nodeType === 'Vehicle') return `${e.make || ''} ${e.model || ''} · ${e.color || ''}`;
    if (e.nodeType === 'Organization') return `${e.type || ''} · ${e.location || ''}`;
    if (e.nodeType === 'Account') return `${e.bank || ''} · ${e.accountType || ''}`;
    if (e.nodeType === 'Location') return `${e.city || ''}, ${e.state || ''}`;
    return '';
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Entity Intelligence</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Browse and analyze all entities in the investigation dataset</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="search-input-wrapper" style={{ flex: 1, maxWidth: 400 }}>
          <Search size={15} className="search-icon" />
          <input className="form-input" placeholder="Search entities..." value={search} onChange={e => handleSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className={`btn btn-sm ${!typeFilter ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setTypeFilter(''); handleSearch(search); }}>
            All
          </button>
          {NODE_TYPES.map(t => (
            <button key={t} className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setTypeFilter(t); handleSearch(search); }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {NODE_TYPES.map(t => {
          const count = DEMO_ENTITIES.filter(e => e.nodeType === t).length;
          return count > 0 ? (
            <div key={t} style={{ padding: '6px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', borderRadius: 8, fontSize: '0.8rem' }}>
              <span className={`badge badge-${t.toLowerCase()}`}>{t}</span>
              <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>{count}</span>
            </div>
          ) : null;
        })}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 10 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Users size={24} /></div>
          <h3>No entities found</h3>
          <p>Try a different search term or entity type filter.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {filtered.map(entity => (
            <div
              key={entity.id}
              className="card"
              style={{ cursor: 'pointer', transition: 'all var(--transition-fast)' }}
              onClick={() => navigate(`/entities/${entity.nodeType}/${entity.id}`)}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--border-accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = ''; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span className={`badge badge-${entity.nodeType.toLowerCase()}`}>{entity.nodeType}</span>
                    {(entity as any).communityId && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Community {(entity as any).communityId}</span>
                    )}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getLabel(entity)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getSub(entity)}</div>
                  <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', marginTop: 4 }}>{entity.id}</div>
                </div>
                <ChevronRight size={14} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 4 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
