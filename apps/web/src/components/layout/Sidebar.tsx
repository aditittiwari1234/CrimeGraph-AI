import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, Network, Users, FileText,
  Bell, Clock, Bot, Shield, BookOpen, Activity, Database, Server,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { canManageDatabases, canViewAuditLogs, isInspectorRole } from '../../lib/permissions';

const navItems = [
  { path: '/dashboard',      label: 'Dashboard',         icon: LayoutDashboard, section: 'main' },
  { path: '/inspector',      label: 'Inspector Home',    icon: Users,           section: 'main', inspectorOnly: true },
  { path: '/investigations', label: 'Investigations',     icon: FolderOpen,      section: 'main' },
  { path: '/network',        label: 'Network Graph',      icon: Network,         section: 'analysis' },
  { path: '/database',       label: 'Database Explorer',  icon: Database,        section: 'analysis' },
  { path: '/entities',       label: 'Entities',           icon: Users,           section: 'analysis' },
  { path: '/timeline',       label: 'Timeline',           icon: Clock,           section: 'analysis' },
  { path: '/alerts',         label: 'Alerts',             icon: Bell,            section: 'intel' },
  { path: '/documents',      label: 'Documents',          icon: FileText,        section: 'intel', hideForAdmin: true },
  { path: '/data-sources',   label: 'Data Sources',       icon: Server,          section: 'tools' },
  { path: '/ai-assistant',   label: 'AI Assistant',       icon: Bot,             section: 'tools' },
  { path: '/evidence',       label: 'Evidence',           icon: Shield,          section: 'tools' },
  { path: '/audit',          label: 'Audit Logs',         icon: BookOpen,        section: 'tools', adminOnly: true },
];

const sections = [
  { key: 'main',     label: 'Investigation' },
  { key: 'analysis', label: 'Analysis' },
  { key: 'intel',    label: 'Intelligence' },
  { key: 'tools',    label: 'Tools' },
];


export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const investigationMatch = location.pathname.match(/^\/investigations\/([^/]+)$/);
  const isInvestigationDetail = Boolean(investigationMatch);
  const investigationId = investigationMatch
    ? decodeURIComponent(investigationMatch[1])
    : ['/network', '/documents', '/evidence', '/timeline', '/data-sources', '/ai-assistant'].includes(location.pathname)
      ? new URLSearchParams(location.search).get('investigation')
      : null;
  const currentInvestigationTab = new URLSearchParams(location.search).get('tab') || 'overview';

  const investigationItems = investigationId ? [
    { path: `/investigations/${encodeURIComponent(investigationId)}?tab=overview`, label: 'Overview', icon: FolderOpen },
    { path: `/investigations/${encodeURIComponent(investigationId)}?tab=entities`, label: 'Entities', icon: Users },
    { path: `/investigations/${encodeURIComponent(investigationId)}?tab=sources`, label: 'Sources', icon: FileText },
    { path: `/investigations/${encodeURIComponent(investigationId)}?tab=evidence`, label: 'Evidence', icon: Shield },
    { path: `/investigations/${encodeURIComponent(investigationId)}?tab=notes`, label: 'Notes', icon: FileText },
    { path: `/investigations/${encodeURIComponent(investigationId)}?tab=timeline`, label: 'Timeline', icon: Clock },
    { path: `/network?investigation=${encodeURIComponent(investigationId)}`, label: 'Network Graph', icon: Network },
    { path: `/ai-assistant?investigation=${encodeURIComponent(investigationId)}`, label: 'AI Assistant', icon: Bot },
  ] : [];

  const grouped = sections.map(s => ({
    ...s,
    items: navItems.filter(i =>
      i.section === s.key &&
      (!i.adminOnly || canViewAuditLogs(user?.role)) &&
      (!i.hideForAdmin || user?.role !== 'administrator') &&
      (!i.inspectorOnly || isInspectorRole(user?.role)) &&
      (i.path !== '/database' && i.path !== '/data-sources' || canManageDatabases(user?.role))
    ),
  }));

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0,
      width: 'var(--sidebar-width)', height: '100vh',
      background: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex', flexDirection: 'column',
      zIndex: 100, overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: '0 20px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', gap: 10,
        minHeight: 'var(--topbar-height)',
      }}>
        <div style={{
          width: 30, height: 30, flexShrink: 0,
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
        }}>
          <Activity size={15} color="white" />
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
            CrimeGraph AI
          </div>
          <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
            NCRB · Intel Platform
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        {investigationId && (
          <div style={{ marginBottom: 10, paddingBottom: 8 }}>
            <div style={{ padding: '10px 10px 4px', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7c3aed' }}>
              Current Investigation
            </div>
            <div style={{ padding: '4px 10px 8px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {investigationId}
            </div>
            <NavLink
              to="/investigations"
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 500, textDecoration: 'none', marginBottom: 2, color: '#475569' }}
            >
              <FolderOpen size={15} style={{ color: '#94a3b8' }} />
              <span>All Investigations</span>
            </NavLink>
            {investigationItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => {
                  const itemTab = new URL(item.path, window.location.origin).searchParams.get('tab');
                  const itemIsActive = itemTab ? isInvestigationDetail && currentInvestigationTab === itemTab : isActive;
                  return {
                    display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8,
                    fontSize: '0.82rem', fontWeight: 500, textDecoration: 'none', marginBottom: 2,
                    color: itemIsActive ? '#7c3aed' : '#475569', background: itemIsActive ? '#f5f3ff' : 'transparent',
                    border: itemIsActive ? '1px solid #ddd6fe' : '1px solid transparent',
                  };
                }}
              >
                {({ isActive }) => {
                  const itemTab = new URL(item.path, window.location.origin).searchParams.get('tab');
                  const itemIsActive = itemTab ? isInvestigationDetail && currentInvestigationTab === itemTab : isActive;
                  return <><item.icon size={15} style={{ color: itemIsActive ? '#7c3aed' : '#94a3b8' }} /><span>{item.label}</span></>;
                }}
              </NavLink>
            ))}
          </div>
        )}
        {!investigationId && grouped.map(section => (
          <div key={section.key} style={{ marginBottom: 4 }}>
            <div style={{
              padding: '10px 10px 4px',
              fontSize: '0.62rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              color: '#94a3b8',
            }}>
              {section.label}
            </div>
            {section.items.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '8px 10px', borderRadius: 8,
                  fontSize: '0.85rem', fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all 150ms ease',
                  marginBottom: 2,
                  color: isActive ? '#2563eb' : '#475569',
                  background: isActive ? '#eff6ff' : 'transparent',
                  border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
                })}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={15} style={{ color: isActive ? '#2563eb' : '#94a3b8', flexShrink: 0 }} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

    </nav>
  );
}
