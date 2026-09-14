import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Eye, EyeOff, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

const DEMO_CREDS: Record<string, { u: string; p: string; label: string; role: string }> = {
  admin:      { u: 'admin',          p: 'Demo@1234', label: 'Administrator',   role: 'Full access' },
  senior:     { u: 'singh_si',       p: 'Demo@1234', label: 'Senior Inspector', role: 'Senior investigator' },
  inv:        { u: 'verma_inv',      p: 'Demo@1234', label: 'Investigator',     role: 'Investigator' },
  analyst:    { u: 'analyst_gupta',  p: 'Demo@1234', label: 'Analyst',          role: 'Read-only analyst' },
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [filled, setFilled] = useState('');

  const fillDemo = (key: string) => {
    const c = DEMO_CREDS[key];
    setUsername(c.u);
    setPassword(c.p);
    setFilled(key);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        err?.message ||
        'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 440px',
      background: '#f0f4f8',
    }}>
      {/* ── Left branding panel ── */}
      <div style={{
        background: '#1e293b',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '64px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: 300, height: 300, borderRadius: '50%', background: 'rgba(59,130,246,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: 240, height: 240, borderRadius: '50%', background: 'rgba(124,58,237,0.08)', pointerEvents: 'none' }} />

        {/* Gov header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 6, marginBottom: 10 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: '#93c5fd' }}>GOVERNMENT OF INDIA</span>
          </div>
          <p style={{ fontSize: '0.825rem', color: '#64748b' }}>Ministry of Home Affairs · National Crime Records Bureau</p>
        </div>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 40 }}>
          <div style={{
            width: 68, height: 68,
            background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
            borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(59,130,246,0.35)',
          }}>
            <Activity size={34} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, color: '#f8fafc', margin: 0 }}>
              CrimeGraph
              <span style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}> AI</span>
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>Criminal Network Analysis & Investigation Platform</p>
          </div>
        </div>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 380 }}>
          {[
            { icon: '🕸️', text: 'Interactive Criminal Network Graph (Cytoscape.js)' },
            { icon: '🧠', text: 'AI-Powered NLP Entity Extraction from FIRs & Reports' },
            { icon: '📊', text: 'Community Detection, Centrality & Anomaly Analysis' },
            { icon: '🔒', text: 'Blockchain-Inspired Tamper-Evident Evidence Ledger' },
            { icon: '🤖', text: 'AI Investigation Assistant with Evidence Citations' },
            { icon: '📋', text: 'Full Immutable Audit Trail for Accountability' },
          ].map(f => (
            <div key={f.text} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: 1 }}>{f.icon}</span>
              <span style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5 }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* SIH badge */}
        <div style={{
          marginTop: 48,
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 16px',
          background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.25)',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem', color: '#93c5fd',
          width: 'fit-content',
        }}>
          <Shield size={12} />
          Smart India Hackathon 2026 · Problem Statement 26189
        </div>
      </div>

      {/* ── Right login panel ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '48px 40px',
        background: 'white',
        borderLeft: '1px solid #e2e8f0',
      }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 6 }}>Sign In</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Authorized investigators only. All access is logged.</p>
        </div>

        {/* Security notice */}
        <div style={{
          display: 'flex', gap: 10, padding: '10px 14px', marginBottom: 20,
          background: '#fef9ec', border: '1px solid #fcd34d',
          borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: '#92400e',
        }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span><strong>Restricted System.</strong> Unauthorized access is a criminal offence under the IT Act 2000.</span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Username / Badge Number</label>
            <input
              id="username"
              type="text"
              className="form-input"
              placeholder="Enter username"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                required
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: '0.825rem', color: '#b91c1c' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !username || !password}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem', fontWeight: 600, marginTop: 4 }}
          >
            {loading
              ? <><div className="loading-spinner" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> Verifying...</>
              : 'Sign In to Platform'
            }
          </button>
        </form>

        {/* Demo accounts */}
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            Demo Quick Access
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {Object.entries(DEMO_CREDS).map(([key, c]) => (
              <button
                key={key}
                type="button"
                onClick={() => fillDemo(key)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                  padding: '8px 12px',
                  background: filled === key ? 'rgba(37,99,235,0.06)' : '#f8fafc',
                  border: `1px solid ${filled === key ? 'rgba(37,99,235,0.3)' : '#e2e8f0'}`,
                  borderRadius: 8, cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={e => { if (filled !== key) (e.currentTarget as HTMLElement).style.borderColor = '#93c5fd'; }}
                onMouseLeave={e => { if (filled !== key) (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; }}
              >
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: filled === key ? '#1d4ed8' : '#1e293b', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {filled === key && <CheckCircle size={11} color="#1d4ed8" />}
                  {c.label}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 1 }}>{c.role}</span>
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 8, textAlign: 'center' }}>
            All demo passwords: <code style={{ fontFamily: 'var(--font-mono)', color: '#475569' }}>Demo@1234</code>
            &nbsp;· Works offline (no backend needed)
          </p>
        </div>

        <p style={{ marginTop: 24, fontSize: '0.7rem', color: '#cbd5e1', textAlign: 'center', lineHeight: 1.6 }}>
          Uses synthetic data only — no real personal information stored.<br />
          AI outputs are analytical leads · Not legal determinations.
        </p>
      </div>
    </div>
  );
}
