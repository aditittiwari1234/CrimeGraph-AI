import { useState, useRef, useEffect } from 'react';
import { X, Camera, Save, User, Mail, Hash, Building2, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  administrator: 'Administrator',
  senior_investigator: 'Senior Investigator',
  investigator: 'Investigator',
  analyst: 'Analyst',
};

export default function ProfileSettingsModal({ open, onClose }: Props) {
  const { user, updateProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    department: user?.department ?? '',
    badgeNumber: user?.badgeNumber ?? '',
  });
  const [photo, setPhoto] = useState<string | null>(user?.photoUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync form when user changes
  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName,
        email: user.email,
        department: user.department ?? '',
        badgeNumber: user.badgeNumber ?? '',
      });
      setPhoto(user.photoUrl ?? null);
    }
  }, [user]);

  if (!open || !user) return null;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      updateProfile({ ...form, photoUrl: photo ?? undefined });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 400);
  };

  const initials = form.fullName
    .split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1001,
        width: 480, maxWidth: 'calc(100vw - 32px)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-xl, 16px)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-primary)',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(0,0,0,0))',
        }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Profile Settings
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Update your personal information and photo
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: 6, borderRadius: 8,
              display: 'flex', alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          {/* Photo upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: photo ? 'transparent' : 'linear-gradient(135deg, var(--color-accent), #6d28d9)',
                border: '3px solid var(--border-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 700, color: '#fff',
                overflow: 'hidden',
                boxShadow: '0 0 0 4px rgba(124,58,237,0.15)',
              }}>
                {photo
                  ? <img src={photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials}
              </div>
              {/* Camera overlay */}
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  position: 'absolute', bottom: -2, right: -2,
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--color-accent, #7c3aed)',
                  border: '2px solid var(--bg-card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#fff',
                }}
              >
                <Camera size={13} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
            </div>

            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                {form.fullName || 'Your Name'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                {ROLE_LABELS[user.role] ?? user.role} · {user.username}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  fontSize: '0.72rem', fontWeight: 600, padding: '4px 12px',
                  borderRadius: 20, background: 'rgba(124,58,237,0.1)',
                  border: '1px solid rgba(124,58,237,0.3)', color: 'var(--color-accent, #7c3aed)',
                  cursor: 'pointer',
                }}
              >
                Change photo
              </button>
              {photo && (
                <button
                  onClick={() => setPhoto(null)}
                  style={{
                    fontSize: '0.72rem', fontWeight: 600, padding: '4px 12px',
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

          {/* Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {[
              { key: 'fullName', label: 'Full Name', icon: User, placeholder: 'e.g. Inspector A.K. Singh' },
              { key: 'email', label: 'Email', icon: Mail, placeholder: 'e.g. user@ncrb.gov.in' },
              { key: 'department', label: 'Department', icon: Building2, placeholder: 'e.g. Cyber Crime Wing' },
              { key: 'badgeNumber', label: 'Badge Number', icon: Hash, placeholder: 'e.g. SI-2024-001' },
            ].map(({ key, label, icon: Icon, placeholder }) => (
              <div key={key}>
                <label style={{
                  display: 'block', fontSize: '0.72rem', fontWeight: 700,
                  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
                  marginBottom: 6,
                }}>
                  {label}
                </label>
                <div style={{ position: 'relative' }}>
                  <Icon
                    size={14}
                    style={{
                      position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                    }}
                  />
                  <input
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '8px 10px 8px 30px',
                      background: 'var(--bg-input, rgba(255,255,255,0.04))',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 8, color: 'var(--text-primary)',
                      fontSize: '0.85rem', outline: 'none',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Role (read-only) */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
            background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.18)',
            borderRadius: 8, marginBottom: 24,
          }}>
            <Shield size={13} style={{ color: 'var(--color-accent, #7c3aed)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Role: <strong style={{ color: 'var(--color-accent, #7c3aed)' }}>{ROLE_LABELS[user.role] ?? user.role}</strong>
              &nbsp;· Contact your administrator to change your role.
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '9px 20px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
                background: 'transparent', border: '1px solid var(--border-primary)',
                color: 'var(--text-secondary)', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 22px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700,
                background: saved
                  ? 'rgba(5,150,105,0.9)'
                  : 'linear-gradient(135deg, var(--color-accent, #7c3aed), #6d28d9)',
                color: '#fff', border: 'none', cursor: saving ? 'wait' : 'pointer',
                transition: 'background 0.3s',
                boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
              }}
            >
              <Save size={14} />
              {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
