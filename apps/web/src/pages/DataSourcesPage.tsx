import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Share2, Database, RefreshCw, CheckCircle2, AlertTriangle,
  Upload, FileText, Phone, CreditCard, Truck, Building2,
  Lock, ArrowRight, Activity, Globe, Shield, ExternalLink,
  Plus, Check, X, Server
} from 'lucide-react';
import { ENTITY_COUNTS } from '../data/dataset';
import DatabaseSelector from '../components/database/DatabaseSelector';
import { useDatabases } from '../contexts/DatabaseContext';

interface DataSource {
  id: string;
  name: string;
  department: string;
  ministry: string;
  icon: any;
  color: string;
  recordsCount: number;
  recordType: string;
  status: 'connected' | 'syncing' | 'standby';
  lastSync: string;
  latencyMs: number;
  protocol: string;
  authMethod: string;
  description: string;
}

export default function DataSourcesPage() {
  const navigate = useNavigate();
  const { setIsAddModalOpen } = useDatabases();
  const [sources, setSources] = useState<DataSource[]>([
    {
      id: 'cctns',
      name: 'CCTNS National Core',
      department: 'Crime & Criminal Tracking Network & Systems',
      ministry: 'Ministry of Home Affairs (MHA) / NCRB',
      icon: FileText,
      color: '#dc2626',
      recordsCount: ENTITY_COUNTS.firs,
      recordType: 'FIRs & Chargesheets',
      status: 'connected',
      lastSync: '2 minutes ago',
      latencyMs: 24,
      protocol: 'HTTPS REST / OAS 3.0',
      authMethod: 'mTLS + NIC OAuth2',
      description: 'Nationwide integration across 16,000+ police stations for FIR registration, general diaries, and court charge-sheets.',
    },
    {
      id: 'telecom',
      name: 'DoT Telecom Gateway (CMS / LIMS)',
      department: 'Central Monitoring System & Telecom Data',
      ministry: 'Department of Telecommunications / TRAI',
      icon: Phone,
      color: '#16a34a',
      recordsCount: ENTITY_COUNTS.cdrRecords,
      recordType: 'CDR & Cell Tower Logs',
      status: 'connected',
      lastSync: '4 minutes ago',
      latencyMs: 18,
      protocol: 'Secure SFTP / Kafka Stream',
      authMethod: 'Gov-VPN + 4096-bit RSA',
      description: 'Automated retrieval of Call Detail Records, tower triangulation feeds, IMEI change alerts, and subscriber identity registries.',
    },
    {
      id: 'fiu',
      name: 'FIU-IND Financial Gateway',
      department: 'Financial Intelligence Unit - India',
      ministry: 'Ministry of Finance / Enforcement Directorate',
      icon: CreditCard,
      color: '#ca8a04',
      recordsCount: ENTITY_COUNTS.transactions,
      recordType: 'Suspicious & Cash Txns',
      status: 'connected',
      lastSync: '7 minutes ago',
      latencyMs: 31,
      protocol: 'ISO 20022 XML / API Gateway',
      authMethod: 'FIU PKI Hardware Token',
      description: 'Live ingestion of Suspicious Transaction Reports (STRs), Cash Transaction Reports (CTRs), and cross-border remittances.',
    },
    {
      id: 'vahan',
      name: 'MoRTH VAHAN & SARATHI',
      department: 'National Vehicle & Driving Licence Register',
      ministry: 'Ministry of Road Transport & Highways',
      icon: Truck,
      color: '#ea580c',
      recordsCount: ENTITY_COUNTS.vehicles,
      recordType: 'RC, Chassis & ANPR Logs',
      status: 'connected',
      lastSync: '12 minutes ago',
      latencyMs: 42,
      protocol: 'NIC e-Governance API',
      authMethod: 'API Token + IP Whitelist',
      description: 'Vehicle registration details, transfer history, automated toll ANPR passage logs, and driving licence verification.',
    },
    {
      id: 'mca',
      name: 'MCA-21 & GSTN Data Hub',
      department: 'Ministry of Corporate Affairs & GST Network',
      ministry: 'MCA / Goods & Services Tax Network',
      icon: Building2,
      color: '#7c3aed',
      recordsCount: ENTITY_COUNTS.organisations,
      recordType: 'Company Filings & Directorships',
      status: 'connected',
      lastSync: '18 minutes ago',
      latencyMs: 37,
      protocol: 'OData REST Endpoint',
      authMethod: 'Corporate Affairs Token',
      description: 'Corporate registry (CIN), registered office addresses, shared directorships (DIN), shell company alerts, and GST invoice trails.',
    },
    {
      id: 'uidai',
      name: 'Immigration & UIDAI Gateway',
      department: 'Bureau of Immigration & Aadhaar Tokenization',
      ministry: 'MHA / MeitY (UIDAI)',
      icon: Globe,
      color: '#0891b2',
      recordsCount: ENTITY_COUNTS.persons,
      recordType: 'Identity & Travel Logs',
      status: 'connected',
      lastSync: '25 minutes ago',
      latencyMs: 19,
      protocol: 'Zero-Knowledge Token API',
      authMethod: 'UIDAI Sub-AUA Token',
      description: 'Tokenized identity verification without exposing clear Aadhaar numbers, international travel manifests, and passport status.',
    },
  ]);

  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importDept, setImportDept] = useState('cctns');
  const [importData, setImportData] = useState('');
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Trigger manual sync
  const handleSync = (id: string) => {
    setSyncingId(id);
    setTimeout(() => {
      setSources(prev => prev.map(s => {
        if (s.id === id) {
          return {
            ...s,
            recordsCount: s.recordsCount + Math.floor(Math.random() * 5) + 1,
            lastSync: 'Just now',
            latencyMs: Math.floor(Math.random() * 20) + 15,
          };
        }
        return s;
      }));
      setSyncingId(null);
    }, 1200);
  };

  // Handle Import
  const handleImportSubmit = () => {
    if (!importData.trim()) return;
    setImportSuccess(`Successfully parsed and integrated records into ${importDept.toUpperCase()} repository pipeline.`);
    setTimeout(() => {
      setImportSuccess(null);
      setShowImportModal(false);
      setImportData('');
    }, 1800);
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 48 }}>
      {/* Active Database Context Switcher */}
      <DatabaseSelector />

      {/* Header Banner */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '24px 28px',
        marginBottom: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                background: '#f0fdf4',
                color: '#16a34a',
                padding: '6px 10px',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 700,
                fontSize: '0.8rem'
              }}>
                <Server size={16} />
                <span>INTER-DEPARTMENTAL FEDERATED GATEWAY</span>
              </div>
              <span style={{
                background: '#f1f5f9',
                color: '#475569',
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: 6
              }}>
                Multi-Agency Security Layer v2.4
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 6px' }}>
              Data Sources & Departmental Integrations
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, maxWidth: 850 }}>
              Live federated synchronization pipeline connecting NCRB CrimeGraph AI with state police departments (CCTNS),
              telecom operators, financial intelligence units, transport registries (VAHAN), and corporate databases.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
            >
              <Plus size={15} color="#2563eb" />
              Connect Database
            </button>
            <button
              onClick={() => navigate('/database')}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
            >
              <Database size={15} />
              Open Database Explorer
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
            >
              <Upload size={15} />
              Ingest External Records
            </button>
          </div>
        </div>

        {/* Status Metrics Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid #f1f5f9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={22} color="#16a34a" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Active Gateways</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>6 / 6 Connected</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={22} color="#2563eb" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Average API Latency</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>28.5 ms</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={22} color="#7c3aed" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Security Standard</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>mTLS + AES-256</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={22} color="#ca8a04" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Ingested Records</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {sources.reduce((acc, s) => acc + s.recordsCount, 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Departmental Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: 20,
      }}>
        {sources.map(src => {
          const Icon = src.icon;
          const isSyncing = syncingId === src.id;

          return (
            <div
              key={src.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '22px 24px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'box-shadow 150ms ease, border-color 150ms ease',
              }}
            >
              {/* Card Top */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 10,
                    background: `${src.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${src.color}30`,
                  }}>
                    <Icon size={24} color={src.color} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>
                      {src.name}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                      {src.ministry}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#16a34a',
                    boxShadow: '0 0 0 3px rgba(22, 163, 74, 0.2)',
                  }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
                    {src.status}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, margin: '0 0 16px', flex: 1 }}>
                {src.description}
              </p>

              {/* Data Specifications Grid */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #f1f5f9',
                borderRadius: 8,
                padding: '12px 16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 10,
                marginBottom: 16,
                fontSize: '0.8rem'
              }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600 }}>Record Type</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginTop: 1 }}>{src.recordType}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600 }}>Active Ingested</div>
                  <div style={{ fontWeight: 800, color: src.color, marginTop: 1 }}>{src.recordsCount.toLocaleString()} items</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600 }}>Protocol / Auth</div>
                  <div style={{ fontWeight: 600, color: '#334155', marginTop: 1 }}>{src.protocol}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 600 }}>Latency & Sync</div>
                  <div style={{ fontWeight: 600, color: '#334155', marginTop: 1 }}>{src.latencyMs} ms · {src.lastSync}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <button
                  onClick={() => navigate(`/database`)}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  <Database size={14} />
                  Browse Records
                </button>

                <button
                  disabled={isSyncing}
                  onClick={() => handleSync(src.id)}
                  className="btn btn-primary"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', padding: '6px 14px',
                    opacity: isSyncing ? 0.7 : 1,
                  }}
                >
                  <RefreshCw size={14} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Gateway'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Dataset Ingestion Modal */}
      {showImportModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowImportModal(false);
          }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            width: '100%',
            maxWidth: 620,
            boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3), 0 0 0 1px rgba(15, 23, 42, 0.12)',
            overflow: 'hidden',
            border: '1px solid #cbd5e1',
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                  Federated Ingestion Engine
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>
                  Ingest Departmental Dataset
                </h2>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {importSuccess ? (
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 8,
                  padding: 20,
                  textAlign: 'center',
                  color: '#16a34a',
                }}>
                  <CheckCircle2 size={36} style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>Ingestion Pipeline Completed</div>
                  <p style={{ fontSize: '0.85rem', color: '#15803d', marginTop: 4 }}>
                    {importSuccess}
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Target Department Source
                    </label>
                    <select
                      value={importDept}
                      onChange={e => setImportDept(e.target.value)}
                      className="input"
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    >
                      <option value="cctns">CCTNS / State Police (FIR & Crime Register)</option>
                      <option value="telecom">DoT CMS (Telecom CDR & Cell Logs)</option>
                      <option value="fiu">FIU-IND (Financial & High-Risk Transactions)</option>
                      <option value="vahan">MoRTH VAHAN (Vehicle Registrations & Fastag)</option>
                      <option value="mca">MCA-21 (Corporate & Director Filings)</option>
                      <option value="surveillance">Special Branch (Surveillance Logs)</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                        Paste Raw CSV or JSON Data Records
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setImportData(
                            `{\n  "batchId": "BATCH-IMPORT-${Date.now()}",\n  "department": "${importDept}",\n  "records": [\n    {\n      "id": "IMP-001",\n      "reference": "POLICE-EXT-2026-991",\n      "timestamp": "2026-09-14T10:30:00Z",\n      "priority": "High",\n      "notes": "Automated inter-agency feed ingest"\n    }\n  ]\n}`
                          );
                        }}
                        style={{ fontSize: '0.75rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Load Sample Schema
                      </button>
                    </div>
                    <textarea
                      rows={7}
                      placeholder="Paste JSON array or CSV records here..."
                      value={importData}
                      onChange={e => setImportData(e.target.value)}
                      className="input"
                      style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{
                    background: '#f8fafc',
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontSize: '0.78rem',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 16,
                  }}>
                    <Shield size={16} color="#2563eb" />
                    <span>Records undergo schema validation, entity resolution, and SHA-256 provenance hashing.</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setShowImportModal(false)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.85rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleImportSubmit}
                      disabled={!importData.trim()}
                      className="btn btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', opacity: !importData.trim() ? 0.6 : 1 }}
                    >
                      <Upload size={15} />
                      Parse & Ingest Records
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
