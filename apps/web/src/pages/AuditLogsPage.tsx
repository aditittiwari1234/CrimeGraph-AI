import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search, RefreshCw, ShieldCheck, Copy, Check, Eye, X,
  ChevronLeft, ChevronRight, Filter, Database, Hash, User
} from 'lucide-react';
import api from '../lib/api';

interface AuditLog {
  id: string;
  user_id: string | null;
  username: string;
  full_name?: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  description: string;
  ip_address: string;
  user_agent: string;
  result: string;
  metadata: any;
  data_hash: string;
  previous_hash: string;
  timestamp: string;
}

interface ColumnDef {
  key: string;
  type: string;
  sortable: boolean;
}

const AUDIT_COLUMNS: ColumnDef[] = [
  { key: 'id', type: 'uuid', sortable: true },
  { key: 'timestamp', type: 'timestamptz', sortable: true },
  { key: 'user_id', type: 'varchar', sortable: true },
  { key: 'username', type: 'varchar', sortable: true },
  { key: 'action', type: 'varchar', sortable: true },
  { key: 'resource_type', type: 'varchar', sortable: true },
  { key: 'resource_id', type: 'varchar', sortable: true },
  { key: 'description', type: 'text', sortable: true },
  { key: 'result', type: 'varchar', sortable: true },
  { key: 'ip_address', type: 'varchar', sortable: true },
  { key: 'user_agent', type: 'text', sortable: false },
  { key: 'metadata', type: 'jsonb', sortable: false },
  { key: 'data_hash', type: 'varchar', sortable: false },
  { key: 'previous_hash', type: 'varchar', sortable: false },
];

