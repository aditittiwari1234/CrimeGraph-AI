import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, Users, Phone, Truck, Building2, CreditCard, MapPin,
  Flag, RefreshCw, CheckCircle2, Database, AlertCircle
} from 'lucide-react';
import { useDatabases } from '../contexts/DatabaseContext';
import {
  PERSONS as FALLBACK_PERSONS,
  PHONES as FALLBACK_PHONES,
  VEHICLES as FALLBACK_VEHICLES,
  ORGANISATIONS as FALLBACK_ORGS,
  ACCOUNTS as FALLBACK_ACCOUNTS,
  LOCATIONS as FALLBACK_LOCATIONS,
} from '../data/dataset';

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: any; tableKey: string }> = {
  Person:       { label: 'Persons',       color: '#2563eb', icon: Users,      tableKey: 'persons' },
  Phone:        { label: 'Phones',        color: '#16a34a', icon: Phone,      tableKey: 'cdr_records' },
  Vehicle:      { label: 'Vehicles',      color: '#ea580c', icon: Truck,      tableKey: 'vehicles' },
  Organization: { label: 'Organisations', color: '#7c3aed', icon: Building2,  tableKey: 'organisations' },
  Account:      { label: 'Accounts',      color: '#ca8a04', icon: CreditCard, tableKey: 'bank_accounts' },
  Location:     { label: 'Locations',     color: '#dc2626', icon: MapPin,     tableKey: 'locations' },
};

// Precise column schemas matching the connected PostgreSQL database
const KNOWN_COLUMNS: Record<string, { key: string; type: string; sortable?: boolean }[]> = {
  Person: [
    { key: 'id',           type: 'varchar(32)',  sortable: true },
    { key: 'name',         type: 'varchar(200)', sortable: true },
    { key: 'aliases',      type: 'varchar(100)', sortable: true },
    { key: 'age',          type: 'int',          sortable: true },
    { key: 'gender',       type: 'varchar(10)' },
    { key: 'aadhaar_hash', type: 'varchar(20)' },
    { key: 'pan',          type: 'varchar(10)' },
    { key: 'occupation',   type: 'varchar(100)', sortable: true },
    { key: 'cluster',      type: 'varchar(10)' },
    { key: 'city',         type: 'varchar(100)', sortable: true },
    { key: 'state',        type: 'varchar(100)', sortable: true },
    { key: 'risk_score',   type: 'numeric',      sortable: true },
    { key: 'status',       type: 'varchar(30)',  sortable: true },
    { key: 'notes',        type: 'text' },
  ],
  Vehicle: [
    { key: 'id',                 type: 'varchar(32)',  sortable: true },
    { key: 'license_plate',      type: 'varchar(20)',  sortable: true },
    { key: 'vehicle_type',       type: 'varchar(50)' },
    { key: 'make',               type: 'varchar(50)' },
    { key: 'model',              type: 'varchar(50)' },
    { key: 'color',              type: 'varchar(30)' },
    { key: 'year',               type: 'int',          sortable: true },
    { key: 'registration_state', type: 'varchar(50)' },
    { key: 'registered_owner',   type: 'varchar(200)', sortable: true },
    { key: 'owner_id',           type: 'varchar(32)' },
    { key: 'status',             type: 'varchar(20)' },
    { key: 'flagged',            type: 'boolean' },
    { key: 'flag_reason',        type: 'text' },
  ],
  Organization: [
    { key: 'id',                 type: 'varchar(32)',  sortable: true },
    { key: 'name',               type: 'varchar(300)', sortable: true },
    { key: 'cin',                type: 'varchar(25)' },
    { key: 'gstin',              type: 'varchar(20)' },
    { key: 'pan',                type: 'varchar(10)' },
    { key: 'director',           type: 'varchar(200)', sortable: true },
    { key: 'city',               type: 'varchar(100)' },
    { key: 'state',              type: 'varchar(100)' },
    { key: 'registered_address', type: 'text' },
    { key: 'status',             type: 'varchar(30)' },
    { key: 'risk_score',         type: 'numeric',      sortable: true },
    { key: 'flagged',            type: 'boolean' },
  ],
  Account: [
    { key: 'id',                  type: 'varchar(32)',  sortable: true },
    { key: 'account_number',      type: 'varchar(30)',  sortable: true },
    { key: 'bank',                type: 'varchar(100)', sortable: true },
    { key: 'branch',              type: 'varchar(100)' },
    { key: 'ifsc',                type: 'varchar(15)' },
    { key: 'account_type',        type: 'varchar(30)' },
    { key: 'linked_person',       type: 'varchar(100)' },
    { key: 'balance',             type: 'varchar(30)' },
    { key: 'suspicious_activity', type: 'boolean' },
  ],
  Location: [
    { key: 'id',            type: 'varchar(32)',  sortable: true },
    { key: 'name',          type: 'varchar(200)', sortable: true },
    { key: 'location_type', type: 'varchar(50)' },
    { key: 'city',          type: 'varchar(100)' },
    { key: 'state',         type: 'varchar(100)' },
    { key: 'lat',           type: 'numeric' },
    { key: 'lng',           type: 'numeric' },
    { key: 'significance',  type: 'text' },
  ],
  Phone: [
    { key: 'id',             type: 'varchar(32)',  sortable: true },
    { key: 'caller_number',  type: 'varchar(20)',  sortable: true },
    { key: 'callee_number',  type: 'varchar(20)',  sortable: true },
    { key: 'caller_id',      type: 'varchar(32)' },
    { key: 'callee_id',      type: 'varchar(32)' },
    { key: 'duration',       type: 'int',          sortable: true },
    { key: 'call_type',      type: 'varchar(20)' },
    { key: 'timestamp',      type: 'varchar(30)' },
    { key: 'tower_location', type: 'varchar(100)' },
    { key: 'flagged',        type: 'boolean' },
    { key: 'flag_reason',    type: 'text' },
  ],
};

