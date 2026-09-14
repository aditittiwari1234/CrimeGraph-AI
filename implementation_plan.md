# CrimeGraph AI — SIH Prototype Implementation Plan

## Overview

Build **CrimeGraph AI**, a production-quality AI-powered Criminal Network Analysis and Investigation Platform for the Ministry of Home Affairs / NCRB. This is a monorepo containing a React frontend, Express/Node backend, Python FastAPI AI service, and infrastructure configs.

---

## Architecture

```
crimegraph-ai/
├── apps/
│   ├── web/          # React 19 + Vite + TypeScript + Tailwind
│   ├── api/          # Node.js + Express + TypeScript
│   └── ai/           # Python + FastAPI + spaCy + sklearn
├── packages/
│   ├── shared/       # Shared utilities
│   └── types/        # TypeScript type definitions
├── infrastructure/
│   ├── docker/       # Docker Compose
│   ├── neo4j/        # Neo4j configs + Cypher seeds
│   └── postgres/     # PostgreSQL migrations
├── scripts/          # Seed scripts, setup utilities
├── docs/             # Architecture, API docs
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, React Router v6, Axios, Recharts, Cytoscape.js |
| Backend API | Node.js, Express, TypeScript, Socket.IO, JWT, bcrypt |
| AI Service | Python, FastAPI, spaCy, scikit-learn, transformers |
| Graph DB | Neo4j (Cypher) |
| Relational DB | PostgreSQL |
| Cache/Queue | Redis (optional, simulated) |
| Security | Helmet, CORS, express-validator, express-rate-limit |
| Audit | Tamper-evident hash chain (blockchain-inspired) |

---

## Implementation Phases

### Phase 1 — Foundation ✅ (Current)
- Monorepo project structure
- PostgreSQL schema + migrations
- Neo4j schema + constraints + seed data (100+ persons, relationships)
- Express API with authentication (JWT, refresh tokens, RBAC)
- React frontend: Auth pages, layout, dark professional theme
- Basic Dashboard with synthetic KPIs

### Phase 2 — Entity Model + Graph APIs
- Entity CRUD (Person, Phone, Vehicle, Org, Location, Account, Case, Event)
- Neo4j relationship APIs
- Graph expand/collapse endpoints
- Entity search with fuzzy matching

### Phase 3 — Interactive Network Graph
- Cytoscape.js graph visualization
- Node types with distinct icons/colors
- Edge labels with relationship metadata
- Zoom, pan, drag, expand, collapse
- Shortest path, filter, highlight

### Phase 4 — Synthetic Data + CDR/Financial
- 500+ CDR records seeded
- 300+ financial transactions
- CDR analysis module (frequency, clusters, spikes)
- Financial network analysis (circular transactions, structuring patterns)

### Phase 5 — Graph Analytics
- Degree/betweenness/PageRank/eigenvector centrality
- Louvain community detection
- Anomaly detection (Isolation Forest style, statistical thresholding)
- Influence indicators

### Phase 6 — Document NLP Pipeline
- File upload endpoint
- spaCy NER (persons, locations, phones, vehicles, orgs)
- Relationship extraction from text
- Entity linking to graph

### Phase 7 — AI Investigation Assistant
- FastAPI chat endpoint
- Query understanding (pattern matching + NLP)
- Graph-grounded responses with evidence citations
- Hallucination prevention

### Phase 8 — Evidence Integrity / Blockchain Layer
- SHA-256 hash chain for evidence records
- Tamper-evident ledger (PostgreSQL append-only table)
- Evidence verification endpoint + UI

### Phase 9 — Security Hardening
- Rate limiting per role
- Input validation middleware
- Audit log hardening
- Security headers review

### Phase 10 — SIH Demo Polish
- End-to-end demo scenario (Person A → C chain)
- Timeline polish
- Export graph feature
- Presentation-ready UI

---

## Database Schema (PostgreSQL)

**Tables:**
- `users` — investigators with roles + bcrypt passwords
- `investigations` — case workspaces
- `investigation_entities` — entities added to an investigation
- `documents` — uploaded files with metadata
- `evidence_records` — source evidence with hash chain
- `audit_logs` — tamper-evident action log
- `alerts` — anomaly/anomaly alerts

**Neo4j Node Labels:**
- `:Person`, `:Phone`, `:Vehicle`, `:Organization`, `:Location`, `:Account`, `:Case`, `:Event`

**Neo4j Relationship Types:**
- `CALLS`, `MESSAGES`, `FINANCIAL_TRANSACTION`, `ASSOCIATED_WITH`, `LOCATED_AT`, `OWNS`, `WORKS_FOR`, `RELATED_TO`, `APPEARED_IN_CASE`, `SHARED_LOCATION`, `SHARED_VEHICLE`, `SHARED_CONTACT`, `ATTENDED_EVENT`

Each relationship carries properties: `source`, `timestamp`, `confidence`, `recordRef`, `evidenceId`

---

## Security Architecture

- **Authentication:** JWT (15min) + Refresh Token (7 days) stored httpOnly cookie
- **Password:** bcrypt (cost 12) or Argon2
- **RBAC Roles:** `investigator`, `senior_investigator`, `analyst`, `administrator`
- **Middleware:** Helmet, CORS (whitelist), express-rate-limit, express-validator
- **Audit:** Every sensitive action logged with user + IP + timestamp + result hash

## Responsible AI Safeguards

- All AI outputs labeled: "Analytical Lead — Requires Investigator Review"
- Confidence scores always shown
- Evidence citations mandatory for every insight
- No demographic profiling
- Explicit "NOT CONFIRMED" watermark on predicted links
- AI assistant refuses to assert guilt

---

## Verification Plan

- `npm run dev` starts all services
- Demo login: `admin@crimegraph.ai / Demo@1234`
- Seed data loaded automatically on first run
- End-to-end demo scenario verifiable through UI
