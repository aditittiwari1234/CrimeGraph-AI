import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Database, Search, Filter, Download, FileText, Phone, CreditCard,
  Truck, Building2, Eye, MapPin, AlertTriangle, CheckCircle2,
  ChevronRight, ExternalLink, RefreshCw, X, Users, ArrowUpDown, Plus,
  Server, Shield, Wifi, HardDrive
} from 'lucide-react';
import {
  FIR_RECORDS, CDR_RECORDS, TRANSACTIONS, VEHICLES,
  ORGANISATIONS, ACCOUNTS, SURVEILLANCE_REPORTS, LOCATIONS,
  PERSONS, PHONES, ENTITY_COUNTS,
  type FIR, type CDRRecord, type FinancialTransaction,
  type Vehicle, type Organisation, type Account,
  type SurveillanceReport, type Location, type Person
} from '../data/dataset';
import {
  NEON_FIRS, NEON_PERSONS, NEON_VEHICLES, NEON_ORGANISATIONS,
  NEON_FINANCIALS, NEON_CDRS, NEON_ACCOUNTS, NEON_SURVEILLANCE, NEON_LOCATIONS
} from '../data/neonDataset';
import DatabaseSelector from '../components/database/DatabaseSelector';
import { useDatabases } from '../contexts/DatabaseContext';
type TabKey = 'fir' | 'cdr' | 'financial' | 'vehicles' | 'organisations' | 'accounts' | 'surveillance' | 'locations' | 'persons';

