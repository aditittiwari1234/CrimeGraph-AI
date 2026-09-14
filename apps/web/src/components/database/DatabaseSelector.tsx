import React, { useState, useRef, useEffect } from 'react';
import {
  Database, ChevronDown, Check, Plus, Server,
  Activity, Shield, RefreshCw, Trash2
} from 'lucide-react';
import { useDatabases, type DatabaseConnection } from '../../contexts/DatabaseContext';
import { useAuth } from '../../contexts/AuthContext';

interface DatabaseSelectorProps {
  compact?: boolean;
}

const ENGINE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  neo4j: { label: 'Neo4j Graph', color: '#1d4ed8', bg: '#dbeafe' },
  postgres: { label: 'PostgreSQL', color: '#0369a1', bg: '#e0f2fe' },
  elasticsearch: { label: 'OpenSearch', color: '#047857', bg: '#d1fae5' },
  oracle: { label: 'Oracle DW', color: '#b91c1c', bg: '#fee2e2' },
  mongodb: { label: 'MongoDB', color: '#15803d', bg: '#dcfce7' },
  mysql: { label: 'MySQL', color: '#c2410c', bg: '#ffedd5' },
  sqlite: { label: 'SQLite', color: '#6d28d9', bg: '#ede9fe' },
  rest_api: { label: 'REST Gateway', color: '#334155', bg: '#f1f5f9' },
};

