export interface MongoCyberComplaint {
  _id: string;
  complaintId: string;
  category: string;
  reportedAmount: number;
  status: 'Under Investigation' | 'Frozen' | 'Escalated' | 'Closed';
  victimState: string;
  suspectUPI: string;
  suspectPhone: string;
  timestamp: string;
  freezeRequested: boolean;
  notes: string;
}

export interface MongoPhishingDomain {
  _id: string;
  domain: string;
  registrar: string;
  hostingIp: string;
  asn: string;
  status: 'Active - High Risk' | 'Sinkholed' | 'Suspended';
  targetedBrand: string;
  firstSeen: string;
  dnsSinkholed: boolean;
  casesLinkedCount: number;
}

export interface MongoMuleAccount {
  _id: string;
  accountNumber: string;
  bankName: string;
  branch: string;
  accountHolder: string;
  totalLayeredAmount: number;
  panLinked: string;
  flaggedByBank: boolean;
  layeringDepth: number;
  routingCode: string;
}

export interface MongoSuspectDevice {
  _id: string;
  imei1: string;
  imei2?: string;
  deviceModel: string;
  simSlots: string[];
  lastLocationTower: string;
  ipAddresses: string[];
  riskLevel: 'Critical' | 'High' | 'Medium';
  lastSeen: string;
}

export interface MongoIpForensic {
  _id: string;
  ipAddress: string;
  isp: string;
  vpnProxyDetected: boolean;
  vpnProvider?: string;
  originCountry: string;
  associatedCasesCount: number;
  threatScore: number;
  openPorts: number[];
}

export const MONGO_CYBER_COMPLAINTS: MongoCyberComplaint[] = [
  {
    _id: '6601a9f4e2b810d931a00101',
    complaintId: 'NCRP-2026-DEL-8942',
    category: 'UPI / Part-time Job Scam',
    reportedAmount: 245000,
    status: 'Under Investigation',
    victimState: 'Delhi',
    suspectUPI: 'task.rewards99@okhdfc',
    suspectPhone: '+91 98765 43210',
    timestamp: '2026-03-22T10:14:00Z',
    freezeRequested: true,
    notes: 'Telegram bot based investment fraud layered into multiple mule accounts in Jamtara module.',
  },
  {
    _id: '6601a9f4e2b810d931a00102',
    complaintId: 'NCRP-2026-MH-4291',
    category: 'Digital Arrest / Fake CBI Warrant',
    reportedAmount: 1850000,
    status: 'Frozen',
    victimState: 'Maharashtra',
    suspectUPI: 'cbi.verification.dept@icici',
    suspectPhone: '+91 97204 88392',
    timestamp: '2026-03-21T14:40:00Z',
    freezeRequested: true,
    notes: 'Elderly retired professor targeted via Skype video call with fabricated Supreme Court seals.',
  },
  {
    _id: '6601a9f4e2b810d931a00103',
    complaintId: 'NCRP-2026-KA-1029',
    category: 'Cryptocurrency Arbitrage Scheme',
    reportedAmount: 760000,
    status: 'Escalated',
    victimState: 'Karnataka',
    suspectUPI: 'crypto.usdt.settle@paytm',
    suspectPhone: '+91 96112 04928',
    timestamp: '2026-03-20T09:25:00Z',
    freezeRequested: false,
    notes: 'Funds converted into USDT TRC-20 and remitted to offshore unhosted wallet clusters.',
  },
  {
    _id: '6601a9f4e2b810d931a00104',
    complaintId: 'NCRP-2026-UP-7721',
    category: 'Loan App Harassment & Extortion',
    reportedAmount: 95000,
    status: 'Under Investigation',
    victimState: 'Uttar Pradesh',
    suspectUPI: 'quick.credit.repay@axis',
    suspectPhone: '+91 99361 20491',
    timestamp: '2026-03-19T18:05:00Z',
    freezeRequested: true,
    notes: 'Predatory lending app cloned user contact list and dispatched morphed blackmail photos.',
  },
  {
    _id: '6601a9f4e2b810d931a00105',
    complaintId: 'NCRP-2026-TN-6104',
    category: 'Electricity Bill Disconnection Phishing',
    reportedAmount: 48000,
    status: 'Closed',
    victimState: 'Tamil Nadu',
    suspectUPI: 'power.tneb.online@sbi',
    suspectPhone: '+91 94441 83920',
    timestamp: '2026-03-18T12:30:00Z',
    freezeRequested: false,
    notes: 'SMS spoofing sending urgency alert for immediate meter disconnection with malicious APK link.',
  },
  {
    _id: '6601a9f4e2b810d931a00106',
    complaintId: 'NCRP-2026-WB-3392',
    category: 'SIM Swap & OTP Hijacking',
    reportedAmount: 512000,
    status: 'Under Investigation',
    victimState: 'West Bengal',
    suspectUPI: 'sim.swap.transfer@ybl',
    suspectPhone: '+91 98301 44921',
    timestamp: '2026-03-17T16:50:00Z',
    freezeRequested: true,
    notes: 'Target phone disconnected during midnight; fraudulent netbanking transfer executed immediately after.',
  },
  {
    _id: '6601a9f4e2b810d931a00107',
    complaintId: 'NCRP-2026-TS-5519',
    category: 'Stock Trading WhatsApp Group Scam',
    reportedAmount: 3200000,
    status: 'Escalated',
    victimState: 'Telangana',
    suspectUPI: 'institutional.vip.desk@kotak',
    suspectPhone: '+91 90001 92831',
    timestamp: '2026-03-16T11:10:00Z',
    freezeRequested: true,
    notes: 'Victims added to WhatsApp VIP group impersonating Morgan Stanley analysts with fake trading dashboard.',
  },
  {
    _id: '6601a9f4e2b810d931a00108',
    complaintId: 'NCRP-2026-GJ-2184',
    category: 'Customs Courier Parcel Extortion',
    reportedAmount: 640000,
    status: 'Frozen',
    victimState: 'Gujarat',
    suspectUPI: 'fedex.customs.clear@barodampay',
    suspectPhone: '+91 98251 77391',
    timestamp: '2026-03-15T15:20:00Z',
    freezeRequested: true,
    notes: 'Pretended parcel containing MDMA drugs was caught in Mumbai airport courier inspection.',
  },
];

