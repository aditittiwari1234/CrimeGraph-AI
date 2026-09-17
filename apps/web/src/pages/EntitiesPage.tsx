import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, Users, Phone, Truck, Building2, CreditCard, MapPin,
  Flag, RefreshCw, CheckCircle2, Database, AlertCircle,
  ExternalLink, Network, Copy, Check, Filter, Info, Share2,
  Layers, ChevronLeft, ChevronRight, FileText, ShieldAlert,
  FileCode, Activity, Eye, AlertTriangle
} from 'lucide-react';
import { useDatabases } from '../contexts/DatabaseContext';
import TableContextMenu, { type ContextMenuItem } from '../components/common/TableContextMenu';

// Fast in-memory and session cache for verified live database entities
let memoryEntitiesCache: Record<string, any[]> | null = null;
const CACHE_KEY = 'crimegraph_entities_cache';

function getInitialCachedData(): Record<string, any[]> | null {
  if (memoryEntitiesCache) return memoryEntitiesCache;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      memoryEntitiesCache = parsed;
      return parsed;
    }
  } catch {}
  return null;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: any; tableKey?: string }> = {
  Person:       { label: 'Persons',       color: '#2563eb', icon: Users,         tableKey: 'persons' },
  Phone:        { label: 'Phones',        color: '#16a34a', icon: Phone,         tableKey: 'cdr_records' },
  Vehicle:      { label: 'Vehicles',      color: '#ea580c', icon: Truck,         tableKey: 'vehicles' },
  Organization: { label: 'Organisations', color: '#7c3aed', icon: Building2,     tableKey: 'organisations' },
  Account:      { label: 'Accounts',      color: '#ca8a04', icon: CreditCard,    tableKey: 'bank_accounts' },
  Location:     { label: 'Locations',     color: '#dc2626', icon: MapPin,        tableKey: 'locations' },
  Case:         { label: 'Cases / FIRs',  color: '#0891b2', icon: FileText,      tableKey: 'fir_records' },
  Evidence:     { label: 'Evidence',      color: '#4f46e5', icon: ShieldAlert,   tableKey: 'evidence_ledger' },
  Document:     { label: 'Documents',     color: '#475569', icon: FileCode,      tableKey: 'documents' },
  Transaction:  { label: 'Transactions',  color: '#d97706', icon: Activity,      tableKey: 'financial_transactions' },
  Surveillance: { label: 'Surveillance',  color: '#0284c7', icon: Eye,           tableKey: 'surveillance_reports' },
  Alert:        { label: 'Alerts',        color: '#e11d48', icon: AlertTriangle,  tableKey: 'alerts' },
};

const FALLBACK_PALETTE = ['#2563eb', '#16a34a', '#ea580c', '#7c3aed', '#ca8a04', '#dc2626', '#0891b2', '#db2777', '#4f46e5', '#059669', '#d97706', '#0284c7'];

