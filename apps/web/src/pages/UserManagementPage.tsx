import { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Pencil, Trash2, Camera, X, Save, Search, UserCheck, Users,
  Shield, CheckCircle2, RefreshCw, Eye, EyeOff, AlertCircle,
  Copy, Check, FileText, Mail, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth, type User } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ImageCropModal from '../components/profile/ImageCropModal';
import TableContextMenu, { type ContextMenuItem } from '../components/common/TableContextMenu';

const ROLES = [
  { value: 'administrator', label: 'Administrator' },
  { value: 'senior_investigator', label: 'Senior Investigator' },
  { value: 'investigator', label: 'Investigator' },
  { value: 'analyst', label: 'Analyst' },
];

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  administrator: { bg: 'rgba(220,38,38,0.1)', text: '#dc2626' },
  senior_investigator: { bg: 'rgba(124,58,237,0.1)', text: '#7c3aed' },
  investigator: { bg: 'rgba(37,99,235,0.1)', text: '#2563eb' },
  analyst: { bg: 'rgba(5,150,105,0.1)', text: '#059669' },
};

const DEPARTMENTS = [
  'NCRB — Master Operations',
  'Cyber Crime Wing',
  'Financial Crimes & Hawala',
  'Intelligence Analysis',
  'Homicide Unit',
  'Narcotics Bureau',
  'Counter Terrorism',
  'Special Branch',
  'Crime Branch CID'
];

const USER_COLUMNS = [
  { key: 'id', type: 'varchar(64)', sortable: true },
  { key: 'username', type: 'varchar(100)', sortable: true },
  { key: 'full_name', type: 'varchar(255)', sortable: true },
  { key: 'role', type: 'varchar(50)', sortable: true },
  { key: 'department', type: 'varchar(255)', sortable: true },
  { key: 'badge_number', type: 'varchar(50)', sortable: true },
  { key: 'email', type: 'varchar(255)', sortable: true },
  { key: 'is_active', type: 'boolean', sortable: true },
  { key: 'last_login', type: 'timestamptz', sortable: true },
  { key: 'created_at', type: 'timestamptz', sortable: true },
  { key: 'updated_at', type: 'timestamptz', sortable: true },
  { key: 'audit_logs', type: 'int', sortable: true },
  { key: 'actions', type: 'actions', sortable: false },
];

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
  };
  if (overrides[key]) return overrides[key];
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function formatTimestamp(val: any): string {
  if (!val) return 'NULL';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toISOString().replace('T', ' ').slice(0, 19);
  } catch {
    return String(val);
  }
}

interface UserFormState {
  fullName: string;
  username: string;
  email: string;
  role: string;
  department: string;
  badgeNumber: string;
  password?: string;
  photoUrl?: string;
}

const emptyForm = (): UserFormState => ({
  fullName: '', username: '', email: '',
  role: 'investigator', department: '', badgeNumber: '', password: '',
});