export const MONGO_PHISHING_DOMAINS: MongoPhishingDomain[] = [
  {
    _id: '6601a9f4e2b810d931a00201',
    domain: 'sbi-kyc-pan-portal-update.com',
    registrar: 'NameCheap Inc.',
    hostingIp: '103.224.182.24',
    asn: 'AS13335 Cloudflare Managed',
    status: 'Active - High Risk',
    targetedBrand: 'State Bank of India',
    firstSeen: '2026-03-20T08:15:00Z',
    dnsSinkholed: false,
    casesLinkedCount: 38,
  },
  {
    _id: '6601a9f4e2b810d931a00202',
    domain: 'hdfc-netbanking-rewards-redeem.in',
    registrar: 'GoDaddy LLC',
    hostingIp: '198.54.117.200',
    asn: 'AS22612 Namecheap Hosting',
    status: 'Sinkholed',
    targetedBrand: 'HDFC Bank Ltd',
    firstSeen: '2026-03-18T14:22:00Z',
    dnsSinkholed: true,
    casesLinkedCount: 19,
  },
  {
    _id: '6601a9f4e2b810d931a00203',
    domain: 'income-tax-refund-gov-efiling.top',
    registrar: 'Hostinger International',
    hostingIp: '185.199.108.153',
    asn: 'AS47583 Hostinger Group',
    status: 'Active - High Risk',
    targetedBrand: 'Income Tax Department (e-Filing)',
    firstSeen: '2026-03-21T06:50:00Z',
    dnsSinkholed: false,
    casesLinkedCount: 44,
  },
  {
    _id: '6601a9f4e2b810d931a00204',
    domain: 'cbi-digital-arrest-court-summons.org',
    registrar: 'Porkbun LLC',
    hostingIp: '45.33.32.156',
    asn: 'AS63949 Linode Akamai',
    status: 'Active - High Risk',
    targetedBrand: 'Central Bureau of Investigation (CBI)',
    firstSeen: '2026-03-22T04:10:00Z',
    dnsSinkholed: false,
    casesLinkedCount: 12,
  },
  {
    _id: '6601a9f4e2b810d931a00205',
    domain: 'epfo-uan-claim-instant-kyc.xyz',
    registrar: 'Tucows Domains',
    hostingIp: '104.21.58.192',
    asn: 'AS13335 Cloudflare Inc.',
    status: 'Suspended',
    targetedBrand: 'EPFO (Provident Fund)',
    firstSeen: '2026-03-12T11:45:00Z',
    dnsSinkholed: true,
    casesLinkedCount: 27,
  },
  {
    _id: '6601a9f4e2b810d931a00206',
    domain: 'indane-lpg-subsidy-reverify.net',
    registrar: 'Dynadot LLC',
    hostingIp: '172.67.189.94',
    asn: 'AS13335 Cloudflare Inc.',
    status: 'Active - High Risk',
    targetedBrand: 'Indian Oil / Bharat Gas',
    firstSeen: '2026-03-23T07:12:00Z',
    dnsSinkholed: false,
    casesLinkedCount: 16,
  },
];

