import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { ALL_ENTITIES, type AnyEntity } from '../../data/dataset';

interface SearchResult {
  id: string;
  name?: string;
  number?: string;
  licensePlate?: string;
  accountNumber?: string;
  nodeType: string;
  matchReason: string;
}

function getEntityLabel(e: AnyEntity): string {
  if (e.nodeType === 'Person') return e.name;
  if (e.nodeType === 'Phone') return e.number;
  if (e.nodeType === 'Vehicle') return e.licensePlate;
  if (e.nodeType === 'Organization') return e.name;
  if (e.nodeType === 'Account') return e.accountNumber;
  if (e.nodeType === 'Location') return e.name;
  return (e as any).name || (e as any).number || (e as any).licensePlate || (e as any).accountNumber || e.id;
}

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [caseNumber, setCaseNumber] = useState<string | null>(null);

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

  const nodeColors: Record<string, string> = {
    Person: '#3b82f6', Phone: '#22c55e', Vehicle: '#f97316',
    Organization: '#8b5cf6', Location: '#ef4444', Account: '#eab308',
    Case: '#06b6d4', Event: '#ec4899',
  };

  // Investigation context
  const investigationMatch = location.pathname.match(/^\/investigations\/([^/]+)$/);
  const investigationId = investigationMatch
    ? decodeURIComponent(investigationMatch[1])
    : location.pathname === '/network'
      ? new URLSearchParams(location.search).get('investigation')
      : null;

  useEffect(() => {
    let mounted = true;
    setCaseNumber(null);

    if (investigationId) {
      api.get(`/api/investigations/${encodeURIComponent(investigationId)}`)
        .then(res => {
          if (mounted) {
            setCaseNumber(res.data.case_number || investigationId);
          }
        })
        .catch(() => {
          if (mounted) setCaseNumber(investigationId);
        });
    }

    return () => { mounted = false; };
  }, [investigationId]);

  const selectedOption = location.pathname === '/network' && investigationId
    ? 'network graph'
    : new URLSearchParams(location.search).get('tab') || 'overview';

  // Entity context
  const entityMatch = location.pathname.match(/^\/entities\/([^/]+)\/([^/]+)$/);
  const isEntityDetail = Boolean(entityMatch);
  const entityType = entityMatch
    ? decodeURIComponent(entityMatch[1])
    : ['/network', '/timeline'].includes(location.pathname)
      ? new URLSearchParams(location.search).get('entityType')
      : null;
  const entityId = entityMatch
    ? decodeURIComponent(entityMatch[2])
    : ['/network', '/timeline'].includes(location.pathname)
      ? new URLSearchParams(location.search).get('entityId') || new URLSearchParams(location.search).get('entity')
      : null;

  const [entityName, setEntityName] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setEntityName(null);

    if (entityType && entityId) {
      const found = ALL_ENTITIES.find(e => e.nodeType === entityType && e.id === entityId);
      if (found) {
        setEntityName(getEntityLabel(found));
      } else {
        setEntityName(`${entityType} ${entityId}`);
      }

      api.get(`/api/entities/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`)
        .then(res => {
          if (mounted && res.data?.entity) {
            const e = res.data.entity;
            const label = e.name || e.number || e.licensePlate || e.accountNumber || e.id;
            if (label) setEntityName(label);
          }
        })
        .catch(() => {});
    }

    return () => { mounted = false; };
  }, [entityType, entityId]);

  const isEntityContext = Boolean(entityType && entityId && (isEntityDetail || !investigationId));
  const isInvestigationContext = Boolean(investigationId && !isEntityDetail);

  const entityTab = location.pathname === '/network'
    ? 'network graph'
    : location.pathname === '/timeline'
      ? 'timeline'
      : (new URLSearchParams(location.search).get('tab') || 'details');

  return (
    <header className="topbar">
      {isEntityContext && entityType && entityId ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <span
            onClick={() => navigate('/entities')}
            style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
            title="Back to All Entities"
          >
            Entity
          </span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '1rem' }}>&gt;</span>
          <span
            onClick={() => navigate('/entities')}
            style={{
              color: nodeColors[entityType] || '#2563eb',
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
            title={`View all ${entityType} entities`}
          >
            {entityType}
          </span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '1rem' }}>&gt;</span>
          <span
            onClick={() => navigate(`/entities/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}?tab=details`)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 700,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
            title={`View ${entityName || entityId}`}
          >
            {entityName && entityName !== entityId ? (
              <>
                <span>{entityName}</span>
                <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600 }}>
                  ({entityId})
                </span>
              </>
            ) : (
              <span className="font-mono">{entityId}</span>
            )}
          </span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '1rem' }}>&gt;</span>
          <span style={{ color: nodeColors[entityType] || '#2563eb', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {entityTab.replace(/-/g, ' ')}
          </span>
        </div>
      ) : isInvestigationContext && investigationId ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <span
            onClick={() => navigate('/investigations')}
            style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
            title="Back to All Investigations"
          >
            Investigation
          </span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '1rem' }}>&gt;</span>
          <span
            onClick={() => navigate(`/investigations/${encodeURIComponent(investigationId)}`)}
            className="font-mono"
            style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase', cursor: 'pointer' }}
            title="View Investigation Overview"
          >
            {caseNumber || 'LOADING...'}
          </span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '1rem' }}>&gt;</span>
          <span style={{ color: '#7c3aed', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {selectedOption}
          </span>
        </div>
      ) : (
      /* Global Search */
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
      )}

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