function getTypeConfig(type: string): { label: string; color: string; icon: any } {
  if (TYPE_CONFIG[type]) return TYPE_CONFIG[type];
  let hash = 0;
  for (let i = 0; i < type.length; i++) hash = type.charCodeAt(i) + ((hash << 5) - hash);
  const color = FALLBACK_PALETTE[Math.abs(hash) % FALLBACK_PALETTE.length];
  return {
    label: type.endsWith('s') ? type : `${type}s`,
    color,
    icon: Database,
  };
}

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

  // Right-click context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    entity: any;
    colKey: string;
    colValue: any;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(m => (m === msg ? null : m));
    }, 2200);
  };

  const handleCellContextMenu = (
    e: React.MouseEvent,
    entity: any,
    colKey: string,
    colValue: any
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      entity,
      colKey,
      colValue,
    });
  };

  const contextMenuItems = useMemo<ContextMenuItem[]>(() => {
    if (!contextMenu) return [];
    const { entity, colKey, colValue } = contextMenu;
    const items: ContextMenuItem[] = [];

    items.push({
      label: 'View Entity Dossier',
      sublabel: `Open full details for ${entity.id}`,
      icon: Info,
      iconColor: '#2563eb',
      onClick: () => navigate(`/entities/${entity.nodeType}/${entity.id}`),
    });

    items.push({
      label: 'Open in Network Graph',
      sublabel: 'Inspect 2-degree connections & network topology',
      icon: Network,
      iconColor: '#7c3aed',
      onClick: () =>
        navigate(
          `/network?entityType=${encodeURIComponent(entity.nodeType)}&entityId=${encodeURIComponent(
            entity.id
          )}`
        ),
    });

    items.push({
      label: 'Open in New Tab',
      icon: ExternalLink,
      onClick: () => window.open(`/entities/${entity.nodeType}/${entity.id}`, '_blank'),
      dividerAfter: true,
    });

    if (colValue !== undefined && colValue !== null && String(colValue).trim() !== '') {
      const displayVal = String(colValue);
      const truncated = displayVal.length > 25 ? displayVal.slice(0, 25) + '...' : displayVal;
      items.push({
        label: `Copy ${formatHeader(colKey)}`,
        sublabel: `"${truncated}"`,
        icon: Copy,
        iconColor: '#059669',
        onClick: () => {
          navigator.clipboard.writeText(displayVal);
          showToast(`Copied ${formatHeader(colKey)} to clipboard!`);
        },
      });
    }

    items.push({
      label: 'Copy Entity ID',
      sublabel: entity.id,
      icon: Copy,
      onClick: () => {
        navigator.clipboard.writeText(entity.id);
        showToast(`Copied ID (${entity.id}) to clipboard!`);
      },
    });

    items.push({
      label: 'Copy Entire Row as JSON',
      icon: Share2,
      onClick: () => {
        navigator.clipboard.writeText(JSON.stringify(entity, null, 2));
        showToast('Entire record copied to clipboard as JSON!');
      },
      dividerAfter: true,
    });

    if (colValue !== undefined && colValue !== null && String(colValue).trim() !== '') {
      items.push({
        label: `Filter Table by "${formatHeader(colKey)}"`,
        sublabel: `Show rows matching: ${String(colValue).slice(0, 20)}`,
        icon: Filter,
        iconColor: '#ca8a04',
        onClick: () => {
          setSearch(String(colValue));
          setPage(1);
          showToast(`Filtered by ${formatHeader(colKey)}: "${String(colValue)}"`);
        },
      });
    }

    const flagged = isFlagged(entity);
    items.push({
      label: flagged ? 'Remove Priority Flag' : 'Flag as Priority Target',
      sublabel: flagged ? 'Remove from high-risk watch list' : 'Mark for priority surveillance review',
      icon: Flag,
      iconColor: flagged ? '#94a3b8' : '#dc2626',
      danger: !flagged,
      onClick: () => {
        const nextFlagged = !flagged;
        entity.flagged = nextFlagged;
        entity.status = nextFlagged ? 'Flagged' : 'Active';
        setLiveData(prev => (prev ? { ...prev } : prev));
        showToast(
          nextFlagged ? `Flagged ${entity.id} as priority target!` : `Removed flag from ${entity.id}.`
        );
      },
    });

    return items;
  }, [contextMenu, navigate]);

  // Horizontal scroll sync refs & logic for always-visible bottom scrollbar
  const tableRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const cardsTrackRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(2000);
  const isSyncingBottom = useRef(false);
  const isSyncingTable = useRef(false);

  const scrollCards = (direction: 'left' | 'right') => {
    if (cardsTrackRef.current) {
      const amount = 340;
      cardsTrackRef.current.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth',
      });
    }
  };

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

  // Live database connection state with instant cache rehydration
  const { activeDatabase, databases } = useDatabases();
  const initialCache = useRef(getInitialCachedData()).current;
  const [liveData, setLiveData] = useState<Record<string, any[]> | null>(initialCache);
  const [isLoading, setIsLoading] = useState<boolean>(!initialCache);
  const [dbStatus, setDbStatus] = useState<string>(initialCache ? 'Live Database Synced' : 'Connecting to database...');

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
          memoryEntitiesCache = json.data;
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(json.data));
          } catch {}
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
        memoryEntitiesCache = json.data;
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(json.data));
        } catch {}
        setDbStatus('Live Database Synced');
      } else {
        setDbStatus(liveData ? 'Live Database Synced' : 'Connecting to database...');
      }
    } catch {
      setDbStatus(liveData ? 'Live Database Synced' : 'Connecting to database...');
    } finally {
      setIsLoading(false);
    }
  }, [activeDatabase, databases, liveData]);

  useEffect(() => {
    fetchLiveData();
  }, [fetchLiveData]);

  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch !== null && urlSearch !== search) setSearch(urlSearch);
  }, [searchParams]);

  // Aggregate entities by type strictly from live database tables (future-proof & auto-discovering)
  const { entitiesByType, allEntities, counts } = useMemo(() => {
    if (!liveData) {
      return {
        entitiesByType: { Person: [], Phone: [], Vehicle: [], Organization: [], Account: [], Location: [] },
        allEntities: [],
        counts: {
          Person: 0,
          Phone: 0,
          Vehicle: 0,
          Organization: 0,
          Account: 0,
          Location: 0,
        }
      };
    }

    const rawPersons = (liveData['persons'] || liveData['person'] || []).map(r => ({ ...r, nodeType: 'Person' }));
    const rawVehicles = (liveData['vehicles'] || liveData['vehicle'] || []).map(r => ({ ...r, nodeType: 'Vehicle' }));
    const rawOrgs = (liveData['organisations'] || liveData['organizations'] || liveData['organisation'] || []).map(r => ({ ...r, nodeType: 'Organization' }));
    const rawAccounts = (liveData['bank_accounts'] || liveData['accounts'] || liveData['account'] || []).map(r => ({ ...r, nodeType: 'Account' }));
    const rawLocations = (liveData['locations'] || liveData['location'] || []).map(r => ({ ...r, nodeType: 'Location' }));
    const rawPhones = (liveData['cdr_records'] || liveData['phones'] || liveData['phone'] || []).map(r => ({ ...r, nodeType: 'Phone' }));
    const rawCases = (liveData['fir_records'] || liveData['cases'] || liveData['case'] || []).map(r => ({ ...r, nodeType: 'Case' }));
    const rawEvidence = (liveData['evidence_ledger'] || liveData['evidence'] || []).map(r => ({ ...r, nodeType: 'Evidence' }));
    const rawDocuments = (liveData['documents'] || liveData['document'] || []).map(r => ({ ...r, nodeType: 'Document' }));
    const rawTransactions = (liveData['financial_transactions'] || liveData['transactions'] || []).map(r => ({ ...r, nodeType: 'Transaction' }));
    const rawSurveillance = (liveData['surveillance_reports'] || liveData['surveillance'] || []).map(r => ({ ...r, nodeType: 'Surveillance' }));
    const rawAlerts = (liveData['alerts'] || liveData['alert'] || []).map(r => ({ ...r, nodeType: 'Alert' }));

    const byType: Record<string, any[]> = {
      Person: rawPersons,
      Phone: rawPhones,
      Vehicle: rawVehicles,
      Organization: rawOrgs,
      Account: rawAccounts,
      Location: rawLocations,
    };

    if (rawCases.length > 0) byType['Case'] = rawCases;
    if (rawEvidence.length > 0) byType['Evidence'] = rawEvidence;
    if (rawDocuments.length > 0) byType['Document'] = rawDocuments;
    if (rawTransactions.length > 0) byType['Transaction'] = rawTransactions;
    if (rawSurveillance.length > 0) byType['Surveillance'] = rawSurveillance;
    if (rawAlerts.length > 0) byType['Alert'] = rawAlerts;

    // Dynamically discover any other custom tables that may be added to the database in the future
    const standardTableNames = new Set([
      'persons', 'person', 'vehicles', 'vehicle', 'organisations', 'organizations', 'organisation',
      'bank_accounts', 'accounts', 'account', 'locations', 'location', 'cdr_records', 'phones', 'phone',
      'fir_records', 'cases', 'case', 'evidence_ledger', 'evidence', 'documents', 'document',
      'financial_transactions', 'transactions', 'surveillance_reports', 'surveillance', 'alerts', 'alert',
      'users', 'refresh_tokens', 'audit_logs', 'investigations', 'investigation_entities', 'investigation_notes', 'external_data_sources'
    ]);

    for (const [tblName, rows] of Object.entries(liveData)) {
      if (!standardTableNames.has(tblName) && Array.isArray(rows) && rows.length > 0) {
        const cleanType = tblName
          .replace(/_+/g, ' ')
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join('')
          .replace(/s$/, '');
        if (!byType[cleanType]) {
          byType[cleanType] = rows.map(r => ({ ...r, nodeType: cleanType }));
        }
      }
    }

    const combined: any[] = [];
    const countsMap: Record<string, number> = {};

    for (const [t, list] of Object.entries(byType)) {
      combined.push(...list);
      countsMap[t] = list.length;
    }

    return {
      entitiesByType: byType,
      allEntities: combined,
      counts: countsMap,
    };
  }, [liveData]);

  // Compute available entity types list (standard schemas + any populated schemas)
  const availableTypes = useMemo(() => {
    const typesSet = new Set<string>();
    ['Person', 'Phone', 'Vehicle', 'Organization', 'Account', 'Location'].forEach(t => typesSet.add(t));
    Object.keys(entitiesByType).forEach(t => {
      if ((entitiesByType[t]?.length ?? 0) > 0) typesSet.add(t);
    });
    return Array.from(typesSet);
  }, [entitiesByType]);

  // Determine active columns (base schema + any extra keys found in the database records)
  const resolvedType = typeFilter
    ? typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)
    : '';

  const activeCols = useMemo(() => {
    if (!resolvedType) {
      return MIXED_COLUMNS;
    }

    const baseCols = KNOWN_COLUMNS[resolvedType] || [
      { key: 'id', type: 'varchar(32)', sortable: true },
      { key: 'name', type: 'varchar(200)', sortable: true },
    ];
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

  // Enable mouse wheel horizontal scrolling on the entity cards track
  useEffect(() => {
    const el = cardsTrackRef.current;
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
              background: isLoading && !liveData ? '#fef3c7' : '#ecfdf5',
              color: isLoading && !liveData ? '#b45309' : '#047857',
              border: `1px solid ${isLoading && !liveData ? '#fde68a' : '#a7f3d0'}`,
              fontWeight: 500
            }}>
              {isLoading && !liveData ? <RefreshCw size={11} className="spin" /> : <CheckCircle2 size={12} />}
              {dbStatus}
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
            {isLoading && !liveData
              ? 'Syncing live database records...'
              : `${totalEntitiesCount} verified entities across ${availableTypes.length} database schemas`}
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

      {/* Scalable Entity Category Track Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        marginTop: 4,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#64748b'
          }}>
            Entity Schemas
          </span>
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 600,
            padding: '2px 7px',
            borderRadius: 10,
            background: '#f1f5f9',
            color: '#475569',
          }}>
            {availableTypes.length} Available
          </span>
        </div>

        {/* Scroll navigation controls for horizontal overflow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => scrollCards('left')}
            className="card-nav-btn"
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569',
            }}
            title="Scroll categories left"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => scrollCards('right')}
            className="card-nav-btn"
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569',
            }}
            title="Scroll categories right"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Scalable horizontal cards carousel track — adapts to any number of entities */}
      <div
        ref={cardsTrackRef}
        className="hide-table-native-scrollbar"
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          paddingBottom: 4,
          marginBottom: 16,
          scrollBehavior: 'smooth',
          scrollbarWidth: 'none',
        }}
      >
        {/* 1. All Entities Master Card */}
        <div
          onClick={() => handleTypeFilter('')}
          className="entity-type-card"
          style={{
            minWidth: 170,
            flex: '0 0 auto',
            cursor: 'pointer',
            padding: '10px 14px',
            borderRadius: 10,
            background: !typeFilter ? '#eff6ff' : '#ffffff',
            border: !typeFilter ? '2px solid #2563eb' : '1px solid #e2e8f0',
            boxShadow: !typeFilter ? '0 4px 12px rgba(37, 99, 235, 0.12)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 6,
          }}
          title="Show all verified entities"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: '#0f172a15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Layers size={13} style={{ color: '#0f172a' }} />
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: !typeFilter ? 700 : 600, color: '#0f172a' }}>
                All Entities
              </span>
            </div>
            {!typeFilter && (
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              {isLoading && !liveData ? '...' : totalEntitiesCount}
            </div>
            <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>
              100%
            </span>
          </div>
        </div>

        {/* 2. Dynamic & Future-Proof Entity Type Cards */}
        {availableTypes.map((type) => {
          const cfg = getTypeConfig(type);
          const Icon = cfg.icon;
          const count = counts[type as keyof typeof counts] || 0;
          const isSelected = typeFilter.toLowerCase() === type.toLowerCase();
          const percent = totalEntitiesCount > 0 ? Math.round((count / totalEntitiesCount) * 100) : 0;

          return (
            <div
              key={type}
              onClick={() => handleTypeFilter(type)}
              className="entity-type-card"
              style={{
                minWidth: 170,
                flex: '0 0 auto',
                cursor: 'pointer',
                padding: '10px 14px',
                borderRadius: 10,
                background: isSelected ? `${cfg.color}0a` : '#ffffff',
                border: isSelected ? `2px solid ${cfg.color}` : '1px solid #e2e8f0',
                boxShadow: isSelected ? `0 4px 12px ${cfg.color}25` : '0 1px 3px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 6,
              }}
              title={`Filter by ${cfg.label} (${count} records)`}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: `${cfg.color}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon size={13} style={{ color: cfg.color }} />
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: isSelected ? 700 : 600, color: isSelected ? cfg.color : '#334155' }}>
                    {cfg.label}
                  </span>
                </div>
                {isSelected && (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: cfg.color, lineHeight: 1 }}>
                  {isLoading && !liveData ? '...' : count}
                </div>
                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>
                  {percent}%
                </span>
              </div>
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
        background: '#ffffff',
        minHeight: 'calc(100vh - 280px)',
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
                  style={{
                    cursor: 'pointer',
                    background: contextMenu?.entity?.id === e.id ? '#eff6ff' : undefined,
                  }}
                  onClick={() => navigate(`/entities/${e.nodeType}/${e.id}`)}
                  onContextMenu={ev => handleCellContextMenu(ev, e, 'id', e.id)}
                >
                  {activeCols.map(col => {
                    const val = col.key === 'nodeType' ? e.nodeType : (e as any)[col.key];

                    if (col.key === 'id') {
                      return (
                        <td
                          key={col.key}
                          onContextMenu={ev => handleCellContextMenu(ev, e, col.key, val)}
                          style={{
                            color: '#2563eb',
                            fontWeight: 600,
                            borderRight: '1px solid #e2e8f0',
                            borderBottom: '1px solid #e2e8f0',
                          }}
                        >
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block',
                              maxWidth: 120,
                            }}
                          >
                            {val}
                          </span>
                        </td>
                      );
                    }

                    if (col.key === 'nodeType') {
                      const cfg = TYPE_CONFIG[e.nodeType];
                      const Icon = cfg?.icon || Users;
                      return (
                        <td
                          key={col.key}
                          onContextMenu={ev => handleCellContextMenu(ev, e, col.key, val)}
                          style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: 3,
                                background: `${cfg?.color || '#64748b'}18`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <Icon size={9} style={{ color: cfg?.color || '#64748b' }} />
                            </div>
                            <span>{e.nodeType}</span>
                          </div>
                        </td>
                      );
                    }

                    if (col.key === 'name' && !typeFilter) {
                      return (
                        <td
                          key={col.key}
                          onContextMenu={ev => handleCellContextMenu(ev, e, col.key, val)}
                          style={{ fontWeight: 500, borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}
                        >
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block',
                              maxWidth: 200,
                            }}
                          >
                            {getEntityLabel(e)}
                          </span>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={col.key}
                        onContextMenu={ev => handleCellContextMenu(ev, e, col.key, val)}
                        style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}
                      >
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
                    style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}
                  >
                    {isLoading && !liveData ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <div className="loading-spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
                        <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>Connecting to database & loading live records...</div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Fetching verified database records. Please wait a moment.</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <Database size={24} style={{ color: '#94a3b8', marginBottom: 4 }} />
                        <div style={{ fontWeight: 600, color: '#475569' }}>No entities match the current filters</div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Try adjusting your search query or selecting a different entity type.</div>
                      </div>
                    )}
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

      {/* Table Right-Click Context Menu */}
      {contextMenu && (
        <TableContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          title={getEntityLabel(contextMenu.entity)}
          subtitle={`${contextMenu.entity.nodeType} ID: ${contextMenu.entity.id}`}
          badge={{
            label: contextMenu.entity.nodeType,
            color: TYPE_CONFIG[contextMenu.entity.nodeType]?.color || '#2563eb',
            bg: `${TYPE_CONFIG[contextMenu.entity.nodeType]?.color || '#2563eb'}18`,
          }}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Copy / Action Toast Notification */}
      {toastMessage &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              bottom: 30,
              right: 30,
              zIndex: 100000,
              background: '#1e293b',
              color: '#ffffff',
              padding: '9px 16px',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 600,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25) !important',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              pointerEvents: 'none',
              animation: 'contextMenuFadeIn 0.15s ease',
            }}
          >
            <Check size={14} style={{ color: '#22c55e' }} />
            <span>{toastMessage}</span>
          </div>,
          document.body
        )}
    </div>
  );
}