export const MONGO_MULE_ACCOUNTS: MongoMuleAccount[] = [
  {
    _id: '6601a9f4e2b810d931a00301',
    accountNumber: '5010049281928',
    bankName: 'HDFC Bank Ltd',
    branch: 'Jamalpur Branch, Ahmedabad',
    accountHolder: 'Rameshwar Prasad (Impersonated)',
    totalLayeredAmount: 1840000,
    panLinked: 'BXYPP4921K',
    flaggedByBank: true,
    layeringDepth: 3,
    routingCode: 'HDFC0001049',
  },
  {
    _id: '6601a9f4e2b810d931a00302',
    accountNumber: '39481029481',
    bankName: 'State Bank of India',
    branch: 'Bistupur, Jamshedpur',
    accountHolder: 'Md. Tariqul Islam',
    totalLayeredAmount: 2950000,
    panLinked: 'CJTPI8392M',
    flaggedByBank: true,
    layeringDepth: 4,
    routingCode: 'SBIN0000094',
  },
  {
    _id: '6601a9f4e2b810d931a00303',
    accountNumber: '912010048192019',
    bankName: 'Axis Bank Ltd',
    branch: 'Indirapuram, Ghaziabad',
    accountHolder: 'Sunita Devi (Dormant Account)',
    totalLayeredAmount: 890000,
    panLinked: 'AXPSD1920L',
    flaggedByBank: true,
    layeringDepth: 2,
    routingCode: 'UTIB0001201',
  },
  {
    _id: '6601a9f4e2b810d931a00304',
    accountNumber: '104928109281',
    bankName: 'Punjab National Bank',
    branch: 'Kharagpur Main, WB',
    accountHolder: 'Bikash Chandra Mandal',
    totalLayeredAmount: 4120000,
    panLinked: 'DZPMB4491J',
    flaggedByBank: true,
    layeringDepth: 5,
    routingCode: 'PUNB0104900',
  },
  {
    _id: '6601a9f4e2b810d931a00305',
    accountNumber: '60291049182',
    bankName: 'Bank of Maharashtra',
    branch: 'Shivaji Nagar, Pune',
    accountHolder: 'Ganesh Pandurang Rao',
    totalLayeredAmount: 640000,
    panLinked: 'AGPRG8391N',
    flaggedByBank: false,
    layeringDepth: 1,
    routingCode: 'MAHB0000021',
  },
  {
    _id: '6601a9f4e2b810d931a00306',
    accountNumber: '4091829102918',
    bankName: 'Kotak Mahindra Bank',
    branch: 'Banjara Hills, Hyderabad',
    accountHolder: 'K. Venkateshwar Rao (Shell Firm)',
    totalLayeredAmount: 5800000,
    panLinked: 'AAACK9192P',
    flaggedByBank: true,
    layeringDepth: 6,
    routingCode: 'KKBK0000551',
  },
  {
    _id: '6601a9f4e2b810d931a00307',
    accountNumber: '20491820192',
    bankName: 'Canara Bank',
    branch: 'Gandhinagar, Bengaluru',
    accountHolder: 'Suresh Kumar G.',
    totalLayeredAmount: 1150000,
    panLinked: 'BNPSK4019H',
    flaggedByBank: false,
    layeringDepth: 2,
    routingCode: 'CNRB0000204',
  },
];

