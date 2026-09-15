import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import cytoscape from 'cytoscape';
import type { Core, NodeSingular } from 'cytoscape';
import {
  Search, ZoomIn, ZoomOut, Maximize2, RefreshCw, Filter,
  Download, Info, X, ChevronRight, Loader, Network, GitBranch
} from 'lucide-react';
import api from '../lib/api';
import { ALL_ENTITIES, GRAPH_EDGES, FIR_RECORDS } from '../data/dataset';

interface GraphNode {
  id: string;
  nodeType: string;
  name?: string;
  number?: string;
  licensePlate?: string;
  accountNumber?: string;
  [key: string]: unknown;
}

interface GraphEdge {
  id?: string;
  source: string;
  target: string;
  type: string;
  confidence?: number;
  timestamp?: string;
  relSource?: string;
  recordRef?: string;
}

interface OfficerSummary {
  id: string;
  full_name: string;
  role: string;
  badge_number?: string;
}

interface CaseSummary {
  id: string;
  case_number: string;
  title: string;
  assigned_to_name?: string;
  entity_count?: string;
}

const NODE_COLORS: Record<string, string> = {
  Person: '#3b82f6',
  Phone: '#22c55e',
  Vehicle: '#f97316',
  Organization: '#8b5cf6',
  Location: '#ef4444',
  Account: '#eab308',
  Case: '#06b6d4',
  Event: '#ec4899',
};

const NODE_SHAPES: Record<string, string> = {
  Person: 'ellipse',
  Phone: 'round-rectangle',
  Vehicle: 'diamond',
  Organization: 'hexagon',
  Location: 'star',
  Account: 'rectangle',
  Case: 'octagon',
  Event: 'vee',
};

const NODE_ICONS: Record<string, string> = {
  Person: '👤', Phone: '📱', Vehicle: '🚗',
  Organization: '🏢', Location: '📍', Account: '💳',
  Case: '📋', Event: '📅',
};

function getNodeLabel(node: GraphNode): string {
  return (node.name || node.number || node.licensePlate || node.accountNumber || node.id || '').substring(0, 20);
}