export default function DatabaseSelector({ compact = false }: DatabaseSelectorProps) {
  const { databases, activeDatabase, setActiveDatabaseId, setIsAddModalOpen, syncDatabase, removeDatabase } = useDatabases();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSync = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSyncingId(id);
    await syncDatabase(id);
    setSyncingId(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to disconnect this external database?')) {
      removeDatabase(id);
    }
  };

  if (!activeDatabase) {
    if (compact) {
      return (
        <button
          onClick={() => setIsAddModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: '#eff6ff',
            border: '1px dashed #3b82f6',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '0.78rem',
            color: '#2563eb',
            fontWeight: 700,
          }}
          title="Connect Database"
        >
          <Plus size={13} />
          <span>Connect Database</span>
        </button>
      );
    }

    return (
      <div style={{
        background: '#ffffff',
        border: '1px dashed #cbd5e1',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database size={20} color="#2563eb" />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>No Database Connected</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
              Connect your PostgreSQL, MongoDB, MySQL, or Neo4j database to explore tables and collections.
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', padding: '7px 16px' }}
        >
          <Plus size={14} />
          <span>Connect Database</span>
        </button>
      </div>
    );
  }

  const engineMeta = ENGINE_LABELS[activeDatabase.type] || { label: activeDatabase.type, color: '#475569', bg: '#f1f5f9' };

  if (compact) {
    return (
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setIsOpen(prev => !prev)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '7px 12px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '0.78rem',
            color: '#1e3a8a',
            fontWeight: 700,
            boxShadow: '0 1px 2px rgba(37,99,235,0.08)',
            transition: 'all 120ms ease',
          }}
          title={`Active Database: ${activeDatabase.name} (${activeDatabase.department})`}
        >
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: activeDatabase.status === 'connected' ? '#16a34a' : '#ea580c',
            boxShadow: activeDatabase.status === 'connected' ? '0 0 0 2px rgba(22,163,74,0.25)' : 'none',
          }} />
          <Database size={13} color="#2563eb" />
          <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.72rem' }}>DB:</span>
          <span style={{
            maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {activeDatabase.name}
          </span>
          <span style={{
            background: engineMeta.bg,
            color: engineMeta.color,
            padding: '1px 6px',
            borderRadius: 4,
            fontSize: '0.66rem',
            fontWeight: 800,
          }}>
            {engineMeta.label}
          </span>
          <ChevronDown size={13} color="#2563eb" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
        </button>

        {isOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: 340,
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 10,
            boxShadow: '0 12px 28px rgba(15,23,42,0.15)',
            zIndex: 1200,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '10px 14px',
              borderBottom: '1px solid #f1f5f9',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Select Active Database
              </span>
              <span style={{ fontSize: '0.72rem', color: '#0f172a', fontWeight: 600 }}>
                {databases.length} Available
              </span>
            </div>

            <div style={{ maxHeight: 280, overflowY: 'auto', padding: '6px 0' }}>
              {databases.map(db => {
                const isSelected = db.id === activeDatabase.id;
                const eng = ENGINE_LABELS[db.type] || { label: db.type, color: '#475569', bg: '#f1f5f9' };
                return (
                  <div
                    key={db.id}
                    onClick={() => {
                      setActiveDatabaseId(db.id);
                      setIsOpen(false);
                    }}
                    style={{
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      background: isSelected ? '#eff6ff' : 'transparent',
                      borderLeft: isSelected ? '3px solid #2563eb' : '3px solid transparent',
                      transition: 'background 100ms ease',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ minWidth: 0, flex: 1, marginRight: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: isSelected ? 700 : 600, color: '#0f172a' }}>
                          {db.name}
                        </span>
                        <span style={{
                          background: eng.bg, color: eng.color,
                          padding: '1px 5px', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700,
                        }}>
                          {eng.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>
                        {db.department} · {db.latencyMs}ms
                      </div>
                    </div>

                    {isSelected && <Check size={16} color="#2563eb" style={{ flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>

            <div style={{
              padding: '8px 12px',
              borderTop: '1px solid #f1f5f9',
              background: '#f8fafc',
            }}>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsAddModalOpen(true);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '7px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} />
                <span>Connect New Database</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full / Expanded Banner Mode (used inside DatabasePage / DataSourcesPage)
  return (
    <div
      ref={dropdownRef}
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
      }}>
        {/* Current Database Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: engineMeta.bg,
            border: `1px solid ${engineMeta.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: engineMeta.color,
            flexShrink: 0,
          }}>
            <Database size={22} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Database Source:
              </span>
              <span style={{
                background: engineMeta.bg,
                color: engineMeta.color,
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 4,
              }}>
                {engineMeta.label}
              </span>
              <span style={{
                background: '#f1f5f9',
                color: '#475569',
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: 4,
              }}>
                {activeDatabase.classification}
              </span>
            </div>

            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
              {activeDatabase.name}
            </div>

            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
              <span>{activeDatabase.department}</span>
              <span style={{ margin: '0 6px' }}>·</span>
              <span style={{ fontFamily: 'monospace' }}>{activeDatabase.host}:{activeDatabase.port}</span>
              <span style={{ margin: '0 6px' }}>·</span>
              <span style={{ color: '#16a34a', fontWeight: 600 }}>● {activeDatabase.status} ({activeDatabase.latencyMs} ms)</span>
            </div>
          </div>
        </div>

        {/* Action Controls & Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          <button
            onClick={() => setIsOpen(prev => !prev)}
            className="btn btn-secondary"
            style={{
              display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem',
              fontWeight: 600, padding: '7px 14px',
            }}
          >
            <Server size={14} color="#2563eb" />
            <span>Switch Database ({databases.length})</span>
            <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
            style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem',
              fontWeight: 600, padding: '7px 14px',
            }}
          >
            <Plus size={14} />
            <span>Connect Database</span>
          </button>

          {/* Switcher Dropdown */}
          {isOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 420,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 12,
              boxShadow: '0 16px 36px rgba(15,23,42,0.18)',
              zIndex: 1200,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f1f5f9',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                  Available Database Connections
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Click to switch context
                </div>
              </div>

              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {databases.map(db => {
                  const isSelected = db.id === activeDatabase.id;
                  const eng = ENGINE_LABELS[db.type] || { label: db.type, color: '#475569', bg: '#f1f5f9' };
                  const isSyncing = syncingId === db.id;

                  return (
                    <div
                      key={db.id}
                      onClick={() => {
                        setActiveDatabaseId(db.id);
                        setIsOpen(false);
                      }}
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        background: isSelected ? '#eff6ff' : 'transparent',
                        borderLeft: isSelected ? '4px solid #2563eb' : '4px solid transparent',
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 100ms ease',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ minWidth: 0, flex: 1, paddingRight: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: isSelected ? 800 : 600, color: '#0f172a' }}>
                            {db.name}
                          </span>
                          <span style={{
                            background: eng.bg, color: eng.color,
                            padding: '1px 6px', borderRadius: 4, fontSize: '0.68rem', fontWeight: 700,
                          }}>
                            {eng.label}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 3 }}>
                          {db.department}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2, fontFamily: 'monospace' }}>
                          {db.host}:{db.port} · {db.latencyMs}ms ping
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <button
                          title="Sync database handshake"
                          disabled={isSyncing}
                          onClick={e => handleSync(e, db.id)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#64748b', padding: 4, borderRadius: 4,
                          }}
                        >
                          <RefreshCw size={13} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                        </button>

                        {!db.isDefault && (
                          <button
                            title="Disconnect database"
                            onClick={e => handleDelete(e, db.id)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#ef4444', padding: 4, borderRadius: 4,
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}

                        {isSelected && <Check size={18} color="#2563eb" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{
                padding: '10px 16px',
                borderTop: '1px solid #f1f5f9',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Admin privileges enabled
                </span>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsAddModalOpen(true);
                  }}
                  className="btn btn-primary"
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  <Plus size={12} />
                  Connect New DB
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
