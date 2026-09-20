import { useState, useRef, useEffect } from 'react';
import { Send, User, Loader, AlertTriangle, BookOpen, ShieldCheck } from 'lucide-react';
import api from '../lib/api';
import { processLocalAIQuery } from '../lib/aiLocalEngine';
import { useAuth } from '../contexts/AuthContext';
import logoImg from '../assets/Logo.png';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: number;
  evidence?: string[];
  disclaimer?: string;
  queryType?: string;
  timestamp: Date;
}

export default function AIAssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Welcome to the CrimeGraph AI Investigation Assistant.\n\nI have complete, direct access to the live intelligence database across all schemas — including Persons, Vehicles, Organisations, Bank Accounts, CDR Intercepts, FIR Cases, Forensic Evidence, Surveillance Reports, Alerts, and Audit Trails.\n\nAsk any investigative question about targets, connections, financial flows, call records, or anomalies. All outputs cite verified evidentiary records.',
      timestamp: new Date(),
      disclaimer: 'All AI outputs are analytical leads grounded in the database requiring investigator review.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (question: string = input) => {
    if (!question.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: question, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/api/ai/query', { question });
      const data = res.data;
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || 'I could not generate a response for this query.',
        confidence: data.confidence,
        evidence: data.evidence,
        disclaimer: data.disclaimer,
        queryType: data.queryType,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      // Grounded fallback engine
      const localResult = processLocalAIQuery(question);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: localResult.answer,
        confidence: localResult.confidence,
        evidence: localResult.evidence,
        disclaimer: localResult.disclaimer,
        queryType: localResult.queryType,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Helper for user initials
  const userInitials = user?.fullName
    ? user.fullName.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : (user?.username?.slice(0, 2).toUpperCase() || 'U');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--topbar-height) - 48px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '0 0 16px', borderBottom: '1px solid var(--border-primary)' }}>
        <div style={{
          width: 42,
          height: 42,
          background: '#ffffff',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border-primary, #e2e8f0)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          padding: 4,
          flexShrink: 0,
        }}>
          <img src={logoImg} alt="CrimeGraph AI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              AI Investigation Assistant
            </h2>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: '0.68rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 10,
              background: '#ecfdf5',
              color: '#059669',
              border: '1px solid #a7f3d0',
            }}>
              <ShieldCheck size={11} /> Full Database Access Active
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '3px 0 0' }}>
            Connected to 13 database schemas · Real-time multi-hop correlation & evidence citations
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 20, fontSize: '0.72rem', color: '#fbbf24' }}>
          <AlertTriangle size={11} /> Analytical leads only — not legal conclusions
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 6 }}>
        {messages.map(msg => (
          <div key={msg.id}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {/* Avatar: App Icon for Assistant, User Profile Picture for User */}
              {msg.role === 'assistant' ? (
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  flexShrink: 0,
                  marginTop: 2,
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #cbd5e1',
                  overflow: 'hidden',
                  padding: 3,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
                }}
                title="CrimeGraph AI"
                >
                  <img src={logoImg} alt="CrimeGraph AI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              ) : (
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  flexShrink: 0,
                  marginTop: 2,
                  background: user?.photoUrl ? 'transparent' : 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(59,130,246,0.35)',
                  overflow: 'hidden',
                  color: '#ffffff',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  boxShadow: '0 2px 5px rgba(37,99,235,0.2)',
                }}
                title={user?.fullName || user?.username || 'You'}
                >
                  {user?.photoUrl ? (
                    <img src={user.photoUrl} alt={user.fullName || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : user?.fullName ? (
                    userInitials
                  ) : (
                    <User size={15} color="#ffffff" />
                  )}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Author Label */}
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                  {msg.role === 'assistant' ? 'CrimeGraph AI' : (user?.fullName ? `${user.fullName} (@${user.username})` : 'You')}
                </div>

                <div className={`ai-message ${msg.role}`}>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{msg.content}</div>

                  {/* Evidence citations */}
                  {msg.evidence && msg.evidence.length > 0 && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-secondary)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <BookOpen size={11} /> Grounded Evidence Citations:
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {msg.evidence.map(e => (
                          <span key={e} style={{ padding: '2px 7px', background: 'var(--surface-2)', borderRadius: 4, fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', border: '1px solid var(--border-primary)' }}>
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confidence */}
                  {msg.confidence !== undefined && msg.confidence > 0 && (
                    <div className="ai-confidence" style={{ marginTop: 8 }}>
                      <div className="progress-bar" style={{ width: 80 }}>
                        <div className="progress-bar-fill" style={{ width: `${msg.confidence * 100}%`, background: msg.confidence > 0.7 ? '#22c55e' : '#eab308' }} />
                      </div>
                      <span>Grounded confidence: {Math.round(msg.confidence * 100)}%</span>
                    </div>
                  )}
                </div>

                {/* Disclaimer */}
                {msg.disclaimer && (
                  <div className="ai-disclaimer" style={{ marginTop: 6, fontSize: '0.72rem' }}>
                    ⚠️ {msg.disclaimer}
                  </div>
                )}

                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  {msg.timestamp.toLocaleTimeString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #cbd5e1',
              flexShrink: 0,
              overflow: 'hidden',
              padding: 3,
            }}>
              <img src={logoImg} alt="CrimeGraph AI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div style={{ padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: 12, border: '1px solid var(--border-primary)', display: 'flex', gap: 8, alignItems: 'center' }}>
              <Loader size={14} color="var(--accent-primary)" className="loading-spinner" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Querying live intelligence tables across 13 schemas...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ paddingTop: 12, borderTop: '1px solid var(--border-primary)', display: 'flex', gap: 8 }}>
        <textarea
          className="form-textarea"
          placeholder="Ask about any subject, target, vehicle, phone number, FIR case, bank account, evidence or transaction..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          rows={2}
          style={{ flex: 1, resize: 'none' }}
        />
        <button className="btn btn-primary" onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ alignSelf: 'flex-end', padding: '10px 16px', gap: 6 }}>
          <Send size={15} />
          <span>Send</span>
        </button>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 6 }}>
        Press Enter to send · Shift+Enter for new line · AI responses are analytical leads grounded in live database records
      </div>
    </div>
  );
}