export const MONGO_SUSPECT_DEVICES: MongoSuspectDevice[] = [
  {
    _id: '6601a9f4e2b810d931a00401',
    imei1: '867492048192049',
    imei2: '867492048192056',
    deviceModel: 'OnePlus Nord CE 3 5G',
    simSlots: ['+91 98765 43210', '+91 70291 88392'],
    lastLocationTower: 'Saket Metro Station Tower 4, New Delhi',
    ipAddresses: ['49.207.182.11', '106.195.42.8'],
    riskLevel: 'Critical',
    lastSeen: '2026-03-24T09:12:00Z',
  },
  {
    _id: '6601a9f4e2b810d931a00402',
    imei1: '862049182910491',
    imei2: '862049182910498',
    deviceModel: 'Xiaomi Redmi Note 12 Pro',
    simSlots: ['+91 97204 88392', '+91 81029 48192'],
    lastLocationTower: 'Kalyan Railway Station West, Thane',
    ipAddresses: ['182.73.19.4', '157.34.120.91'],
    riskLevel: 'Critical',
    lastSeen: '2026-03-23T14:45:00Z',
  },
  {
    _id: '6601a9f4e2b810d931a00403',
    imei1: '359104928192019',
    deviceModel: 'Apple iPhone 13 (A2633)',
    simSlots: ['+91 96112 04928'],
    lastLocationTower: 'Indiranagar 100ft Road Tower 2, Bengaluru',
    ipAddresses: ['103.224.182.55'],
    riskLevel: 'High',
    lastSeen: '2026-03-22T19:30:00Z',
  },
  {
    _id: '6601a9f4e2b810d931a00404',
    imei1: '864910294819201',
    imei2: '864910294819208',
    deviceModel: 'Realme Narzo 60x 5G',
    simSlots: ['+91 99361 20491', '+91 91201 84912'],
    lastLocationTower: 'Civil Lines Bus Depot, Kanpur',
    ipAddresses: ['117.211.89.4', '49.36.192.8'],
    riskLevel: 'High',
    lastSeen: '2026-03-21T11:05:00Z',
  },
  {
    _id: '6601a9f4e2b810d931a00405',
    imei1: '869018291029481',
    deviceModel: 'Samsung Galaxy M34 5G',
    simSlots: ['+91 98301 44921'],
    lastLocationTower: 'Sector V Salt Lake, Kolkata',
    ipAddresses: ['103.49.201.12'],
    riskLevel: 'Medium',
    lastSeen: '2026-03-20T17:40:00Z',
  },
];

export const MONGO_IP_FORENSICS: MongoIpForensic[] = [
  {
    _id: '6601a9f4e2b810d931a00501',
    ipAddress: '103.224.182.24',
    isp: 'Bharti Airtel Enterprise Gateway',
    vpnProxyDetected: true,
    vpnProvider: 'NordVPN Dedicated IP Pool',
    originCountry: 'India (Routed via Singapore)',
    associatedCasesCount: 38,
    threatScore: 0.94,
    openPorts: [80, 443, 8080, 22],
  },
  {
    _id: '6601a9f4e2b810d931a00502',
    ipAddress: '198.54.117.200',
    isp: 'Namecheap Hosting Network',
    vpnProxyDetected: true,
    vpnProvider: 'Commercial SOCKS5 Proxy',
    originCountry: 'United States',
    associatedCasesCount: 19,
    threatScore: 0.88,
    openPorts: [80, 443, 8443],
  },
  {
    _id: '6601a9f4e2b810d931a00503',
    ipAddress: '185.199.108.153',
    isp: 'Hostinger Datacenter Network',
    vpnProxyDetected: false,
    originCountry: 'Lithuania',
    associatedCasesCount: 44,
    threatScore: 0.91,
    openPorts: [80, 443, 3306],
  },
  {
    _id: '6601a9f4e2b810d931a00504',
    ipAddress: '49.207.182.11',
    isp: 'Reliance Jio 5G Mobile Gateway',
    vpnProxyDetected: false,
    originCountry: 'India',
    associatedCasesCount: 14,
    threatScore: 0.76,
    openPorts: [443],
  },
  {
    _id: '6601a9f4e2b810d931a00505',
    ipAddress: '45.33.32.156',
    isp: 'Linode Cloud Infrastructure',
    vpnProxyDetected: true,
    vpnProvider: 'Mullvad WireGuard Tunnel',
    originCountry: 'Germany',
    associatedCasesCount: 12,
    threatScore: 0.85,
    openPorts: [80, 443, 51820],
  },
  {
    _id: '6601a9f4e2b810d931a00506',
    ipAddress: '104.21.58.192',
    isp: 'Cloudflare Edge CDN',
    vpnProxyDetected: true,
    vpnProvider: 'Cloudflare WARP',
    originCountry: 'United Kingdom',
    associatedCasesCount: 27,
    threatScore: 0.82,
    openPorts: [80, 443],
  },
];