const MIXED_COLUMNS = [
  { key: 'id',       type: 'varchar(32)',  sortable: true },
  { key: 'nodeType', type: 'varchar(20)',  sortable: true },
  { key: 'name',     type: 'varchar(200)', sortable: true },
  { key: 'status',   type: 'varchar(30)' },
  { key: 'city',     type: 'varchar(100)' },
  { key: 'state',    type: 'varchar(100)' },
];

function getEntityLabel(e: any): string {
  if (e.name) return e.name;
  if (e.license_plate) return e.license_plate;
  if (e.caller_number) return `${e.caller_number} → ${e.callee_number || ''}`;
  if (e.account_number) return e.account_number;
  return e.id || '';
}

function isFlagged(e: any): boolean {
  if (e.nodeType === 'Person') {
    return Number(e.risk_score || e.riskScore || 0) >= 0.6 ||
      e.status === 'Prime Suspect' || e.status === 'Arrested' || e.status === 'Under Surveillance';
  }
  if (e.nodeType === 'Vehicle') return !!e.flagged;
  if (e.nodeType === 'Organization') return !!e.flagged || Number(e.risk_score || 0) >= 0.7;
  if (e.nodeType === 'Account') return !!e.suspicious_activity || !!e.suspiciousActivity;
  if (e.nodeType === 'Phone') return !!e.flagged;
  return false;
}

function renderCell(val: any, colKey: string) {
  if (val === null || val === undefined || val === '') return <span className="cell-null">NULL</span>;
  if (typeof val === 'boolean') {
    return val
      ? <span style={{ color: '#dc2626', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }}></span>true</span>
      : <span style={{ color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }}></span>false</span>;
  }
  if (colKey === 'risk_score' || colKey === 'riskScore' || colKey === 'centralityScore' || colKey === 'betweennessScore') {
    const n = Number(val);
    if (isNaN(n)) return <span className="cell-null">NULL</span>;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 52, height: 4, background: '#e2e8f0', borderRadius: 2, flexShrink: 0 }}>
          <div style={{ width: `${Math.min(100, n * 100)}%`, height: '100%', borderRadius: 2, background: n > 0.7 ? '#dc2626' : n > 0.5 ? '#ea580c' : '#ca8a04' }} />
        </div>
        <span style={{ fontWeight: 600, color: n > 0.7 ? '#dc2626' : '#64748b' }}>{n.toFixed(2)}</span>
      </div>
    );
  }
  if (colKey === 'aliases') {
    return (
      <span style={{ color: '#2563eb', fontWeight: 500 }}>
        {Array.isArray(val) ? val.join(', ') : String(val)}
      </span>
    );
  }
  if (colKey === 'status') {
    const str = String(val);
    const isCritical = str.includes('Prime Suspect') || str.includes('Arrested') || str.includes('Impounded') || str.includes('Suspended');
    const isWarn = str.includes('Surveillance') || str.includes('Flagged') || str.includes('Interest') || str.includes('Investigation');
    const color = isCritical ? '#dc2626' : isWarn ? '#ea580c' : '#16a34a';
    const bg = isCritical ? '#fef2f2' : isWarn ? '#fff7ed' : '#f0fdf4';
    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: '0.75rem',
        fontWeight: 500,
        color,
        background: bg,
        border: `1px solid ${color}30`,
        whiteSpace: 'nowrap'
      }}>
        {str}
      </span>
    );
  }
  if (Array.isArray(val)) return <span style={{ color: '#7c3aed' }}>[{val.length}]</span>;
  if (typeof val === 'number') return <span style={{ color: '#0f172a' }}>{val.toLocaleString()}</span>;
  const str = String(val);
  return (
    <span title={str} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 260 }}>
      {str}
    </span>
  );
}

