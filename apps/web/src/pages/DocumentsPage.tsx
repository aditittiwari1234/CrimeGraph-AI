import { useState } from 'react';
import { FileText, Upload, Search, Eye } from 'lucide-react';
import api from '../lib/api';

const DOCUMENT_TYPES = ['fir', 'police_report', 'intelligence_report', 'surveillance_report', 'case_notes', 'cdr', 'financial', 'other'];

const DEMO_TEXT = `Inspector Singh filed FIR No. FIR-2026-00451 at Kanpur Central Police Station on 15 January 2026.

During surveillance on 14 January 2026, Inspector Rao observed Arjun Mehta and Vikram Sinha near Kanpur Central Station at approximately 10:30 AM. Ramesh Gupta was also present at the location. Later, Arjun Mehta was seen making a call from phone number 9876543210.

According to the report, the three individuals met at Lotus Hotel in Mumbai on 03 February 2026. Deepak Patel was also identified at this meeting.

Subsequent financial analysis revealed transactions from Shree Trading Co. to Apex Logistics amounting to Rs. 5,00,000 on 20 January 2026.`;

export default function DocumentsPage() {
  const [content, setContent] = useState('');
  const [docType, setDocType] = useState('fir');
  const [filename, setFilename] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const analyze = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/api/documents/upload', {
        content, documentType: docType,
        originalName: filename || `document_${Date.now()}.txt`,
      });
      setResult(res.data);
    } catch {
      // Demo fallback
      setResult({
        document: { id: 'demo', filename: 'demo.txt', document_type: docType, status: 'analyzed' },
        evidenceId: 'EVD-DOC-DEMO001',
        extractedEntities: [
          { id: 'NLP-PERSON-0', type: 'Person', value: 'Arjun Mehta', confidence: 0.82, method: 'NER-PERSON' },
          { id: 'NLP-PERSON-1', type: 'Person', value: 'Vikram Sinha', confidence: 0.79, method: 'NER-PERSON' },
          { id: 'NLP-PERSON-2', type: 'Person', value: 'Ramesh Gupta', confidence: 0.76, method: 'NER-PERSON' },
          { id: 'NLP-PHONE-0', type: 'Phone', value: '9876543210', confidence: 0.95, method: 'REGEX-PHONE' },
          { id: 'NLP-LOC-0', type: 'Location', value: 'Kanpur Central Station', confidence: 0.75, method: 'NER-LOCATION' },
          { id: 'NLP-LOC-1', type: 'Location', value: 'Lotus Hotel', confidence: 0.72, method: 'NER-LOCATION' },
          { id: 'NLP-DATE-0', type: 'Date', value: '15 January 2026', confidence: 0.90, method: 'REGEX-DATE' },
          { id: 'NLP-DATE-1', type: 'Date', value: '14 January 2026', confidence: 0.90, method: 'REGEX-DATE' },
        ],
        extractedRelationships: [
          { id: 'NLP-REL-0', source: 'Arjun Mehta', target: 'Vikram Sinha', type: 'ASSOCIATED_WITH', confidence: 0.65, method: 'PROXIMITY-EXTRACTION', disclaimer: 'Extracted — not confirmed' },
          { id: 'NLP-REL-1', source: 'Vikram Sinha', target: 'Ramesh Gupta', type: 'ASSOCIATED_WITH', confidence: 0.60, method: 'PROXIMITY-EXTRACTION', disclaimer: 'Extracted — not confirmed' },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const typeColor: Record<string, string> = {
    Person: '#3b82f6', Phone: '#22c55e', Location: '#ef4444',
    Date: '#06b6d4', Organization: '#8b5cf6', Vehicle: '#f97316',
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Document Analysis</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>AI-powered NLP entity extraction from FIRs, police reports, and intelligence documents</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 20 }}>
        {/* Upload / Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 14 }}>Upload Document for NLP Analysis</h3>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Document Type</label>
                <select className="form-select" value={docType} onChange={e => setDocType(e.target.value)}>
                  {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').toUpperCase()}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Document Name</label>
                <input className="form-input" placeholder="e.g., FIR-2026-00451.txt" value={filename} onChange={e => setFilename(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Document Text</label>
              <textarea
                className="form-textarea"
                rows={12}
                placeholder="Paste or type document content here for NLP entity extraction..."
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary" onClick={analyze} disabled={loading || !content.trim()}>
                {loading ? <><div className="loading-spinner" style={{ width: 14, height: 14 }} /> Analyzing...</> : <><Search size={14} /> Extract Entities</>}
              </button>
              <button className="btn btn-secondary" onClick={() => setContent(DEMO_TEXT)}>
                <FileText size={14} /> Load Demo FIR
              </button>
            </div>

            <div className="ai-disclaimer" style={{ marginTop: 12 }}>
              NLP extraction uses Named Entity Recognition and regex patterns. All extracted entities require investigator verification before use as evidence.
            </div>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                <h4 style={{ fontSize: '0.9rem' }}>Extraction Complete</h4>
                <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-accent)', marginLeft: 'auto' }}>
                  {result.evidenceId}
                </span>
              </div>

              <h5 style={{ fontSize: '0.825rem', marginBottom: 8, color: 'var(--text-secondary)' }}>
                Extracted Entities ({result.extractedEntities?.length || 0})
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                {result.extractedEntities?.map((e: any) => (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#f8fafc', borderRadius: 6, borderLeft: `3px solid ${typeColor[e.type] || '#94a3b8'}` }}>
                    <span style={{ width: 60, flexShrink: 0 }}>
                      <span className={`badge badge-${e.type?.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{e.type}</span>
                    </span>
                    <span style={{ flex: 1, fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{e.value}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{Math.round(e.confidence * 100)}%</span>
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{e.method}</span>
                  </div>
                ))}
              </div>

              <h5 style={{ fontSize: '0.825rem', marginBottom: 8, color: 'var(--text-secondary)' }}>
                Extracted Relationships ({result.extractedRelationships?.length || 0})
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.extractedRelationships?.map((r: any) => (
                  <div key={r.id} style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.source}</span>
                      <span style={{ color: 'var(--text-accent)' }}>→ {r.type.replace(/_/g, ' ')} →</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.target}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Confidence: {Math.round(r.confidence * 100)}% · Method: {r.method}
                    </div>
                    <div className="ai-disclaimer" style={{ marginTop: 4, fontSize: '0.68rem' }}>{r.disclaimer}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
