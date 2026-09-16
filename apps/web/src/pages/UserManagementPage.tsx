import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Camera, X, Save, Search, UserCheck, Users, Shield, ChevronDown } from 'lucide-react';
import { useAuth, type User } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ImageCropModal from '../components/profile/ImageCropModal';

const ROLES = [
  { value: 'administrator', label: 'Administrator' },
  { value: 'senior_investigator', label: 'Senior Investigator' },
  { value: 'investigator', label: 'Investigator' },
  { value: 'analyst', label: 'Analyst' },
];

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  administrator:     { bg: 'rgba(220,38,38,0.1)',   text: '#dc2626' },
  senior_investigator:{ bg: 'rgba(124,58,237,0.1)', text: '#7c3aed' },
  investigator:      { bg: 'rgba(37,99,235,0.1)',   text: '#2563eb' },
  analyst:           { bg: 'rgba(5,150,105,0.1)',   text: '#059669' },
};

const DEPARTMENTS = [
  'NCRB', 'Cyber Crime Wing', 'Financial Crimes', 'Intelligence Analysis',
  'Homicide Unit', 'Narcotics Bureau', 'Counter Terrorism', 'Special Branch',
];

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

interface UserFormState {
  fullName: string;
  username: string;
  email: string;
  role: string;
  department: string;
  badgeNumber: string;
  photoUrl?: string;
}

const emptyForm = (): UserFormState => ({
  fullName: '', username: '', email: '',
  role: 'investigator', department: '', badgeNumber: '',
});

