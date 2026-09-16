import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Users, Phone, Truck, Building2, CreditCard, MapPin, AlertTriangle, CheckCircle, Flag } from 'lucide-react';
import {
  PERSONS, PHONES, VEHICLES, ORGANISATIONS, ACCOUNTS, LOCATIONS,
  ENTITY_COUNTS, type AnyEntity,
} from '../data/dataset';

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  Person:       { label: 'Persons',       color: '#2563eb', icon: Users },
  Phone:        { label: 'Phones',        color: '#16a34a', icon: Phone },
  Vehicle:      { label: 'Vehicles',      color: '#ea580c', icon: Truck },
  Organization: { label: 'Organisations', color: '#7c3aed', icon: Building2 },
  Account:      { label: 'Accounts',      color: '#ca8a04', icon: CreditCard },
  Location:     { label: 'Locations',     color: '#dc2626', icon: MapPin },
};

function getEntityLabel(e: AnyEntity): string {
  if (e.nodeType === 'Person') return e.name;
  if (e.nodeType === 'Phone') return e.number;
  if (e.nodeType === 'Vehicle') return e.licensePlate;
  if (e.nodeType === 'Organization') return e.name;
  if (e.nodeType === 'Account') return e.accountNumber;
  if (e.nodeType === 'Location') return e.name;
  return e.id;
}

function getEntitySub(e: AnyEntity): string {
  if (e.nodeType === 'Person') return `${e.occupation || '—'} · ${e.city || '—'}, ${e.state || '—'}`;
  if (e.nodeType === 'Phone') return `${e.operator || '—'} · ${e.circle || '—'} · ${e.callCount} calls`;
  if (e.nodeType === 'Vehicle') return `${e.make} ${e.model} · ${e.color} · ${e.registrationState}`;
  if (e.nodeType === 'Organization') return `${e.type || '—'} · ${e.city || '—'}`;
  if (e.nodeType === 'Account') return `${e.bank || '—'} · ${e.accountType}`;
  if (e.nodeType === 'Location') return `${e.city || '—'}, ${e.state || '—'}`;
  return '';
}

function isFlagged(e: AnyEntity): boolean {
  if (e.nodeType === 'Person') return (e.riskScore || 0) >= 0.6;
  if (e.nodeType === 'Vehicle') return !!e.flagged;
  if (e.nodeType === 'Organization') return !!e.flagged;
  if (e.nodeType === 'Account') return !!e.suspiciousActivity;
  if (e.nodeType === 'Phone') return e.registeredOwner === 'UNREGISTERED';
  return false;
}

function getRisk(e: AnyEntity): number {
  if (e.nodeType === 'Person') return e.riskScore || 0;
  return 0;
}

const PAGE_SIZE = 20;

