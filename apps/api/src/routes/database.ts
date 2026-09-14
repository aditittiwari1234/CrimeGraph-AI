import { Router, Request, Response } from 'express';
import { query } from '../db/postgres';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/database/live-data
// Returns live rows from all tables in the connected Neon PostgreSQL database
router.get('/live-data', async (req: Request, res: Response): Promise<void> => {
  const customUri = (req.query.uri as string) || (req.headers['x-database-uri'] as string);
  let client: any = null;
  let isDedicated = false;

  try {
    if (customUri && (customUri.startsWith('postgres://') || customUri.startsWith('postgresql://'))) {
      const { Client } = await import('pg');
      client = new Client({
        connectionString: customUri,
        ssl: { rejectUnauthorized: false },
      });
      await client.connect();
      isDedicated = true;
    } else {
      client = await (await import('../db/postgres')).getPool().connect();
    }

    const safeQuery = async (sql: string) => {
      try {
        return await client.query(sql);
      } catch {
        return { rows: [] as any[] };
      }
    };

    // Discover actual tables in the connected database
    const schemaRes = await safeQuery("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    const discoveredTables: string[] = schemaRes.rows.map((r: any) => r.table_name);

    let firsRes = { rows: [] as any[] };
    let personsRes = { rows: [] as any[] };
    let vehiclesRes = { rows: [] as any[] };
    let orgsRes = { rows: [] as any[] };
    let txnsRes = { rows: [] as any[] };
    let cdrsRes = { rows: [] as any[] };
    let accountsRes = { rows: [] as any[] };
    let surveillanceRes = { rows: [] as any[] };
    let locationsRes = { rows: [] as any[] };
    let alertsRes = { rows: [] as any[] };

    if (discoveredTables.length === 0 || discoveredTables.includes('fir_records')) {
      firsRes = await safeQuery('SELECT * FROM fir_records ORDER BY created_at DESC LIMIT 100');
    }
    if (discoveredTables.length === 0 || discoveredTables.includes('persons')) {
      personsRes = await safeQuery('SELECT * FROM persons ORDER BY risk_score DESC LIMIT 100');
    }
    if (discoveredTables.length === 0 || discoveredTables.includes('vehicles')) {
      vehiclesRes = await safeQuery('SELECT * FROM vehicles ORDER BY year DESC LIMIT 100');
    }
    if (discoveredTables.length === 0 || discoveredTables.includes('organisations')) {
      orgsRes = await safeQuery('SELECT * FROM organisations ORDER BY name ASC LIMIT 100');
    }
    if (discoveredTables.length === 0 || discoveredTables.includes('financial_transactions')) {
      txnsRes = await safeQuery('SELECT * FROM financial_transactions ORDER BY txn_date DESC LIMIT 100');
    }
    if (discoveredTables.length === 0 || discoveredTables.includes('cdr_records')) {
      cdrsRes = await safeQuery('SELECT * FROM cdr_records ORDER BY timestamp DESC LIMIT 100');
    }
    if (discoveredTables.length === 0 || discoveredTables.includes('bank_accounts')) {
      accountsRes = await safeQuery('SELECT * FROM bank_accounts ORDER BY id ASC LIMIT 100');
    }
    if (discoveredTables.length === 0 || discoveredTables.includes('surveillance_reports')) {
      surveillanceRes = await safeQuery('SELECT * FROM surveillance_reports ORDER BY report_date DESC LIMIT 100');
    }
    if (discoveredTables.length === 0 || discoveredTables.includes('locations')) {
      locationsRes = await safeQuery('SELECT * FROM locations ORDER BY name ASC LIMIT 100');
    }
    if (discoveredTables.length === 0 || discoveredTables.includes('alerts')) {
      alertsRes = await safeQuery('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 100');
    }

    // Format rows to match frontend interface format
    const firs = firsRes.rows.map((r: any) => ({
      id: r.id,
      firNumber: r.fir_number || r.id,
      station: r.station || '',
      district: r.district || '',
      state: r.state || '',
      filedDate: r.filed_date || r.created_at || '',
      complainant: r.complainant || '',
      accused: r.accused || [],
      sections: r.sections || [],
      priority: r.priority || 'Normal',
      description: r.description || '',
      createdAt: r.created_at || '',
    }));

    const persons = personsRes.rows.map((r: any) => ({
      id: r.id,
      name: r.name || r.full_name || '',
      alias: r.alias || '',
      age: r.age || 0,
      gender: r.gender || '',
      aadharMasked: r.aadhar_masked || '',
      city: r.city || '',
      state: r.state || '',
      occupation: r.occupation || '',
      communityId: r.community_id || 'C1',
      riskScore: parseFloat(r.risk_score) || 0.5,
      status: r.status || 'Active',
      flaggedReason: r.flagged_reason || '',
    }));

    const vehicles = vehiclesRes.rows.map((r: any) => ({
      id: r.id,
      licensePlate: r.license_plate || r.plate || '',
      make: r.make || '',
      model: r.model || '',
      color: r.color || '',
      year: r.year || 2020,
      registeredOwner: r.registered_owner || '',
      registrationState: r.registration_state || '',
      status: r.status || 'Registered',
      flagged: Boolean(r.flagged),
    }));

    const organisations = orgsRes.rows.map((r: any) => ({
      id: r.id,
      name: r.name || '',
      orgType: r.org_type || '',
      cin: r.cin || '',
      gstin: r.gstin || '',
      director: r.director || '',
      city: r.city || '',
      state: r.state || '',
      turnover: r.turnover || '',
      businessNature: r.business_nature || '',
      flagged: Boolean(r.flagged),
    }));

    const financials = txnsRes.rows.map((r: any) => ({
      id: r.id,
      referenceNo: r.reference_no || '',
      fromAccount: r.from_account || '',
      toAccount: r.to_account || '',
      fromPersonId: r.from_person_id || '',
      toPersonId: r.to_person_id || '',
      amount: parseFloat(r.amount) || 0,
      txnType: r.txn_type || '',
      txnDate: r.txn_date || '',
      status: r.status || 'Completed',
      flagged: Boolean(r.flagged),
      flagReason: r.flag_reason || '',
    }));

    const cdrs = cdrsRes.rows.map((r: any) => ({
      id: r.id,
      callerNumber: r.caller_number || '',
      calleeNumber: r.callee_number || '',
      callerId: r.caller_id || '',
      calleeId: r.callee_id || '',
      duration: r.duration || 0,
      callType: r.call_type || '',
      timestamp: r.timestamp || '',
      towerLocation: r.tower_location || '',
      flagged: Boolean(r.flagged),
      flagReason: r.flag_reason || '',
    }));

    const accounts = accountsRes.rows.map((r: any) => ({
      id: r.id,
      accountNumber: r.account_number || '',
      bankName: r.bank_name || '',
      accountType: r.account_type || '',
      holderName: r.holder_name || '',
      personId: r.person_id || '',
      balance: parseFloat(r.balance) || 0,
      status: r.status || 'Active',
      flagged: Boolean(r.flagged),
    }));

    const surveillance = surveillanceRes.rows.map((r: any) => ({
      id: r.id,
      targetPersonId: r.target_person_id || '',
      officerId: r.officer_id || '',
      reportDate: r.report_date || '',
      location: r.location || '',
      observations: r.observations || '',
      threatLevel: r.threat_level || 'Low',
    }));

    const locations = locationsRes.rows.map((r: any) => ({
      id: r.id,
      name: r.name || '',
      locationType: r.location_type || '',
      city: r.city || '',
      state: r.state || '',
      lat: parseFloat(r.lat) || 0,
      lng: parseFloat(r.lng) || 0,
      significance: r.significance || '',
    }));

    res.json({
      success: true,
      database: customUri ? 'Custom Connected Database' : 'Neon Cloud PostgreSQL',
      discoveredTables,
      counts: {
        firs: firs.length,
        persons: persons.length,
        vehicles: vehicles.length,
        organisations: organisations.length,
        financials: financials.length,
        cdrs: cdrs.length,
        accounts: accounts.length,
        surveillance: surveillance.length,
        locations: locations.length,
        alerts: alertsRes.rows.length,
      },
      data: {
        firs,
        persons,
        vehicles,
        organisations,
        financials,
        cdrs,
        accounts,
        surveillance,
        locations,
        alerts: alertsRes.rows,
      },
    });
  } catch (error) {
    logger.error('Error fetching live database records:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  } finally {
    if (client) {
      if (isDedicated) {
        try { await client.end(); } catch {}
      } else {
        try { client.release(); } catch {}
      }
    }
  }
});

// POST /api/database/records
// Insert a record into Neon PostgreSQL directly from UI
router.post('/records', async (req: Request, res: Response): Promise<void> => {
  const { table, record } = req.body;
  if (!table || !record) {
    res.status(400).json({ success: false, error: 'Table and record are required' });
    return;
  }

  try {
    switch (table) {
      case 'fir':
      case 'fir_records': {
        const queryText = `
          INSERT INTO fir_records (id, fir_number, station, district, state, filed_date, complainant, accused, sections, priority, description)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *;
        `;
        const values = [
          record.id || `FIR-${Date.now()}`,
          record.firNumber,
          record.station,
          record.district,
          record.state,
          record.filedDate,
          record.complainant,
          record.accused || [],
          record.sections || [],
          record.priority || 'Normal',
          record.description || '',
        ];
        const result = await query(queryText, values);
        res.json({ success: true, record: result.rows[0] });
        return;
      }
      case 'person':
      case 'persons': {
        const queryText = `
          INSERT INTO persons (id, name, alias, age, gender, city, state, occupation, community_id, risk_score, status, flagged_reason)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *;
        `;
        const values = [
          record.id || `P-${Date.now()}`,
          record.name,
          record.alias || '',
          record.age || 30,
          record.gender || 'Male',
          record.city || 'New Delhi',
          record.state || 'Delhi',
          record.occupation || '',
          record.communityId || 'C1',
          record.riskScore || 0.5,
          record.status || 'Person of Interest',
          record.flaggedReason || '',
        ];
        const result = await query(queryText, values);
        res.json({ success: true, record: result.rows[0] });
        return;
      }
      case 'vehicle':
      case 'vehicles': {
        const queryText = `
          INSERT INTO vehicles (id, license_plate, make, model, color, year, registered_owner, registration_state, status, flagged)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *;
        `;
        const values = [
          record.id || `V-${Date.now()}`,
          record.licensePlate,
          record.make,
          record.model,
          record.color,
          record.year || 2022,
          record.registeredOwner,
          record.registrationState || 'Delhi',
          record.status || 'Active RC',
          Boolean(record.flagged),
        ];
        const result = await query(queryText, values);
        res.json({ success: true, record: result.rows[0] });
        return;
      }
      case 'organisation':
      case 'organisations': {
        const queryText = `
          INSERT INTO organisations (id, name, org_type, cin, gstin, director, city, state, turnover, business_nature, flagged)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *;
        `;
        const values = [
          record.id || `O-${Date.now()}`,
          record.name,
          record.orgType || 'Private Limited',
          record.cin || '',
          record.gstin || '',
          record.director || '',
          record.city || '',
          record.state || '',
          record.turnover || '',
          record.businessNature || '',
          Boolean(record.flagged),
        ];
        const result = await query(queryText, values);
        res.json({ success: true, record: result.rows[0] });
        return;
      }
      case 'financial':
      case 'financial_transactions': {
        const queryText = `
          INSERT INTO financial_transactions (id, reference_no, from_account, to_account, from_account_id, to_account_id, amount, currency, txn_date, channel, narration, flagged, flag_reason)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *;
        `;
        const values = [
          record.id || `TXN-${Date.now()}`,
          record.referenceNo,
          record.fromAccount,
          record.toAccount,
          record.fromAccountId || 'ACC-01',
          record.toAccountId || 'ACC-02',
          record.amount || 0,
          record.currency || 'INR',
          record.txnDate || new Date().toISOString().split('T')[0],
          record.channel || 'RTGS',
          record.narration || '',
          Boolean(record.flagged),
          record.flagReason || '',
        ];
        const result = await query(queryText, values);
        res.json({ success: true, record: result.rows[0] });
        return;
      }
      case 'cdr':
      case 'cdr_records': {
        const queryText = `
          INSERT INTO cdr_records (id, caller_number, callee_number, caller_id, callee_id, duration, call_type, timestamp, tower_location, flagged, flag_reason)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *;
        `;
        const values = [
          record.id || `CDR-${Date.now()}`,
          record.callerNumber,
          record.calleeNumber,
          record.callerId || 'P001',
          record.calleeId || 'P002',
          record.duration || 60,
          record.callType || 'CALL',
          record.timestamp || new Date().toISOString(),
          record.towerLocation || '',
          Boolean(record.flagged),
          record.flagReason || '',
        ];
        const result = await query(queryText, values);
        res.json({ success: true, record: result.rows[0] });
        return;
      }
      default:
        res.status(400).json({ success: false, error: `Unsupported table ${table}` });
    }
  } catch (error) {
    logger.error('Error inserting record:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