const ACTION_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  LOGIN: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  LOGOUT: { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
  CREATE: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  READ: { bg: '#ecfeff', text: '#0891b2', border: '#a5f3fc' },
  UPDATE: { bg: '#fefce8', text: '#ca8a04', border: '#fef08a' },
  DELETE: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  GRAPH_QUERY: { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
  AI_QUERY: { bg: '#fdf2f8', text: '#db2777', border: '#fbcfe8' },
  SEARCH: { bg: '#eef2ff', text: '#4f46e5', border: '#c7d2fe' },
  SEED_EXECUTED: { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
  EVIDENCE_VERIFY: { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
  EXPORT: { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
};

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
    resource_type: 'Resource Type',
    user_agent: 'User Agent',
  };
  if (overrides[key]) return overrides[key];
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatTimestamp(iso: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return iso;
  }
}

export default function AuditLogsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const userQuery = searchParams.get('user') || '';

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [actionFilter, setActionFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [userFilter, setUserFilter] = useState(userQuery);

  const [sortField, setSortField] = useState<string>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const [activeLogModal, setActiveLogModal] = useState<AuditLog | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Sync state if URL query param changes
  useEffect(() => {
    if (userQuery) {
      setUserFilter(userQuery);
    }
  }, [userQuery]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all logs from PostgreSQL audit_logs table
      const res = await api.get('/api/audit?limit=1000');
      if (res.data && Array.isArray(res.data.logs)) {
        setLogs(res.data.logs);
        setTotalCount(res.data.total ?? res.data.logs.length);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Unique actions for the filter dropdown
  const uniqueActions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => {
      if (l.action) set.add(l.action);
    });
    return Array.from(set).sort();
  }, [logs]);

  // Unique users for the filter dropdown
  const uniqueUsers = useMemo(() => {
    const map = new Map<string, string>();
    logs.forEach(l => {
      if (l.username) {
        map.set(l.username, l.full_name || l.username);
      }
    });
    return Array.from(map.entries())
      .map(([username, fullName]) => ({ username, fullName }))
      .sort((a, b) => a.username.localeCompare(b.username));
  }, [logs]);

  const handleUserFilterChange = (val: string) => {
    setUserFilter(val);
    if (val) {
      searchParams.set('user', val);
    } else {
      searchParams.delete('user');
    }
    setSearchParams(searchParams);
  };

  // Sorting handler
  const handleSort = (key: string) => {
    if (sortField === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(key);
      setSortOrder('asc');
    }
  };

  // Filtered dataset
  const filtered = useMemo(() => {
    return logs.filter(l => {
      // User filter
      if (userFilter) {
        const uTarget = userFilter.toLowerCase();
        const matchesUser =
          (l.username && l.username.toLowerCase().includes(uTarget)) ||
          (l.user_id && l.user_id.toLowerCase().includes(uTarget)) ||
          (l.full_name && l.full_name.toLowerCase().includes(uTarget));
        if (!matchesUser) return false;
      }

      // Action filter
      if (actionFilter && l.action !== actionFilter) {
        return false;
      }

      // Result filter
      if (resultFilter && l.result?.toLowerCase() !== resultFilter.toLowerCase()) {
        return false;
      }

      // Global text search
      if (search.trim()) {
        const q = search.toLowerCase();
        const inId = l.id?.toLowerCase().includes(q);
        const inUser = l.username?.toLowerCase().includes(q) || l.user_id?.toLowerCase().includes(q) || l.full_name?.toLowerCase().includes(q);
        const inAction = l.action?.toLowerCase().includes(q);
        const inResource = l.resource_type?.toLowerCase().includes(q) || l.resource_id?.toLowerCase().includes(q);
        const inDesc = l.description?.toLowerCase().includes(q);
        const inIp = l.ip_address?.toLowerCase().includes(q);
        const inHash = l.data_hash?.toLowerCase().includes(q) || l.previous_hash?.toLowerCase().includes(q);
        return inId || inUser || inAction || inResource || inDesc || inIp || inHash;
      }

      return true;
    });
  }, [logs, userFilter, actionFilter, resultFilter, search]);

  // Sorted dataset
  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = (a as any)[sortField];
      const bVal = (b as any)[sortField];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (sortField === 'timestamp') {
        const at = new Date(aVal).getTime();
        const bt = new Date(bVal).getTime();
        return sortOrder === 'asc' ? at - bt : bt - at;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filtered, sortField, sortOrder]);

  // Paginated dataset
  const paginated = useMemo(() => {
    if (pageSize === -1) return sorted;
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(sorted.length / pageSize));

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
  }, [paginated]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, actionFilter, resultFilter, userFilter, pageSize]);

  return (
    <div className="fade-in">
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Audit Logs
            </h1>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: 20,
              background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0'
            }}>
              <ShieldCheck size={13} />
              Cryptographic Tamper-Proof Chain
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0 0' }}>
            Complete historical trail of all actions stored directly in the PostgreSQL <code style={{ fontFamily: 'var(--font-mono)', background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>audit_logs</code> table.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', padding: '7px 14px' }}
            title="Reload all audit logs from database"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            {loading ? 'Syncing...' : 'Sync Database'}
          </button>
        </div>
      </div>

      {/* Database & Hash Banner */}
      <div className="card" style={{ marginBottom: 16, background: '#f8fafc', borderColor: '#e2e8f0', padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#475569' }}>
            <Database size={15} color="#2563eb" />
            <span>
              Connected to <strong>PostgreSQL / Neon DB</strong> &bull; Showing all <strong>14 schema columns</strong> &bull; Total records in DB: <strong>{totalCount}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.78rem', color: '#64748b' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Hash size={13} color="#059669" />
              SHA-256 Hashing Active
            </span>
            <span>&bull;</span>
            <span>Genesis Root Linked</span>
          </div>
        </div>
      </div>

      {/* Active User Filter Notification Chip */}
      {userFilter && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14,
          padding: '4px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 20,
          fontSize: '0.8rem', color: '#1d4ed8'
        }}>
          <User size={13} />
          <span>Filtered by officer: <strong>@{userFilter}</strong></span>
          <button
            onClick={() => handleUserFilterChange('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1d4ed8', padding: 0, display: 'flex', alignItems: 'center' }}
            title="Clear officer filter"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filters Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260, maxWidth: 780 }}>
          {/* Search Box */}
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search size={14} className="search-icon" />
            <input
              className="form-input"
              style={{ height: 34, fontSize: '0.82rem', paddingLeft: 34 }}
              placeholder="Search by user, action, resource, IP, description, hash..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* User / Officer Filter */}
          <select
            value={userFilter}
            onChange={e => handleUserFilterChange(e.target.value)}
            style={{
              height: 34, padding: '0 10px', fontSize: '0.8rem',
              background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6,
              color: '#334155', cursor: 'pointer', outline: 'none'
            }}
          >
            <option value="">All Officers ({uniqueUsers.length})</option>
            {uniqueUsers.map(u => (
              <option key={u.username} value={u.username}>
                @{u.username}{u.fullName && u.fullName !== u.username ? ` (${u.fullName})` : ''}
              </option>
            ))}
          </select>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            style={{
              height: 34, padding: '0 10px', fontSize: '0.8rem',
              background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6,
              color: '#334155', cursor: 'pointer', outline: 'none'
            }}
          >
            <option value="">All Actions ({uniqueActions.length})</option>
            {uniqueActions.map(act => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>

          {/* Result Filter */}
          <select
            value={resultFilter}
            onChange={e => setResultFilter(e.target.value)}
            style={{
              height: 34, padding: '0 10px', fontSize: '0.8rem',
              background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6,
              color: '#334155', cursor: 'pointer', outline: 'none'
            }}
          >
            <option value="">All Results</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>

          {(search || actionFilter || resultFilter || userFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setActionFilter('');
                setResultFilter('');
                handleUserFilterChange('');
              }}
              style={{
                height: 34, padding: '0 10px', fontSize: '0.78rem',
                background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6,
                color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {/* Row Counts, Page Size & Pagination Controls above table */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.8rem', color: '#64748b', flexWrap: 'wrap' }}>
          <span>
            {filtered.length > 0
              ? `${pageSize === -1 ? 1 : ((page - 1) * pageSize) + 1}–${pageSize === -1 ? filtered.length : Math.min(page * pageSize, filtered.length)} of ${filtered.length} rows`
              : '0 rows'}
            {filtered.length !== logs.length && ` (from ${logs.length})`}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Per page:</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              style={{
                height: 28, padding: '0 6px', fontSize: '0.75rem',
                background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 5,
                color: '#334155', cursor: 'pointer', outline: 'none'
              }}
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={-1}>All ({logs.length})</option>
            </select>
          </div>

          {pageSize !== -1 && totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{ display: 'flex', alignItems: 'center', padding: '4px 8px' }}
                title="Previous Page"
              >
                <ChevronLeft size={14} />
              </button>

              <span style={{ fontSize: '0.78rem', color: '#334155', padding: '0 4px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {page} / {totalPages}
              </span>

              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                style={{ display: 'flex', alignItems: 'center', padding: '4px 8px' }}
                title="Next Page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Full-width Main Table Card (edge-to-edge, zero left/right padding) */}
      <div className="card" style={{
        padding: 0,
        overflow: 'hidden',
        borderTop: '1px solid #e2e8f0',
        borderBottom: '1px solid #e2e8f0',
        borderLeft: 'none',
        borderRight: 'none',
        borderRadius: 0,
        marginLeft: 'calc(-1 * var(--spacing-lg, 24px))',
        marginRight: 'calc(-1 * var(--spacing-lg, 24px))',
        width: 'calc(100% + (2 * var(--spacing-lg, 24px)))',
      }}>
        <div
          ref={tableRef}
          onScroll={handleTableScroll}
          className="hide-table-native-scrollbar"
        >
          <table className="data-table" style={{ borderCollapse: 'collapse', width: '100%', minWidth: 1600 }}>
            <thead>
              <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 2 }}>
                {AUDIT_COLUMNS.map(col => (
                  <th
                    key={col.key}
                    className={[col.sortable ? 'sortable' : '', sortField === col.key ? 'sorted' : ''].join(' ')}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                    style={{
                      borderRight: '1px solid #e2e8f0',
                      borderBottom: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      padding: '10px 12px',
                      textAlign: 'left'
                    }}
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
              {paginated.map(log => {
                const actStyle = ACTION_STYLES[log.action] || { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
                const isSuccess = log.result?.toLowerCase() === 'success';

                return (
                  <tr
                    key={log.id}
                    onClick={() => setActiveLogModal(log)}
                    style={{ cursor: 'pointer' }}
                    title="Click row to inspect full audit details"
                  >
                    {/* 1. id (uuid) */}
                    <td style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', color: '#2563eb', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span title={log.id} style={{ maxWidth: 105, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.id.substring(0, 8)}...
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(log.id, `id-${log.id}`);
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#94a3b8' }}
                          title="Copy UUID"
                        >
                          {copiedKey === `id-${log.id}` ? <Check size={11} color="#16a34a" /> : <Copy size={11} />}
                        </button>
                      </div>
                    </td>

                    {/* 2. timestamp (timestamptz) */}
                    <td style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap', color: '#64748b' }}>
                      {formatTimestamp(log.timestamp)}
                    </td>

                    {/* 3. user_id (varchar) */}
                    <td style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                      {log.user_id ? (
                        <span style={{
                          padding: '2px 6px', borderRadius: 4, background: '#f1f5f9',
                          color: '#334155', fontWeight: 600, fontSize: '0.75rem'
                        }}>
                          {log.user_id}
                        </span>
                      ) : (
                        <span className="cell-null">NULL</span>
                      )}
                    </td>

                    {/* 4. username (varchar) */}
                    <td style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUserFilterChange(log.username);
                          }}
                          style={{
                            background: 'none', border: 'none', padding: 0,
                            fontWeight: 600, color: '#0f172a', cursor: 'pointer',
                            textAlign: 'left'
                          }}
                          title={`Filter by @${log.username}`}
                        >
                          @{log.username}
                        </button>
                        {log.full_name && (
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            ({log.full_name})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 5. action (varchar) */}
                    <td style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: 5, fontSize: '0.72rem', fontWeight: 700,
                        fontFamily: 'var(--font-mono)', letterSpacing: '0.03em',
                        background: actStyle.bg, color: actStyle.text, border: `1px solid ${actStyle.border}`,
                      }}>
                        {log.action}
                      </span>
                    </td>

                    {/* 6. resource_type (varchar) */}
                    <td style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                      <span style={{
                        padding: '2px 7px', borderRadius: 4, background: '#f8fafc',
                        border: '1px solid #e2e8f0', color: '#475569', fontSize: '0.74rem'
                      }}>
                        {log.resource_type || '—'}
                      </span>
                    </td>

                    {/* 7. resource_id (varchar) */}
                    <td style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                      {log.resource_id ? (
                        <span style={{ color: '#0284c7', fontWeight: 600 }}>
                          {log.resource_id}
                        </span>
                      ) : (
                        <span className="cell-null">NULL</span>
                      )}
                    </td>

                    {/* 8. description (text) */}
                    <td style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', minWidth: 200, maxWidth: 320 }}>
                      <span title={log.description} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.description || '—'}
                      </span>
                    </td>

                    {/* 9. result (varchar) */}
                    <td style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '2px 8px', borderRadius: 12,
                        background: isSuccess ? '#f0fdf4' : '#fef2f2',
                        color: isSuccess ? '#16a34a' : '#dc2626',
                        border: `1px solid ${isSuccess ? '#bbf7d0' : '#fecaca'}`,
                        fontSize: '0.72rem', fontWeight: 600
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: isSuccess ? '#16a34a' : '#dc2626' }} />
                        {log.result || 'unknown'}
                      </span>
                    </td>

                    {/* 10. ip_address (varchar) */}
                    <td style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap', color: '#475569' }}>
                      {log.ip_address || <span className="cell-null">NULL</span>}
                    </td>

                    {/* 11. user_agent (text) */}
                    <td style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', maxWidth: 160 }}>
                      <span title={log.user_agent} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }}>
                        {log.user_agent || <span className="cell-null">NULL</span>}
                      </span>
                    </td>

                    {/* 12. metadata (jsonb) */}
                    <td style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap', textAlign: 'center' }}>
                      {log.metadata && Object.keys(log.metadata).length > 0 ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveLogModal(log);
                          }}
                          style={{
                            background: '#f1f5f9', border: '1px solid #cbd5e1',
                            borderRadius: 4, padding: '2px 7px', fontSize: '0.72rem',
                            color: '#334155', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                          }}
                          title="Inspect JSON metadata"
                        >
                          <Eye size={11} /> {`{ ${Object.keys(log.metadata).length} keys }`}
                        </button>
                      ) : (
                        <span className="cell-null">&#123;&#125;</span>
                      )}
                    </td>

                    {/* 13. data_hash (varchar) */}
                    <td style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span title={log.data_hash} style={{ color: '#475569', fontSize: '0.75rem' }}>
                          {log.data_hash ? `${log.data_hash.substring(0, 10)}...${log.data_hash.substring(log.data_hash.length - 6)}` : <span className="cell-null">NULL</span>}
                        </span>
                        {log.data_hash && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(log.data_hash, `dh-${log.id}`);
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#94a3b8' }}
                            title="Copy full data hash"
                          >
                            {copiedKey === `dh-${log.id}` ? <Check size={11} color="#16a34a" /> : <Copy size={11} />}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 14. previous_hash (varchar) */}
                    <td style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        {log.previous_hash === 'GENESIS' ? (
                          <span style={{
                            padding: '2px 7px', borderRadius: 4, background: '#fef3c7',
                            border: '1px solid #fde68a', color: '#b45309', fontWeight: 700, fontSize: '0.72rem'
                          }}>
                            GENESIS
                          </span>
                        ) : log.previous_hash ? (
                          <>
                            <span title={log.previous_hash} style={{ color: '#64748b', fontSize: '0.75rem' }}>
                              {`${log.previous_hash.substring(0, 8)}...`}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(log.previous_hash, `ph-${log.id}`);
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#94a3b8' }}
                              title="Copy full previous hash"
                            >
                              {copiedKey === `ph-${log.id}` ? <Check size={11} color="#16a34a" /> : <Copy size={11} />}
                            </button>
                          </>
                        ) : (
                          <span className="cell-null">NULL</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginated.length === 0 && (
                <tr>
                  <td
                    colSpan={AUDIT_COLUMNS.length}
                    style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}
                  >
                    {loading ? 'Loading audit records from database...' : 'No audit log entries match your current filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Spacer so the fixed bottom horizontal scrollbar does not overlap the last row */}
      <div style={{ height: 20 }} />

      {/* Fixed Horizontal Scrollbar — ALWAYS stuck at bottom of screen, mounted directly to body */}
      {createPortal(
        <div className="fixed-table-bottom-dock">
          <div
            ref={bottomScrollRef}
            onScroll={handleBottomScroll}
            className="fixed-horizontal-scrollbar"
            title="Scroll horizontally across all columns"
          >
            <div style={{ width: scrollWidth, height: 1 }} />
          </div>
        </div>,
        document.body
      )}

      {/* Detailed Inspection Modal */}
      {activeLogModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 12, width: '100%', maxWidth: 740,
            maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            border: '1px solid #e2e8f0'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={18} color="#059669" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                    Audit Record Details
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                    ID: {activeLogModal.id}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveLogModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content: All 14 fields */}
            <div style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>
                    Timestamp
                  </label>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#0f172a' }}>
                    {formatTimestamp(activeLogModal.timestamp)} ({activeLogModal.timestamp})
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>
                    Action & Result
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      background: (ACTION_STYLES[activeLogModal.action]?.bg || '#f1f5f9'),
                      color: (ACTION_STYLES[activeLogModal.action]?.text || '#475569')
                    }}>
                      {activeLogModal.action}
                    </span>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 600,
                      color: activeLogModal.result === 'success' ? '#16a34a' : '#dc2626'
                    }}>
                      {activeLogModal.result}
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>
                    User ID & Username
                  </label>
                  <div style={{ fontSize: '0.82rem', color: '#0f172a' }}>
                    <strong>@{activeLogModal.username}</strong>
                    {activeLogModal.full_name && ` (${activeLogModal.full_name})`}
                    <span style={{ color: '#64748b', marginLeft: 6, fontFamily: 'var(--font-mono)' }}>
                      [{activeLogModal.user_id || 'NULL'}]
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>
                    Resource Type & ID
                  </label>
                  <div style={{ fontSize: '0.82rem', color: '#0f172a' }}>
                    <span style={{ padding: '2px 6px', background: '#f1f5f9', borderRadius: 4, marginRight: 6 }}>
                      {activeLogModal.resource_type}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#0284c7' }}>
                      {activeLogModal.resource_id || 'NULL'}
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>
                    IP Address
                  </label>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#0f172a' }}>
                    {activeLogModal.ip_address || 'NULL'}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>
                    User Agent
                  </label>
                  <div style={{ fontSize: '0.82rem', color: '#475569', wordBreak: 'break-all' }}>
                    {activeLogModal.user_agent || 'NULL'}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                  Description
                </label>
                <div style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.82rem', color: '#0f172a' }}>
                  {activeLogModal.description || 'No description recorded.'}
                </div>
              </div>

              {/* Metadata JSON */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Metadata
                  </label>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(activeLogModal.metadata, null, 2), 'modal-meta')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    {copiedKey === 'modal-meta' ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                    {copiedKey === 'modal-meta' ? 'Copied' : 'Copy JSON'}
                  </button>
                </div>
                <pre style={{
                  padding: '10px 12px', background: '#0f172a', color: '#38bdf8', borderRadius: 6,
                  fontSize: '0.75rem', fontFamily: 'var(--font-mono)', overflowX: 'auto', margin: 0, maxHeight: 150
                }}>
                  {JSON.stringify(activeLogModal.metadata, null, 2)}
                </pre>
              </div>

              {/* Cryptographic Hashes */}
              <div style={{ padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Hash size={13} color="#2563eb" /> Cryptographic Integrity Proofs
                </div>

                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', fontWeight: 600 }}>
                    DATA_HASH (SHA-256)
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <code style={{ fontSize: '0.74rem', color: '#0f172a', background: '#e2e8f0', padding: '3px 6px', borderRadius: 4, flex: 1, wordBreak: 'break-all' }}>
                      {activeLogModal.data_hash || 'NULL'}
                    </code>
                    {activeLogModal.data_hash && (
                      <button
                        onClick={() => copyToClipboard(activeLogModal.data_hash, 'modal-dh')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                      >
                        {copiedKey === 'modal-dh' ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', fontWeight: 600 }}>
                    PREVIOUS_HASH (BLOCKCHAIN LINK)
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <code style={{ fontSize: '0.74rem', color: '#0f172a', background: '#e2e8f0', padding: '3px 6px', borderRadius: 4, flex: 1, wordBreak: 'break-all' }}>
                      {activeLogModal.previous_hash || 'NULL'}
                    </code>
                    {activeLogModal.previous_hash && activeLogModal.previous_hash !== 'GENESIS' && (
                      <button
                        onClick={() => copyToClipboard(activeLogModal.previous_hash, 'modal-ph')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                      >
                        {copiedKey === 'modal-ph' ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveLogModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