export default function NetworkGraphPage() {
  const [searchParams] = useSearchParams();
  const investigationCase = searchParams.get('investigation');
  const entityIdParam = searchParams.get('entityId') || searchParams.get('entity');
  const entityTypeParam = searchParams.get('entityType') || 'Person';
  const cyRef = useRef<HTMLDivElement>(null);
  const cyInstance = useRef<Core | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityType, setEntityType] = useState('');
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);
  const [filterTypes, setFilterTypes] = useState<Set<string>>(new Set());
  const [pathMode, setPathMode] = useState(false);
  const [pathNodes, setPathNodes] = useState<GraphNode[]>([]);
  const [pathLoading, setPathLoading] = useState(false);
  const [pathResult, setPathResult] = useState<Record<string, unknown>[] | null>(null);
  const [officers, setOfficers] = useState<OfficerSummary[]>([]);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [graphPeople, setGraphPeople] = useState<GraphNode[]>([]);

  const initCytoscape = useCallback(() => {
    if (!cyRef.current) return;

    if (cyInstance.current) {
      cyInstance.current.destroy();
    }

    const cy = cytoscape({
      container: cyRef.current,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele: NodeSingular) => NODE_COLORS[ele.data('nodeType')] || '#64748b',
            'shape': (ele: NodeSingular) => (NODE_SHAPES[ele.data('nodeType')] || 'ellipse') as any,
            'label': 'data(label)',
            'color': '#1e293b',
            'font-size': '10px',
            'font-family': 'Inter, sans-serif',
            'font-weight': '600',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': '4px',
            'width': 36,
            'height': 36,
            'border-width': 3,
            'border-color': 'white',
            'border-opacity': 1,
            'text-outline-width': 2,
            'text-outline-color': '#f0f4f8',
            'text-max-width': '90px',
            'text-wrap': 'ellipsis',
            'overlay-padding': '4px',
            'box-shadow': '0 2px 8px rgba(0,0,0,0.15)',
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#1e293b',
            'width': 44,
            'height': 44,
          },
        },
        {
          selector: 'node.highlighted',
          style: {
            'border-width': 4,
            'border-color': '#f59e0b',
          },
        },
        {
          selector: 'node.dimmed',
          style: { 'opacity': 0.2 },
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': '#94a3b8',
            'target-arrow-color': '#94a3b8',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'color': '#475569',
            'font-size': '9px',
            'font-weight': '500',
            'text-background-color': '#f0f4f8',
            'text-background-opacity': 0.9,
            'text-background-padding': '2px',
            'edge-text-rotation': 'autorotate',
            'opacity': 0.8,
          },
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#2563eb',
            'target-arrow-color': '#2563eb',
            'width': 2.5,
            'opacity': 1,
          },
        },
        {
          selector: 'edge.path-highlight',
          style: {
            'line-color': '#f59e0b',
            'target-arrow-color': '#f59e0b',
            'width': 3,
            'opacity': 1,
          },
        },
        {
          selector: 'edge.dimmed',
          style: { 'opacity': 0.08 },
        },
      ],
      layout: { name: 'cose', randomize: true, animate: false } as any,
      wheelSensitivity: 0.3,
      minZoom: 0.1,
      maxZoom: 5,
    });

    // Click on node
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      setSelectedNode(node.data());
      setSelectedEdge(null);

      if (pathMode) {
        setPathNodes(prev => {
          if (prev.length === 0) return [node.data()];
          if (prev.length === 1) return [...prev, node.data()];
          return [node.data()];
        });
      }

      // Highlight neighbors
      cy.elements().removeClass('highlighted dimmed');
      const neighborhood = node.closedNeighborhood();
      cy.elements().not(neighborhood).addClass('dimmed');
      neighborhood.addClass('highlighted');
    });

    // Click on edge
    cy.on('tap', 'edge', (evt) => {
      setSelectedEdge(evt.target.data());
      setSelectedNode(null);
    });

    // Click on background — clear selection
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null);
        setSelectedEdge(null);
        cy.elements().removeClass('highlighted dimmed');
      }
    });

    cyInstance.current = cy;
    return cy;
  }, [pathMode]);

  // Load the selected investigation network, or the overall network by default.
  useEffect(() => {
    const cy = initCytoscape();
    if (!cy) return;
    loadDemoNetwork(cy);
  }, [investigationCase, entityIdParam, entityTypeParam]);

  const renderGraph = (cy: Core, nodes: GraphNode[], edges: GraphEdge[]) => {
    cy.elements().remove();

    const nodeIds = new Set(nodes.map(n => n.id));

    // Ensure we never pass edges with missing source or target, which crashes Cytoscape!
    const validEdges = edges.filter(e => e && e.source && e.target && nodeIds.has(e.source) && nodeIds.has(e.target));

    const cyNodes = nodes.map(n => ({
      group: 'nodes' as const,
      data: {
        id: n.id,
        label: n.name || n.number || n.licensePlate || n.accountNumber || n.id,
        nodeType: n.nodeType,
        ...n,
      },
    }));

    const cyEdges = validEdges.map((e, i) => ({
      group: 'edges' as const,
      data: {
        id: e.id || `edge-${i}-${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        type: e.type,
        confidence: e.confidence || 0.8,
        label: e.type ? e.type.replace(/_/g, ' ') : '',
        relSource: e.relSource,
        recordRef: e.recordRef,
        timestamp: e.timestamp,
      },
    }));

    try {
      cy.add([...cyNodes, ...cyEdges]);
    } catch (err) {
      console.warn('Cytoscape add warning:', err);
    }

    try {
      cy.layout({
        name: 'cose',
        randomize: true,
        animate: true,
        animationDuration: 800,
        componentSpacing: 100,
        nodeRepulsion: () => 8000,
        idealEdgeLength: () => 100,
        edgeElasticity: () => 100,
      } as any).run();
    } catch (err) {
      console.warn('Cytoscape layout warning:', err);
    }

    setNodeCount(cyNodes.length);
    setEdgeCount(cyEdges.length);
    setGraphPeople(nodes.filter(node => node.nodeType === 'Person').slice(0, 12));

    if (entityIdParam) {
      setTimeout(() => {
        const target = cy.$(`node[id = "${entityIdParam}"]`);
        if (target && target.length > 0) {
          setSelectedNode(target.data());
          cy.elements().removeClass('highlighted dimmed');
          const neighborhood = target.closedNeighborhood();
          cy.elements().not(neighborhood).addClass('dimmed');
          neighborhood.addClass('highlighted');
          cy.animate({ center: { eles: target }, zoom: 1.5, duration: 400 });
        }
      }, 600);
    }
  };

  const renderInvestigationFallback = (cy: Core, caseRef: string) => {
    const normalized = caseRef.trim().toLowerCase();
    const targetFir = FIR_RECORDS.find(f =>
      f.id.toLowerCase() === normalized ||
      f.firNumber.toLowerCase() === normalized ||
      f.firNumber.toLowerCase().replace('fir-', 'case-') === normalized ||
      normalized.includes(f.id.toLowerCase()) ||
      normalized.includes(f.firNumber.toLowerCase())
    ) || FIR_RECORDS[0];

    const linkedIds = new Set<string>(targetFir.linkedEntities || []);
    linkedIds.add(targetFir.id);

    // Include 1st degree neighbor nodes connected via GRAPH_EDGES
    GRAPH_EDGES.forEach(e => {
      if (linkedIds.has(e.source)) linkedIds.add(e.target);
      if (linkedIds.has(e.target)) linkedIds.add(e.source);
    });

    const demoNodes: GraphNode[] = (ALL_ENTITIES as any[])
      .filter(e => linkedIds.has(e.id))
      .map(e => ({
        id: e.id,
        nodeType: e.nodeType,
        name: e.name || e.number || e.licensePlate || e.accountNumber || e.id,
        ...e,
      }));

    if (!demoNodes.some(n => n.id === targetFir.id)) {
      demoNodes.push({
        id: targetFir.id,
        nodeType: 'Case',
        name: targetFir.firNumber,
        firNumber: targetFir.firNumber,
        ...targetFir,
      });
    }

    const nodeIds = new Set(demoNodes.map(n => n.id));
    const demoEdges: GraphEdge[] = GRAPH_EDGES
      .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map((e, i) => ({
        id: `e-inv-${i}`,
        source: e.source,
        target: e.target,
        type: e.type,
        confidence: e.confidence,
        relSource: (e as any).source_ref || 'CASE_INTELLIGENCE_LINK',
      }));

    // Ensure edges connecting FIR to its linked entities exist
    (targetFir.linkedEntities || []).forEach((entityId, idx) => {
      if (nodeIds.has(entityId)) {
        const alreadyHasEdge = demoEdges.some(
          e => (e.source === entityId && e.target === targetFir.id) || (e.source === targetFir.id && e.target === entityId)
        );
        if (!alreadyHasEdge) {
          demoEdges.push({
            id: `fir-link-${idx}`,
            source: entityId,
            target: targetFir.id,
            type: 'APPEARED_IN_CASE',
            confidence: 0.99,
            relSource: targetFir.firNumber,
          });
        }
      }
    });

    renderGraph(cy, demoNodes, demoEdges);
  };

  const renderEntityFallback = (cy: Core, entityId: string, fallbackType: string) => {
    const focusIds = new Set<string>([entityId]);

    // 1-hop neighbors
    GRAPH_EDGES.forEach(e => {
      if (e.source === entityId) focusIds.add(e.target);
      if (e.target === entityId) focusIds.add(e.source);
    });

    // 2-hop neighbors (capped to 40 nodes to maintain performance and clarity)
    const firstHop = Array.from(focusIds);
    for (const id of firstHop) {
      if (focusIds.size >= 40) break;
      GRAPH_EDGES.forEach(e => {
        if (focusIds.size >= 40) return;
        if (e.source === id) focusIds.add(e.target);
        if (e.target === id) focusIds.add(e.source);
      });
    }

    const demoNodes: GraphNode[] = (ALL_ENTITIES as any[])
      .filter(e => focusIds.has(e.id))
      .map(e => ({
        id: e.id,
        nodeType: e.nodeType,
        name: e.name || e.number || e.licensePlate || e.accountNumber || e.id,
        ...e,
      }));

    if (!demoNodes.some(n => n.id === entityId)) {
      demoNodes.push({
        id: entityId,
        nodeType: fallbackType || 'Person',
        name: entityId,
      });
      focusIds.add(entityId);
    }

    const nodeIds = new Set(demoNodes.map(n => n.id));
    const demoEdges: GraphEdge[] = GRAPH_EDGES
      .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map((e, i) => ({
        id: `e-ent-${i}`,
        source: e.source,
        target: e.target,
        type: e.type,
        confidence: e.confidence,
        relSource: (e as any).source_ref || 'ENTITY_NETWORK_EXPANSION',
      }));

    renderGraph(cy, demoNodes, demoEdges);
  };

  const renderDemoGraph = (cy: Core) => {
    const demoNodes: GraphNode[] = (ALL_ENTITIES as any[]).map(e => ({
      id: e.id,
      nodeType: e.nodeType,
      name: e.name || e.number || e.licensePlate || e.accountNumber || e.id,
      ...e,
    }));

    const demoEdges = GRAPH_EDGES.map((e, i) => ({
      id: `e-${i}`,
      source: e.source,
      target: e.target,
      type: e.type,
      confidence: e.confidence,
      relSource: (e as any).source_ref || 'INTERPOL_NCRB_FEED',
    }));

    renderGraph(cy, demoNodes, demoEdges);
  };

  const loadDemoNetwork = async (cy?: Core) => {
    const instance = cy || cyInstance.current;
    if (!instance) return;
    setLoading(true);

    let fetchedNodes: GraphNode[] | null = null;
    let fetchedEdges: GraphEdge[] | null = null;

    try {
      const res = investigationCase
        ? await api.get(`/api/graph/investigation/${encodeURIComponent(investigationCase)}`)
        : entityIdParam
          ? await api.get(`/api/entities/${encodeURIComponent(entityTypeParam)}/${encodeURIComponent(entityIdParam)}/network?depth=2&limit=80`)
          : await api.get('/api/entities/Person/P001/network?depth=2&limit=80');

      if (res.data?.nodes && res.data.nodes.length > 0) {
        fetchedNodes = res.data.nodes;
        fetchedEdges = res.data.edges || [];
      }
    } catch {
      // API request failed or Neo4j offline; proceed to fallback
    } finally {
      setLoading(false);
    }

    if (fetchedNodes && fetchedNodes.length > 0) {
      renderGraph(instance, fetchedNodes, fetchedEdges || []);
    } else {
      if (investigationCase) {
        renderInvestigationFallback(instance, investigationCase);
      } else if (entityIdParam) {
        renderEntityFallback(instance, entityIdParam, entityTypeParam);
      } else {
        renderDemoGraph(instance);
      }
    }
  };

  useEffect(() => {
    if (investigationCase || entityIdParam) return;
    Promise.all([
      api.get('/api/investigations/officers'),
      api.get('/api/investigations?limit=50'),
    ]).then(([officerResponse, caseResponse]) => {
      setOfficers(officerResponse.data.officers || []);
      setCases(caseResponse.data.investigations || []);
    }).catch(() => {
      setOfficers([]);
      setCases([]);
    });
  }, [investigationCase, entityIdParam]);

  const handleSearch = async () => {
    if (!searchTerm || !cyInstance.current) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/entities/search?q=${encodeURIComponent(searchTerm)}&type=${entityType}&limit=5`);
      const entities = res.data?.entities || [];
      if (entities.length > 0) {
        const first = entities[0];
        try {
          const netRes = await api.get(`/api/entities/${first.nodeType}/${first.id}/network?depth=2&limit=60`);
          if (netRes.data?.nodes && netRes.data.nodes.length > 0) {
            renderGraph(cyInstance.current, netRes.data.nodes, netRes.data.edges || []);
            return;
          }
        } catch {
          // fall through to local fallback
        }
        renderEntityFallback(cyInstance.current, first.id, first.nodeType);
      } else {
        const localMatch = (ALL_ENTITIES as any[]).find(e => {
          const label = (e.name || e.number || e.licensePlate || e.accountNumber || e.id || '').toLowerCase();
          const matchTerm = label.includes(searchTerm.toLowerCase());
          return entityType ? matchTerm && e.nodeType === entityType : matchTerm;
        });
        if (localMatch) {
          renderEntityFallback(cyInstance.current, localMatch.id, localMatch.nodeType);
        }
      }
    } catch {
      const localMatch = (ALL_ENTITIES as any[]).find(e => {
        const label = (e.name || e.number || e.licensePlate || e.accountNumber || e.id || '').toLowerCase();
        const matchTerm = label.includes(searchTerm.toLowerCase());
        return entityType ? matchTerm && e.nodeType === entityType : matchTerm;
      });
      if (localMatch && cyInstance.current) {
        renderEntityFallback(cyInstance.current, localMatch.id, localMatch.nodeType);
      }
    } finally {
      setLoading(false);
    }
  };

  const expandNode = async (node: GraphNode) => {
    if (!cyInstance.current || !node.nodeType) return;
    setLoading(true);
    try {
      const res = await api.post('/api/graph/expand', { nodeId: node.id, nodeType: node.nodeType, limit: 20 });
      const { nodes = [], edges = [] } = res.data || {};
      const existingIds = new Set(cyInstance.current.nodes().map((n: any) => n.id()));

      const newNodes = nodes.filter((n: GraphNode) => !existingIds.has(n.id));
      const newCyNodes = newNodes.map((n: GraphNode) => ({
        data: { id: n.id, label: getNodeLabel(n), nodeType: n.nodeType, ...n },
      }));

      const allKnownIds = new Set([...existingIds, ...newNodes.map((n: GraphNode) => n.id)]);
      const validNewEdges = edges.filter((e: GraphEdge) => e && e.source && e.target && allKnownIds.has(e.source) && allKnownIds.has(e.target));
      const newEdges = validNewEdges.map((e: GraphEdge, i: number) => ({
        data: { id: e.id || `expand-${i}-${e.source}-${e.target}`, source: e.source, target: e.target, label: e.type?.replace(/_/g, ' '), ...e },
      }));

      try {
        cyInstance.current.add([...newCyNodes, ...newEdges]);
        cyInstance.current.layout({ name: 'cose', randomize: false, animate: true, animationDuration: 600 } as any).run();
      } catch (err) {
        console.warn('Expand layout warning:', err);
      }
      setNodeCount(cyInstance.current.nodes().length);
      setEdgeCount(cyInstance.current.edges().length);
    } catch {
      // No-op
    } finally {
      setLoading(false);
    }
  };

  const findPath = async () => {
    if (pathNodes.length < 2) return;
    setPathLoading(true);
    try {
      const [from, to] = pathNodes;
      const res = await api.post('/api/graph/path', {
        fromId: from.id, fromType: from.nodeType,
        toId: to.id, toType: to.nodeType, maxHops: 6,
      });
      setPathResult(res.data.paths || []);

      // Highlight path in graph
      if (cyInstance.current && res.data.paths.length > 0) {
        const pathNodeIds = new Set<string>();
        res.data.paths[0].nodes?.forEach((n: any) => pathNodeIds.add(n.id));
        cyInstance.current.elements().removeClass('path-highlight highlighted dimmed');
        cyInstance.current.nodes().forEach((n: any) => {
          if (!pathNodeIds.has(n.id())) n.addClass('dimmed');
          else n.addClass('highlighted');
        });
        cyInstance.current.edges().addClass('dimmed');
        cyInstance.current.edges().filter((e: any) =>
          pathNodeIds.has(e.source().id()) && pathNodeIds.has(e.target().id())
        ).removeClass('dimmed').addClass('path-highlight');
      }
    } catch {
      // No-op
    } finally {
      setPathLoading(false);
    }
  };

  const resetGraph = () => {
    if (cyInstance.current) {
      cyInstance.current.elements().removeClass('highlighted dimmed path-highlight');
      cyInstance.current.fit(undefined, 40);
    }
    setPathNodes([]);
    setPathResult(null);
    setSelectedNode(null);
    setSelectedEdge(null);
  };

  const exportGraph = () => {
    if (!cyInstance.current) return;
    const png = cyInstance.current.png({ output: 'blob', scale: 2, bg: '#080c18' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(png);
    a.download = `crimegraph-network-${Date.now()}.png`;
    a.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--topbar-height) - 48px)', gap: 12 }}>
      {!investigationCase && !entityIdParam && (
        <div className="card" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', marginBottom: 2 }}>Investigator Network Overview</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Inspectors, assigned cases, and people represented in the overall graph</p>
            </div>
            <span className="badge badge-info">{graphPeople.length} people in view</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <div className="stat-label" style={{ marginBottom: 6 }}>Inspectors</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {officers.slice(0, 4).map(officer => <span key={officer.id} className="badge badge-neutral">{officer.full_name}</span>)}
                {officers.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No officers loaded</span>}
              </div>
            </div>
            <div>
              <div className="stat-label" style={{ marginBottom: 6 }}>Assigned Cases</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 54, overflowY: 'auto' }}>
                {cases.slice(0, 3).map(item => <span key={item.id} style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{item.case_number} · {item.assigned_to_name || 'Unassigned'}</span>)}
                {cases.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No cases loaded</span>}
              </div>
            </div>
            <div>
              <div className="stat-label" style={{ marginBottom: 6 }}>People in Graph</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {graphPeople.slice(0, 4).map(person => <span key={person.id} className="badge badge-neutral">{getNodeLabel(person)}</span>)}
                {graphPeople.length > 4 && <span className="badge badge-info">+{graphPeople.length - 4} more</span>}
              </div>
            </div>
          </div>
        </div>
      )}
      {investigationCase && (
        <div className="ai-disclaimer">Focused investigation graph: <strong>{investigationCase}</strong>. Expand nodes to inspect related people, accounts, locations, and communications.</div>
      )}
      {entityIdParam && (
        <div className="ai-disclaimer">
          Focused entity graph: <strong>{entityTypeParam} · {entityIdParam}</strong>. Exploring connections, direct relationships, and link predictions.
        </div>
      )}
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Network size={18} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '1.1rem' }}>Network Graph</h2>
        </div>

        <div style={{ flex: 1, display: 'flex', gap: 8, maxWidth: 500 }}>
          <select
            className="form-select"
            value={entityType}
            onChange={e => setEntityType(e.target.value)}
            style={{ width: 120 }}
          >
            <option value="">All Types</option>
            {['Person', 'Phone', 'Vehicle', 'Organization', 'Location', 'Account', 'Case', 'Event'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search size={14} className="search-icon" />
            <input
              type="text" className="form-input"
              placeholder="Search entity to focus..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleSearch}>Search</button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          {/* Path finder */}
          <button
            className={`btn btn-sm ${pathMode ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setPathMode(v => !v); setPathNodes([]); setPathResult(null); }}
            title="Find shortest path between two nodes"
          >
            <GitBranch size={14} /> Path Finder
          </button>
          <button className="btn btn-secondary btn-sm" onClick={resetGraph} title="Reset view">
            <RefreshCw size={14} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => cyInstance.current?.zoom({ level: cyInstance.current.zoom() * 1.2 })} title="Zoom in">
            <ZoomIn size={14} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => cyInstance.current?.zoom({ level: cyInstance.current.zoom() * 0.8 })} title="Zoom out">
            <ZoomOut size={14} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => cyInstance.current?.fit(undefined, 40)} title="Fit all">
            <Maximize2 size={14} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={exportGraph} title="Export as PNG">
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Path finder bar */}
      {pathMode && (
        <div style={{
          padding: '10px 14px', background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10,
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <GitBranch size={14} color="var(--accent-primary)" />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Path Finder: Click on <strong>Node 1</strong> then <strong>Node 2</strong> in the graph to find the shortest path.
          </span>
          {pathNodes.map((n, i) => (
            <span key={i} className="badge badge-info">
              Node {i + 1}: {getNodeLabel(n)} ({n.nodeType})
            </span>
          ))}
          {pathNodes.length === 2 && (
            <button className="btn btn-primary btn-sm" onClick={findPath} disabled={pathLoading}>
              {pathLoading ? <Loader size={14} className="loading-spinner" /> : 'Find Path'}
            </button>
          )}
          {pathResult && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {pathResult.length > 0 ? `✅ ${pathResult.length} path(s) found` : '❌ No path found'}
            </span>
          )}
        </div>
      )}

      {/* Main graph area */}
      <div style={{ flex: 1, display: 'flex', gap: 12, minHeight: 0 }}>
        {/* Graph canvas */}
        <div className="graph-container" style={{ flex: 1, position: 'relative' }}>
          {loading && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
              background: 'rgba(8, 12, 24, 0.7)', zIndex: 10, borderRadius: 14,
            }}>
              <div className="loading-spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading network graph...</span>
            </div>
          )}

          <div ref={cyRef} style={{ width: '100%', height: '100%' }} />

          {/* Graph stats overlay */}
          <div style={{
            position: 'absolute', bottom: 12, left: 12,
            display: 'flex', gap: 8, flexWrap: 'wrap',
          }}>
            <div style={{
              padding: '4px 10px', background: 'rgba(255,255,255,0.92)',
              border: '1px solid var(--border-primary)', borderRadius: 6,
              fontSize: '0.72rem', color: 'var(--text-tertiary)',
              boxShadow: 'var(--shadow-sm)',
            }}>
              {nodeCount} nodes · {edgeCount} edges
            </div>
            <div className="ai-disclaimer" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>
              Graph shows analytical relationships — not proof of wrongdoing
            </div>
          </div>

          {/* Node Legend */}
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: 'rgba(255,255,255,0.95)', border: '1px solid var(--border-primary)',
            borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5,
            boxShadow: 'var(--shadow-md)',
          }}>
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'block', flexShrink: 0 }} />
                {NODE_ICONS[type]} {type}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — entity details */}
        {(selectedNode || selectedEdge) && (
          <div className="slide-in-right" style={{
            width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12,
            overflowY: 'auto', maxHeight: '100%',
          }}>
            {selectedNode && (
              <div className="card" style={{ flex: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: '1.2rem' }}>{NODE_ICONS[selectedNode.nodeType]}</span>
                      <span className={`badge badge-${selectedNode.nodeType?.toLowerCase()}`}>{selectedNode.nodeType}</span>
                    </div>
                    <h3 style={{ fontSize: '1rem' }}>{getNodeLabel(selectedNode)}</h3>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedNode(null); if (cyInstance.current) cyInstance.current.elements().removeClass('highlighted dimmed'); }}>
                    <X size={14} />
                  </button>
                </div>

                {/* Entity properties */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Object.entries(selectedNode)
                    .filter(([k]) => !['id', 'nodeType', 'createdAt', 'communityId'].includes(k))
                    .filter(([, v]) => v !== null && v !== undefined && v !== '')
                    .map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', gap: 8, fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize', width: 100, flexShrink: 0 }}>
                          {k.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </span>
                        <span style={{ color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                          {String(v).substring(0, 60)}
                        </span>
                      </div>
                    ))}
                </div>

                <div style={{ marginTop: 14, display: 'flex', gap: 6 }}>
                  <button className="btn btn-primary btn-sm" onClick={() => expandNode(selectedNode)}>
                    <ChevronRight size={12} /> Expand
                  </button>
                  <a
                    href={`/entities/${selectedNode.nodeType}/${selectedNode.id}`}
                    className="btn btn-secondary btn-sm"
                    target="_blank"
                  >
                    <Info size={12} /> Full Profile
                  </a>
                </div>
              </div>
            )}

            {selectedEdge && (
              <div className="card" style={{ flex: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h4 style={{ fontSize: '0.875rem' }}>Relationship Details</h4>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedEdge(null)}>
                    <X size={14} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{
                    padding: '8px 10px', background: 'var(--bg-tertiary)',
                    borderRadius: 6, textAlign: 'center', fontSize: '0.875rem',
                    fontWeight: 600, color: 'var(--text-accent)',
                  }}>
                    {selectedEdge.type?.replace(/_/g, ' ')}
                  </div>
                  {[
                    { label: 'Confidence', value: selectedEdge.confidence ? `${Math.round(Number(selectedEdge.confidence) * 100)}%` : '—' },
                    { label: 'Timestamp', value: selectedEdge.timestamp ? new Date(selectedEdge.timestamp).toLocaleString('en-IN') : '—' },
                    { label: 'Source', value: selectedEdge.relSource || '—' },
                    { label: 'Record Ref', value: selectedEdge.recordRef || '—' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', gap: 8, fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)', width: 90, flexShrink: 0 }}>{item.label}</span>
                      <span style={{ color: 'var(--text-secondary)', fontFamily: item.label === 'Record Ref' ? 'var(--font-mono)' : undefined }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="ai-disclaimer" style={{ marginTop: 10 }}>
                  Relationship shown is based on recorded data. Does not imply criminal activity.
                </div>
              </div>
            )}

            {/* Path result panel */}
            {pathResult && pathResult.length > 0 && (
              <div className="card" style={{ flex: 'none' }}>
                <h4 style={{ fontSize: '0.875rem', marginBottom: 10 }}>Path Analysis Results</h4>
                {pathResult.map((path: any, i: number) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                      Path {i + 1} ({path.length} hops):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {path.nodes?.map((n: any, j: number) => (
                        <span key={j} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <span className={`badge badge-${n.nodeType?.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                            {n.name || n.id}
                          </span>
                          {j < path.nodes.length - 1 && <ChevronRight size={10} color="var(--text-muted)" />}
                        </span>
                      ))}
                    </div>
                    <div className="ai-disclaimer" style={{ marginTop: 6, fontSize: '0.72rem' }}>
                      {path.disclaimer || 'Analytical lead — requires investigator review'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
