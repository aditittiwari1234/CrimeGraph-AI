import { useEffect, useState } from 'react';
import { ChevronRight, FolderOpen, Plus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

interface InvestigationPreview {
  id: string;
  case_number: string;
  title: string;
  priority: string;
  entity_count: string;
  alert_count: string;
}

interface EntityPreview {
  id: string;
  nodeType: string;
  name?: string;
  number?: string;
  accountNumber?: string;
}

function entityLabel(entity: EntityPreview): string {
  return entity.name || entity.number || entity.accountNumber || entity.id;
}

export default function InspectorHomePage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<InvestigationPreview[]>([]);
  const [entities, setEntities] = useState<EntityPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/api/investigations?limit=5'),
      api.get('/api/entities/search?q=&limit=8'),
    ])
      .then(([casesResponse, entitiesResponse]) => {
        setCases(casesResponse.data.investigations || []);
        setEntities(entitiesResponse.data.entities || []);
      })
      .catch(() => setError('Unable to load the inspector workspace. Check the API connection and try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="empty-state"><div className="loading-spinner" style={{ width: 36, height: 36, borderWidth: 3 }} /></div>;
  }

  if (error) {
    return <div className="empty-state"><h3>Inspector workspace unavailable</h3><p>{error}</p></div>;
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Inspector Workspace</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Select an entity or case to review connected intelligence and investigation details.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/investigations')}>
          <Plus size={16} /> New Investigation
        </button>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <section className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Users size={18} color="#2563eb" />
              <div>
                <h2 style={{ fontSize: '1rem', marginBottom: 2 }}>Entities</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>People, phones, accounts, and connected records</p>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/entities')} title="View all entities">
              View all <ChevronRight size={14} />
            </button>
          </div>
          {entities.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No entities available.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {entities.slice(0, 5).map(entity => (
                <button key={`${entity.nodeType}-${entity.id}`} className="list-row" onClick={() => navigate(`/entities/${entity.nodeType}/${entity.id}`)}>
                  <span><strong>{entityLabel(entity)}</strong><small>{entity.nodeType} · {entity.id}</small></span>
                  <ChevronRight size={15} />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FolderOpen size={18} color="#7c3aed" />
              <div>
                <h2 style={{ fontSize: '1rem', marginBottom: 2 }}>Cases</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active investigations and assigned intelligence</p>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/investigations')} title="View all cases">
              View all <ChevronRight size={14} />
            </button>
          </div>
          {cases.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No cases available.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cases.slice(0, 5).map(investigation => (
                <button key={investigation.id} className="list-row" onClick={() => navigate(`/investigations/${investigation.case_number}`)}>
                  <span><strong>{investigation.title}</strong><small>{investigation.case_number} · {investigation.entity_count || 0} entities · {investigation.alert_count || 0} alerts</small></span>
                  <ChevronRight size={15} />
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="ai-disclaimer">Analytical leads require investigator review. This workspace does not make legal conclusions.</div>
    </div>
  );
}