function Avatar({ user, size = 32 }: { user: Partial<User>; size?: number }) {
  const rc = ROLE_COLORS[user.role ?? ''] ?? { bg: 'rgba(100,100,100,0.2)', text: '#64748b' };
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
      background: user.photoUrl ? 'transparent' : `linear-gradient(135deg, ${rc.text}cc, ${rc.text}66)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: '#fff',
      border: `2px solid ${rc.text}40`,
    }}>
      {user.photoUrl
        ? <img src={user.photoUrl} alt={user.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials(user.fullName ?? '?')}
    </div>
  );
}

interface UserFormModalProps {
  initial?: UserFormState & { id?: string };
  onSave: (data: UserFormState & { id?: string }) => Promise<void>;
  onClose: () => void;
}

function UserFormModal({ initial, onSave, onClose }: UserFormModalProps) {
  const [form, setForm] = useState<UserFormState>(initial ?? emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(initial?.id);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = ev => setCropSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = (cropped: string) => {
    setForm(f => ({ ...f, photoUrl: cropped }));
    setCropSrc(null);
  };

  const handleSubmit = async () => {
    if (!form.fullName.trim() || !form.username.trim()) {
      setFormError('Full Name and Username are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await onSave({ ...form, id: initial?.id });
    } catch (err: any) {
      setFormError(err.message || 'Failed to save user in database.');
      setSaving(false);
    }
  };

  const rc = ROLE_COLORS[form.role] ?? { bg: 'rgba(100,100,100,0.1)', text: '#64748b' };

  return createPortal(
    <>
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          onConfirm={handleCropConfirm}
          onClose={() => setCropSrc(null)}
        />
      )}

      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 1101, width: 540, maxWidth: 'calc(100vw - 32px)',
        background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-primary, #e2e8f0)',
        borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: '1px solid var(--border-primary, #e2e8f0)',
          background: 'linear-gradient(135deg, rgba(37,99,235,0.06), transparent)',
        }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
              {isEdit ? 'Edit Database User' : 'Add New User to Database'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: 2 }}>
              {isEdit ? 'Update credentials and role stored in PostgreSQL' : 'Creates an active user account directly in PostgreSQL'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #64748b)', padding: 6, borderRadius: 8, display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
          {formError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 8,
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#dc2626', fontSize: '0.82rem', marginBottom: 16
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{formError}</span>
            </div>
          )}

          {/* Photo preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 68, height: 68, borderRadius: '50%', overflow: 'hidden',
                background: form.photoUrl ? 'transparent' : `linear-gradient(135deg, ${rc.text}cc, ${rc.text}66)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem', fontWeight: 700, color: '#fff',
                border: `3px solid ${rc.text}40`,
              }}>
                {form.photoUrl
                  ? <img src={form.photoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials(form.fullName || '?')}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  position: 'absolute', bottom: -2, right: -2,
                  width: 26, height: 26, borderRadius: '50%',
                  background: '#2563eb', border: '2px solid #fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#fff',
                }}
                title="Upload Photo"
              >
                <Camera size={12} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
                {form.fullName || 'New Officer'}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4,
                padding: '2px 8px', borderRadius: 12, background: rc.bg, color: rc.text,
                fontSize: '0.7rem', fontWeight: 700,
              }}>
                {ROLES.find(r => r.value === form.role)?.label ?? form.role}
              </div>
            </div>
          </div>

          {/* Fields grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                Full Name *
              </label>
              <input
                value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                placeholder="Inspector A.K. Singh"
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                  background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 7,
                  color: '#0f172a', fontSize: '0.85rem', outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                Username *
              </label>
              <input
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="singh_si"
                disabled={isEdit}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                  background: isEdit ? '#f1f5f9' : '#ffffff', border: '1px solid #cbd5e1', borderRadius: 7,
                  color: '#0f172a', fontSize: '0.85rem', outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                Email
              </label>
              <input
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="singh@ncrb.gov.in"
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                  background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 7,
                  color: '#0f172a', fontSize: '0.85rem', outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                Badge Number
              </label>
              <input
                value={form.badgeNumber}
                onChange={e => setForm(f => ({ ...f, badgeNumber: e.target.value }))}
                placeholder="SI-2024-001"
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                  background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 7,
                  color: '#0f172a', fontSize: '0.85rem', outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Password field */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
              {isEdit ? 'Change Password (leave empty to keep current)' : 'Password * (default: Demo@1234)'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password || ''}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder={isEdit ? 'Enter new password…' : 'Demo@1234'}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '8px 36px 8px 10px',
                  background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 7,
                  color: '#0f172a', fontSize: '0.85rem', outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4
                }}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
              Role
            </label>
            <select
              className="form-select"
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1px solid #cbd5e1', borderRadius: 7,
                color: '#0f172a', fontSize: '0.85rem',
              }}
            >
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {/* Department */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
              Department
            </label>
            <select
              className="form-select"
              value={form.department}
              onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1px solid #cbd5e1', borderRadius: 7,
                color: '#0f172a', fontSize: '0.85rem',
              }}
            >
              <option value="">Select department…</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '9px 18px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
                background: 'transparent', border: '1px solid #cbd5e1', color: '#64748b', cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !form.fullName.trim() || !form.username.trim()}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 22px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700,
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#fff', border: 'none', cursor: saving ? 'wait' : 'pointer',
                opacity: (!form.fullName.trim() || !form.username.trim() || saving) ? 0.6 : 1,
                boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
              }}
            >
              <Save size={14} />
              {saving ? 'Saving to Database…' : isEdit ? 'Update in Database' : 'Save to Database'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

export default function UserManagementPage() {
  const { user: currentUser, managedUsers, addManagedUser, updateManagedUser, deleteManagedUser, refreshManagedUsers } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<(UserFormState & { id: string }) | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [syncNotice, setSyncNotice] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Table Sorting and Pagination (Audit Logs style)
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Right-click context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    targetUser: User;
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
    targetUser: User,
    colKey: string,
    colValue: any
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetUser,
      colKey,
      colValue,
    });
  };

  const openEdit = (u: User) => {
    setEditTarget({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      email: u.email || '',
      role: u.role,
      department: u.department ?? '',
      badgeNumber: u.badgeNumber ?? '',
      photoUrl: u.photoUrl,
    });
  };

  const contextMenuItems = useMemo<ContextMenuItem[]>(() => {
    if (!contextMenu) return [];
    const { targetUser, colKey, colValue } = contextMenu;
    const items: ContextMenuItem[] = [];

    items.push({
      label: 'Edit User Profile',
      sublabel: `Edit ${targetUser.fullName}`,
      icon: Pencil,
      iconColor: '#2563eb',
      onClick: () => openEdit(targetUser),
    });

    items.push({
      label: `Audit Logs for @${targetUser.username}`,
      sublabel: 'View cryptographic actions trail',
      icon: FileText,
      iconColor: '#7c3aed',
      onClick: () => navigate(`/audit?user=${encodeURIComponent(targetUser.username)}`),
      dividerAfter: true,
    });

    if (colValue !== undefined && colValue !== null && String(colValue).trim() !== '') {
      const displayVal = String(colValue);
      const truncated = displayVal.length > 30 ? displayVal.slice(0, 30) + '...' : displayVal;
      items.push({
        label: `Copy Cell Value (${formatHeader(colKey)})`,
        sublabel: `"${truncated}"`,
        icon: Copy,
        iconColor: '#059669',
        onClick: () => {
          navigator.clipboard.writeText(displayVal);
          showToast(`Copied ${formatHeader(colKey)}: "${truncated}" to clipboard!`);
        },
      });
    }

    if (colKey !== 'username') {
      items.push({
        label: 'Copy Username',
        sublabel: `@${targetUser.username}`,
        icon: Copy,
        onClick: () => {
          navigator.clipboard.writeText(targetUser.username);
          showToast(`Copied @${targetUser.username} to clipboard!`);
        },
        dividerAfter: colKey === 'email' || (!targetUser.email && targetUser.id !== currentUser?.id),
      });
    }

    if (targetUser.email && colKey !== 'email') {
      items.push({
        label: 'Copy Email Address',
        sublabel: targetUser.email,
        icon: Mail,
        onClick: () => {
          navigator.clipboard.writeText(targetUser.email);
          showToast('Copied email address to clipboard!');
        },
        dividerAfter: targetUser.id !== currentUser?.id,
      });
    }

    if (targetUser.id !== currentUser?.id) {
      items.push({
        label: 'Delete User Account',
        sublabel: `Remove @${targetUser.username}`,
        icon: Trash2,
        danger: true,
        onClick: () => setDeleteConfirm(targetUser.id),
      });
    }

    return items;
  }, [contextMenu, currentUser?.id, navigate]);

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

  // Admin guard
  if (currentUser?.role !== 'administrator') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <Shield size={40} style={{ color: '#dc2626' }} />
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>Access Denied</div>
        <div style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.85rem' }}>This page is restricted to administrators.</div>
        <button onClick={() => navigate('/dashboard')} style={{ marginTop: 8, padding: '8px 20px', borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const result = await refreshManagedUsers();
    setIsRefreshing(false);
    if (result.success) {
      setSyncNotice(`Users successfully synced with PostgreSQL database (${result.count} accounts active)`);
    } else {
      setSyncNotice(`⚠️ Sync failed: ${result.error || 'Database connection error'}`);
    }
    setTimeout(() => setSyncNotice(''), 5000);
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

  const filtered = useMemo(() => {
    let result = managedUsers.filter(u => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        u.fullName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.department ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q);
      const matchRole = !roleFilter || u.role === roleFilter;
      return matchSearch && matchRole;
    });

    if (sortField) {
      result = [...result].sort((a, b) => {
        let va = (a as any)[sortField];
        let vb = (b as any)[sortField];
        if (sortField === 'full_name') { va = a.fullName; vb = b.fullName; }
        if (sortField === 'badge_number') { va = a.badgeNumber; vb = b.badgeNumber; }
        if (sortField === 'is_active') { va = a.isActive !== false; vb = b.isActive !== false; }
        if (sortField === 'last_login') { va = a.lastLogin; vb = b.lastLogin; }
        if (sortField === 'created_at') { va = (a as any).createdAt; vb = (b as any).createdAt; }
        if (sortField === 'updated_at') { va = (a as any).updatedAt; vb = (b as any).updatedAt; }
        if (sortField === 'audit_logs') { va = a.auditLogsCount ?? 0; vb = b.auditLogsCount ?? 0; }

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
  }, [managedUsers, search, roleFilter, sortField, sortOrder]);

  const paginated = useMemo(() => {
    if (pageSize === -1) return filtered;
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(filtered.length / pageSize));

  // Reset page when filters or pageSize change
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, pageSize]);

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

  const stats = {
    total: managedUsers.length,
    admins: managedUsers.filter(u => u.role === 'administrator').length,
    investigators: managedUsers.filter(u => u.role === 'investigator' || u.role === 'senior_investigator').length,
    analysts: managedUsers.filter(u => u.role === 'analyst').length,
  };

  const handleAdd = async (data: UserFormState & { id?: string }) => {
    const newUser: User & { password?: string } = {
      id: `usr-${Date.now()}`,
      username: data.username,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      department: data.department || undefined,
      badgeNumber: data.badgeNumber || undefined,
      photoUrl: data.photoUrl || undefined,
      password: data.password || 'Demo@1234',
    };
    await addManagedUser(newUser);
    setShowModal(false);
    setSyncNotice(`User ${newUser.username} successfully added to database!`);
    setTimeout(() => setSyncNotice(''), 5000);
  };

  const handleEdit = async (data: UserFormState & { id?: string }) => {
    if (!data.id) return;
    await updateManagedUser(data.id, {
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      department: data.department || undefined,
      badgeNumber: data.badgeNumber || undefined,
      photoUrl: data.photoUrl || undefined,
      password: data.password || undefined,
    });
    setEditTarget(null);
    setSyncNotice(`User ${data.username} updated in database!`);
    setTimeout(() => setSyncNotice(''), 5000);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteManagedUser(id);
      setDeleteConfirm(null);
      setSyncNotice(`User successfully removed from database!`);
      setTimeout(() => setSyncNotice(''), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="fade-in">
      {/* Page header with inline stats cards */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}>
                User Management
              </h1>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: 12,
                background: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0',
                fontWeight: 500,
                whiteSpace: 'nowrap'
              }}>
                <CheckCircle2 size={12} />
                PostgreSQL Connected
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              System accounts with role governance
            </p>
          </div>

          {/* Inline Stats Cards next to the heading */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'All Users', value: stats.total, icon: Users, color: '#2563eb', role: '' },
              { label: 'Admins', value: stats.admins, icon: Shield, color: '#dc2626', role: 'administrator' },
              { label: 'Investigators', value: stats.investigators, icon: UserCheck, color: '#7c3aed', role: 'investigator' },
              { label: 'Analysts', value: stats.analysts, icon: Users, color: '#059669', role: 'analyst' },
            ].map(({ label, value, icon: Icon, color, role }) => {
              const isSelected = roleFilter === role || (role === '' && !roleFilter);
              return (
                <div
                  key={label}
                  onClick={() => {
                    setRoleFilter(roleFilter === role && role !== '' ? '' : role);
                    setPage(1);
                  }}
                  title={role ? `Click to filter by ${label}` : 'Click to show all users'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '5px 12px',
                    borderRadius: 8,
                    background: isSelected && role ? `${color}10` : '#ffffff',
                    border: isSelected && role ? `1.5px solid ${color}` : '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: `${color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon size={12} style={{ color }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color, lineHeight: 1 }}>
                      {value}
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 35 }}
            title="Refresh list from database"
          >
            <RefreshCw size={13} className={isRefreshing ? 'spin' : ''} />
            <span>Sync Database</span>
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 35 }}
          >
            <Plus size={14} />
            Add User
          </button>
        </div>
      </div>

      {syncNotice && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 16px', borderRadius: 8,
          background: syncNotice.startsWith('⚠️') ? '#fef2f2' : '#eff6ff',
          border: syncNotice.startsWith('⚠️') ? '1px solid #fecaca' : '1px solid #bfdbfe',
          color: syncNotice.startsWith('⚠️') ? '#b91c1c' : '#1d4ed8',
          fontSize: '0.85rem', fontWeight: 500, marginBottom: 18
        }}>
          {syncNotice.startsWith('⚠️') ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Filter, search bar and pagination above the table */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="search-input-wrapper" style={{ width: 280, maxWidth: '100%', flexShrink: 0 }}>
          <Search size={15} className="search-icon" />
          <input
            className="form-input"
            placeholder="Search users by name, username, email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select
          className="form-select"
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          style={{
            width: 175,
            flexShrink: 0,
            fontSize: '0.82rem',
            height: 34,
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            boxSizing: 'border-box'
          }}
        >
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>

        {roleFilter && (
          <button className="btn btn-secondary btn-sm" onClick={() => setRoleFilter('')}>
            Clear Role ✕
          </button>
        )}

        {/* Row Counts, Page Size & Pagination Controls above table */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.8rem', color: '#64748b', flexWrap: 'wrap' }}>
          <span>
            {filtered.length > 0
              ? `${pageSize === -1 ? 1 : ((page - 1) * pageSize) + 1}–${pageSize === -1 ? filtered.length : Math.min(page * pageSize, filtered.length)} of ${filtered.length} rows`
              : '0 rows'}
            {filtered.length !== managedUsers.length && ` (from ${managedUsers.length})`}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#94a3b8' }}>Per page:</span>
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
              <option value={-1}>All ({managedUsers.length})</option>
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

      {/* Full-width Data Table (edge-to-edge, zero left/right padding, 10px bottom padding) */}
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
                {USER_COLUMNS.map(col => (
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
              {paginated.map(u => {
                const rc = ROLE_COLORS[u.role] ?? { bg: 'rgba(100,100,100,0.1)', text: '#64748b' };
                return (
                  <tr
                    key={u.id}
                    onContextMenu={ev => handleCellContextMenu(ev, u, 'id', u.id)}
                    style={{
                      background: contextMenu?.targetUser?.id === u.id ? '#eff6ff' : undefined,
                    }}
                  >
                    {/* id */}
                    <td
                      onContextMenu={ev => handleCellContextMenu(ev, u, 'id', u.id)}
                      style={{ color: '#2563eb', fontWeight: 600, borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 120 }}>
                        {u.id}
                      </span>
                    </td>

                    {/* username */}
                    <td
                      onContextMenu={ev => handleCellContextMenu(ev, u, 'username', `@${u.username}`)}
                      style={{ fontWeight: 600, color: '#0f172a', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}
                    >
                      @{u.username}
                    </td>

                    {/* full_name with avatar */}
                    <td
                      onContextMenu={ev => handleCellContextMenu(ev, u, 'full_name', u.fullName)}
                      style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar user={u} size={26} />
                        <span style={{ fontWeight: 500, color: '#0f172a', whiteSpace: 'nowrap' }}>{u.fullName}</span>
                        {u.id === currentUser?.id && (
                          <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: '#eff6ff', color: '#2563eb', verticalAlign: 'middle' }}>
                            You
                          </span>
                        )}
                      </div>
                    </td>

                    {/* role */}
                    <td
                      onContextMenu={ev => handleCellContextMenu(ev, u, 'role', ROLES.find(r => r.value === u.role)?.label ?? u.role)}
                      style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}
                    >
                      <span style={{ padding: '2px 8px', borderRadius: 12, background: rc.bg, color: rc.text, fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {ROLES.find(r => r.value === u.role)?.label ?? u.role}
                      </span>
                    </td>

                    {/* department */}
                    <td
                      onContextMenu={ev => handleCellContextMenu(ev, u, 'department', u.department ?? '')}
                      style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}
                    >
                      <span title={u.department} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 220 }}>
                        {u.department ?? <span className="cell-null">NULL</span>}
                      </span>
                    </td>

                    {/* badge_number */}
                    <td
                      onContextMenu={ev => handleCellContextMenu(ev, u, 'badge_number', u.badgeNumber ?? '')}
                      style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}
                    >
                      {u.badgeNumber ?? <span className="cell-null">NULL</span>}
                    </td>

                    {/* email */}
                    <td
                      onContextMenu={ev => handleCellContextMenu(ev, u, 'email', u.email ?? '')}
                      style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}
                    >
                      <span title={u.email} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 200 }}>
                        {u.email}
                      </span>
                    </td>

                    {/* is_active */}
                    <td
                      onContextMenu={ev => handleCellContextMenu(ev, u, 'is_active', u.isActive !== false ? 'Active' : 'Inactive')}
                      style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}
                    >
                      <span style={{ color: u.isActive !== false ? '#16a34a' : '#dc2626', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: u.isActive !== false ? '#16a34a' : '#dc2626' }}></span>
                        {u.isActive !== false ? 'true' : 'false'}
                      </span>
                    </td>

                    {/* last_login */}
                    <td
                      onContextMenu={ev => handleCellContextMenu(ev, u, 'last_login', formatTimestamp(u.lastLogin))}
                      style={{ color: '#64748b', fontSize: '0.78rem', whiteSpace: 'nowrap', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}
                    >
                      {formatTimestamp(u.lastLogin)}
                    </td>

                    {/* created_at */}
                    <td
                      onContextMenu={ev => handleCellContextMenu(ev, u, 'created_at', formatTimestamp((u as any).createdAt))}
                      style={{ color: '#64748b', fontSize: '0.78rem', whiteSpace: 'nowrap', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}
                    >
                      {formatTimestamp((u as any).createdAt)}
                    </td>

                    {/* updated_at */}
                    <td
                      onContextMenu={ev => handleCellContextMenu(ev, u, 'updated_at', formatTimestamp((u as any).updatedAt))}
                      style={{ color: '#64748b', fontSize: '0.78rem', whiteSpace: 'nowrap', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}
                    >
                      {formatTimestamp((u as any).updatedAt)}
                    </td>

                    {/* audit_logs */}
                    <td
                      onContextMenu={ev => handleCellContextMenu(ev, u, 'audit_logs', `${u.auditLogsCount ?? 0} logs`)}
                      style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', textAlign: 'center' }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/audit?user=${encodeURIComponent(u.username)}`);
                        }}
                        style={{
                          background: (u.auditLogsCount ?? 0) > 0 ? '#eff6ff' : '#f8fafc',
                          color: (u.auditLogsCount ?? 0) > 0 ? '#2563eb' : '#94a3b8',
                          border: `1px solid ${(u.auditLogsCount ?? 0) > 0 ? '#bfdbfe' : '#e2e8f0'}`,
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title={`View ${u.auditLogsCount ?? 0} audit log entries for @${u.username}`}
                      >
                        <span>{u.auditLogsCount ?? 0} logs</span>
                      </button>
                    </td>

                    {/* actions */}
                    <td style={{ borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button
                          onClick={() => openEdit(u)}
                          style={{
                            padding: '4px 8px', borderRadius: 5, background: '#eff6ff',
                            border: '1px solid #bfdbfe', color: '#2563eb', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 600
                          }}
                        >
                          <Pencil size={11} /> Edit
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => setDeleteConfirm(u.id)}
                            style={{
                              padding: '4px 8px', borderRadius: 5, background: '#fef2f2',
                              border: '1px solid #fecaca', color: '#dc2626', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 600
                            }}
                          >
                            <Trash2 size={11} /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={USER_COLUMNS.length} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
                    No users match the current search or filters.
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
          title={contextMenu.targetUser.fullName}
          subtitle={`@${contextMenu.targetUser.username} · ${contextMenu.targetUser.department || contextMenu.targetUser.role}`}
          badge={{
            label: contextMenu.targetUser.role.replace(/_/g, ' '),
            color: ROLE_COLORS[contextMenu.targetUser.role]?.text || '#2563eb',
            bg: ROLE_COLORS[contextMenu.targetUser.role]?.bg || '#eff6ff',
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

      {/* Add modal */}
      {showModal && (
        <UserFormModal
          onSave={handleAdd}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <UserFormModal
          initial={editTarget}
          onSave={handleEdit}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (() => {
        const target = managedUsers.find(u => u.id === deleteConfirm);
        return (
          <>
            <div onClick={() => setDeleteConfirm(null)} style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
            <div style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              zIndex: 1201, width: 380, background: '#ffffff',
              border: '1px solid #e2e8f0', borderRadius: 14,
              boxShadow: '0 24px 60px rgba(0,0,0,0.2)', padding: 28,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: '50%', background: '#fef2f2', margin: '0 auto 16px' }}>
                <Trash2 size={24} style={{ color: '#dc2626' }} />
              </div>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Delete User from Database?</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  <strong>{target?.fullName}</strong> will be permanently deleted from the PostgreSQL database.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '9px', borderRadius: 8, background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: '9px', borderRadius: 8, background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
                  Delete
                </button>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
