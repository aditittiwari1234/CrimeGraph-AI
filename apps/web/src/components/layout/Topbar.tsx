import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Search, Bell, LogOut, X, Sliders } from 'lucide-react';
import logoImg from '../../assets/Logo.png';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { ALL_ENTITIES, type AnyEntity } from '../../data/dataset';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/inspector': 'Inspector Home',
  '/investigations': 'Investigations',
  '/network': 'Network Graph',
  '/database': 'Database Explorer',
  '/entities': 'Entities',
  '/timeline': 'Timeline',
  '/alerts': 'Alerts & Intel',
  '/documents': 'Documents',
  '/data-sources': 'Data Sources',
  '/datasources': 'Data Sources',
  '/ai-assistant': 'AI Assistant',
  '/evidence': 'Evidence Ledger',
  '/audit': 'Audit Logs',
  '/users': 'User Management',
  '/settings': 'Settings',
};

function getPageTitle(pathname: string): string {
  for (const [route, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return title;
    }
  }

  const firstPart = pathname.replace(/^\//, '').split('/')[0];
  if (firstPart) {
    return firstPart
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  return 'Dashboard';
}

interface SearchResult {
  id: string;
  name?: string;
  number?: string;
  licensePlate?: string;
  accountNumber?: string;
  firNumber?: string;
  nodeType: string;
  matchReason: string;
}

function getEntityLabel(e: AnyEntity | SearchResult): string {
  if (e.nodeType === 'Person') return e.name || e.id;
  if (e.nodeType === 'Phone') return e.number || e.id;
  if (e.nodeType === 'Vehicle') return e.licensePlate || e.id;
  if (e.nodeType === 'Organization') return e.name || e.id;
  if (e.nodeType === 'Account') return e.accountNumber || e.id;
  if (e.nodeType === 'Location') return e.name || e.id;
  if (e.nodeType === 'Case') return ('firNumber' in e && e.firNumber) || e.name || e.id;
  return (e as any).name || (e as any).number || (e as any).licensePlate || (e as any).accountNumber || e.id;
}

function searchLocalEntities(q: string, filterTypes: string[] = [], flaggedOnly = false, limit = 8): SearchResult[] {
  const searchTerm = q.trim().toLowerCase();
  if (!searchTerm) return [];

  const hasTypeFilter = filterTypes.length > 0;
  const matches: { result: SearchResult; score: number }[] = [];

  for (const entity of ALL_ENTITIES) {
    if (hasTypeFilter && !filterTypes.includes(entity.nodeType)) {
      continue;
    }

    if (flaggedOnly) {
      const isFlagged =
        ('riskScore' in entity && (entity.riskScore || 0) >= 0.6) ||
        ('flagged' in entity && Boolean(entity.flagged)) ||
        ('suspiciousActivity' in entity && Boolean(entity.suspiciousActivity)) ||
        ('registeredOwner' in entity && entity.registeredOwner === 'UNREGISTERED');
      if (!isFlagged) continue;
    }

    let matchReason = '';
    let score = 0;

    const id = (entity.id || '').toLowerCase();

    // Direct ID match
    if (id === searchTerm) {
      matchReason = `Exact ID match (${entity.id})`;
      score = 100;
    } else if (id.includes(searchTerm)) {
      matchReason = `ID contains "${q}"`;
      score = 80;
    }

    if (entity.nodeType === 'Person') {
      const name = (entity.name || '').toLowerCase();
      const alias = (entity.alias || '').toLowerCase();
      if (name === searchTerm) {
        matchReason = `Exact name match`;
        score = Math.max(score, 95);
      } else if (name.startsWith(searchTerm)) {
        matchReason = `Name starts with "${q}"`;
        score = Math.max(score, 90);
      } else if (name.includes(searchTerm)) {
        matchReason = `Name contains "${q}"`;
        score = Math.max(score, 75);
      } else if (alias && alias.includes(searchTerm)) {
        matchReason = `Alias: "${entity.alias}"`;
        score = Math.max(score, 70);
      } else if (entity.city && entity.city.toLowerCase().includes(searchTerm)) {
        matchReason = `Location: ${entity.city}`;
        score = Math.max(score, 50);
      } else if (entity.occupation && entity.occupation.toLowerCase().includes(searchTerm)) {
        matchReason = `Occupation: ${entity.occupation}`;
        score = Math.max(score, 45);
      }
    } else if (entity.nodeType === 'Phone') {
      const num = (entity.number || '').toLowerCase();
      if (num === searchTerm) {
        matchReason = `Exact phone match`;
        score = Math.max(score, 95);
      } else if (num.includes(searchTerm)) {
        matchReason = `Phone number matches`;
        score = Math.max(score, 85);
      } else if (entity.operator && entity.operator.toLowerCase().includes(searchTerm)) {
        matchReason = `Operator: ${entity.operator}`;
        score = Math.max(score, 40);
      }
    } else if (entity.nodeType === 'Vehicle') {
      const plate = (entity.licensePlate || '').toLowerCase().replace(/[\s-]/g, '');
      const cleanQ = searchTerm.replace(/[\s-]/g, '');
      if (plate.includes(cleanQ)) {
        matchReason = `Plate matches "${entity.licensePlate}"`;
        score = Math.max(score, 90);
      } else if (entity.make && entity.make.toLowerCase().includes(searchTerm)) {
        matchReason = `Make: ${entity.make} ${entity.model || ''}`;
        score = Math.max(score, 60);
      }
    } else if (entity.nodeType === 'Organization') {
      const name = (entity.name || '').toLowerCase();
      if (name.includes(searchTerm)) {
        matchReason = `Org: ${entity.name}`;
        score = Math.max(score, 80);
      } else if (entity.city && entity.city.toLowerCase().includes(searchTerm)) {
        matchReason = `City: ${entity.city}`;
        score = Math.max(score, 50);
      }
    } else if (entity.nodeType === 'Account') {
      const acc = (entity.accountNumber || '').toLowerCase();
      if (acc.includes(searchTerm)) {
        matchReason = `Account number matches`;
        score = Math.max(score, 85);
      } else if (entity.bank && entity.bank.toLowerCase().includes(searchTerm)) {
        matchReason = `Bank: ${entity.bank}`;
        score = Math.max(score, 55);
      }
    } else if (entity.nodeType === 'Location') {
      const name = (entity.name || '').toLowerCase();
      if (name.includes(searchTerm)) {
        matchReason = `Location: ${entity.name}`;
        score = Math.max(score, 75);
      } else if (entity.city && entity.city.toLowerCase().includes(searchTerm)) {
        matchReason = `City: ${entity.city}`;
        score = Math.max(score, 60);
      }
    } else if (entity.nodeType === 'Case') {
      const fir = (entity.firNumber || entity.name || '').toLowerCase();
      if (fir.includes(searchTerm)) {
        matchReason = `FIR: ${entity.firNumber}`;
        score = Math.max(score, 85);
      } else if (entity.description && entity.description.toLowerCase().includes(searchTerm)) {
        matchReason = `Description matches`;
        score = Math.max(score, 50);
      }
    }

    if (score > 0) {
      matches.push({
        result: {
          id: entity.id,
          name: 'name' in entity ? entity.name : undefined,
          number: 'number' in entity ? entity.number : undefined,
          licensePlate: 'licensePlate' in entity ? entity.licensePlate : undefined,
          accountNumber: 'accountNumber' in entity ? entity.accountNumber : undefined,
          firNumber: 'firNumber' in entity ? entity.firNumber : undefined,
          nodeType: entity.nodeType,
          matchReason,
        },
        score,
      });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, limit).map(m => m.result);
}

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [flaggedOnly, setFlaggedOnly] = useState<boolean>(false);
  const [showFilterPopover, setShowFilterPopover] = useState<boolean>(false);
  const [caseNumber, setCaseNumber] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showFilterPopover) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterPopover]);

  const toggleType = (typeKey: string) => {
    let next: string[];
    if (typeKey === 'ALL') {
      next = [];
    } else {
      if (selectedTypes.includes(typeKey)) {
        next = selectedTypes.filter(t => t !== typeKey);
      } else {
        next = [...selectedTypes, typeKey];
      }
    }
    setSelectedTypes(next);
    if (query.trim()) {
      const matches = searchLocalEntities(query.trim(), next, flaggedOnly, 8);
      setResults(matches);
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  const toggleFlaggedOnly = (val: boolean) => {
    setFlaggedOnly(val);
    if (query.trim()) {
      const matches = searchLocalEntities(query.trim(), selectedTypes, val, 8);
      setResults(matches);
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  const resetFilters = () => {
    setSelectedTypes([]);
    setFlaggedOnly(false);
    if (query.trim()) {
      const matches = searchLocalEntities(query.trim(), [], false, 8);
      setResults(matches);
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  const handleSearch = (q: string) => {
    setQuery(q);
    setSelectedIndex(-1);
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setShowResults(false);
      return;
    }

    // Immediate local results for instant feedback with active filters
    const local = searchLocalEntities(trimmed, selectedTypes, flaggedOnly, 8);
    setResults(local);
    setShowResults(true);

    // Also attempt remote search if backend is available
    setSearching(true);
    const typeParam = selectedTypes.length === 1 ? `&type=${encodeURIComponent(selectedTypes[0])}` : '';
    api.get(`/api/entities/search?q=${encodeURIComponent(trimmed)}${typeParam}&limit=8`)
      .then(res => {
        if (res.data?.entities?.length) {
          const filtered = selectedTypes.length > 0
            ? res.data.entities.filter((e: any) => selectedTypes.includes(e.nodeType))
            : res.data.entities;
          if (filtered.length) {
            setResults(filtered);
          }
        }
      })
      .catch(() => {
        // Retain local results on API failure
      })
      .finally(() => {
        setSearching(false);
      });
  };

  const selectResult = (r: SearchResult) => {
    setShowResults(false);
    setQuery('');
    setSelectedIndex(-1);
    if (r.nodeType === 'Case') {
      navigate(`/investigations/${encodeURIComponent(r.id)}`);
    } else {
      navigate(`/entities/${encodeURIComponent(r.nodeType)}/${encodeURIComponent(r.id)}`);
    }
  };

  const handleNavigate = () => {
    if (selectedIndex >= 0 && selectedIndex < results.length) {
      selectResult(results[selectedIndex]);
    } else if (results.length > 0) {
      selectResult(results[0]);
    } else if (query.trim()) {
      navigate(`/entities?search=${encodeURIComponent(query.trim())}`);
      setShowResults(false);
      setSelectedIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!showResults && results.length > 0) {
        setShowResults(true);
      }
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleNavigate();
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setSelectedIndex(-1);
    }
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
        .catch(() => { });
    }

    return () => { mounted = false; };
  }, [entityType, entityId]);

  // Evidence context
  const evidenceMatch = location.pathname.match(/^\/evidence\/([^/]+)$/);
  const isEvidenceDetail = Boolean(evidenceMatch);
  const evidenceId = evidenceMatch
    ? decodeURIComponent(evidenceMatch[1])
    : null;
  const currentEvidenceTab = new URLSearchParams(location.search).get('tab') || 'details';
  const [evidenceMeta, setEvidenceMeta] = useState<{ type: string; title?: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    if (evidenceId) {
      api.get(`/api/evidence/${encodeURIComponent(evidenceId)}`)
        .then(res => {
          if (mounted && res.data) {
            const ev = res.data;
            const blockData = typeof ev.block_data === 'string' ? JSON.parse(ev.block_data) : ev.block_data;
            setEvidenceMeta({
              type: ev.evidence_type || 'document',
              title: blockData?.title || ev.evidence_id,
            });
          }
        })
        .catch(() => {
          if (mounted) setEvidenceMeta({ type: 'document', title: evidenceId });
        });
    } else {
      setEvidenceMeta(null);
    }
    return () => { mounted = false; };
  }, [evidenceId]);

  const isEvidenceContext = Boolean(isEvidenceDetail && evidenceId);
  const isEntityContext = Boolean(!isEvidenceContext && entityType && entityId && (isEntityDetail || !investigationId));
  const isInvestigationContext = Boolean(!isEvidenceContext && investigationId && !isEntityDetail);
  const entityListFilterType = location.pathname === '/entities' ? new URLSearchParams(location.search).get('type') : null;

  const entityTab = location.pathname === '/network'
    ? 'network graph'
    : location.pathname === '/timeline'
      ? 'timeline'
      : (new URLSearchParams(location.search).get('tab') || 'details');

  return (
    <header className="topbar">
      {/* Brand Logo */}
      <Link
        to="/dashboard"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          textDecoration: 'none',
          color: 'inherit',
          flexShrink: 0,
          cursor: 'pointer',
        }}
        title="CrimeGraph AI — Home"
      >
        <img
          src={logoImg}
          alt="CrimeGraph AI Logo"
          style={{ height: 30, width: 'auto', maxHeight: 32, objectFit: 'contain' }}
        />

      </Link>
      <div style={{ width: 2, height: 40, background: 'var(--border-primary)', flexShrink: 0, margin: '0 0px' }} />

      {/* User identity chip — display only, no interaction */}
      {user && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '4px 8px 4px 4px',
            background: 'rgba(255,255,255,0.04)',
            flexShrink: 0,
            cursor: 'default',
            userSelect: 'none',
          }}
          title={`${user.fullName} · ${user.department ?? user.role}`}
        >
          {/* Avatar circle — shows photo if set, else initials */}
          <div style={{
            width: 35,
            height: 35,
            borderRadius: '50%',
            background: user.photoUrl ? 'transparent' : 'linear-gradient(135deg, var(--color-accent), #6d28d9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
            letterSpacing: '0.02em',
            boxShadow: '0 0 0 2px rgba(124,58,237,0.25)',
            overflow: 'hidden',
          }}>
            {user.photoUrl
              ? <img src={user.photoUrl} alt={user.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : user.fullName.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()}
          </div>

          {/* Name + designation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, lineHeight: 1.2, minWidth: 0 }}>
            <span style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 160,
            }}>
              {user.fullName}
            </span>
            <span style={{
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 160,
              textTransform: 'capitalize',
            }}>
              {user.department ?? user.role.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      )}

      <div style={{ width: 2, height: 32, background: 'var(--border-primary)', flexShrink: 0, margin: '0 0px' }} />

      {/* Context Breadcrumbs if in detail view */}
      {isEvidenceContext && evidenceId ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <span
            onClick={() => navigate('/evidence')}
            style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', flexShrink: 0 }}
            title="Back to All Evidence"
          >
            Evidence
          </span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '1rem', flexShrink: 0 }}>&gt;</span>
          <span
            onClick={() => navigate('/evidence')}
            style={{
              color: '#059669',
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title="Evidence Ledger"
          >
            {evidenceMeta?.type?.replace(/_/g, ' ') || 'RECORD'}
          </span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '1rem', flexShrink: 0 }}>&gt;</span>
          <span
            onClick={() => navigate(`/evidence/${encodeURIComponent(evidenceId)}?tab=details`)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 700,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
            title={`View ${evidenceMeta?.title || evidenceId}`}
          >
            {evidenceMeta?.title && evidenceMeta.title !== evidenceId ? (
              <>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evidenceMeta.title}</span>
                <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, flexShrink: 0 }}>
                  ({evidenceId})
                </span>
              </>
            ) : (
              <span className="font-mono">{evidenceId}</span>
            )}
          </span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '1rem', flexShrink: 0 }}>&gt;</span>
          <span style={{ color: '#059669', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {currentEvidenceTab === 'settings' ? 'ACCESS & SETTINGS' : currentEvidenceTab.replace(/-/g, ' ')}
          </span>
        </div>
      ) : isEntityContext && entityType && entityId ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <span
            onClick={() => navigate('/entities')}
            style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', flexShrink: 0 }}
            title="Back to All Entities"
          >
            Entity
          </span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '1rem', flexShrink: 0 }}>&gt;</span>
          <span
            onClick={() => navigate('/entities')}
            style={{
              color: nodeColors[entityType] || '#2563eb',
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title={`View all ${entityType} entities`}
          >
            {entityType}
          </span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '1rem', flexShrink: 0 }}>&gt;</span>
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
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entityName}</span>
                <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, flexShrink: 0 }}>
                  ({entityId})
                </span>
              </>
            ) : (
              <span className="font-mono">{entityId}</span>
            )}
          </span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '1rem', flexShrink: 0 }}>&gt;</span>
          <span style={{ color: nodeColors[entityType] || '#2563eb', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {entityTab === 'settings' ? 'ACCESS & SETTINGS' : entityTab.replace(/-/g, ' ')}
          </span>
        </div>
      ) : isInvestigationContext && investigationId ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <span
            onClick={() => navigate('/investigations')}
            style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', flexShrink: 0 }}
            title="Back to All Investigations"
          >
            Investigation
          </span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '1rem', flexShrink: 0 }}>&gt;</span>
          <span
            onClick={() => navigate(`/investigations/${encodeURIComponent(investigationId)}`)}
            className="font-mono"
            style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase', cursor: 'pointer' }}
            title="View Investigation Overview"
          >
            {caseNumber || 'LOADING...'}
          </span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '1rem', flexShrink: 0 }}>&gt;</span>
          <span style={{ color: '#7c3aed', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {selectedOption === 'settings' ? 'ACCESS & SETTINGS' : selectedOption}
          </span>
        </div>
      ) : entityListFilterType ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <span
            onClick={() => navigate('/entities')}
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title="Back to All Entities"
          >
            Entities
          </span>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '1rem', flexShrink: 0 }}>&gt;</span>
          <span
            style={{
              color: nodeColors[entityListFilterType] || '#2563eb',
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {entityListFilterType}
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            {pageTitle}
          </span>
        </div>
      )}

      {/* Global Search — Always active, responsive and workable on all pages */}
      <div
        className="topbar-search"
        style={{
          position: 'relative',
          width: (isEvidenceContext && evidenceId) || (isEntityContext && entityType && entityId) || (isInvestigationContext && investigationId) ? 340 : 480,
          maxWidth: '100%',
          flexShrink: 0,
        }}
      >
        <div className="search-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={15} className="search-icon" style={{ position: 'absolute', left: 12, color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="form-input"
            placeholder={
              selectedTypes.length === 0
                ? 'Search persons, phones, vehicles, cases...'
                : selectedTypes.length === 1
                  ? `Search ${selectedTypes[0]}s...`
                  : `Search ${selectedTypes.join(', ')}...`
            }
            value={query}
            onChange={e => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.trim()) {
                const matches = searchLocalEntities(query.trim(), selectedTypes, flaggedOnly, 8);
                setResults(matches);
                setShowResults(true);
              }
            }}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            style={{ paddingLeft: 34, paddingRight: query ? 60 : 38, width: '100%', height: 36, fontSize: '0.82rem' }}
          />
          {searching && (
            <div style={{ position: 'absolute', right: query ? 62 : 40 }}>
              <div className="loading-spinner" style={{ width: 14, height: 14 }} />
            </div>
          )}
          <div style={{ position: 'absolute', right: 6, display: 'flex', alignItems: 'center', gap: 2 }}>
            {query && (
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  setQuery('');
                  setResults([]);
                  setShowResults(false);
                  setSelectedIndex(-1);
                }}
                style={{
                  background: 'none', border: 'none',
                  cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center',
                  color: 'var(--text-muted)',
                }}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
            <div ref={filterRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setShowFilterPopover(prev => !prev)}
                style={{
                  background: showFilterPopover || selectedTypes.length > 0 || flaggedOnly ? 'rgba(37, 99, 235, 0.1)' : 'none',
                  border: showFilterPopover || selectedTypes.length > 0 || flaggedOnly ? '1px solid #bfdbfe' : '1px solid transparent',
                  borderRadius: 6,
                  cursor: 'pointer',
                  padding: '4px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: selectedTypes.length > 0 || flaggedOnly ? '#2563eb' : '#64748b',
                  transition: 'all 150ms ease',
                }}
                title="Filter search (Sliders)"
              >
                <Sliders size={14} />
              </button>

              {/* Filter popover */}
              {showFilterPopover && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 310,
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
                    zIndex: 10000,
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sliders size={13} style={{ color: '#2563eb' }} />
                      Filter Search
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {(selectedTypes.length > 0 || flaggedOnly) && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          style={{
                            background: 'none', border: 'none', fontSize: '0.7rem',
                            color: '#2563eb', fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          Reset
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowFilterPopover(false)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#94a3b8', padding: 2, display: 'flex', alignItems: 'center',
                        }}
                        title="Close filters"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Entity Type (Multi-select)
                    </div>
                    {selectedTypes.length > 0 && (
                      <div style={{ fontSize: '0.68rem', color: '#2563eb', fontWeight: 600 }}>
                        {selectedTypes.length} selected
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                    {[
                      { key: 'ALL', label: 'All', color: '#64748b' },
                      { key: 'Person', label: 'Person', color: '#3b82f6' },
                      { key: 'Phone', label: 'Phone', color: '#22c55e' },
                      { key: 'Vehicle', label: 'Vehicle', color: '#f97316' },
                      { key: 'Organization', label: 'Org', color: '#8b5cf6' },
                      { key: 'Account', label: 'Account', color: '#eab308' },
                      { key: 'Location', label: 'Location', color: '#ef4444' },
                      { key: 'Case', label: 'Case / FIR', color: '#06b6d4' },
                    ].map(t => {
                      const active = t.key === 'ALL' ? selectedTypes.length === 0 : selectedTypes.includes(t.key);
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => toggleType(t.key)}
                          style={{
                            padding: '4px 9px',
                            borderRadius: 6,
                            fontSize: '0.72rem',
                            fontWeight: active ? 700 : 500,
                            border: active ? `1px solid ${t.color}` : '1px solid #e2e8f0',
                            background: active ? `${t.color}18` : '#f8fafc',
                            color: active ? t.color : '#475569',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            transition: 'all 120ms ease',
                          }}
                        >
                          {t.key !== 'ALL' && (
                            <span style={{
                              width: 12,
                              height: 12,
                              borderRadius: 3,
                              border: active ? `1.5px solid ${t.color}` : '1px solid #cbd5e1',
                              background: active ? t.color : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '9px',
                              color: '#ffffff',
                              fontWeight: 800,
                              lineHeight: 1,
                              flexShrink: 0
                            }}>
                              {active ? '✓' : ''}
                            </span>
                          )}
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10, marginTop: 4 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, color: '#334155' }}>
                      <input
                        type="checkbox"
                        checked={flaggedOnly}
                        onChange={e => toggleFlaggedOnly(e.target.checked)}
                        style={{ accentColor: '#dc2626', cursor: 'pointer' }}
                      />
                      <span>Flagged / High Risk Only</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {showResults && results.length > 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: '#ffffff', border: '1px solid var(--border-accent, #cbd5e1)',
            borderRadius: 'var(--radius-lg, 10px)', boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
            zIndex: 9999, overflow: 'hidden', maxHeight: 380, overflowY: 'auto',
          }}>
            <div style={{ padding: '6px 12px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border-secondary, #f1f5f9)', background: '#f8fafc' }}>
              Matching Entities ({results.length})
            </div>
            {results.map((r, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={`${r.nodeType}-${r.id}`}
                  onMouseDown={e => {
                    e.preventDefault();
                    selectResult(r);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', cursor: 'pointer',
                    borderBottom: '1px solid var(--border-secondary, #f1f5f9)',
                    background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    transition: 'background 120ms ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent')}
                >
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: nodeColors[r.nodeType] || '#64748b',
                    boxShadow: `0 0 6px ${nodeColors[r.nodeType] || '#64748b'}88`,
                  }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getEntityLabel(r)}</span>
                      <span style={{
                        fontSize: '0.65rem', padding: '1px 6px', borderRadius: 4,
                        background: `${nodeColors[r.nodeType] || '#64748b'}18`,
                        color: nodeColors[r.nodeType] || '#64748b',
                        fontWeight: 700, textTransform: 'uppercase', flexShrink: 0,
                      }}>
                        {r.nodeType}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {r.matchReason}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showResults && results.length === 0 && query.trim() && !searching && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: '#ffffff', border: '1px solid var(--border-primary, #e2e8f0)',
            borderRadius: 'var(--radius-lg, 10px)', padding: '14px 16px',
            color: 'var(--text-muted)', fontSize: '0.85rem', zIndex: 9999,
            boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No entities found for "{query}"</div>
            <div style={{ fontSize: '0.75rem', marginTop: 4, color: 'var(--text-muted)' }}>
              Try searching by Name (e.g. "Arjun"), Phone ("9876"), Vehicle ("MH02"), Case ("FIR"), or ID ("P001").
            </div>
          </div>
        )}
      </div>

      <div className="topbar-right">
        {/* Classification marker */}

        <button
          className="btn btn-ghost"
          onClick={() => navigate('/alerts')}
          style={{ padding: '6px 8px', position: 'relative' }}
        >
          <Bell size={17} />
          <span style={{
            position: 'absolute', top: 2, right: 2, width: 8, height: 8,
            background: 'var(--color-critical)', borderRadius: '50%', border: '2px solid white',
          }} />
        </button>

        <div style={{ width: 1, height: 24, background: 'var(--border-primary)' }} />

        <button className="btn btn-ghost btn-sm" onClick={logout} title="Logout">
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