function Avatar({ user, size = 40 }: { user: Partial<User>; size?: number }) {
  const rc = ROLE_COLORS[user.role ?? ''] ?? { bg: 'rgba(100,100,100,0.2)', text: '#64748b' };
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
      background: user.photoUrl ? 'transparent' : `linear-gradient(135deg, ${rc.text}cc, ${rc.text}66)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.3, fontWeight: 700, color: '#fff',
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
  onSave: (data: UserFormState & { id?: string }) => void;
  onClose: () => void;
}

function UserFormModal({ initial, onSave, onClose }: UserFormModalProps) {
  const [form, setForm] = useState<UserFormState>(initial ?? emptyForm());
  const [saving, setSaving] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(initial?.id);

  // Step 1: read file → open crop modal
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-selected
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = ev => setCropSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Step 2: crop confirmed → apply to form
  const handleCropConfirm = (cropped: string) => {
    setForm(f => ({ ...f, photoUrl: cropped }));
    setCropSrc(null);
  };

  const handleSubmit = () => {
    if (!form.fullName.trim() || !form.username.trim()) return;
    setSaving(true);
    setTimeout(() => {
      onSave({ ...form, id: initial?.id });
      setSaving(false);
    }, 300);
  };

  const rc = ROLE_COLORS[form.role] ?? { bg: 'rgba(100,100,100,0.1)', text: '#64748b' };

  return (
    <>
      {/* Crop modal — appears before the form photo is set */}
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
        zIndex: 1101, width: 520, maxWidth: 'calc(100vw - 32px)',
        background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
        borderRadius: 16, boxShadow: '0 32px 80px rgba(0,0,0,0.5)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--border-primary)',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.07), transparent)',
        }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {isEdit ? 'Edit User' : 'Add New User'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {isEdit ? 'Update user information and permissions' : 'Create a new system user account'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, borderRadius: 8, display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Photo + initials preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', overflow: 'hidden',
                background: form.photoUrl ? 'transparent' : `linear-gradient(135deg, ${rc.text}cc, ${rc.text}66)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem', fontWeight: 700, color: '#fff',
                border: `3px solid ${rc.text}40`,
                boxShadow: `0 0 0 4px ${rc.text}18`,
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
                  background: 'var(--color-accent, #7c3aed)',
                  border: '2px solid var(--bg-card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#fff',
                }}
              >
                <Camera size={12} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                {form.fullName || 'New User'}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 10px', borderRadius: 20,
                background: rc.bg, color: rc.text,
                fontSize: '0.7rem', fontWeight: 700,
              }}>
                {ROLES.find(r => r.value === form.role)?.label ?? form.role}
              </div>
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    fontSize: '0.7rem', fontWeight: 600, padding: '3px 10px',
                    borderRadius: 20, background: 'rgba(124,58,237,0.1)',
                    border: '1px solid rgba(124,58,237,0.3)', color: 'var(--color-accent, #7c3aed)',
                    cursor: 'pointer',
                  }}
                >
                  {form.photoUrl ? 'Change photo' : 'Upload photo'}
                </button>
                {form.photoUrl && (
                  <button
                    onClick={() => setForm(f => ({ ...f, photoUrl: undefined }))}
                    style={{
                      fontSize: '0.7rem', fontWeight: 600, padding: '3px 10px',
                      borderRadius: 20, background: 'transparent',
                      border: '1px solid var(--border-primary)', color: 'var(--text-muted)',
                      cursor: 'pointer', marginLeft: 8,
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Fields grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            {[
              { key: 'fullName', label: 'Full Name *', placeholder: 'Inspector A.K. Singh' },
              { key: 'username', label: 'Username *', placeholder: 'singh_si' },
              { key: 'email', label: 'Email', placeholder: 'user@ncrb.gov.in' },
              { key: 'badgeNumber', label: 'Badge Number', placeholder: 'SI-2024-001' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                  {label}
                </label>
                <input
                  value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  disabled={isEdit && key === 'username'}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                    background: 'var(--bg-input, rgba(255,255,255,0.04))',
                    border: '1px solid var(--border-primary)', borderRadius: 7,
                    color: 'var(--text-primary)', fontSize: '0.83rem', outline: 'none',
                    opacity: (isEdit && key === 'username') ? 0.5 : 1,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Role */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
              Role
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '8px 32px 8px 10px',
                  background: 'var(--bg-input, rgba(255,255,255,0.04))',
                  border: '1px solid var(--border-primary)', borderRadius: 7,
                  color: 'var(--text-primary)', fontSize: '0.83rem', outline: 'none',
                  appearance: 'none',
                }}
              >
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Department */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
              Department
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '8px 32px 8px 10px',
                  background: 'var(--bg-input, rgba(255,255,255,0.04))',
                  border: '1px solid var(--border-primary)', borderRadius: 7,
                  color: 'var(--text-primary)', fontSize: '0.83rem', outline: 'none',
                  appearance: 'none',
                }}
              >
                <option value="">Select department…</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, background: 'transparent', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !form.fullName.trim() || !form.username.trim()}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 22px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700,
                background: 'linear-gradient(135deg, var(--color-accent, #7c3aed), #6d28d9)',
                color: '#fff', border: 'none', cursor: saving ? 'wait' : 'pointer',
                opacity: (!form.fullName.trim() || !form.username.trim()) ? 0.5 : 1,
                boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
              }}
            >
              <Save size={14} />
              {saving ? 'Saving…' : isEdit ? 'Update User' : 'Create User'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function UserManagementPage() {
  const { user: currentUser, managedUsers, addManagedUser, updateManagedUser, deleteManagedUser } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<(UserFormState & { id: string }) | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Admin guard
  if (currentUser?.role !== 'administrator') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <Shield size={40} style={{ color: '#dc2626' }} />
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Access Denied</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>This page is restricted to administrators.</div>
        <button onClick={() => navigate('/dashboard')} style={{ marginTop: 8, padding: '8px 20px', borderRadius: 8, background: 'var(--color-accent, #7c3aed)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  const filtered = managedUsers.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || (u.department ?? '').toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const stats = {
    total: managedUsers.length,
    admins: managedUsers.filter(u => u.role === 'administrator').length,
    investigators: managedUsers.filter(u => u.role === 'investigator' || u.role === 'senior_investigator').length,
    analysts: managedUsers.filter(u => u.role === 'analyst').length,
  };

  const handleAdd = (data: UserFormState & { id?: string }) => {
    const newUser: User = {
      id: `usr-${Date.now()}`,
      username: data.username,
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      department: data.department || undefined,
      badgeNumber: data.badgeNumber || undefined,
      photoUrl: data.photoUrl || undefined,
    };
    addManagedUser(newUser);
    setShowModal(false);
  };

  const handleEdit = (data: UserFormState & { id?: string }) => {
    if (!data.id) return;
    updateManagedUser(data.id, {
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      department: data.department || undefined,
      badgeNumber: data.badgeNumber || undefined,
      photoUrl: data.photoUrl || undefined,
    });
    setEditTarget(null);
  };

  const handleDelete = (id: string) => {
    deleteManagedUser(id);
    setDeleteConfirm(null);
  };

  return (
    <div style={{ padding: 28, maxWidth: 1100, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            User Management
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
            Manage system users, roles, and profile photos
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10, fontSize: '0.875rem', fontWeight: 700,
            background: 'linear-gradient(135deg, var(--color-accent, #7c3aed), #6d28d9)',
            color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
          }}
        >
          <Plus size={16} />
          Add User
        </button>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Users', value: stats.total, icon: Users, color: '#7c3aed' },
          { label: 'Admins', value: stats.admins, icon: Shield, color: '#dc2626' },
          { label: 'Investigators', value: stats.investigators, icon: UserCheck, color: '#2563eb' },
          { label: 'Analysts', value: stats.analysts, icon: Users, color: '#059669' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{
            padding: '16px 18px', borderRadius: 12,
            background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users by name, username, email…"
            style={{
              width: '100%', boxSizing: 'border-box', padding: '9px 10px 9px 32px',
              background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
              borderRadius: 9, color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none',
            }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            style={{
              padding: '9px 32px 9px 12px', appearance: 'none',
              background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
              borderRadius: 9, color: 'var(--text-primary)', fontSize: '0.83rem', outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* Users table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 14, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2.5fr 1.5fr 1.5fr 1fr auto',
          padding: '12px 20px', borderBottom: '1px solid var(--border-primary)',
          fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)',
        }}>
          <span>User</span>
          <span>Role</span>
          <span>Department</span>
          <span>Badge</span>
          <span>Actions</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No users found matching your search.
          </div>
        ) : (
          filtered.map((u, idx) => {
            const rc = ROLE_COLORS[u.role] ?? { bg: 'rgba(100,100,100,0.1)', text: '#64748b' };
            return (
              <div
                key={u.id}
                style={{
                  display: 'grid', gridTemplateColumns: '2.5fr 1.5fr 1.5fr 1fr auto',
                  padding: '14px 20px', alignItems: 'center',
                  borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-primary)' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* User info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar user={u} size={38} />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {u.fullName}
                      {u.id === currentUser?.id && (
                        <span style={{ marginLeft: 6, fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(124,58,237,0.12)', color: '#7c3aed', verticalAlign: 'middle' }}>
                          You
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>
                      @{u.username} · {u.email}
                    </div>
                  </div>
                </div>

                {/* Role badge */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, background: rc.bg, color: rc.text, fontSize: '0.7rem', fontWeight: 700 }}>
                    {ROLES.find(r => r.value === u.role)?.label ?? u.role}
                  </span>
                </div>

                {/* Department */}
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {u.department ?? '—'}
                </div>

                {/* Badge */}
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {u.badgeNumber ?? '—'}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setEditTarget({ ...u, department: u.department ?? '', badgeNumber: u.badgeNumber ?? '', photoUrl: u.photoUrl })}
                    style={{ padding: '6px 8px', borderRadius: 7, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 600 }}
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  {u.id !== currentUser?.id && (
                    <button
                      onClick={() => setDeleteConfirm(u.id)}
                      style={{ padding: '6px 8px', borderRadius: 7, background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.18)', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 600 }}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

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
              zIndex: 1201, width: 380, background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)', borderRadius: 14,
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)', padding: 28,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', background: 'rgba(220,38,38,0.1)', margin: '0 auto 16px' }}>
                <Trash2 size={24} style={{ color: '#dc2626' }} />
              </div>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Delete User?</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <strong>{target?.fullName}</strong> will be permanently removed from the system.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '9px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, padding: '9px', borderRadius: 8, background: 'rgba(220,38,38,0.9)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
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
