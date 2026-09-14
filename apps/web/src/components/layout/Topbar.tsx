import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

interface SearchResult {
  id: string;
  name?: string;
  number?: string;
  licensePlate?: string;
  accountNumber?: string;
  nodeType: string;
  matchReason: string;
}

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); setShowResults(false); return; }
    setSearching(true);
    try {
      const res = await api.get(`/api/entities/search?q=${encodeURIComponent(q)}&limit=8`);
      setResults(res.data.entities || []);
      setShowResults(true);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectResult = (r: SearchResult) => {
    setShowResults(false);
    setQuery('');
    navigate(`/entities/${r.nodeType}/${r.id}`);
  };

  const getEntityLabel = (r: SearchResult) => r.name || r.number || r.licensePlate || r.accountNumber || r.id;

  const nodeColors: Record<string, string> = {
    Person: '#3b82f6', Phone: '#22c55e', Vehicle: '#f97316',
    Organization: '#8b5cf6', Location: '#ef4444', Account: '#eab308',
    Case: '#06b6d4', Event: '#ec4899',
  };

  return (
    <header className="topbar">
      {/* Global Search */}
      <div className="topbar-search" style={{ position: 'relative' }}>
        <div className="search-input-wrapper">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search entities — persons, phones, vehicles, cases..."
            value={query}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            style={{ paddingRight: 12 }}
          />
          {searching && (
            <div style={{ position: 'absolute', right: 12 }}>
              <div className="loading-spinner" />
            </div>
          )}
        </div>

        {showResults && results.length > 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: 'var(--bg-card)', border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
            zIndex: 1000, overflow: 'hidden',
          }}>
            {results.map(r => (
              <div
                key={r.id}
                onClick={() => selectResult(r)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', cursor: 'pointer',
                  borderBottom: '1px solid var(--border-secondary)',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: nodeColors[r.nodeType] || '#64748b',
                }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {getEntityLabel(r)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {r.nodeType} · {r.matchReason}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showResults && results.length === 0 && query.length >= 2 && !searching && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-lg)', padding: '14px 16px',
            color: 'var(--text-muted)', fontSize: '0.875rem', zIndex: 1000,
          }}>
            No entities found for "{query}"
          </div>
        )}
      </div>

      <div className="topbar-right">
        {/* Classification marker */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
          background: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.2)',
          borderRadius: 'var(--radius-full)', fontSize: '0.65rem', fontWeight: 700,
          letterSpacing: '0.1em', color: '#b91c1c', textTransform: 'uppercase',
        }}>
          <Shield size={10} />
          Prototype Demo
        </div>

        <button
          className="btn btn-ghost"
          onClick={() => navigate('/alerts')}
          style={{ padding: '6px 8px', position: 'relative' }}
        >
          <Bell size={16} />
          <span style={{
            position: 'absolute', top: 2, right: 2, width: 8, height: 8,
            background: 'var(--color-critical)', borderRadius: '50%', border: '2px solid white',
          }} />
        </button>

        <div style={{ width: 1, height: 24, background: 'var(--border-primary)' }} />

        <div className="user-avatar" title={`${user?.fullName} (${user?.role})`}>
          {user?.fullName?.charAt(0) || 'U'}
        </div>

        <button className="btn btn-ghost btn-sm" onClick={logout} title="Logout">
          <LogOut size={14} />
        </button>
      </div>
    </header>
  );
}