export default function EntitiesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const typeFilter = searchParams.get('type') || '';
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch !== null && urlSearch !== search) {
      setSearch(urlSearch);
    }
  }, [searchParams]);

  const allEntities: AnyEntity[] = useMemo(() => [
    ...PERSONS, ...PHONES, ...VEHICLES, ...ORGANISATIONS, ...ACCOUNTS, ...LOCATIONS,
  ], []);

  const filtered = useMemo(() => {
    return allEntities.filter(e => {
      if (typeFilter && e.nodeType.toLowerCase() !== typeFilter.toLowerCase()) return false;
      if (flaggedOnly && !isFlagged(e)) return false;
      if (search) {
        const q = search.toLowerCase();
        const label = getEntityLabel(e).toLowerCase();
        const sub = getEntitySub(e).toLowerCase();
        if (!label.includes(q) && !sub.includes(q) && !e.id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allEntities, typeFilter, flaggedOnly, search]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleTypeFilter = (t: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (!t || t.toLowerCase() === typeFilter.toLowerCase()) {
      nextParams.delete('type');
    } else {
      nextParams.set('type', t);
    }
    setSearchParams(nextParams);
    setPage(1);
  };
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Entity Registry</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            {ENTITY_COUNTS.totalEntities} entities across {Object.keys(TYPE_CONFIG).length} types · {ENTITY_COUNTS.totalRelationships} relationships mapped
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid-4" style={{ marginBottom: 20, gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
          const Icon = cfg.icon;
          const count = {
            Person: ENTITY_COUNTS.persons, Phone: ENTITY_COUNTS.phones,
            Vehicle: ENTITY_COUNTS.vehicles, Organization: ENTITY_COUNTS.organisations,
            Account: ENTITY_COUNTS.accounts, Location: ENTITY_COUNTS.locations,
          }[type] || 0;
          return (
            <div
              key={type}
              onClick={() => handleTypeFilter(type)}
              className="stat-card"
              style={{ cursor: 'pointer', borderTop: typeFilter === type ? `3px solid ${cfg.color}` : '3px solid transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: `${cfg.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={14} style={{ color: cfg.color }} />
                </div>
                <span className="stat-label">{cfg.label}</span>
              </div>
              <div className="stat-value" style={{ fontSize: '1.6rem', color: cfg.color }}>{count}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search-input-wrapper" style={{ flex: 1, minWidth: 280 }}>
          <Search size={15} className="search-icon" />
          <input className="form-input" placeholder="Search by name, number, plate, city, bank..." value={search} onChange={e => handleSearch(e.target.value)} />
        </div>

        <button
          onClick={() => { setFlaggedOnly(v => !v); setPage(1); }}
          className={`btn ${flaggedOnly ? 'btn-danger' : 'btn-secondary'}`}
          style={{ gap: 6 }}
        >
          <Flag size={14} />
          {flaggedOnly ? 'Flagged Only' : 'Show All'}
        </button>

        {typeFilter && (
          <button className="btn btn-secondary btn-sm" onClick={() => handleTypeFilter('')}>
            Clear Filter ✕
          </button>
        )}

        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th className="sortable">
                <span className="col-name">id</span>
                <span className="col-type">varchar(32)</span>
                <span className="sort-icon">⇅</span>
              </th>
              <th className="sortable">
                <span className="col-name">type</span>
                <span className="col-type">varchar(20)</span>
                <span className="sort-icon">⇅</span>
              </th>
              <th className="sortable">
                <span className="col-name">name</span>
                <span className="col-type">varchar(200)</span>
                <span className="sort-icon">⇅</span>
              </th>
              <th>
                <span className="col-name">details</span>
                <span className="col-type">text</span>
              </th>
              <th>
                <span className="col-name">community</span>
                <span className="col-type">varchar(4)</span>
              </th>
              <th className="sortable">
                <span className="col-name">risk_score</span>
                <span className="col-type">numeric</span>
                <span className="sort-icon">⇅</span>
              </th>
              <th>
                <span className="col-name">status</span>
                <span className="col-type">varchar(10)</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(e => {
              const cfg = TYPE_CONFIG[e.nodeType];
              const Icon = cfg?.icon || Users;
              const flagged = isFlagged(e);
              const risk = getRisk(e);
              return (
                <tr
                  key={e.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/entities/${e.nodeType}/${e.id}`)}
                >
                  <td style={{ color: '#2563eb', maxWidth: 120 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                      {e.id}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, background: `${cfg?.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={10} style={{ color: cfg?.color }} />
                      </div>
                      {e.nodeType}
                    </div>
                  </td>
                  <td style={{ maxWidth: 200 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', fontWeight: 500 }}>
                      {getEntityLabel(e)}
                    </span>
                    {e.nodeType === 'Person' && (e as any).alias && (
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>alias: {(e as any).alias}</span>
                    )}
                  </td>
                  <td style={{ maxWidth: 240, color: '#475569' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                      {getEntitySub(e)}
                    </span>
                  </td>
                  <td>
                    {e.nodeType === 'Person' && (e as any).communityId
                      ? <span style={{
                          color: { C1: '#1d4ed8', C2: '#6d28d9', C3: '#15803d' }[(e as any).communityId as string] || '#475569',
                        }}>{(e as any).communityId}</span>
                      : <span className="cell-null">NULL</span>
                    }
                  </td>
                  <td>
                    {risk > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 52, height: 3, background: '#e2e8f0', borderRadius: 2, flexShrink: 0 }}>
                          <div style={{ width: `${risk * 100}%`, height: '100%', borderRadius: 2, background: risk > 0.7 ? '#dc2626' : risk > 0.5 ? '#ea580c' : '#ca8a04' }} />
                        </div>
                        <span style={{ color: risk > 0.7 ? '#dc2626' : '#64748b' }}>
                          {(risk).toFixed(2)}
                        </span>
                      </div>
                    ) : <span className="cell-null">NULL</span>}
                  </td>
                  <td>
                    {flagged
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#b91c1c' }}><AlertTriangle size={11} /> flagged</span>
                      : <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#15803d' }}><CheckCircle size={11} /> clear</span>
                    }
                  </td>
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  No entities match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
          {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} rows
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(1)}
            style={{ padding: '4px 8px', fontSize: '0.78rem', background: 'none', border: '1px solid #e2e8f0', borderRadius: 5, cursor: page <= 1 ? 'not-allowed' : 'pointer', color: page <= 1 ? '#cbd5e1' : '#475569' }}
          >«</button>
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            style={{ padding: '4px 10px', fontSize: '0.78rem', background: 'none', border: '1px solid #e2e8f0', borderRadius: 5, cursor: page <= 1 ? 'not-allowed' : 'pointer', color: page <= 1 ? '#cbd5e1' : '#475569' }}
          >Prev</button>
          <span style={{ fontSize: '0.78rem', color: '#64748b', padding: '0 6px', fontFamily: 'var(--font-mono)' }}>
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            style={{ padding: '4px 10px', fontSize: '0.78rem', background: 'none', border: '1px solid #e2e8f0', borderRadius: 5, cursor: page >= totalPages ? 'not-allowed' : 'pointer', color: page >= totalPages ? '#cbd5e1' : '#475569' }}
          >Next</button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(totalPages)}
            style={{ padding: '4px 8px', fontSize: '0.78rem', background: 'none', border: '1px solid #e2e8f0', borderRadius: 5, cursor: page >= totalPages ? 'not-allowed' : 'pointer', color: page >= totalPages ? '#cbd5e1' : '#475569' }}
          >»</button>
        </div>
      </div>
    </div>
  );
}