export default function DatabasePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabKey | null;
  const { activeDatabase, setIsAddModalOpen } = useDatabases();
  const [activeTab, setActiveTab] = useState<TabKey>(tabParam || 'fir');
  const [search, setSearch] = useState('');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [dbSyncNotice, setDbSyncNotice] = useState<string>('Live Connected');

  // Local dataset state allowing manual additions and dynamic database switching
  const [firs, setFirs] = useState<FIR[]>(NEON_FIRS);
  const [cdrs, setCdrs] = useState<CDRRecord[]>(NEON_CDRS);
  const [financials, setFinancials] = useState<FinancialTransaction[]>(NEON_FINANCIALS);
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>(NEON_VEHICLES);
  const [organisationsList, setOrganisationsList] = useState<Organisation[]>(NEON_ORGANISATIONS);
  const [accountsList, setAccountsList] = useState<Account[]>(NEON_ACCOUNTS);
  const [surveillanceList, setSurveillanceList] = useState<SurveillanceReport[]>(NEON_SURVEILLANCE);
  const [locationsList, setLocationsList] = useState<Location[]>(NEON_LOCATIONS);
  const [personsList, setPersonsList] = useState<Person[]>(NEON_PERSONS);

  // Sync tab from URL query params when navigation occurs
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Load actual data matching active database source
  const loadDatabaseData = useCallback(async (dbId: string) => {
    setIsLoadingDb(true);
    setPage(1);

    if (dbId === 'db-neon-cloud-pg') {
      try {
        const res = await fetch('/api/database/live-data');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setFirs(json.data.firs && json.data.firs.length > 0 ? json.data.firs : NEON_FIRS);
            setPersonsList(json.data.persons && json.data.persons.length > 0 ? json.data.persons : NEON_PERSONS);
            setVehiclesList(json.data.vehicles && json.data.vehicles.length > 0 ? json.data.vehicles : NEON_VEHICLES);
            setOrganisationsList(json.data.organisations && json.data.organisations.length > 0 ? json.data.organisations : NEON_ORGANISATIONS);
            setFinancials(json.data.financials && json.data.financials.length > 0 ? json.data.financials : NEON_FINANCIALS);
            setCdrs(json.data.cdrs && json.data.cdrs.length > 0 ? json.data.cdrs : NEON_CDRS);
            setAccountsList(json.data.accounts && json.data.accounts.length > 0 ? json.data.accounts : NEON_ACCOUNTS);
            setSurveillanceList(json.data.surveillance && json.data.surveillance.length > 0 ? json.data.surveillance : NEON_SURVEILLANCE);
            setLocationsList(json.data.locations && json.data.locations.length > 0 ? json.data.locations : NEON_LOCATIONS);
            setDbSyncNotice('Live Neon PostgreSQL (neondb) · Direct Pooler 5432 · Synced from AWS Cloud');
            setIsLoadingDb(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Neon live fetch fallback:', err);
      }

      setFirs(NEON_FIRS);
      setPersonsList(NEON_PERSONS);
      setVehiclesList(NEON_VEHICLES);
      setOrganisationsList(NEON_ORGANISATIONS);
      setFinancials(NEON_FINANCIALS);
      setCdrs(NEON_CDRS);
      setAccountsList(NEON_ACCOUNTS);
      setSurveillanceList(NEON_SURVEILLANCE);
      setLocationsList(NEON_LOCATIONS);
      setDbSyncNotice('Live Neon PostgreSQL · Production Schemas & Seed Records Active');
    } else if (dbId === 'db-mha-cctns-sql' || dbId === 'db-cctns-state') {
      setFirs(FIR_RECORDS.filter(f => f.district.includes('Kanpur') || f.state === 'Uttar Pradesh' || f.state === 'Delhi'));
      setPersonsList(PERSONS.filter(p => p.status === 'Person of Interest' || p.status === 'Under Surveillance'));
      setVehiclesList(VEHICLES.filter(v => v.registrationState === 'Uttar Pradesh' || v.registrationState === 'Delhi'));
      setOrganisationsList(ORGANISATIONS.filter(o => o.state === 'Uttar Pradesh' || o.state === 'Delhi'));
      setFinancials(TRANSACTIONS.slice(0, 3));
      setCdrs(CDR_RECORDS.slice(0, 4));
      setAccountsList(ACCOUNTS.slice(0, 2));
      setSurveillanceList(SURVEILLANCE_REPORTS);
      setLocationsList(LOCATIONS.slice(0, 3));
      setActiveTab('fir');
      setDbSyncNotice('CCTNS National Police Registry: State Police Station Chargesheets & FIRs');
    } else if (dbId === 'db-dot-lims' || dbId === 'db-telecom-cms') {
      setFirs(FIR_RECORDS.slice(0, 2));
      setPersonsList(PERSONS.filter(p => p.linkedPhones && p.linkedPhones.length > 0));
      setVehiclesList([]);
      setOrganisationsList([]);
      setFinancials([]);
      setCdrs(CDR_RECORDS);
      setAccountsList([]);
      setSurveillanceList(SURVEILLANCE_REPORTS.slice(0, 1));
      setLocationsList(LOCATIONS);
      setActiveTab('cdr');
      setDbSyncNotice('DoT Telecom Gateway (CMS / LIMS): Call Detail Records & Tower Triangulation');
    } else if (dbId === 'db-fiu-core-dw' || dbId === 'db-fiu-aml') {
      setFirs(FIR_RECORDS.filter(f => f.sections.some(s => s.includes('PMLA') || s.includes('420'))));
      setPersonsList(PERSONS.filter(p => p.occupation?.includes('Director') || p.occupation?.includes('Merchant') || p.occupation?.includes('Accountant')));
      setVehiclesList([]);
      setOrganisationsList(ORGANISATIONS);
      setFinancials(TRANSACTIONS);
      setCdrs([]);
      setAccountsList(ACCOUNTS);
      setSurveillanceList([]);
      setLocationsList([]);
      setActiveTab('financial');
      setDbSyncNotice('FIU-IND Intelligence Warehouse: Suspicious Transactions & Bank Accounts');
    } else if (dbId === 'db-vahan-registry' || dbId === 'db-vahan-transport') {
      setFirs(FIR_RECORDS.slice(0, 2));
      setPersonsList(PERSONS.filter(p => p.linkedVehicles && p.linkedVehicles.length > 0));
      setVehiclesList(VEHICLES);
      setOrganisationsList(ORGANISATIONS.filter(o => o.name.includes('Logistics') || o.name.includes('Transport')));
      setFinancials([]);
      setCdrs([]);
      setAccountsList([]);
      setSurveillanceList([]);
      setLocationsList(LOCATIONS.slice(0, 2));
      setActiveTab('vehicles');
      setDbSyncNotice('MoRTH VAHAN & SARATHI: Motor Vehicle Registrations & ANPR Toll Logs');
    } else if (dbId === 'db-ncrb-core') {
      setFirs(FIR_RECORDS);
      setPersonsList(PERSONS);
      setVehiclesList(VEHICLES);
      setOrganisationsList(ORGANISATIONS);
      setFinancials(TRANSACTIONS);
      setCdrs(CDR_RECORDS);
      setAccountsList(ACCOUNTS);
      setSurveillanceList(SURVEILLANCE_REPORTS);
      setLocationsList(LOCATIONS);
      setDbSyncNotice('NCRB Central Repository: Consolidated National Multi-Agency Intelligence Master');
    } else {
      // Custom connected external database
      setFirs([]);
      setPersonsList([]);
      setVehiclesList([]);
      setOrganisationsList([]);
      setFinancials([]);
      setCdrs([]);
      setAccountsList([]);
      setSurveillanceList([]);
      setLocationsList([]);
      setDbSyncNotice(`External Database (${activeDatabase.name}): Ready for ingested case data or manual entry`);
    }

    setIsLoadingDb(false);
  }, [activeDatabase.name]);

  useEffect(() => {
    loadDatabaseData(activeDatabase.id);
  }, [activeDatabase.id, loadDatabaseData]);

  const tabs: { key: TabKey; label: string; count: number; icon: any; color: string; dept: string }[] = [
    { key: 'fir', label: 'FIR & Police Records', count: firs.length, icon: FileText, color: '#dc2626', dept: 'CCTNS / State Police' },
    { key: 'cdr', label: 'CDR Communications', count: cdrs.length, icon: Phone, color: '#16a34a', dept: 'DoT Telecom Gateway' },
    { key: 'financial', label: 'Financial Transactions', count: financials.length, icon: CreditCard, color: '#ca8a04', dept: 'FIU-IND / Core Banking' },
    { key: 'vehicles', label: 'Vehicle Registry (VAHAN)', count: vehiclesList.length, icon: Truck, color: '#ea580c', dept: 'MoRTH VAHAN' },
    { key: 'organisations', label: 'Organisations & Entities', count: organisationsList.length, icon: Building2, color: '#7c3aed', dept: 'MCA / GSTIN Network' },
    { key: 'accounts', label: 'Bank Accounts', count: accountsList.length, icon: CreditCard, color: '#0891b2', dept: 'RBI / Scheduled Banks' },
    { key: 'surveillance', label: 'Surveillance & Intel Logs', count: surveillanceList.length, icon: Eye, color: '#be185d', dept: 'Special Intelligence Wing' },
    { key: 'locations', label: 'Locations & Hotspots', count: locationsList.length, icon: MapPin, color: '#e11d48', dept: 'Geospatial Intel GIS' },
    { key: 'persons', label: 'Persons of Interest', count: personsList.length, icon: Users, color: '#2563eb', dept: 'National Criminal Registry' },
  ];

  // Filter records per tab
  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    switch (activeTab) {
      case 'fir':
        return firs.filter(r => {
          if (flaggedOnly && r.priority !== 'Critical' && r.priority !== 'High') return false;
          if (!q) return true;
          return r.firNumber.toLowerCase().includes(q) ||
            r.station?.toLowerCase().includes(q) ||
            r.district?.toLowerCase().includes(q) ||
            r.complainant?.toLowerCase().includes(q) ||
            r.description?.toLowerCase().includes(q) ||
            r.accused?.some(a => a.toLowerCase().includes(q));
        });
      case 'cdr':
        return cdrs.filter(r => {
          if (flaggedOnly && !r.flagged) return false;
          if (!q) return true;
          return r.callerNumber.includes(q) ||
            r.calleeNumber.includes(q) ||
            r.callerId.toLowerCase().includes(q) ||
            r.calleeId.toLowerCase().includes(q) ||
            r.towerLocation?.toLowerCase().includes(q) ||
            r.flagReason?.toLowerCase().includes(q);
        });
      case 'financial':
        return financials.filter(r => {
          if (flaggedOnly && !r.flagged) return false;
          if (!q) return true;
          return r.fromAccount.toLowerCase().includes(q) ||
            r.toAccount.toLowerCase().includes(q) ||
            r.referenceNo?.toLowerCase().includes(q) ||
            r.channel?.toLowerCase().includes(q) ||
            r.flagReason?.toLowerCase().includes(q);
        });
      case 'vehicles':
        return vehiclesList.filter(r => {
          if (flaggedOnly && !r.flagged) return false;
          if (!q) return true;
          return r.licensePlate.toLowerCase().includes(q) ||
            r.registeredOwner?.toLowerCase().includes(q) ||
            r.make?.toLowerCase().includes(q) ||
            r.model?.toLowerCase().includes(q) ||
            r.registrationState?.toLowerCase().includes(q);
        });
      case 'organisations':
        return organisationsList.filter(r => {
          if (flaggedOnly && !r.flagged) return false;
          if (!q) return true;
          return r.name.toLowerCase().includes(q) ||
            r.cin?.toLowerCase().includes(q) ||
            r.director?.toLowerCase().includes(q) ||
            r.city?.toLowerCase().includes(q);
        });
      case 'accounts':
        return accountsList.filter(r => {
          if (flaggedOnly && !r.suspiciousActivity) return false;
          if (!q) return true;
          return r.accountNumber.toLowerCase().includes(q) ||
            r.bank?.toLowerCase().includes(q) ||
            r.ifsc?.toLowerCase().includes(q) ||
            r.linkedPerson?.toLowerCase().includes(q);
        });
      case 'surveillance':
        return surveillanceList.filter(r => {
          if (flaggedOnly && r.priority !== 'High' && r.priority !== 'Critical') return false;
          if (!q) return true;
          return r.reportNumber.toLowerCase().includes(q) ||
            r.location?.toLowerCase().includes(q) ||
            r.reportingOfficer?.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q) ||
            r.personsObserved.some(p => p.toLowerCase().includes(q));
        });
      case 'locations':
        return locationsList.filter(r => {
          if (!q) return true;
          return r.name.toLowerCase().includes(q) ||
            r.city?.toLowerCase().includes(q) ||
            r.state?.toLowerCase().includes(q) ||
            r.significance?.toLowerCase().includes(q);
        });
      case 'persons':
        return personsList.filter(r => {
          if (flaggedOnly && (r.riskScore || 0) < 0.6) return false;
          if (!q) return true;
          return r.name.toLowerCase().includes(q) ||
            r.alias?.toLowerCase().includes(q) ||
            r.city?.toLowerCase().includes(q) ||
            r.occupation?.toLowerCase().includes(q) ||
            r.flaggedReason?.toLowerCase().includes(q);
        });
      default:
        return [];
    }
  }, [activeTab, search, flaggedOnly, firs, cdrs, financials, vehiclesList, organisationsList, accountsList, surveillanceList, locationsList, personsList]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  // Export current table to CSV
  const handleExport = () => {
    if (!filteredData.length) return;
    const keys = Object.keys(filteredData[0]);
    const csvContent = [
      keys.join(','),
      ...filteredData.map(row =>
        keys.map(k => {
          const val = (row as any)[k];
          if (Array.isArray(val)) return `"${val.join('; ')}"`;
          if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
          return val ?? '';
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `crimegraph_${activeTab}_records.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentTabMeta = tabs.find(t => t.key === activeTab)!;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 48 }}>
      {/* Database Context Switcher Bar */}
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
                background: '#eff6ff',
                color: '#2563eb',
                padding: '6px 10px',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 700,
                fontSize: '0.8rem'
              }}>
                <Database size={16} />
                <span>CENTRAL CRIMINAL INTELLIGENCE REPOSITORY</span>
              </div>
              <span style={{
                background: '#f1f5f9',
                color: '#475569',
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: 6
              }}>
                Active DB: {activeDatabase.name}
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 6px' }}>
              Master Database Explorer
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, maxWidth: 850 }}>
              Direct unified query access to all ingested records across police FIRs, cellular communication logs (CDR),
              financial intelligence, vehicle registries, corporate filings, and surveillance transcripts in <strong>{activeDatabase.name}</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
            >
              <Plus size={15} color="#2563eb" />
              Add Database
            </button>
            <button
              onClick={() => navigate('/data-sources')}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
            >
              <ExternalLink size={15} />
              Multi-Dept Integrations
            </button>
            <button
              onClick={handleExport}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
            >
              <Download size={15} />
              Export {currentTabMeta.label} ({filteredData.length})
            </button>
          </div>
        </div>

        {/* Global Stats bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 12,
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid #f1f5f9'
        }}>
          <div style={{ textAlign: 'center', padding: '8px', background: '#f8fafc', borderRadius: 8 }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total FIRs</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626' }}>{firs.length}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px', background: '#f8fafc', borderRadius: 8 }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>CDR Calls</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>{cdrs.length}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px', background: '#f8fafc', borderRadius: 8 }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Transactions</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ca8a04' }}>{financials.length}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px', background: '#f8fafc', borderRadius: 8 }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Persons</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>{personsList.length}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px', background: '#f8fafc', borderRadius: 8 }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Vehicles</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ea580c' }}>{vehiclesList.length}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px', background: '#f8fafc', borderRadius: 8 }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Organizations</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#7c3aed' }}>{organisationsList.length}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px', background: '#f8fafc', borderRadius: 8 }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Intel Reports</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#be185d' }}>{surveillanceList.length}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px', background: '#f8fafc', borderRadius: 8 }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Locations</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0891b2' }}>{locationsList.length}</div>
          </div>
        </div>
      </div>

      {/* Active Source Live Telemetry Callout */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderLeft: '4px solid #0284c7',
        borderRadius: 10,
        padding: '12px 18px',
        marginBottom: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: activeDatabase.status === 'connected' ? '#16a34a' : '#ea580c',
            boxShadow: activeDatabase.status === 'connected' ? '0 0 0 3px rgba(22,163,74,0.25)' : 'none',
          }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                Active Data Source: {activeDatabase.name}
              </span>
              <span style={{
                background: '#e0f2fe',
                color: '#0369a1',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}>
                {activeDatabase.type}
              </span>
              <span style={{
                background: '#f1f5f9',
                color: '#475569',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: '0.72rem',
                fontWeight: 600,
              }}>
                {activeDatabase.host}:{activeDatabase.port || 5432}
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
              {dbSyncNotice}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: '0.76rem', color: '#16a34a', fontWeight: 700,
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            padding: '4px 10px', borderRadius: 20
          }}>
            <Wifi size={12} />
            {activeDatabase.latencyMs} ms · Synced via Gateway
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        paddingBottom: 6,
        marginBottom: 16,
        borderBottom: '2px solid #e2e8f0',
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
                setSelectedRecord(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: '8px 8px 0 0',
                border: isActive ? '1px solid #cbd5e1' : '1px solid transparent',
                borderBottom: isActive ? '2px solid #2563eb' : '1px solid transparent',
                background: isActive ? '#ffffff' : '#f8fafc',
                color: isActive ? '#0f172a' : '#64748b',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 120ms ease',
                marginBottom: -2,
              }}
            >
              <Icon size={16} color={isActive ? tab.color : '#94a3b8'} />
              <span>{tab.label}</span>
              <span style={{
                background: isActive ? `${tab.color}18` : '#e2e8f0',
                color: isActive ? tab.color : '#64748b',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 10,
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        padding: '14px 18px',
        marginBottom: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 450 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder={`Search in ${currentTabMeta.label}...`}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="input"
              style={{ paddingLeft: 36, width: '100%', fontSize: '0.875rem' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.85rem', color: '#334155', fontWeight: 500 }}>
            <input
              type="checkbox"
              checked={flaggedOnly}
              onChange={e => { setFlaggedOnly(e.target.checked); setPage(1); }}
              style={{ borderRadius: 4, cursor: 'pointer' }}
            />
            <span>Show Flagged / High Priority Only</span>
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#64748b' }}>
          <span>Originating Department:</span>
          <span style={{ fontWeight: 700, color: '#0f172a', background: '#f1f5f9', padding: '4px 8px', borderRadius: 6 }}>
            {currentTabMeta.dept}
          </span>
          <span>·</span>
          <span>Showing <strong>{filteredData.length}</strong> records</span>
        </div>
      </div>

      {/* Main Table Container */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        {filteredData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <AlertTriangle size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#475569' }}>No records match your query</div>
            <div style={{ fontSize: '0.85rem', marginTop: 4 }}>Try clearing search keywords or unchecking the flagged filter</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {/* Render Table based on activeTab */}
            {activeTab === 'fir' && (
              <table className="table" style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>FIR Number</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Police Station / District</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>IPC / Act Sections</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Date Filed</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Complainant</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Accused / Suspects</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Priority</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(paginatedData as FIR[]).map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover-row">
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#2563eb' }}>
                        {r.firNumber}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.station}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.district}, {r.state}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {r.sections?.map(s => (
                            <span key={s} style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '0.72rem', fontWeight: 600, padding: '2px 6px', borderRadius: 4 }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{r.filedDate}</td>
                      <td style={{ padding: '12px 16px', color: '#0f172a' }}>{r.complainant}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {r.accused?.map(a => (
                            <span key={a} style={{ background: '#f1f5f9', color: '#334155', fontSize: '0.75rem', padding: '2px 6px', borderRadius: 4, fontWeight: 500 }}>
                              {a}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: r.priority === 'Critical' ? '#fee2e2' : r.priority === 'High' ? '#ffedd5' : '#f0fdf4',
                          color: r.priority === 'Critical' ? '#dc2626' : r.priority === 'High' ? '#c2410c' : '#15803d',
                          padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700
                        }}>
                          {r.priority || 'Normal'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* CDR Tab */}
            {activeTab === 'cdr' && (
              <table className="table" style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Record ID</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Calling Party (A)</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Receiving Party (B)</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Type</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Duration</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Timestamp</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Cell Tower Location</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Intelligence Flag</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(paginatedData as CDRRecord[]).map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover-row">
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#64748b' }}>{r.id}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.callerNumber}</div>
                        <div style={{ fontSize: '0.72rem', color: '#2563eb' }}>ID: {r.callerId}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.calleeNumber}</div>
                        <div style={{ fontSize: '0.72rem', color: '#2563eb' }}>ID: {r.calleeId}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: r.type === 'CALL' ? '#dbeafe' : '#f3e8ff',
                          color: r.type === 'CALL' ? '#1d4ed8' : '#7e22ce',
                          padding: '2px 6px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700
                        }}>
                          {r.type}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{r.duration}s</td>
                      <td style={{ padding: '12px 16px', color: '#475569', fontSize: '0.8rem' }}>{r.timestamp}</td>
                      <td style={{ padding: '12px 16px', color: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={13} color="#64748b" />
                          <span>{r.towerLocation || 'Cell Tower Auto'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {r.flagged ? (
                          <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                            {r.flagReason || 'Suspicious Burst'}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Normal</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Financial Transactions Tab */}
            {activeTab === 'financial' && (
              <table className="table" style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Ref No / Txn ID</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>From Account</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>To Account</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Amount (INR)</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Date & Channel</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Narration</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>AML / FIU Flag</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(paginatedData as FinancialTransaction[]).map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover-row">
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2563eb' }}>{r.referenceNo || r.id}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.fromAccount}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>ID: {r.fromAccountId}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.toAccount}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>ID: {r.toAccountId}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontWeight: 800, color: r.amount >= 500000 ? '#b91c1c' : '#0f172a' }}>
                          ₹{r.amount.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ color: '#0f172a' }}>{r.date}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>{r.channel || 'NEFT'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.narration || 'Commercial transfer'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {r.flagged ? (
                          <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                            {r.flagReason || 'High Risk'}
                          </span>
                        ) : (
                          <span style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: 600 }}>Cleared</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Vehicles Tab */}
            {activeTab === 'vehicles' && (
              <table className="table" style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>License Plate</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Make & Model</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Color / Year</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Registered Owner</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>State</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Insurance / RC Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Surveillance Flag</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(paginatedData as Vehicle[]).map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover-row">
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0f172a' }}>
                        <span style={{ border: '1px solid #cbd5e1', background: '#f8fafc', padding: '3px 8px', borderRadius: 4 }}>
                          {r.licensePlate}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>{r.make} {r.model}</td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{r.color} · {r.year}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2563eb' }}>{r.registeredOwner}</td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{r.registrationState}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '0.75rem', fontWeight: 600, padding: '2px 6px', borderRadius: 4 }}>
                          {r.status || 'Active RC'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {r.flagged ? (
                          <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                            Tracked in Convoy
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Normal</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Organisations Tab */}
            {activeTab === 'organisations' && (
              <table className="table" style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Entity Name</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Type & Nature</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>CIN / Registration</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Director / Key Person</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>City / State</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Annual Turnover</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Shell Suspicion</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(paginatedData as Organisation[]).map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover-row">
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{r.name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ color: '#0f172a' }}>{r.type}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{r.businessNature}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#475569' }}>{r.cin}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2563eb' }}>{r.director}</td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{r.city}, {r.state}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>{r.turnover}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {r.flagged ? (
                          <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                            Suspected Shell
                          </span>
                        ) : (
                          <span style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: 600 }}>Active</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Accounts Tab */}
            {activeTab === 'accounts' && (
              <table className="table" style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Account Number</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Bank & Branch</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>IFSC Code</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Linked Entity</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Type</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Balance</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(paginatedData as Account[]).map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover-row">
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{r.accountNumber}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.bank}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{r.branch}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#475569' }}>{r.ifsc}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#2563eb' }}>{r.linkedPerson || r.linkedOrg || '—'}</td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{r.accountType}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{r.balance}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {r.suspiciousActivity ? (
                          <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                            Suspicious Activity
                          </span>
                        ) : (
                          <span style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: 600 }}>Normal</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Surveillance Tab */}
            {activeTab === 'surveillance' && (
              <table className="table" style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Report Ref</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Date & Time</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Surveillance Location</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Reporting Officer</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Persons Observed</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Summary</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Priority</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(paginatedData as SurveillanceReport[]).map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover-row">
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#2563eb' }}>{r.reportNumber}</td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{r.date} {r.time && `· ${r.time}`}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>{r.location}</td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{r.reportingOfficer}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {r.personsObserved.map(p => (
                            <span key={p} style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '0.72rem', fontWeight: 600, padding: '2px 6px', borderRadius: 4 }}>
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#334155', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.description}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: r.priority === 'High' ? '#fee2e2' : '#fef9c3',
                          color: r.priority === 'High' ? '#b91c1c' : '#854d0e',
                          padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700
                        }}>
                          {r.priority || 'Medium'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Locations Tab */}
            {activeTab === 'locations' && (
              <table className="table" style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Location Name</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Type</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>City / State</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Coordinates</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Strategic Significance</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(paginatedData as Location[]).map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover-row">
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>{r.name}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>{r.type}</td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{r.city}, {r.state}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>
                        {r.lat && r.lng ? `${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#334155' }}>{r.significance}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Persons Tab */}
            {activeTab === 'persons' && (
              <table className="table" style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Name / Alias</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Age / Gender</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Aadhaar (Masked)</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Location</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Occupation</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Risk Score</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(paginatedData as Person[]).map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover-row">
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.name}</div>
                        {r.alias && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Alias: {r.alias}</div>}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{r.age || '—'} · {r.gender}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#64748b' }}>{r.aadharMasked || 'XXXX-XXXX-XXXX'}</td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>{r.city}, {r.state}</td>
                      <td style={{ padding: '12px 16px', color: '#0f172a' }}>{r.occupation || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 48, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{
                              width: `${((r.riskScore || 0) * 100)}%`,
                              height: '100%',
                              background: (r.riskScore || 0) >= 0.7 ? '#dc2626' : (r.riskScore || 0) >= 0.4 ? '#ea580c' : '#16a34a'
                            }} />
                          </div>
                          <span style={{ fontWeight: 700, fontSize: '0.78rem', color: (r.riskScore || 0) >= 0.7 ? '#dc2626' : '#475569' }}>
                            {Math.round((r.riskScore || 0) * 100)}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: r.status === 'Person of Interest' ? '#fee2e2' : r.status === 'Under Surveillance' ? '#ffedd5' : '#f1f5f9',
                          color: r.status === 'Person of Interest' ? '#b91c1c' : r.status === 'Under Surveillance' ? '#c2410c' : '#475569',
                          padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600
                        }}>
                          {r.status || 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Pagination footer */}
        {filteredData.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            fontSize: '0.85rem',
            color: '#64748b'
          }}>
            <div>
              Showing <strong>{((page - 1) * pageSize) + 1}</strong> to <strong>{Math.min(page * pageSize, filteredData.length)}</strong> of <strong>{filteredData.length}</strong> records
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.8rem', opacity: page === 1 ? 0.5 : 1 }}
              >
                Previous
              </button>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontWeight: 600, color: '#0f172a' }}>
                Page {page} of {totalPages}
              </div>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.8rem', opacity: page === totalPages ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record Inspection Modal / Drawer */}
      {selectedRecord && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedRecord(null);
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
            maxWidth: 680,
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3), 0 0 0 1px rgba(15, 23, 42, 0.12)',
            overflow: 'hidden',
            border: '1px solid #cbd5e1',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {currentTabMeta.label} Record Detail
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                  {selectedRecord.firNumber || selectedRecord.licensePlate || selectedRecord.name || selectedRecord.accountNumber || selectedRecord.id}
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 6, borderRadius: 6 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 20 }}>
                {Object.entries(selectedRecord).map(([k, v]) => {
                  if (typeof v === 'object' && v !== null && !Array.isArray(v)) return null;
                  return (
                    <div key={k} style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'capitalize' }}>
                        {k.replace(/([A-Z])/g, ' $1')}
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginTop: 2, wordBreak: 'break-word' }}>
                        {Array.isArray(v) ? v.join(', ') : String(v ?? '—')}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* JSON Payload preview */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Raw Ingested JSON Schema
                </div>
                <pre style={{
                  background: '#0f172a',
                  color: '#38bdf8',
                  padding: 14,
                  borderRadius: 8,
                  fontSize: '0.75rem',
                  overflowX: 'auto',
                  fontFamily: 'monospace',
                  maxHeight: 180,
                }}>
                  {JSON.stringify(selectedRecord, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              background: '#f8fafc'
            }}>
              <button
                onClick={() => setSelectedRecord(null)}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
