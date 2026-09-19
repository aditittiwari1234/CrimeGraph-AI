<div align="center">

# 🛡️ CrimeGraph AI
### AI-Powered Criminal Network Analysis & Forensic Investigation Platform
**Smart India Hackathon (SIH) Prototype · Ministry of Home Affairs / NCRB**

[![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Cytoscape.js](https://img.shields.io/badge/Cytoscape.js-Graph_Engine-ea580c?style=for-the-badge)](https://js.cytoscape.org/)
[![Neo4j](https://img.shields.io/badge/Neo4j-Graph_Database-008cc1?style=for-the-badge&logo=neo4j&logoColor=white)](https://neo4j.com/)
[![License](https://img.shields.io/badge/License-Government_Use_Only-critical?style=for-the-badge)](LICENSE)

<p align="center">
  <b>Unifying disparate intelligence—FIR records, Call Detail Records (CDRs), Hawala transactions, and shell corporations—into an interactive Knowledge Graph to expose hidden kingpins and preserve legal chain of custody.</b>
</p>

[Key Features](#-key-features) •
[Architecture](#-system-architecture) •
[Quickstart](#-quickstart-guide) •
[Graph Algorithms](#-graph-algorithms--ai) •
[Chain of Custody](#-legal-chain-of-custody--integrity) •
[Presentation Guide](#-sih-presentation-deck--demo-flow)

</div>

---

## 📌 Problem Statement

In modern organized crime and financial fraud syndicates, conspirators intentionally operate across fragmented channels to evade detection:
* **Siloed Records:** Police FIRs, telecom CDR dumps, bank statements, and vehicle registries sit in disconnected departmental databases or Excel sheets.
* **Hidden Kingpins:** Syndicate leaders rarely communicate directly with field operatives; they route orders and illicit capital through 3–5 degrees of intermediaries, prepaid burner SIMs, and shell accounts.
* **Evidence Inadmissibility:** Digital evidence frequently gets challenged or dismissed in Indian courtrooms due to broken or unverifiable **Chain of Custody** (Section 65B Indian Evidence Act).

---

## 💡 Solution: CrimeGraph AI

**CrimeGraph AI** is an end-to-end investigative workspace engineered for law enforcement agencies (NCRB, State Police Special Cells, and Financial Intelligence Units):

1. **Heterogeneous Knowledge Graph:** Combines 8 distinct entity types (`Person`, `Phone`, `Vehicle`, `Organization`, `Location`, `Account`, `Case`, `Event`) and 13 relational edge types into an interactive multi-hop graph.
2. **Kingpin & Cluster Identification:** Utilizes graph theory algorithms (PageRank, Betweenness Centrality, and Louvain Community Detection) to highlight critical nodes operating behind proxy actors.
3. **AI Investigation Assistant:** Graph-grounded conversational agent that answers complex natural language investigative queries with mandatory source citations (preventing AI hallucination).
4. **Cryptographic Chain of Custody:** Implements a tamper-evident SHA-256 hash chain ledger for every piece of digital evidence and case modification.
5. **Instant Dossier Generation:** Generates one-click, court-ready printable NCRB Investigation Dossiers with suspect dossiers, transaction trails, and verification hashes.

---

## 🏗️ System Architecture

```
                                  CRIMEGRAPH AI ARCHITECTURE
                                  
   +-----------------------------------------------------------------------------------+
   |                             RAW INTELLIGENCE INGESTION                            |
   |   [Police FIR Reports]   [Telecom CDR Dumps]   [Bank Statements]   [Vahan Records]|
   +------------------------------------------+----------------------------------------+
                                              |
                                              v
   +-----------------------------------------------------------------------------------+
   |                           CORE PROCESSING & GRAPH ENGINE                          |
   |   - Entity Resolution & Fuzzy Disambiguation                                      |
   |   - Neo4j Cypher Property Graph (Nodes, Edges, Confidence Scores)                 |
   |   - PostgreSQL Relational Store (Investigators, Cases, Tamper-Evident Ledger)     |
   +------------------------------------------+----------------------------------------+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
                     v                                                 v
   +------------------------------------+            +---------------------------------+
   |      AI & ANALYTICS PIPELINE       |            |   CRYPTOGRAPHIC INTEGRITY LAYER |
   | - Degree & Betweenness Centrality  |            | - SHA-256 Incremental Hash Chain|
   | - Louvain Community Clustering     |            | - Immutable Action Audit Trail  |
   | - Grounded LLM Investigation Agent |            | - Sec. 65B Evidentiary Seal     |
   +-----------------+------------------+            +----------------+----------------+
                     |                                                 |
                     +------------------------+------------------------+
                                              |
                                              v
   +-----------------------------------------------------------------------------------+
   |                          INVESTIGATOR FRONTEND (REACT 19)                         |
   |   [Interactive Network Canvas]  [Temporal Event Timeline]  [Forensic Dossier PDF] |
   |   [AI Query Assistant]          [Real-Time Anomaly Alerts] [Evidence Chain UI]    |
   +-----------------------------------------------------------------------------------+
```

---

## ✨ Key Features

### 1. Interactive Cytoscape Graph Canvas
* **Force-Directed Layout:** Smooth, physics-based `cose` visualization that naturally clusters criminal organizations and reveals bridge nodes.
* **Multi-Attribute Filtering:** Filter instantaneously by entity type (Person, Phone, Vehicle, Shell Company) or relation confidence threshold.
* **Shortest Path & Degree Expansion:** Trace the exact intermediary chain between any two suspects with 1 click.
* **High-Res Snapshot & Export:** Export canvas views directly as high-resolution PNGs for incident boards.

### 2. Official NCRB Investigation Dossier
* Generate official, court-ready investigative dossiers on demand.
* Displays verified suspect profiles, degree centrality ratings, flagged financial links, and cryptographic tamper-proof validation hashes.
* Print-optimized styling for direct filing in magistrate courts.

### 3. AI Investigation Assistant
* Natural language querying built specifically for detectives and analysts.
* Answers questions like *"Who is the critical financial bridge to Tariq?"* or *"Summarize suspicious off-hour CDR spikes in June"*.
* Grounded strictly in case datasets with mandatory citation references to prevent hallucinations.

### 4. Tamper-Evident Blockchain-Inspired Evidence Ledger
* Every uploaded document, wiretap transcript, and FIR reference receives an incremental SHA-256 hash linked to previous entries.
* Guarantees that neither defense lawyers nor corrupted actors can alter evidence without invalidating the mathematical chain.

---

## 🔬 Graph Algorithms & AI

| Algorithm | Real-World Investigative Application |
|---|---|
| **Degree Centrality** | Identifies telecom switchboards, burner phone operators, or hyper-connected organizers. |
| **Betweenness Centrality** | Exposes the "Bridge" entities—money couriers or intermediaries connecting separate crime syndicates. |
| **PageRank Influence** | Uncovers the true **Kingpins** who maintain minimal direct calls but hold maximum transitive authority. |
| **Louvain Community Detection** | Automatically partitions 10,000+ records into distinct gang factions and financial laundering circles. |
| **Dijkstra Shortest Path** | Proves the exact contact sequence connecting an underworld boss to a street-level perpetrator. |

---

## 🔒 Legal Chain of Custody & Integrity

Under the **Indian Evidence Act (Section 65B)** and the **Bharatiya Sakshya Adhiniyam (BSA)**, digital evidence presented in court requires demonstrable proof that it was not altered following seizure:

$$\text{Block Hash}_n = \text{SHA256}(\text{Record}_n \,\|\, \text{Timestamp} \,\|\, \text{Investigator ID} \,\|\, \text{Block Hash}_{n-1})$$

Any modification to historical records breaks the hash chain, immediately alerting the senior investigative officer and flagging the audit log.

---

## 🚀 Quickstart Guide

### Prerequisites
* **Node.js** v18 or higher (v24 tested & recommended)
* **npm** v9 or higher

### 1. Clone & Install
```bash
git clone https://github.com/divyanshisr1060-cmd/CrimeGraph-AI.git
cd CrimeGraph-AI
npm install
```

### 2. Start the Frontend Application
```bash
npm run dev:web
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 3. Default Demo Credentials
The prototype includes a zero-dependency offline mode with pre-seeded NCRB investigation cases:

| Role | Username / Email | Password | Access Level |
|---|---|---|---|
| **Master Administrator** | `admin` / `admin@crimegraph.ai` | `Demo@1234` | Full System Access, Audit Log Inspection |
| **Senior Investigator** | `singh_si` / `inspector.singh@ncrb.gov.in` | `Demo@1234` | Case Management, Dossier Export, Graph Analysis |
| **Field Investigator** | `verma_inv` | `Demo@1234` | Entity Linking, Evidence Upload |
| **Intelligence Analyst** | `analyst_gupta` | `Demo@1234` | AI Query Assistant, Anomaly Detection |

---

## 📂 Project Structure

```
crimegraph-ai/
├── apps/
│   ├── web/                     # React 19 + Vite + Cytoscape.js Frontend
│   │   ├── src/
│   │   │   ├── components/      # UI components, layout, modals
│   │   │   ├── contexts/        # Auth and Database state contexts
│   │   │   ├── data/            # Pre-seeded NCRB crime syndicates & CDR datasets
│   │   │   ├── lib/             # AI local engine, API client, permissions
│   │   │   └── pages/           # 18 investigative pages (Graph, Timeline, AI, etc.)
│   └── api/                     # Express + TypeScript + Socket.IO Backend
│       ├── src/
│       │   ├── db/              # Neo4j Cypher and PostgreSQL connectors
│       │   ├── middleware/      # Rate-limiting, JWT authentication, audit logger
│       │   └── routes/          # REST endpoints (graph, AI, evidence, audit)
├── docs/                        # Presentation guide, cheat sheet, architecture docs
├── package.json                 # Monorepo workspaces configuration
└── README.md                    # Project documentation
```

---

## 🎯 SIH Presentation Deck & Demo Flow

Check out our comprehensive presentation rehearsal guide:
📄 **[SIH Presentation & Defense Guide](docs/presentation_guide.md)**
* 3-Minute Elevator Pitch Script
* Step-by-Step Live Demo Click Path
* Top 5 Tough Judge Questions with Technical Counter-Arguments

---

## ⚖️ Responsible AI Notice
All analytical leads, centrality rankings, and suggested entity links generated by CrimeGraph AI are categorized as **investigative intelligence leads** and require formal human verification by a gazetted law enforcement officer before inclusion in a formal charge sheet.

<div align="center">
  <sub>Built with ❤️ for the Smart India Hackathon (SIH).</sub>
</div>