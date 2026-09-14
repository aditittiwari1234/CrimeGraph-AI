import { NavLink } from 'react-router-dom';
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

const roleColors: Record<string, string> = {
  administrator:      '#dc2626',
  senior_investigator:'#7c3aed',
  investigator:       '#2563eb',
  analyst:            '#0891b2',
};

export default function Sidebar() {
  const { user } = useAuth();

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
        {grouped.map(section => (
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

      {/* User footer */}
      <div style={{
        padding: '12px 14px',
        borderTop: '1px solid #f1f5f9',
        background: '#fafafa',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: roleColors[user?.role || ''] || '#2563eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700, color: 'white',
          }}>
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.fullName}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'capitalize' }}>
              {user?.role?.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
