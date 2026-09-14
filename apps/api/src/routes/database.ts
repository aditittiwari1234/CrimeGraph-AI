import { Router, Request, Response } from 'express';
import { query } from '../db/postgres';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/database/live-data
// Returns live rows from all tables in the connected Neon PostgreSQL database
router.get('/live-data', async (_req: Request, res: Response): Promise<void> => {
  try {
    const client = await (await import('../db/postgres')).getPool().connect();
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

    try {
      firsRes = await client.query('SELECT * FROM fir_records ORDER BY created_at DESC LIMIT 100');
      personsRes = await client.query('SELECT * FROM persons ORDER BY risk_score DESC LIMIT 100');
      vehiclesRes = await client.query('SELECT * FROM vehicles ORDER BY year DESC LIMIT 100');
      orgsRes = await client.query('SELECT * FROM organisations ORDER BY name ASC LIMIT 100');
      txnsRes = await client.query('SELECT * FROM financial_transactions ORDER BY txn_date DESC LIMIT 100');
      cdrsRes = await client.query('SELECT * FROM cdr_records ORDER BY timestamp DESC LIMIT 100');
      accountsRes = await client.query('SELECT * FROM bank_accounts ORDER BY id ASC LIMIT 100');
      surveillanceRes = await client.query('SELECT * FROM surveillance_reports ORDER BY report_date DESC LIMIT 100');
      locationsRes = await client.query('SELECT * FROM locations ORDER BY name ASC LIMIT 100');
      alertsRes = await client.query('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 100');
    } finally {
      client.release();
    }

    // Format rows to match frontend interface format
    const firs = firsRes.rows.map((r: any) => ({
      id: r.id,
      firNumber: r.fir_number,
      station: r.station,
      district: r.district,
      state: r.state,
      filedDate: r.filed_date,
      complainant: r.complainant,
      accused: r.accused || [],
      sections: r.sections || [],
      priority: r.priority || 'Normal',
      description: r.description,
      createdAt: r.created_at,
    }));

    const persons = personsRes.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      alias: r.alias || '',
      age: r.age,
      gender: r.gender,
      aadharMasked: r.aadhar_masked,
      city: r.city,
      state: r.state,
      occupation: r.occupation,
      communityId: r.community_id || 'C1',
      riskScore: parseFloat(r.risk_score) || 0.5,
      status: r.status,
      flaggedReason: r.flagged_reason,
    }));

    const vehicles = vehiclesRes.rows.map((r: any) => ({
      id: r.id,
      licensePlate: r.license_plate,
      make: r.make,
      model: r.model,
      color: r.color,
      year: r.year,
      registeredOwner: r.registered_owner,
      registrationState: r.registration_state,
      status: r.status,
      flagged: Boolean(r.flagged),
    }));

    const organisations = orgsRes.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      orgType: r.org_type,
      cin: r.cin,
      gstin: r.gstin,
      director: r.director,
      city: r.city,
      state: r.state,
      turnover: r.turnover,
      businessNature: r.business_nature,
      flagged: Boolean(r.flagged),
    }));

    const financials = txnsRes.rows.map((r: any) => ({
      id: r.id,
      referenceNo: r.reference_no,
      fromAccount: r.from_account,
      toAccount: r.to_account,
      fromAccountId: r.from_account_id,
      toAccountId: r.to_account_id,
      amount: parseFloat(r.amount) || 0,
      currency: r.currency || 'INR',
      txnDate: r.txn_date,
      channel: r.channel,
      narration: r.narration,
      flagged: Boolean(r.flagged),
      flagReason: r.flag_reason,
    }));

    const cdrs = cdrsRes.rows.map((r: any) => ({
      id: r.id,
      callerNumber: r.caller_number,
      calleeNumber: r.callee_number,
      callerId: r.caller_id,
      calleeId: r.callee_id,
      duration: r.duration,
      callType: r.call_type || 'CALL',
      timestamp: r.timestamp,
      towerLocation: r.tower_location,
      flagged: Boolean(r.flagged),
      flagReason: r.flag_reason,
    }));

    const accounts = accountsRes.rows.map((r: any) => ({
      id: r.id,
      accountNumber: r.account_number,
      bank: r.bank,
      branch: r.branch,
      ifsc: r.ifsc,
      accountType: r.account_type,
      linkedPerson: r.linked_person,
      balance: r.balance,
      suspiciousActivity: Boolean(r.suspicious_activity),
    }));

    const surveillance = surveillanceRes.rows.map((r: any) => ({
      id: r.id,
      reportNumber: r.report_number,
      reportDate: r.report_date,
      time: r.time,
      location: r.location,
      reportingOfficer: r.reporting_officer,
      personsObserved: r.persons_observed || [],
      description: r.description,
      priority: r.priority,
    }));

    const locations = locationsRes.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      locationType: r.location_type,
      city: r.city,
      state: r.state,
      lat: parseFloat(r.lat) || 0,
      lng: parseFloat(r.lng) || 0,
      significance: r.significance,
    }));

    res.json({
      success: true,
      database: 'Neon Cloud PostgreSQL',
      host: 'ep-odd-cake-b37vzncm-pooler.c-4.ap-southeast-1.aws.neon.tech',
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