function formatHeader(key: string): string {
  const overrides: Record<string, string> = {
    id: 'ID',
    user_id: 'User ID',
    resource_id: 'Resource ID',
    ip_address: 'IP Address',
    nodeType: 'Node Type',
    data_hash: 'Data Hash',
    previous_hash: 'Previous Hash',
    created_at: 'Created At',
    updated_at: 'Updated At',
    last_login: 'Last Login',
    badge_number: 'Badge Number',
    full_name: 'Full Name',
    is_active: 'Status',
    audit_logs: 'Audit Logs',
    dob: 'DOB',
    pan: 'PAN',
    aadhaar: 'Aadhaar',
    fir_number: 'FIR Number',
  };
  if (overrides[key]) return overrides[key];
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const PAGE_SIZE = 20;

export default function EntitiesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const typeFilter = searchParams.get('type') || '';
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Horizontal scroll sync refs & logic for always-visible bottom scrollbar
  const tableRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(2000);
  const isSyncingBottom = useRef(false);
  const isSyncingTable = useRef(false);

  const handleTableScroll = () => {
    if (isSyncingBottom.current) {
      isSyncingBottom.current = false;
      return;
    }
    if (bottomScrollRef.current && tableRef.current) {
      isSyncingTable.current = true;
      bottomScrollRef.current.scrollLeft = tableRef.current.scrollLeft;
    }
  };

  const handleBottomScroll = () => {
    if (isSyncingTable.current) {
      isSyncingTable.current = false;
      return;
    }
    if (tableRef.current && bottomScrollRef.current) {
      isSyncingBottom.current = true;
      tableRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
    }
  };

  // Live database connection state
  const { activeDatabase, databases } = useDatabases();
  const [liveData, setLiveData] = useState<Record<string, any[]> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<string>('Connecting to database...');

  const fetchLiveData = useCallback(async () => {
    setIsLoading(true);
    const db = activeDatabase || databases[0];

    try {
      if (db?.type === 'mongodb') {
        const uri = db.connectionUri || (db.host?.startsWith('mongodb') ? db.host : '');
        const dbParam = db.databaseName ? `&db=${encodeURIComponent(db.databaseName)}` : '';
        const res = await fetch(`/api/database/mongo-data?uri=${encodeURIComponent(uri)}${dbParam}&limit=2000`);
        const json = await res.json();
        if (json.success && json.data) {
          setLiveData(json.data);
          setDbStatus(`Live MongoDB Synced (${db.name || 'Atlas'})`);
          setIsLoading(false);
          return;
        }
      }

      // Relational / PostgreSQL
      let uriParam = '';
      if (db?.connectionUri) {
        uriParam = `?uri=${encodeURIComponent(db.connectionUri)}`;
      } else if (db?.host?.startsWith('postgres://') || db?.host?.startsWith('postgresql://')) {
        uriParam = `?uri=${encodeURIComponent(db.host)}`;
      }

      const separator = uriParam ? '&' : '?';
      const res = await fetch(`/api/database/live-data${uriParam}${separator}limit=2000`);
      const json = await res.json();

      if (json.success && json.data) {
        setLiveData(json.data);
        setDbStatus('Live Database Synced');
      } else {
        setDbStatus('Using cached dataset');
      }
    } catch {
      setDbStatus('Offline fallback dataset');
    } finally {
      setIsLoading(false);
    }
  }, [activeDatabase, databases]);

  useEffect(() => {
    fetchLiveData();
  }, [fetchLiveData]);

  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch !== null && urlSearch !== search) setSearch(urlSearch);
  }, [searchParams]);

  // Aggregate entities by type from live database tables
  const { entitiesByType, allEntities, counts } = useMemo(() => {
    if (!liveData) {
      // Fallback to static dataset if database is unreachable
      const p = FALLBACK_PERSONS.map(x => ({ ...x, nodeType: 'Person', aliases: (x as any).alias || '' }));
      const ph = FALLBACK_PHONES.map(x => ({ ...x, nodeType: 'Phone' }));
      const v = FALLBACK_VEHICLES.map(x => ({ ...x, nodeType: 'Vehicle' }));
      const o = FALLBACK_ORGS.map(x => ({ ...x, nodeType: 'Organization' }));
      const a = FALLBACK_ACCOUNTS.map(x => ({ ...x, nodeType: 'Account' }));
      const l = FALLBACK_LOCATIONS.map(x => ({ ...x, nodeType: 'Location' }));
      return {
        entitiesByType: { Person: p, Phone: ph, Vehicle: v, Organization: o, Account: a, Location: l },
        allEntities: [...p, ...ph, ...v, ...o, ...a, ...l],
        counts: {
          Person: p.length,
          Phone: ph.length,
          Vehicle: v.length,
          Organization: o.length,
          Account: a.length,
          Location: l.length,
        }
      };
    }

    const rawPersons = (liveData['persons'] || liveData['person'] || [])
      .map(r => ({ ...r, nodeType: 'Person' }));
    const rawVehicles = (liveData['vehicles'] || liveData['vehicle'] || [])
      .map(r => ({ ...r, nodeType: 'Vehicle' }));
    const rawOrgs = (liveData['organisations'] || liveData['organizations'] || liveData['organisation'] || [])
      .map(r => ({ ...r, nodeType: 'Organization' }));
    const rawAccounts = (liveData['bank_accounts'] || liveData['accounts'] || liveData['account'] || [])
      .map(r => ({ ...r, nodeType: 'Account' }));
    const rawLocations = (liveData['locations'] || liveData['location'] || [])
      .map(r => ({ ...r, nodeType: 'Location' }));
    const rawPhones = (liveData['cdr_records'] || liveData['phones'] || liveData['phone'] || [])
      .map(r => ({ ...r, nodeType: 'Phone' }));

    const byType: Record<string, any[]> = {
      Person: rawPersons,
      Phone: rawPhones,
      Vehicle: rawVehicles,
      Organization: rawOrgs,
      Account: rawAccounts,
      Location: rawLocations,
    };

    const combined = [
      ...rawPersons,
      ...rawPhones,
      ...rawVehicles,
      ...rawOrgs,
      ...rawAccounts,
      ...rawLocations,
    ];

    return {
      entitiesByType: byType,
      allEntities: combined,
      counts: {
        Person: rawPersons.length,
        Phone: rawPhones.length,
        Vehicle: rawVehicles.length,
        Organization: rawOrgs.length,
        Account: rawAccounts.length,
        Location: rawLocations.length,
      }
    };
  }, [liveData]);

  // Determine active columns (base schema + any extra keys found in the database records)
  const resolvedType = typeFilter
    ? typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)
    : '';

  const activeCols = useMemo(() => {
    if (!resolvedType || !KNOWN_COLUMNS[resolvedType]) {
      return MIXED_COLUMNS;
    }

    const baseCols = KNOWN_COLUMNS[resolvedType];
    const records = entitiesByType[resolvedType] || [];
    if (records.length === 0) return baseCols;

    const baseKeySet = new Set(baseCols.map(c => c.key));
    const extraCols: { key: string; type: string; sortable?: boolean }[] = [];

    // Dynamically discover any additional fields in the database row
    const seen = new Set<string>();
    for (const rec of records) {
      for (const k of Object.keys(rec)) {
        if (k === 'nodeType' || baseKeySet.has(k) || seen.has(k)) continue;
        seen.add(k);
        const val = rec[k];
        const inferredType = typeof val === 'number' ? 'int' : typeof val === 'boolean' ? 'boolean' : 'varchar(100)';
        extraCols.push({ key: k, type: inferredType, sortable: true });
      }
    }

    return [...baseCols, ...extraCols];
  }, [resolvedType, entitiesByType]);

  // Filter entities
  const filtered = useMemo(() => {
    const list = resolvedType ? (entitiesByType[resolvedType] || []) : allEntities;
    let result = list.filter(e => {
      if (flaggedOnly && !isFlagged(e)) return false;
      if (search) {
        const q = search.toLowerCase();
        return Object.values(e).some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(q));
      }
      return true;
    });

    if (sortField) {
      result = [...result].sort((a, b) => {
        const va = (a as any)[sortField];
        const vb = (b as any)[sortField];
        if (va === vb) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        const cmp = typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb));
        return sortOrder === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [resolvedType, entitiesByType, allEntities, flaggedOnly, search, sortField, sortOrder]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const handleTypeFilter = (t: string) => {
    const next = new URLSearchParams(searchParams);
    if (!t || t.toLowerCase() === typeFilter.toLowerCase()) {
      next.delete('type');
    } else {
      next.set('type', t);
    }
    setSearchParams(next);
    setPage(1);
    setSortField(null);
  };

  const handleSort = (key: string) => {
    if (sortField === key) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(key);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const totalEntitiesCount = Object.values(counts).reduce((a, b) => a + b, 0);

  // Measure and sync table scrollWidth for the sticky horizontal scrollbar
  useEffect(() => {
    const updateWidth = () => {
      if (tableRef.current) {
        setScrollWidth(tableRef.current.scrollWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    const observer = new ResizeObserver(updateWidth);
    if (tableRef.current) observer.observe(tableRef.current);
    return () => {
      window.removeEventListener('resize', updateWidth);
      observer.disconnect();
    };
  }, [activeCols, paginated]);

  // Enable mouse wheel horizontal scrolling when hovering on the horizontal scrollbar
  useEffect(() => {
    const el = bottomScrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        const delta = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
        el.scrollLeft += delta;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, []);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: 2, fontWeight: 700 }}>Entity Registry</h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '0.75rem',
              padding: '2px 8px',
              borderRadius: 12,
              background: '#ecfdf5',
              color: '#047857',
              border: '1px solid #a7f3d0',
              fontWeight: 500
            }}>
              <CheckCircle2 size={12} />
              {dbStatus}
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            {totalEntitiesCount} entities verified from live database across {Object.keys(TYPE_CONFIG).length} schemas
          </p>
        </div>

        <button
          onClick={fetchLiveData}
          className="btn btn-secondary btn-sm"
          style={{ gap: 6, display: 'flex', alignItems: 'center' }}
          title="Refresh entities from live database"
          disabled={isLoading}
        >
          <RefreshCw size={13} className={isLoading ? 'spin' : ''} />
          <span>Sync Database</span>
        </button>
      </div>

      {/* Type cards with exact counts */}
      <div className="grid-4" style={{ marginBottom: 20, gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
          const Icon = cfg.icon;
          const count = counts[type as keyof typeof counts] || 0;
          const isSelected = typeFilter.toLowerCase() === type.toLowerCase();
          return (
            <div
              key={type}
              onClick={() => handleTypeFilter(type)}
              className="stat-card"
              style={{
                cursor: 'pointer',
                borderTop: isSelected ? `3px solid ${cfg.color}` : '3px solid transparent',
                background: isSelected ? '#f8fafc' : '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: `${cfg.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={14} style={{ color: cfg.color }} />
                </div>
                <span className="stat-label" style={{ fontWeight: isSelected ? 600 : 500 }}>{cfg.label}</span>
              </div>
              <div className="stat-value" style={{ fontSize: '1.6rem', color: cfg.color }}>{count}</div>
            </div>
          );
        })}
      </div>

      {/* Filter, search bar and pagination above the table */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search-input-wrapper" style={{ flex: 1, minWidth: 260 }}>
          <Search size={15} className="search-icon" />
          <input
            className="form-input"
            placeholder="Search across all fields..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
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

        {/* Row count & Next/Prev pagination buttons above table */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
            {filtered.length > 0 ? ((page - 1) * PAGE_SIZE) + 1 : 0}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} rows
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(1)}
              style={{
                padding: '4px 8px', fontSize: '0.78rem', background: '#ffffff',
                border: '1px solid #cbd5e1', borderRadius: 5,
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                color: page <= 1 ? '#cbd5e1' : '#334155', fontWeight: 600
              }}
              title="First Page"
            >
              «
            </button>
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              style={{
                padding: '4px 10px', fontSize: '0.78rem', background: '#ffffff',
                border: '1px solid #cbd5e1', borderRadius: 5,
                cursor: page <= 1 ? 'not-allowed' : 'pointer',
                color: page <= 1 ? '#cbd5e1' : '#334155', fontWeight: 600
              }}
            >
              Prev
            </button>
            <span style={{ fontSize: '0.78rem', color: '#334155', padding: '0 6px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              style={{
                padding: '4px 10px', fontSize: '0.78rem', background: '#ffffff',
                border: '1px solid #cbd5e1', borderRadius: 5,
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                color: page >= totalPages ? '#cbd5e1' : '#334155', fontWeight: 600
              }}
            >
              Next
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              style={{
                padding: '4px 8px', fontSize: '0.78rem', background: '#ffffff',
                border: '1px solid #cbd5e1', borderRadius: 5,
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                color: page >= totalPages ? '#cbd5e1' : '#334155', fontWeight: 600
              }}
              title="Last Page"
            >
              »
            </button>
          </div>
        </div>
      </div>

      {/* Full-width Table Card (edge-to-edge, zero left/right padding, 10px bottom padding) */}
      <div className="card" style={{
        padding: '0 0 10px 0',
        overflow: 'hidden',
        borderTop: '1px solid #e2e8f0',
        borderBottom: '1px solid #e2e8f0',
        borderLeft: 'none',
        borderRight: 'none',
        borderRadius: 0,
        marginLeft: 'calc(-1 * var(--spacing-lg, 24px))',
        marginRight: 'calc(-1 * var(--spacing-lg, 24px))',
        marginBottom: 'calc(-1 * var(--spacing-lg, 24px))',
        width: 'calc(100% + (2 * var(--spacing-lg, 24px)))',
      }}>
        <div
          ref={tableRef}
          onScroll={handleTableScroll}
          className="hide-table-native-scrollbar"
        >
          <table className="data-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                {activeCols.map(col => (
                  <th
                    key={col.key}
                    className={[col.sortable ? 'sortable' : '', sortField === col.key ? 'sorted' : ''].join(' ')}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                    style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}
                  >
                    <span className="col-name">{formatHeader(col.key)}</span>
                    {col.sortable && (
                      <span className="sort-icon">
                        {sortField === col.key ? (sortOrder === 'asc' ? '↑' : '↓') : '⇅'}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map(e => (
                <tr
                  key={e.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/entities/${e.nodeType}/${e.id}`)}
                >
                  {activeCols.map(col => {
                    const val = col.key === 'nodeType' ? e.nodeType : (e as any)[col.key];

                    if (col.key === 'id') {
                      return (
                        <td key={col.key} style={{ color: '#2563eb', fontWeight: 600, borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 120 }}>
                            {val}
                          </span>
                        </td>
                      );
                    }

                    if (col.key === 'nodeType') {
                      const cfg = TYPE_CONFIG[e.nodeType];
                      const Icon = cfg?.icon || Users;
                      return (
                        <td key={col.key} style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{
                              width: 16,
                              height: 16,
                              borderRadius: 3,
                              background: `${cfg?.color || '#64748b'}18`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <Icon size={9} style={{ color: cfg?.color || '#64748b' }} />
                            </div>
                            <span>{e.nodeType}</span>
                          </div>
                        </td>
                      );
                    }

                    if (col.key === 'name' && !typeFilter) {
                      return (
                        <td key={col.key} style={{ fontWeight: 500, borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 200 }}>
                            {getEntityLabel(e)}
                          </span>
                        </td>
                      );
                    }

                    return (
                      <td key={col.key} style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                        {renderCell(val, col.key)}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {paginated.length === 0 && (
                <tr>
                  <td
                    colSpan={activeCols.length}
                    style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}
                  >
                    {isLoading ? 'Loading entities from database...' : 'No entities match the current filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fixed Horizontal Scrollbar — ALWAYS stuck at bottom of screen, mounted directly to body */}
      {createPortal(
        <div
          className="fixed-table-bottom-dock"
          onWheel={(e) => {
            if (e.deltaY !== 0 && bottomScrollRef.current) {
              const delta = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
              bottomScrollRef.current.scrollLeft += delta;
            }
          }}
        >
          <div
            ref={bottomScrollRef}
            onScroll={handleBottomScroll}
            className="fixed-horizontal-scrollbar"
            title="Scroll horizontally across all columns (rotate mouse wheel to scroll)"
          >
            <div style={{ width: scrollWidth, height: 1 }} />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
