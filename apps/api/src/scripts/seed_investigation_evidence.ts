import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { initPostgres, query } from '../db/postgres';
import { generateEvidenceHash, generateBlockHash } from '../utils/crypto';
import { v4 as uuidv4 } from 'uuid';

async function seedSourcesAndEvidence() {
  console.log('🔄 Initializing DB for Investigation Sources & Evidence Seed...');
  await initPostgres();

  // 1. Ensure columns
  await query(`ALTER TABLE evidence_ledger ADD COLUMN IF NOT EXISTS investigation_id VARCHAR(64)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_evidence_ledger_inv ON evidence_ledger(investigation_id)`);

  const adminRes = await query("SELECT id FROM users WHERE username = 'admin' LIMIT 1");
  const adminId = adminRes.rows[0]?.id || 'USR-001';

  // 2. Fetch or confirm investigations
  const invRes = await query(`SELECT id, case_number FROM investigations`);
  const invMap = new Map<string, string>();
  invRes.rows.forEach((r: any) => {
    invMap.set(r.case_number, r.id);
  });

  const inv1 = invMap.get('CASE-2026-00451') || 'INV-001';
  const inv2 = invMap.get('CASE-2026-00892') || 'INV-002';
  const inv3 = invMap.get('CASE-2026-01234') || 'INV-003';

  // 3. Link Investigation Entities
  console.log('📌 Seeding investigation entities...');
  const entities = [
    // Case 1 (Smuggling)
    { invId: inv1, entityId: 'P001', type: 'Person', label: 'Arjun Mehta (Target / Transporter)', bookmarked: true },
    { invId: inv1, entityId: 'P002', type: 'Person', label: 'Vikram Sinha (Financier)', bookmarked: true },
    { invId: inv1, entityId: 'P003', type: 'Person', label: 'Ramesh Gupta (Corridor Handler)', bookmarked: false },
    { invId: inv1, entityId: 'PH001', type: 'Phone', label: '+91 9876543210 (Airtel SIM)', bookmarked: false },
    { invId: inv1, entityId: 'ACC001', type: 'Account', label: 'ACC-MH-001-2019 (Shree Trading Co.)', bookmarked: false },
    { invId: inv1, entityId: 'V001', type: 'Vehicle', label: 'MH02AB1234 (Toyota Innova White)', bookmarked: false },
    { invId: inv1, entityId: 'L001', type: 'Location', label: 'Kanpur Central Station', bookmarked: false },
    // Case 2 (Hawala)
    { invId: inv2, entityId: 'P005', type: 'Person', label: 'Deepak Patel (Hawala Operator)', bookmarked: true },
    { invId: inv2, entityId: 'P009', type: 'Person', label: 'Ravi Kumar (Front Director)', bookmarked: true },
    { invId: inv2, entityId: 'ACC004', type: 'Account', label: 'ACC-GJ-004-2019 (Sunrise Finance)', bookmarked: false },
    { invId: inv2, entityId: 'ACC005', type: 'Account', label: 'ACC-BR-005-2017 (Bharat Construction)', bookmarked: false },
    { invId: inv2, entityId: 'ACC011', type: 'Account', label: 'ACC-SHELL-011 (XYZ Enterprises Shell)', bookmarked: true },
    // Case 3 (Cybercrime)
    { invId: inv3, entityId: 'P007', type: 'Person', label: 'Suresh Yadav (SIM Box Operator)', bookmarked: true },
    { invId: inv3, entityId: 'P014', type: 'Person', label: 'Ajay Singh (Call Spoofing Tech)', bookmarked: false },
    { invId: inv3, entityId: 'PH016', type: 'Phone', label: '7777888899 (Prepaid Unregistered SIM)', bookmarked: true },
  ];

  for (const e of entities) {
    await query(`
      INSERT INTO investigation_entities (investigation_id, entity_id, entity_type, entity_label, is_bookmarked, added_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
    `, [e.invId, e.entityId, e.type, e.label, e.bookmarked, adminId]);
  }

  // 4. Seed Sources (Documents table)
  console.log('📄 Seeding investigation sources (documents)...');
  const sources = [
    // Case 1 Sources
    {
      id: uuidv4(),
      investigationId: inv1,
      filename: 'FIR-2026-00451.pdf',
      originalName: 'First Information Report No. 451/2026 (Kanpur PS)',
      docType: 'fir',
      status: 'analyzed',
      entities: [
        { id: 'E1', type: 'Person', value: 'Arjun Mehta', confidence: 0.95 },
        { id: 'E2', type: 'Person', value: 'Vikram Sinha', confidence: 0.92 },
        { id: 'E3', type: 'Location', value: 'Kanpur Central Station', confidence: 0.88 },
        { id: 'E4', type: 'Date', value: '15 January 2026', confidence: 0.99 }
      ],
      metadata: {
        agency: 'CCTNS / UP Police',
        station: 'Kanpur Nagar Central',
        firNumber: 'FIR-2026-00451',
        sections: ['Sec 120B IPC (Conspiracy)', 'Sec 420 IPC (Cheating)', 'Customs Act Sec 135'],
        classification: 'Confidential',
        sourceChannel: 'State Police Inter-Agency Pipeline',
        summary: 'Primary FIR alleging interstate transport of contraband cargo through Kanpur railway transit hub with financial routing through Mumbai shell current accounts.',
      }
    },
    {
      id: uuidv4(),
      investigationId: inv1,
      filename: 'DoT-CMS-CDR-KanpurCorridor.csv',
      originalName: 'DoT Central Monitoring System Telecom Intercepts',
      docType: 'cdr',
      status: 'analyzed',
      entities: [
        { id: 'E5', type: 'Phone', value: '+91 9876543210', confidence: 0.99 },
        { id: 'E6', type: 'Phone', value: '+91 9654321098', confidence: 0.99 },
        { id: 'E7', type: 'Location', value: 'Tower TOWER-MH-001 (Andheri)', confidence: 0.91 }
      ],
      metadata: {
        agency: 'Department of Telecommunications (DoT CMS)',
        operator: 'Bharti Airtel & Reliance Jio',
        callEventsCount: 142,
        classification: 'Secret',
        sourceChannel: 'Encrypted Telecom Gateway',
        summary: 'Forensic CDR extracts detailing 142 voice and SMS links between Arjun Mehta (PH001) and Vikram Sinha (PH003) preceding transit dates.',
      }
    },
    {
      id: uuidv4(),
      investigationId: inv1,
      filename: 'FIU-IND-STR-2026-889.pdf',
      originalName: 'FIU Suspicious Transaction Audit Report (STR-2026-889)',
      docType: 'financial',
      status: 'analyzed',
      entities: [
        { id: 'E8', type: 'Account', value: 'ACC-MH-001-2019', confidence: 0.99 },
        { id: 'E9', type: 'Account', value: 'ACC-DL-002-2020', confidence: 0.97 },
        { id: 'E10', type: 'Organization', value: 'Shree Trading Co.', confidence: 0.94 }
      ],
      metadata: {
        agency: 'Financial Intelligence Unit — India (FIU-IND)',
        totalVolume: '₹5,00,000 INR',
        classification: 'Secret / Law Enforcement Only',
        sourceChannel: 'FinNet 2.0 Real-Time API',
        summary: 'Suspicious wire transfer of ₹5,00,000 from Shree Trading Co. to Apex Logistics flagged for sudden volume spike and round-dollar structuring.',
      }
    },
    {
      id: uuidv4(),
      investigationId: inv1,
      filename: 'SpecialBranch-CCTV-KanpurStation.log',
      originalName: 'Special Branch CCTV Surveillance Log — Platform 1 & 4',
      docType: 'surveillance_report',
      status: 'analyzed',
      entities: [
        { id: 'E11', type: 'Person', value: 'Arjun Mehta', confidence: 0.89 },
        { id: 'E12', type: 'Vehicle', value: 'MH02AB1234', confidence: 0.94 },
        { id: 'E13', type: 'Location', value: 'Kanpur Central Station VIP Parking', confidence: 0.92 }
      ],
      metadata: {
        agency: 'Special Branch CID / Northern Railway RPF',
        timestamps: '2026-01-14 09:45:00 to 11:15:00 IST',
        classification: 'Restricted',
        sourceChannel: 'Facial Recognition & ANPR Toll Feeds',
        summary: 'Camera feeds confirming arrival of Toyota Innova (MH02AB1234) and physical handover of manifest envelopes between suspects.',
      }
    },

    // Case 2 Sources (Hawala)
    {
      id: uuidv4(),
      investigationId: inv2,
      filename: 'EOW-FIR-2026-00892.pdf',
      originalName: 'Economic Offences Wing FIR (Hawala & Circular Remittance)',
      docType: 'fir',
      status: 'analyzed',
      entities: [
        { id: 'E14', type: 'Person', value: 'Deepak Patel', confidence: 0.96 },
        { id: 'E15', type: 'Person', value: 'Ravi Kumar', confidence: 0.93 },
        { id: 'E16', type: 'Organization', value: 'Sunrise Finance Services', confidence: 0.95 }
      ],
      metadata: {
        agency: 'Economic Offences Wing (EOW) Mumbai',
        classification: 'Confidential',
        sourceChannel: 'CCTNS National Crime Portal',
        summary: 'Complaint by Directorate of Enforcement regarding layering of ₹2.43M across 6 intermediary bank accounts within 6 business days.',
      }
    },
    {
      id: uuidv4(),
      investigationId: inv2,
      filename: 'Banking-SWIFT-RTGS-Ledger-Extract.csv',
      originalName: 'Multi-Bank Consolidated RTGS & NEFT Ledger',
      docType: 'financial',
      status: 'analyzed',
      entities: [
        { id: 'E17', type: 'Account', value: 'ACC-GJ-004-2019', confidence: 0.99 },
        { id: 'E18', type: 'Account', value: 'ACC-BR-005-2017', confidence: 0.99 },
        { id: 'E19', type: 'Account', value: 'ACC-SHELL-011', confidence: 0.99 }
      ],
      metadata: {
        agency: 'Reserve Bank of India / Commercial Banks Consortium',
        classification: 'Secret',
        sourceChannel: 'Core Banking Direct SFTP Feed',
        summary: 'Consolidated circular remittance flow confirming fund cycling: ACC001 → ACC007 → ACC004 → ACC005 → ACC011 → ACC003 → ACC001.',
      }
    },

    // Case 3 Sources (Cybercrime)
    {
      id: uuidv4(),
      investigationId: inv3,
      filename: 'CyberCell-FIR-2026-01234.pdf',
      originalName: 'State Cyber Cell FIR — Online Extortion Syndicate',
      docType: 'fir',
      status: 'analyzed',
      entities: [
        { id: 'E20', type: 'Person', value: 'Suresh Yadav', confidence: 0.94 },
        { id: 'E21', type: 'Phone', value: '7777888899', confidence: 0.99 }
      ],
      metadata: {
        agency: 'Bengaluru Cyber Crime Police Station',
        classification: 'Confidential',
        sourceChannel: 'National Cyber Crime Reporting Portal (I4C)',
        summary: 'Extortion ring using VoIP spoofing, SIM boxes, and encrypted messenger threats demanding cryptocurrency payments.',
      }
    },
    {
      id: uuidv4(),
      investigationId: inv3,
      filename: 'Digital-Forensics-UFED-Extraction.json',
      originalName: 'Cellebrite UFED Mobile Forensic Image Dump',
      docType: 'intelligence_report',
      status: 'analyzed',
      entities: [
        { id: 'E22', type: 'Phone', value: '7777888899', confidence: 0.99 },
        { id: 'E23', type: 'Person', value: 'Ajay Singh', confidence: 0.88 }
      ],
      metadata: {
        agency: 'Central Forensic Science Laboratory (CFSL)',
        classification: 'Secret',
        sourceChannel: 'Forensic Hardware Lab Extraction',
        summary: 'Decrypted application databases, deleted VoIP call records, and 16 virtual wallet addresses extracted from seized hardware.',
      }
    }
  ];

  for (const s of sources) {
    await query(`
      INSERT INTO documents (id, investigation_id, filename, original_name, document_type, status, extracted_entities, extracted_relationships, analysis_metadata, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, '[]', $8, $9)
      ON CONFLICT (id) DO NOTHING
    `, [s.id, s.investigationId, s.filename, s.originalName, s.docType, s.status, JSON.stringify(s.entities), JSON.stringify(s.metadata), adminId]);
  }

  // 5. Seed Evidence Ledger (Cryptographic blockchain blocks)
  console.log('🔒 Seeding cryptographic evidence ledger for investigations...');

  // Update existing evidence records to link to inv1 if they match
  await query(`UPDATE evidence_ledger SET investigation_id = $1 WHERE evidence_id IN ('EV-001', 'EV-002', 'EV-003', 'EVID-BLOCK-001', 'EVID-BLOCK-002', 'EVID-BLOCK-003')`, [inv1]);

  // Specific evidence blocks for each case
  const evidenceBlocks = [
    // Case 1 Evidence
    {
      evidenceId: 'EVD-FIR-00451',
      invId: inv1,
      type: 'fir',
      entityRef: 'P001',
      sourceDoc: 'FIR-2026-00451.pdf',
      data: {
        title: 'Original FIR Integrity Ledger Block',
        firNumber: 'FIR-2026-00451',
        station: 'Kanpur Central',
        filingDate: '2026-01-15T10:00:00Z',
        accusedPerson: 'Arjun Mehta',
        ipcSections: ['120B', '420', 'Customs 135'],
        verificationStatus: 'VERIFIED',
      }
    },
    {
      evidenceId: 'EVD-CDR-0001',
      invId: inv1,
      type: 'cdr_record',
      entityRef: 'PH001',
      sourceDoc: 'DoT-CMS-CDR-KanpurCorridor.csv',
      data: {
        title: 'Call Data Record Forensic Audit Hash',
        callerNumber: '+91 9876543210',
        calleeNumber: '+91 9654321098',
        operator: 'Airtel',
        towerLocation: 'TOWER-MH-001',
        interceptTimestamp: '2026-01-14T08:23:10Z',
        verificationStatus: 'VERIFIED',
      }
    },
    {
      evidenceId: 'EVD-TXN-0001',
      invId: inv1,
      type: 'financial_record',
      entityRef: 'ACC001',
      sourceDoc: 'FIU-IND-STR-2026-889.pdf',
      data: {
        title: 'Wire Transfer Provenance Block',
        sourceAccount: 'ACC-MH-001-2019',
        destinationAccount: 'ACC-DL-002-2020',
        amountInr: 500000,
        utrNumber: 'CMS-RTGS-2026-001',
        reportedBy: 'FIU-IND',
        verificationStatus: 'VERIFIED',
      }
    },
    {
      evidenceId: 'EVD-VL-001',
      invId: inv1,
      type: 'surveillance',
      entityRef: 'V001',
      sourceDoc: 'SpecialBranch-CCTV-KanpurStation.log',
      data: {
        title: 'CCTV ANPR Vehicle Transit Stamp',
        licensePlate: 'MH02AB1234',
        vehicleType: 'Toyota Innova',
        cameraSensorId: 'CAM-KN-04',
        sightingTimestamp: '2026-01-14T09:45:00Z',
        confidenceScore: 0.94,
        verificationStatus: 'VERIFIED',
      }
    },

    // Case 2 Evidence (Hawala)
    {
      evidenceId: 'EVD-HAWALA-001',
      invId: inv2,
      type: 'financial_record',
      entityRef: 'ACC004',
      sourceDoc: 'Banking-SWIFT-RTGS-Ledger-Extract.csv',
      data: {
        title: 'Circular Layering Pattern Cryptographic Hash',
        loopSequence: ['ACC001', 'ACC007', 'ACC004', 'ACC005', 'ACC011', 'ACC003', 'ACC001'],
        totalDisbursed: 2430000,
        currency: 'INR',
        flaggedReason: 'Rapid round-tripping within 6 banking days',
        verificationStatus: 'VERIFIED',
      }
    },
    {
      evidenceId: 'EVD-HAWALA-002',
      invId: inv2,
      type: 'fir',
      entityRef: 'P005',
      sourceDoc: 'EOW-FIR-2026-00892.pdf',
      data: {
        title: 'EOW Case Evidence Block — Deepak Patel',
        firNumber: 'FIR-2026-00892',
        agency: 'EOW Mumbai',
        seizureItems: ['Encrypted Laptop', 'Bank Tokens', 'Cash Slips'],
        verificationStatus: 'VERIFIED',
      }
    },

    // Case 3 Evidence (Cybercrime)
    {
      evidenceId: 'EVD-CYBER-001',
      invId: inv3,
      type: 'digital_forensics',
      entityRef: 'PH016',
      sourceDoc: 'Digital-Forensics-UFED-Extraction.json',
      data: {
        title: 'Hardware Cryptographic Extraction Block',
        hardwareId: 'SIMBOX-RACK-02',
        deviceMac: '00:1A:2B:3C:4D:5E',
        imeiRange: '864201040000000 to 864201040000032',
        unregisteredSimsCount: 32,
        verificationStatus: 'VERIFIED',
      }
    }
  ];

  for (const eb of evidenceBlocks) {
    const existing = await query('SELECT id FROM evidence_ledger WHERE evidence_id = $1', [eb.evidenceId]);
    if (existing.rows.length > 0) {
      await query('UPDATE evidence_ledger SET investigation_id = $1 WHERE evidence_id = $2', [eb.invId, eb.evidenceId]);
      continue;
    }

    const lastBlock = await query('SELECT data_hash FROM evidence_ledger ORDER BY record_number DESC LIMIT 1');
    const prevHash = lastBlock.rows[0]?.data_hash || '0000000000000000000000000000000000000000000000000000000000000000';
    const ts = new Date().toISOString();

    const fullData = {
      ...eb.data,
      evidenceId: eb.evidenceId,
      investigationId: eb.invId,
      timestamp: ts,
    };

    const dataHash = generateEvidenceHash(fullData);
    const blockHash = generateBlockHash(eb.evidenceId, dataHash, prevHash, ts);

    await query(`
      INSERT INTO evidence_ledger (id, evidence_id, evidence_type, entity_ref, source_document, data_hash, previous_hash, block_data, created_by, is_genesis, investigation_id, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, $10, $11)
    `, [uuidv4(), eb.evidenceId, eb.type, eb.entityRef, eb.sourceDoc, blockHash, prevHash, JSON.stringify(fullData), adminId, eb.invId, ts]);
  }

  console.log('✅ Investigation Sources & Evidence Seeded Successfully!');
  process.exit(0);
}

seedSourcesAndEvidence().catch(err => {
  console.error('❌ Seed script error:', err);
  process.exit(1);
});
