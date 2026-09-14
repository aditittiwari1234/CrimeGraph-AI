const { Client } = require('pg');

const DATABASE_URL = 'postgresql://neondb_owner:npg_macF9OxUfvC7@ep-odd-cake-b37vzncm-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function seed() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Connecting to Neon PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully to Neon cloud!');

    console.log('Creating schemas and tables...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        badge_number VARCHAR(50),
        department VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS fir_records (
        id VARCHAR(64) PRIMARY KEY,
        fir_number VARCHAR(100) UNIQUE NOT NULL,
        station VARCHAR(255),
        district VARCHAR(255),
        state VARCHAR(100),
        filed_date VARCHAR(50),
        complainant VARCHAR(255),
        accused TEXT[],
        sections TEXT[],
        priority VARCHAR(50),
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS cdr_records (
        id VARCHAR(64) PRIMARY KEY,
        caller_number VARCHAR(50) NOT NULL,
        callee_number VARCHAR(50) NOT NULL,
        caller_id VARCHAR(64),
        callee_id VARCHAR(64),
        duration INTEGER,
        call_type VARCHAR(20),
        timestamp VARCHAR(50),
        tower_location VARCHAR(255),
        flagged BOOLEAN DEFAULT false,
        flag_reason VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS financial_transactions (
        id VARCHAR(64) PRIMARY KEY,
        reference_no VARCHAR(100),
        from_account VARCHAR(100),
        to_account VARCHAR(100),
        from_account_id VARCHAR(64),
        to_account_id VARCHAR(64),
        amount NUMERIC(15,2),
        currency VARCHAR(10) DEFAULT 'INR',
        txn_date VARCHAR(50),
        channel VARCHAR(50),
        narration TEXT,
        flagged BOOLEAN DEFAULT false,
        flag_reason VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS vehicles (
        id VARCHAR(64) PRIMARY KEY,
        license_plate VARCHAR(50) UNIQUE NOT NULL,
        make VARCHAR(100),
        model VARCHAR(100),
        color VARCHAR(50),
        year INTEGER,
        registered_owner VARCHAR(255),
        registration_state VARCHAR(100),
        status VARCHAR(50),
        flagged BOOLEAN DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS organisations (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        org_type VARCHAR(100),
        cin VARCHAR(100),
        gstin VARCHAR(100),
        director VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        turnover VARCHAR(100),
        business_nature VARCHAR(255),
        flagged BOOLEAN DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS bank_accounts (
        id VARCHAR(64) PRIMARY KEY,
        account_number VARCHAR(100) UNIQUE NOT NULL,
        bank VARCHAR(255),
        branch VARCHAR(255),
        ifsc VARCHAR(50),
        account_type VARCHAR(50),
        linked_person VARCHAR(255),
        balance VARCHAR(100),
        suspicious_activity BOOLEAN DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS surveillance_reports (
        id VARCHAR(64) PRIMARY KEY,
        report_number VARCHAR(100) UNIQUE NOT NULL,
        report_date VARCHAR(50),
        time VARCHAR(50),
        location VARCHAR(255),
        reporting_officer VARCHAR(255),
        persons_observed TEXT[],
        description TEXT,
        priority VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS locations (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location_type VARCHAR(100),
        city VARCHAR(100),
        state VARCHAR(100),
        lat NUMERIC(9,6),
        lng NUMERIC(9,6),
        significance TEXT
      );

      CREATE TABLE IF NOT EXISTS persons (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        alias VARCHAR(100),
        age INTEGER,
        gender VARCHAR(20),
        aadhar_masked VARCHAR(50),
        city VARCHAR(100),
        state VARCHAR(100),
        occupation VARCHAR(100),
        community_id VARCHAR(20),
        risk_score NUMERIC(3,2),
        status VARCHAR(100),
        flagged_reason TEXT
      );

      CREATE TABLE IF NOT EXISTS investigations (
        id VARCHAR(64) PRIMARY KEY,
        case_number VARCHAR(100) UNIQUE NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'active',
        priority VARCHAR(20) DEFAULT 'high',
        assigned_to VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS alerts (
        id VARCHAR(64) PRIMARY KEY,
        alert_type VARCHAR(100) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        entity_id VARCHAR(255),
        is_acknowledged BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Tables verified / created in Neon PostgreSQL.');

    console.log('Inserting seed records...');

    // Users
    await client.query(`
      INSERT INTO users (id, username, email, full_name, role, badge_number, department)
      VALUES 
        ('usr-001', 'admin', 'admin@ncrb.gov.in', 'System Administrator', 'administrator', 'ADMIN-001', 'NCRB National Headquarters'),
        ('usr-002', 'singh_si', 'singh@ncrb.gov.in', 'Inspector A.K. Singh', 'senior_investigator', 'SI-2024-001', 'Special Crime Division'),
        ('usr-003', 'verma_inv', 'verma@ncrb.gov.in', 'Sub-Inspector R. Verma', 'investigator', 'INV-2024-002', 'Financial Intelligence Wing'),
        ('usr-004', 'analyst_gupta', 'gupta@ncrb.gov.in', 'Analyst P. Gupta', 'analyst', 'AN-2024-003', 'Cyber Forensics Unit')
      ON CONFLICT (id) DO NOTHING;
    `);

    // FIR Records
    await client.query(`
      INSERT INTO fir_records (id, fir_number, station, district, state, filed_date, complainant, accused, sections, priority, description)
      VALUES
        ('FIR001', 'FIR-2026-00451', 'Kanpur Central', 'Kanpur Nagar', 'Uttar Pradesh', '2026-01-15', 'State of UP (Suo Motu)', ARRAY['Arjun Mehta', 'Vikram Sinha', 'Ramesh Gupta'], ARRAY['IPC 420', 'IPC 120B', 'IPC 467', 'PMLA Sec 3'], 'Critical', 'Cross-state financial fraud and money laundering via shell logistics firms.'),
        ('FIR002', 'FIR-2026-00892', 'Connaught Place', 'New Delhi', 'Delhi', '2026-01-28', 'Enforcement Directorate', ARRAY['Vikram Sinha', 'Manish Kapoor'], ARRAY['PMLA Sec 3', 'PMLA Sec 4', 'IPC 471'], 'High', 'Hawala channel operation involving round-tripping through Dubai import invoices.'),
        ('FIR003', 'FIR-2026-01234', 'Cyber Cell Bandra', 'Mumbai', 'Maharashtra', '2026-02-05', 'HDFC Bank Vigilance', ARRAY['Deepak Patel', 'Mohammed Farouk'], ARRAY['IT Act 66D', 'IT Act 43', 'IPC 419', 'IPC 420'], 'High', 'Organized cyber extortion ring deploying phishing attacks against corporate bank accounts.'),
        ('FIR004', 'FIR-2026-01567', 'Civil Lines', 'Allahabad', 'Uttar Pradesh', '2026-02-18', 'Income Tax Investigation Wing', ARRAY['Alok Trivedi', 'Bharat Malhotra'], ARRAY['IPC 120B', 'IPC 406', 'IPC 420'], 'Normal', 'Layering of unaccounted real estate capital through benami co-operative societies.'),
        ('FIR005', 'FIR-2026-02011', 'Assi Ghat Police Station', 'Varanasi', 'Uttar Pradesh', '2026-03-01', 'Narcotics Control Bureau', ARRAY['Suresh Yadav', 'Kuldeep Nanda'], ARRAY['NDPS Act 8/21', 'NDPS Act 29'], 'Critical', 'Interstate contraband transport utilizing modified commercial vehicles across NH-19.'),
        ('FIR006', 'FIR-2026-02340', 'Amritsar Cantt', 'Amritsar', 'Punjab', '2026-03-08', 'Border Security Intelligence', ARRAY['Kuldeep Nanda', 'Girish Pandey'], ARRAY['IPC 121A', 'UAPA Sec 17', 'FEMA Sec 13'], 'Critical', 'Cross-border Hawala syndicate financing illicit consignments via western border nodes.')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Investigations
    await client.query(`
      INSERT INTO investigations (id, case_number, title, description, status, priority, assigned_to)
      VALUES
        ('INV-001', 'CASE-2026-00451', 'Operation Northern Web', 'Multi-state criminal syndicate network tracking Arjun Mehta and associates.', 'active', 'critical', 'Inspector A.K. Singh'),
        ('INV-002', 'CASE-2026-00892', 'Hawala Financial Network', 'Investigation into unbanked cash flow structuring through jewellery front stores.', 'active', 'high', 'Sub-Inspector R. Verma'),
        ('INV-003', 'CASE-2026-01234', 'Cybercrime Extortion Ring', 'SIM box spoofing, phishing, and credential harvesting network targeting PSU accounts.', 'active', 'high', 'Analyst P. Gupta')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Vehicles
    await client.query(`
      INSERT INTO vehicles (id, license_plate, make, model, color, year, registered_owner, registration_state, status, flagged)
      VALUES
        ('V001', 'MH02AB1234', 'Toyota', 'Fortuner', 'White', 2021, 'Arjun Mehta', 'Maharashtra', 'Active RC', true),
        ('V002', 'MH01CD5678', 'BMW', '5-Series', 'Black', 2022, 'Arjun Mehta', 'Maharashtra', 'Active RC', false),
        ('V003', 'DL01EF9012', 'Mercedes-Benz', 'E-Class', 'Silver', 2020, 'Vikram Sinha', 'Delhi', 'Active RC', true),
        ('V004', 'UP78GH3456', 'Mahindra', 'Scorpio', 'White', 2019, 'Ramesh Gupta', 'Uttar Pradesh', 'Active RC', true),
        ('V005', 'UP78JK7890', 'Tata', 'Signa Truck', 'Blue', 2018, 'Ramesh Gupta', 'Uttar Pradesh', 'Active RC', false),
        ('V006', 'UP65LM2345', 'Toyota', 'Innova Crysta', 'Grey', 2021, 'Suresh Yadav', 'Uttar Pradesh', 'Active RC', true),
        ('V007', 'UK07NP6789', 'Hyundai', 'Creta', 'White', 2022, 'Sanjay Rawat', 'Uttarakhand', 'Active RC', false),
        ('V008', 'CH01QR0123', 'Audi', 'A6', 'Black', 2020, 'Ajay Singh', 'Chandigarh', 'Active RC', true),
        ('V009', 'DL03ST4567', 'Range Rover', 'Velar', 'Red', 2023, 'Bharat Malhotra', 'Delhi', 'Active RC', false),
        ('V010', 'DL08UV8901', 'Toyota', 'Innova', 'Silver', 2019, 'Manish Kapoor', 'Delhi', 'Active RC', true)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Organisations
    await client.query(`
      INSERT INTO organisations (id, name, org_type, cin, gstin, director, city, state, turnover, business_nature, flagged)
      VALUES
        ('O001', 'Shree Trading Co.', 'Private Limited', 'U51909MH2018PTC312456', '27AAACS1234A1Z5', 'Arjun Mehta', 'Mumbai', 'Maharashtra', '₹45.8 Cr', 'General wholesale & trading', true),
        ('O002', 'Apex Logistics Pvt. Ltd.', 'Private Limited', 'U60200DL2016PTC298765', '07AABCA5678B1Z2', 'Vikram Sinha', 'Delhi', 'Delhi', '₹82.4 Cr', 'Freight & multi-modal transport', true),
        ('O003', 'Kanpur Transport Agency', 'Partnership Firm', 'UP-KN-2015-004321', '09AACCK9012C1Z9', 'Ramesh Gupta', 'Kanpur', 'Uttar Pradesh', '₹18.2 Cr', 'Inter-state surface transport', false),
        ('O004', 'SS Enterprises', 'Proprietorship', 'RJ-JP-2019-009876', '08AABFS3456D1Z6', 'Sunita Sharma', 'Jaipur', 'Rajasthan', '₹6.5 Cr', 'Textiles & export garments', false),
        ('O005', 'Jain Textiles & Exports', 'Private Limited', 'U17120UP2014PTC065432', '09AABCJ7890E1Z3', 'Seema Jain', 'Ghaziabad', 'Uttar Pradesh', '₹34.1 Cr', 'Yarn trading & export billing', true),
        ('O006', 'Eastern Bullion Traders', 'Private Limited', 'U36911WB2017PTC221987', '19AABCE1234F1Z0', 'Kuldeep Nanda', 'Kolkata', 'West Bengal', '₹120.0 Cr', 'Precious metals & cash trading', true)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Persons
    await client.query(`
      INSERT INTO persons (id, name, alias, age, gender, aadhar_masked, city, state, occupation, community_id, risk_score, status, flagged_reason)
      VALUES
        ('P001', 'Arjun Mehta', 'AJ / Tiger', 34, 'Male', 'XXXX-XXXX-4521', 'Mumbai', 'Maharashtra', 'Businessman', 'C1', 0.87, 'Person of Interest', 'High-centrality network node; circular financial transactions'),
        ('P002', 'Vikram Sinha', 'VK', 41, 'Male', 'XXXX-XXXX-8834', 'Delhi', 'Delhi', 'Director', 'C1', 0.72, 'Under Surveillance', 'Key controller of Apex Logistics; suspected Hawala conduit'),
        ('P003', 'Ramesh Gupta', 'Ram / Bhai', 38, 'Male', 'XXXX-XXXX-2210', 'Kanpur', 'Uttar Pradesh', 'Transport Contractor', 'C1', 0.68, 'Under Surveillance', 'Convoy coordination for suspect logistics shipments'),
        ('P004', 'Deepak Patel', 'DP', 29, 'Male', 'XXXX-XXXX-9912', 'Ahmedabad', 'Gujarat', 'Accountant', 'C1', 0.55, 'Under Surveillance', 'Prepares audit accounts for multiple shell entities'),
        ('P005', 'Sunita Sharma', 'Sunita', 45, 'Female', 'XXXX-XXXX-3367', 'Jaipur', 'Rajasthan', 'Proprietor', 'C2', 0.60, 'Under Surveillance', 'Frequent cross-state cash deposits below TDS thresholds'),
        ('P006', 'Kuldeep Nanda', 'KN', 48, 'Male', 'XXXX-XXXX-6678', 'Amritsar', 'Punjab', 'Money Exchanger', 'C2', 0.71, 'Person of Interest', 'Hawala suspicion; cross-border cash flows'),
        ('P007', 'Suresh Yadav', 'Suresh', 43, 'Male', 'XXXX-XXXX-4401', 'Varanasi', 'Uttar Pradesh', 'Driver', 'C2', 0.63, 'Under Surveillance', 'Flagged vehicle pilot across NH-19 and eastern checkpoints'),
        ('P008', 'Girish Pandey', 'GP', 33, 'Male', 'XXXX-XXXX-9981', 'Kanpur', 'Uttar Pradesh', 'Logistics Coordinator', 'C3', 0.56, 'Person of Interest', 'Bridge between C1 and C3; shared vehicle logs')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Locations
    await client.query(`
      INSERT INTO locations (id, name, location_type, city, state, lat, lng, significance)
      VALUES
        ('L001', 'Kanpur Central Station Area', 'Railway Node', 'Kanpur', 'Uttar Pradesh', 26.4547, 80.3507, 'Frequent meeting location recorded in surveillance reports.'),
        ('L002', 'Lotus Hotel, Mumbai', 'Commercial Hospitality', 'Mumbai', 'Maharashtra', 19.0760, 72.8777, 'Conclave location on 03 Feb 2026 observed by Special Branch.'),
        ('L003', 'Connaught Place Outer Circle', 'Commercial Hub', 'Delhi', 'Delhi', 28.6315, 77.2167, 'Registered address of Apex Logistics Pvt. Ltd.'),
        ('L004', 'Nhava Sheva Port Terminal 2', 'Shipping Port', 'Navi Mumbai', 'Maharashtra', 18.9499, 72.9510, 'Customs clearance node for flagged import consignments.')
      ON CONFLICT (id) DO NOTHING;
    `);

    // CDR Records sample
    await client.query(`
      INSERT INTO cdr_records (id, caller_number, callee_number, caller_id, callee_id, duration, call_type, timestamp, tower_location, flagged, flag_reason)
      VALUES
        ('CDR001', '9876543210', '9988776655', 'P001', 'P002', 342, 'CALL', '2026-01-14 10:24:18', 'Mumbai Bandra West Cell-12', true, 'Pre-meeting coordination'),
        ('CDR002', '9876543210', '9876543212', 'P001', 'P003', 185, 'CALL', '2026-01-14 11:15:02', 'Mumbai Dadar Central Cell-04', false, NULL),
        ('CDR003', '9988776655', '9876543212', 'P002', 'P003', 510, 'CALL', '2026-01-15 08:30:45', 'Delhi CP North Cell-09', true, 'Unusual burst after FIR filing'),
        ('CDR004', '9876543212', '9876543216', 'P003', 'P007', 95, 'CALL', '2026-01-16 14:02:11', 'Kanpur Mall Road Cell-01', true, 'Vehicle convoy departure confirmation'),
        ('CDR005', '9876543210', '9876543213', 'P001', 'P004', 420, 'CALL', '2026-01-18 16:45:00', 'Mumbai Andheri Cell-08', false, NULL)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Financial Transactions sample
    await client.query(`
      INSERT INTO financial_transactions (id, reference_no, from_account, to_account, from_account_id, to_account_id, amount, currency, txn_date, channel, narration, flagged, flag_reason)
      VALUES
        ('TXN001', 'CMS-RTGS-2026-001', 'Shree Trading HDFC Current', 'Apex Logistics ICICI Current', 'ACC001', 'ACC002', 5000000.00, 'INR', '2026-01-20', 'RTGS', 'Advance against export bills', true, 'Round-tripping suspected; immediate backward remittance'),
        ('TXN002', 'CMS-NEFT-2026-002', 'Apex Logistics ICICI Current', 'Kanpur Transport Agency SBI', 'ACC002', 'ACC003', 1850000.00, 'INR', '2026-01-21', 'NEFT', 'Fleet freight settlement', false, NULL),
        ('TXN003', 'CMS-IMPS-2026-003', 'Apex Logistics ICICI Current', 'Shree Trading HDFC Current', 'ACC002', 'ACC001', 4950000.00, 'INR', '2026-01-23', 'RTGS', 'Refund of unfulfilled consignment', true, 'Classic circular layering cycle completed in 72 hours'),
        ('TXN004', 'CMS-CASH-2026-004', 'Cash Deposit Branch 042', 'Kanpur Transport Agency SBI', 'CASH-DEP', 'ACC003', 950000.00, 'INR', '2026-01-25', 'Cash', 'Self cash counter deposit', true, 'Structuring below 10-lakh CTR threshold')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Alerts
    await client.query(`
      INSERT INTO alerts (id, alert_type, severity, title, description, entity_id, is_acknowledged)
      VALUES
        ('ALT-001', 'circular_transaction', 'critical', 'Potential Circular Transaction Pattern', 'Detected 50.0L outflow from Shree Trading returning via Apex Logistics within 72 hours.', 'ACC001', false),
        ('ALT-002', 'communication_spike', 'high', 'Unusual Communication Spike Post-Incident', '7 high-frequency calls between Vikram Sinha and Ramesh Gupta within 3 hours.', 'P002', false),
        ('ALT-003', 'structuring', 'high', 'Cash Structuring Pattern Detected', 'Multiple cash deposits of ₹9,50,000 made just below the mandatory PMLA ₹10,00,000 threshold.', 'ACC003', false)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Bank Accounts
    await client.query(`
      INSERT INTO bank_accounts (id, account_number, bank, branch, ifsc, account_type, linked_person, balance, suspicious_activity)
      VALUES
        ('ACC001', '50200012345678', 'HDFC Bank', 'Fort, Mumbai', 'HDFC0000060', 'Current', 'Arjun Mehta', '₹1,45,20,000', true),
        ('ACC002', '000405012345', 'ICICI Bank', 'Connaught Place, New Delhi', 'ICIC0000004', 'Current', 'Vikram Sinha', '₹89,40,000', true),
        ('ACC003', '30987654321', 'State Bank of India', 'Mall Road, Kanpur', 'SBIN0000108', 'Current', 'Ramesh Gupta', '₹34,10,000', true)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Surveillance Reports
    await client.query(`
      INSERT INTO surveillance_reports (id, report_number, report_date, time, location, reporting_officer, persons_observed, description, priority)
      VALUES
        ('SR001', 'SR-2026-0042', '2026-02-14', '14:30', 'Kanpur Central Station Area', 'Inspector A.K. Singh', ARRAY['Arjun Mehta', 'Ramesh Gupta'], 'Subject P001 observed handing briefcase to P003 outside cargo terminal gate 4.', 'Critical'),
        ('SR002', 'SR-2026-0089', '2026-02-20', '19:15', 'Lotus Hotel, Mumbai', 'Sub-Inspector R. Verma', ARRAY['Vikram Sinha', 'Sunita Sharma'], 'Suspects convened in 4th floor private lounge. Third unidentified party present.', 'High')
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('✅ Seed data inserted successfully!');

    // Output stats from Neon
    console.log('\n--- Live Neon PostgreSQL Database Summary ---');
    const tableList = [
      'users', 'investigations', 'fir_records', 'cdr_records', 
      'financial_transactions', 'vehicles', 'organisations', 
      'bank_accounts', 'surveillance_reports', 'persons', 
      'locations', 'alerts'
    ];
    for (const t of tableList) {
      const countRes = await client.query(`SELECT count(*) FROM ${t}`);
      console.log(`  * ${t.padEnd(24)}: ${countRes.rows[0].count} rows`);
    }
    console.log('----------------------------------------------\n');

  } catch (err) {
    console.error('❌ Error during seeding:', err);
  } finally {
    await client.end();
  }
}

seed();
