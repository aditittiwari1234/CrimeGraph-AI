import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader, AlertTriangle, BookOpen } from 'lucide-react';
import api from '../lib/api';
import { processLocalAIQuery } from '../lib/aiLocalEngine';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence?: number;
  evidence?: string[];
  disclaimer?: string;
  queryType?: string;
  suggestions?: string[];
  timestamp: Date;
}

const STARTER_QUESTIONS = [
  'How are Person A and Person C potentially connected?',
  'What unusual activity occurred last month?',
  'Which entities have the highest network influence?',
  'Show all transactions involving ACC-SHELL-011',
  'Summarize this investigation',
  'Which communities have been detected?',
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Welcome to the CrimeGraph AI Investigation Assistant. I can help you analyze network connections, detect anomalies, identify influential entities, and summarize investigation data.\n\nAll responses are grounded in the available investigation dataset and will include evidence citations. I will not make unsupported claims.\n\nHow can I assist your investigation?',
      timestamp: new Date(),
      disclaimer: 'Responses are based on available synthetic data only. All AI outputs are analytical leads requiring investigator review.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        suggestions: data.suggestions,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      // Intelligent grounded fallback — ensures zero downtime during presentations
      const localResult = processLocalAIQuery(question);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: localResult.answer,
        confidence: localResult.confidence,
        evidence: localResult.evidence,
        disclaimer: localResult.disclaimer,
        queryType: localResult.queryType,
        suggestions: localResult.suggestions,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--topbar-height) - 48px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '0 0 16px', borderBottom: '1px solid var(--border-primary)' }}>
        <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bot size={20} color="white" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 2 }}>AI Investigation Assistant</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Powered by graph-grounded analysis · All outputs cite evidence sources</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 20, fontSize: '0.72rem', color: '#fbbf24' }}>
          <AlertTriangle size={11} /> Analytical leads only — not legal conclusions
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4 }}>
        {messages.map(msg => (
          <div key={msg.id}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              {/* Avatar */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                background: msg.role === 'user' ? 'rgba(59,130,246,0.2)' : 'rgba(139,92,246,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${msg.role === 'user' ? 'rgba(59,130,246,0.3)' : 'rgba(139,92,246,0.3)'}`,
              }}>
                {msg.role === 'user' ? <User size={14} color="#93c5fd" /> : <Bot size={14} color="#c4b5fd" />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={`ai-message ${msg.role}`}>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{msg.content}</div>

                  {/* Evidence citations */}
                  {msg.evidence && msg.evidence.length > 0 && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-secondary)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <BookOpen size={10} /> Evidence References:
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {msg.evidence.map(e => (
                          <span key={e} style={{ padding: '1px 6px', background: 'var(--surface-2)', borderRadius: 4, fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', border: '1px solid var(--border-primary)' }}>
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confidence */}
                  {msg.confidence !== undefined && msg.confidence > 0 && (
                    <div className="ai-confidence">
                      <div className="progress-bar" style={{ width: 80 }}>
                        <div className="progress-bar-fill" style={{ width: `${msg.confidence * 100}%`, background: msg.confidence > 0.7 ? '#22c55e' : '#eab308' }} />
                      </div>
                      <span>Analytical confidence: {Math.round(msg.confidence * 100)}%</span>
                    </div>
                  )}
                </div>

                {/* Disclaimer */}
                {msg.disclaimer && (
                  <div className="ai-disclaimer" style={{ marginTop: 6, fontSize: '0.72rem' }}>
                    ⚠️ {msg.disclaimer}
                  </div>
                )}

                {/* Suggested follow-ups */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {msg.suggestions.map(s => (
                      <button key={s} onClick={() => sendMessage(s.replace(/['"]/g, ''))} className="btn btn-secondary btn-sm" style={{ fontSize: '0.72rem' }}>
                        {s}
                      </button>
                    ))}
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
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(139,92,246,0.3)', flexShrink: 0 }}>
              <Bot size={14} color="#c4b5fd" />
            </div>
            <div style={{ padding: '14px 16px', background: 'var(--bg-tertiary)', borderRadius: 12, border: '1px solid var(--border-primary)', display: 'flex', gap: 8, alignItems: 'center' }}>
              <Loader size={14} color="var(--accent-primary)" className="loading-spinner" />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Analyzing investigation data...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Starter questions */}
      {messages.length === 1 && (
        <div style={{ padding: '12px 0', borderTop: '1px solid var(--border-primary)', marginTop: 8 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Suggested queries:</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STARTER_QUESTIONS.map(q => (
              <button key={q} onClick={() => sendMessage(q)} className="btn btn-secondary btn-sm" style={{ fontSize: '0.78rem' }}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{ paddingTop: 12, borderTop: '1px solid var(--border-primary)', display: 'flex', gap: 8 }}>
        <textarea
          className="form-textarea"
          placeholder="Ask about connections, anomalies, patterns, communities, or request summaries..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          rows={2}
          style={{ flex: 1, resize: 'none' }}
        />
        <button className="btn btn-primary" onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ alignSelf: 'flex-end', padding: '10px 14px' }}>
          <Send size={16} />
        </button>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 6 }}>
        Press Enter to send · Shift+Enter for new line · AI responses are analytical leads only
      </div>
    </div>
  );
}
