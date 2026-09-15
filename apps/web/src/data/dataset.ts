// ============================================================
// CrimeGraph AI — Comprehensive Synthetic Dataset
// SIH 2026 · Problem Statement 26189 · NCRB
// ALL DATA IS SYNTHETIC — No real personal information
// ============================================================

export interface Person {
  id: string; nodeType: 'Person';
  name: string; alias?: string; age?: number; gender: string;
  dob?: string; aadharMasked?: string; pan?: string;
  address?: string; city?: string; state?: string; pincode?: string;
  occupation?: string; employer?: string;
  communityId?: string; riskScore?: number;
  centralityScore?: number; betweennessScore?: number;
  status?: string; nationality?: string;
  linkedPhones?: string[]; linkedVehicles?: string[];
  notes?: string; flaggedReason?: string;
}

export interface Phone {
  id: string; nodeType: 'Phone';
  number: string; operator?: string; circle?: string;
  imei?: string; simType?: string; registeredOwner?: string;
  registrationDate?: string; status?: string;
  lastLocation?: string; callCount?: number;
}

export interface Vehicle {
  id: string; nodeType: 'Vehicle';
  licensePlate: string; make?: string; model?: string;
  color?: string; year?: number; fuelType?: string;
  chassisNo?: string; engineNo?: string;
  registeredOwner?: string; registrationState?: string;
  insuranceValid?: string; rcExpiry?: string;
  status?: string; flagged?: boolean;
}

export interface Organisation {
  id: string; nodeType: 'Organization';
  name: string; type?: string; cin?: string; gstin?: string;
  incorporationDate?: string; registeredAddress?: string;
  city?: string; state?: string; director?: string;
  turnover?: string; status?: string; flagged?: boolean;
  businessNature?: string;
}

export interface Account {
  id: string; nodeType: 'Account';
  accountNumber: string; bank?: string; branch?: string;
  ifsc?: string; accountType?: string;
  linkedPerson?: string; linkedOrg?: string;
  balance?: string; openedDate?: string;
  suspiciousActivity?: boolean; frozenStatus?: boolean;
}

export interface Location {
  id: string; nodeType: 'Location';
  name: string; type?: string; address?: string;
  city?: string; state?: string; pincode?: string;
  lat?: number; lng?: number; significance?: string;
}

export interface FIR {
  id: string;
  firNumber: string; station?: string; district?: string;
  state?: string; filedDate?: string; filedBy?: string;
  sections?: string[]; description?: string;
  complainant?: string; accused?: string[];
  status?: string; priority?: string;
  linkedEntities?: string[];
}

export interface CDRRecord {
  id: string; callerId: string; calleeId: string;
  callerNumber: string; calleeNumber: string;
  duration: number; type: 'CALL' | 'SMS';
  timestamp: string; towerLocation?: string;
  flagged?: boolean; flagReason?: string;
}

export interface FinancialTransaction {
  id: string; fromAccountId: string; toAccountId: string;
  fromAccount: string; toAccount: string;
  amount: number; currency: string;
  date: string; channel?: string;
  narration?: string; referenceNo?: string;
  flagged?: boolean; flagReason?: string;
}

export interface SurveillanceReport {
  id: string; reportNumber: string;
  date: string; time?: string;
  location?: string; reportingOfficer?: string;
  personsObserved: string[];
  description: string; evidenceRef?: string;
  priority?: string;
}

// ============================================================
// PERSONS (30)
// ============================================================
export const PERSONS: Person[] = [
  { id: 'P001', nodeType: 'Person', name: 'Arjun Mehta', alias: 'AJ / Tiger', age: 34, gender: 'Male', dob: '1992-03-15', aadharMasked: 'XXXX-XXXX-4521', pan: 'ABJPM1234C', address: '14-B, Andheri West', city: 'Mumbai', state: 'Maharashtra', pincode: '400058', occupation: 'Businessman', employer: 'Shree Trading Co.', communityId: 'C1', riskScore: 0.87, centralityScore: 0.91, betweennessScore: 0.84, status: 'Person of Interest', linkedPhones: ['PH001','PH002'], linkedVehicles: ['V001','V002'], flaggedReason: 'High-centrality network node; circular financial transactions' },
  { id: 'P002', nodeType: 'Person', name: 'Vikram Sinha', alias: 'VK', age: 41, gender: 'Male', dob: '1985-07-22', aadharMasked: 'XXXX-XXXX-8834', address: 'F-12, Connaught Place', city: 'Delhi', state: 'Delhi', pincode: '110001', occupation: 'Director', employer: 'Apex Logistics Pvt. Ltd.', communityId: 'C1', riskScore: 0.72, centralityScore: 0.78, betweennessScore: 0.65, status: 'Under Surveillance', linkedPhones: ['PH003'], linkedVehicles: ['V003'] },
  { id: 'P003', nodeType: 'Person', name: 'Ramesh Gupta', alias: 'Ram / Bhai', age: 38, gender: 'Male', dob: '1988-11-04', aadharMasked: 'XXXX-XXXX-2210', address: '77, Civil Lines', city: 'Kanpur', state: 'Uttar Pradesh', pincode: '208001', occupation: 'Transport Contractor', communityId: 'C1', riskScore: 0.68, centralityScore: 0.61, betweennessScore: 0.70, status: 'Under Surveillance', linkedPhones: ['PH004'], linkedVehicles: ['V004','V005'] },
  { id: 'P004', nodeType: 'Person', name: 'Deepak Patel', alias: 'DP', age: 29, gender: 'Male', dob: '1997-05-18', aadharMasked: 'XXXX-XXXX-9912', address: '3, Navrangpura', city: 'Ahmedabad', state: 'Gujarat', pincode: '380009', occupation: 'Accountant', communityId: 'C1', riskScore: 0.55, centralityScore: 0.44, betweennessScore: 0.38, status: 'Under Surveillance', linkedPhones: ['PH005'] },
  { id: 'P005', nodeType: 'Person', name: 'Sunita Sharma', alias: 'Sunita / SS', age: 45, gender: 'Female', dob: '1981-09-30', aadharMasked: 'XXXX-XXXX-3367', address: 'B-4, Vaishali Nagar', city: 'Jaipur', state: 'Rajasthan', pincode: '302021', occupation: 'Proprietor', employer: 'SS Enterprises', communityId: 'C2', riskScore: 0.60, status: 'Under Surveillance', linkedPhones: ['PH006'] },
  { id: 'P006', nodeType: 'Person', name: 'Mohammed Farouk', alias: 'Farouk', age: 36, gender: 'Male', dob: '1990-02-12', aadharMasked: 'XXXX-XXXX-7723', address: '22, Fraser Road', city: 'Patna', state: 'Bihar', pincode: '800001', occupation: 'Hawker', communityId: 'C2', riskScore: 0.52, linkedPhones: ['PH007'] },
  { id: 'P007', nodeType: 'Person', name: 'Suresh Yadav', alias: 'Suresh / SY', age: 43, gender: 'Male', dob: '1983-06-08', aadharMasked: 'XXXX-XXXX-4401', address: '19, Assi Ghat Area', city: 'Varanasi', state: 'Uttar Pradesh', pincode: '221005', occupation: 'Driver', communityId: 'C2', riskScore: 0.63, centralityScore: 0.55, betweennessScore: 0.61, status: 'Under Surveillance', linkedVehicles: ['V006'], linkedPhones: ['PH008'] },
  { id: 'P008', nodeType: 'Person', name: 'Priya Nair', alias: 'PN', age: 32, gender: 'Female', dob: '1994-12-01', aadharMasked: 'XXXX-XXXX-5589', address: '7, Vyttila', city: 'Kochi', state: 'Kerala', pincode: '682019', occupation: 'Bank Employee', communityId: 'C3', riskScore: 0.38, status: 'Witness', linkedPhones: ['PH009'] },
  { id: 'P009', nodeType: 'Person', name: 'Ravi Kumar', alias: 'RK / Ravi Bhai', age: 37, gender: 'Male', dob: '1989-08-25', aadharMasked: 'XXXX-XXXX-6643', address: '11, Boring Road', city: 'Patna', state: 'Bihar', pincode: '800001', occupation: 'Contractor', communityId: 'C2', riskScore: 0.79, centralityScore: 0.74, betweennessScore: 0.68, status: 'Person of Interest', linkedPhones: ['PH010','PH011'], flaggedReason: 'Communication spike 7 contacts in 3 hours; linked to suspicious accounts' },
  { id: 'P010', nodeType: 'Person', name: 'Anita Desai', alias: 'AD', age: 50, gender: 'Female', dob: '1976-04-14', aadharMasked: 'XXXX-XXXX-1198', address: '45, Law Garden', city: 'Ahmedabad', state: 'Gujarat', pincode: '380006', occupation: 'Retired', communityId: 'C3', riskScore: 0.21, status: 'Cleared' },
  { id: 'P011', nodeType: 'Person', name: 'Sanjay Rawat', alias: 'Sanjay / SR', age: 44, gender: 'Male', dob: '1982-10-20', aadharMasked: 'XXXX-XXXX-8823', address: '3-B, Rajpur Road', city: 'Dehradun', state: 'Uttarakhand', pincode: '248001', occupation: 'Hotelier', communityId: 'C1', riskScore: 0.58, linkedPhones: ['PH012'], linkedVehicles: ['V007'] },
  { id: 'P012', nodeType: 'Person', name: 'Kavita Singh', alias: 'KS', age: 28, gender: 'Female', dob: '1998-03-07', aadharMasked: 'XXXX-XXXX-4412', address: '22, Hazratganj', city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001', occupation: 'Student', communityId: 'C3', riskScore: 0.18, status: 'Cleared' },
  { id: 'P013', nodeType: 'Person', name: 'Naresh Tiwari', alias: 'NT / Naresh', age: 55, gender: 'Male', dob: '1971-01-30', aadharMasked: 'XXXX-XXXX-3341', address: '8, Model Town', city: 'Ludhiana', state: 'Punjab', pincode: '141002', occupation: 'Politician', communityId: 'C3', riskScore: 0.33, linkedPhones: ['PH013'] },
  { id: 'P014', nodeType: 'Person', name: 'Ajay Singh', alias: 'AS / AJ', age: 39, gender: 'Male', dob: '1987-07-11', aadharMasked: 'XXXX-XXXX-9912', address: '17, Sector 9', city: 'Chandigarh', state: 'Chandigarh', pincode: '160009', occupation: 'Customs Agent', communityId: 'C3', riskScore: 0.66, centralityScore: 0.59, betweennessScore: 0.72, status: 'Person of Interest', linkedPhones: ['PH014'], linkedVehicles: ['V008'], flaggedReason: 'Cross-community bridge node; shared contacts with C1 and C2' },
  { id: 'P015', nodeType: 'Person', name: 'Fatima Khan', alias: 'FK', age: 33, gender: 'Female', dob: '1993-11-19', aadharMasked: 'XXXX-XXXX-6621', address: '5, Bandra West', city: 'Mumbai', state: 'Maharashtra', pincode: '400050', occupation: 'Journalist', communityId: 'C3', riskScore: 0.14, status: 'Cleared' },
  { id: 'P016', nodeType: 'Person', name: 'Alok Trivedi', alias: 'AT / Trivedi', age: 47, gender: 'Male', dob: '1979-05-05', aadharMasked: 'XXXX-XXXX-5523', address: '14, Civil Lines', city: 'Allahabad', state: 'Uttar Pradesh', pincode: '211001', occupation: 'Lawyer', communityId: 'C1', riskScore: 0.57, linkedPhones: ['PH015'] },
  { id: 'P017', nodeType: 'Person', name: 'Bharat Malhotra', alias: 'BM', age: 52, gender: 'Male', dob: '1974-02-28', aadharMasked: 'XXXX-XXXX-1109', address: '9, Race Course Road', city: 'Delhi', state: 'Delhi', pincode: '110003', occupation: 'Real Estate Developer', communityId: 'C1', riskScore: 0.61, linkedVehicles: ['V009'], linkedPhones: ['PH016'] },
  { id: 'P018', nodeType: 'Person', name: 'Geeta Rao', alias: 'GR', age: 35, gender: 'Female', dob: '1991-09-13', aadharMasked: 'XXXX-XXXX-7734', address: '23, Indira Nagar', city: 'Bengaluru', state: 'Karnataka', pincode: '560038', occupation: 'Software Engineer', communityId: 'C3', riskScore: 0.08, status: 'Cleared' },
  { id: 'P019', nodeType: 'Person', name: 'Harish Verma', alias: 'HV', age: 42, gender: 'Male', dob: '1984-04-06', aadharMasked: 'XXXX-XXXX-4490', address: '1-A, Shimla Hills', city: 'Shimla', state: 'Himachal Pradesh', pincode: '171001', occupation: 'Government Employee', communityId: 'C2', riskScore: 0.45, linkedPhones: ['PH017'] },
  { id: 'P020', nodeType: 'Person', name: 'Imran Siddiqui', alias: 'IS / Imran', age: 31, gender: 'Male', dob: '1995-06-24', aadharMasked: 'XXXX-XXXX-8812', address: '7, Charminar Area', city: 'Hyderabad', state: 'Telangana', pincode: '500002', occupation: 'Shop Owner', communityId: 'C2', riskScore: 0.49, linkedPhones: ['PH018'] },
  { id: 'P021', nodeType: 'Person', name: 'Jyoti Pandey', alias: 'JP', age: 26, gender: 'Female', dob: '2000-01-15', aadharMasked: 'XXXX-XXXX-3345', address: '55, Sigra', city: 'Varanasi', state: 'Uttar Pradesh', pincode: '221010', occupation: 'Teacher', communityId: 'C3', riskScore: 0.12, status: 'Cleared' },
  { id: 'P022', nodeType: 'Person', name: 'Kuldeep Nanda', alias: 'KN', age: 48, gender: 'Male', dob: '1978-08-11', aadharMasked: 'XXXX-XXXX-6678', address: '3, Lawrence Road', city: 'Amritsar', state: 'Punjab', pincode: '143001', occupation: 'Money Exchanger', communityId: 'C2', riskScore: 0.71, centralityScore: 0.62, betweennessScore: 0.55, flaggedReason: 'Hawala suspicion; cross-border cash flows', linkedPhones: ['PH019'] },
  { id: 'P023', nodeType: 'Person', name: 'Lakshmi Devi', alias: 'LD', age: 60, gender: 'Female', dob: '1966-03-03', aadharMasked: 'XXXX-XXXX-2212', address: '12, Ramnagar', city: 'Coimbatore', state: 'Tamil Nadu', pincode: '641009', occupation: 'Retired', communityId: 'C3', riskScore: 0.09 },
  { id: 'P024', nodeType: 'Person', name: 'Girish Pandey', alias: 'GP / Girish', age: 33, gender: 'Male', dob: '1993-10-30', aadharMasked: 'XXXX-XXXX-9981', address: '8, Tilak Nagar', city: 'Kanpur', state: 'Uttar Pradesh', pincode: '208002', occupation: 'Logistics Coordinator', communityId: 'C3', riskScore: 0.56, centralityScore: 0.52, betweennessScore: 0.64, status: 'Person of Interest', linkedPhones: ['PH020'], flaggedReason: 'Bridge between C1 and C3; shared vehicle with P003' },
  { id: 'P025', nodeType: 'Person', name: 'Manish Kapoor', alias: 'MK', age: 40, gender: 'Male', dob: '1986-12-25', aadharMasked: 'XXXX-XXXX-3312', address: '6, Friends Colony', city: 'Delhi', state: 'Delhi', pincode: '110065', occupation: 'Import-Export', communityId: 'C1', riskScore: 0.73, linkedPhones: ['PH021'], linkedVehicles: ['V010'] },
  { id: 'P026', nodeType: 'Person', name: 'Nita Joshi', alias: 'NJ', age: 38, gender: 'Female', dob: '1988-07-07', aadharMasked: 'XXXX-XXXX-5545', address: '99, Koregaon Park', city: 'Pune', state: 'Maharashtra', pincode: '411001', occupation: 'CA', communityId: 'C2', riskScore: 0.44, linkedPhones: ['PH022'] },
  { id: 'P027', nodeType: 'Person', name: 'Om Prakash', alias: 'OP / Omi', age: 57, gender: 'Male', dob: '1969-04-18', aadharMasked: 'XXXX-XXXX-7701', address: '2, Lal Bagh', city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001', occupation: 'Politician', communityId: 'C1', riskScore: 0.48, linkedVehicles: ['V011'], linkedPhones: ['PH023'] },
  { id: 'P028', nodeType: 'Person', name: 'Pawan Agarwal', alias: 'PA', age: 36, gender: 'Male', dob: '1990-09-09', aadharMasked: 'XXXX-XXXX-8867', address: '14, Sadar Bazaar', city: 'Agra', state: 'Uttar Pradesh', pincode: '282001', occupation: 'Jeweller', communityId: 'C2', riskScore: 0.64, linkedPhones: ['PH024'], flaggedReason: 'High-value cash transactions; unregistered gold purchases' },
  { id: 'P029', nodeType: 'Person', name: 'Rahul Shukla', alias: 'RS', age: 30, gender: 'Male', dob: '1996-02-14', aadharMasked: 'XXXX-XXXX-1123', address: '5, Nehru Nagar', city: 'Bhopal', state: 'Madhya Pradesh', pincode: '462001', occupation: 'Unemployed', communityId: 'C2', riskScore: 0.55, linkedPhones: ['PH025'] },
  { id: 'P030', nodeType: 'Person', name: 'Seema Jain', alias: 'SJ', age: 43, gender: 'Female', dob: '1983-05-20', aadharMasked: 'XXXX-XXXX-4489', address: '7, Vaishali', city: 'Ghaziabad', state: 'Uttar Pradesh', pincode: '201012', occupation: 'Proprietor', employer: 'Jain Textiles', communityId: 'C1', riskScore: 0.59, linkedPhones: ['PH003'] },
];

// ============================================================
// PHONES (25)
// ============================================================
export const PHONES: Phone[] = [
  { id: 'PH001', nodeType: 'Phone', number: '9876543210', operator: 'Airtel', circle: 'Maharashtra', imei: '356234100034567', simType: 'Registered', registeredOwner: 'Arjun Mehta', status: 'Active', lastLocation: 'Mumbai', callCount: 142 },
  { id: 'PH002', nodeType: 'Phone', number: '9988776655', operator: 'Jio', circle: 'Maharashtra', imei: '490154203237518', simType: 'Registered', registeredOwner: 'Arjun Mehta', status: 'Active', lastLocation: 'Mumbai', callCount: 87 },
  { id: 'PH003', nodeType: 'Phone', number: '9871234567', operator: 'BSNL', circle: 'Delhi', simType: 'Registered', registeredOwner: 'Vikram Sinha', status: 'Active', lastLocation: 'Delhi', callCount: 93 },
  { id: 'PH004', nodeType: 'Phone', number: '9450123456', operator: 'Vodafone', circle: 'UP West', simType: 'Registered', registeredOwner: 'Ramesh Gupta', status: 'Active', lastLocation: 'Kanpur', callCount: 211 },
  { id: 'PH005', nodeType: 'Phone', number: '9712345678', operator: 'Airtel', circle: 'Gujarat', simType: 'Registered', registeredOwner: 'Deepak Patel', status: 'Active', lastLocation: 'Ahmedabad', callCount: 54 },
  { id: 'PH006', nodeType: 'Phone', number: '9414123456', operator: 'Jio', circle: 'Rajasthan', simType: 'Registered', registeredOwner: 'Sunita Sharma', status: 'Active', lastLocation: 'Jaipur', callCount: 78 },
  { id: 'PH007', nodeType: 'Phone', number: '9334567890', operator: 'BSNL', circle: 'Bihar', simType: 'Registered', registeredOwner: 'Mohammed Farouk', status: 'Active', lastLocation: 'Patna', callCount: 44 },
  { id: 'PH008', nodeType: 'Phone', number: '9415678901', operator: 'Airtel', circle: 'UP East', simType: 'Registered', registeredOwner: 'Suresh Yadav', status: 'Active', lastLocation: 'Varanasi', callCount: 166 },
  { id: 'PH009', nodeType: 'Phone', number: '9847123456', operator: 'BSNL', circle: 'Kerala', simType: 'Registered', registeredOwner: 'Priya Nair', status: 'Active', lastLocation: 'Kochi', callCount: 31 },
  { id: 'PH010', nodeType: 'Phone', number: '8987654321', operator: 'Vodafone', circle: 'Bihar', imei: '356234108765432', simType: 'Registered', registeredOwner: 'Ravi Kumar', status: 'Active', lastLocation: 'Patna', callCount: 198 },
  { id: 'PH011', nodeType: 'Phone', number: '7777888899', operator: 'Unknown', circle: 'UP East', simType: 'Unregistered', registeredOwner: 'UNREGISTERED', status: 'Active', lastLocation: 'Varanasi', callCount: 34 },
  { id: 'PH012', nodeType: 'Phone', number: '9897123456', operator: 'Jio', circle: 'Uttarakhand', simType: 'Registered', registeredOwner: 'Sanjay Rawat', status: 'Active', lastLocation: 'Dehradun', callCount: 62 },
  { id: 'PH013', nodeType: 'Phone', number: '9814567890', operator: 'Airtel', circle: 'Punjab', simType: 'Registered', registeredOwner: 'Naresh Tiwari', status: 'Active', lastLocation: 'Ludhiana', callCount: 55 },
  { id: 'PH014', nodeType: 'Phone', number: '9876012345', operator: 'Vodafone', circle: 'Chandigarh', simType: 'Registered', registeredOwner: 'Ajay Singh', status: 'Active', lastLocation: 'Chandigarh', callCount: 89 },
  { id: 'PH015', nodeType: 'Phone', number: '9415234567', operator: 'BSNL', circle: 'UP East', simType: 'Registered', registeredOwner: 'Alok Trivedi', status: 'Active', lastLocation: 'Allahabad', callCount: 47 },
  { id: 'PH016', nodeType: 'Phone', number: '9999123456', operator: 'Airtel', circle: 'Delhi', simType: 'Registered', registeredOwner: 'Bharat Malhotra', status: 'Active', lastLocation: 'Delhi', callCount: 83 },
  { id: 'PH017', nodeType: 'Phone', number: '9816345678', operator: 'BSNL', circle: 'Himachal Pradesh', simType: 'Registered', registeredOwner: 'Harish Verma', status: 'Active', lastLocation: 'Shimla', callCount: 29 },
  { id: 'PH018', nodeType: 'Phone', number: '9849012345', operator: 'Airtel', circle: 'Telangana', simType: 'Registered', registeredOwner: 'Imran Siddiqui', status: 'Active', lastLocation: 'Hyderabad', callCount: 41 },
  { id: 'PH019', nodeType: 'Phone', number: '9815123456', operator: 'Jio', circle: 'Punjab', simType: 'Registered', registeredOwner: 'Kuldeep Nanda', status: 'Active', lastLocation: 'Amritsar', callCount: 127 },
  { id: 'PH020', nodeType: 'Phone', number: '9450987654', operator: 'Airtel', circle: 'UP West', simType: 'Registered', registeredOwner: 'Girish Pandey', status: 'Active', lastLocation: 'Kanpur', callCount: 73 },
  { id: 'PH021', nodeType: 'Phone', number: '9810234567', operator: 'Vodafone', circle: 'Delhi', simType: 'Registered', registeredOwner: 'Manish Kapoor', status: 'Active', lastLocation: 'Delhi', callCount: 96 },
  { id: 'PH022', nodeType: 'Phone', number: '9823456789', operator: 'Jio', circle: 'Maharashtra', simType: 'Registered', registeredOwner: 'Nita Joshi', status: 'Active', lastLocation: 'Pune', callCount: 38 },
  { id: 'PH023', nodeType: 'Phone', number: '9415678902', operator: 'BSNL', circle: 'UP East', simType: 'Registered', registeredOwner: 'Om Prakash', status: 'Active', lastLocation: 'Lucknow', callCount: 44 },
  { id: 'PH024', nodeType: 'Phone', number: '9456789012', operator: 'Airtel', circle: 'UP West', simType: 'Registered', registeredOwner: 'Pawan Agarwal', status: 'Active', lastLocation: 'Agra', callCount: 82 },
  { id: 'PH025', nodeType: 'Phone', number: '9713456789', operator: 'Vodafone', circle: 'Madhya Pradesh', simType: 'Registered', registeredOwner: 'Rahul Shukla', status: 'Active', lastLocation: 'Bhopal', callCount: 57 },
];

// ============================================================
// VEHICLES (15)
// ============================================================
export const VEHICLES: Vehicle[] = [
  { id: 'V001', nodeType: 'Vehicle', licensePlate: 'MH02AB1234', make: 'Toyota', model: 'Innova Crysta', color: 'White', year: 2022, fuelType: 'Diesel', chassisNo: 'MBRKG8BL4J2345678', engineNo: 'K2JB4J012345', registeredOwner: 'Arjun Mehta', registrationState: 'Maharashtra', insuranceValid: '2026-12-31', rcExpiry: '2037-01-15', status: 'Active', flagged: true },
  { id: 'V002', nodeType: 'Vehicle', licensePlate: 'MH04CD5678', make: 'BMW', model: '5 Series', color: 'Black', year: 2023, fuelType: 'Petrol', registeredOwner: 'Shree Trading Co.', registrationState: 'Maharashtra', insuranceValid: '2027-03-31', flagged: false, status: 'Active' },
  { id: 'V003', nodeType: 'Vehicle', licensePlate: 'DL01EF9012', make: 'Mercedes', model: 'C-Class', color: 'Silver', year: 2021, fuelType: 'Petrol', registeredOwner: 'Vikram Sinha', registrationState: 'Delhi', insuranceValid: '2026-08-15', status: 'Active', flagged: true },
  { id: 'V004', nodeType: 'Vehicle', licensePlate: 'UP78GH3456', make: 'Tata', model: 'Truck 407', color: 'Blue', year: 2019, fuelType: 'Diesel', registeredOwner: 'Ramesh Gupta', registrationState: 'Uttar Pradesh', rcExpiry: '2034-06-20', status: 'Active', flagged: true },
  { id: 'V005', nodeType: 'Vehicle', licensePlate: 'UP80IJ7890', make: 'Ashok Leyland', model: 'Boss', color: 'Red', year: 2020, fuelType: 'Diesel', registeredOwner: 'Ramesh Gupta', registrationState: 'Uttar Pradesh', status: 'Active', flagged: false },
  { id: 'V006', nodeType: 'Vehicle', licensePlate: 'UP65KL1234', make: 'Mahindra', model: 'Scorpio', color: 'Grey', year: 2018, fuelType: 'Diesel', registeredOwner: 'Suresh Yadav', registrationState: 'Uttar Pradesh', status: 'Active', flagged: true },
  { id: 'V007', nodeType: 'Vehicle', licensePlate: 'UK07MN5678', make: 'Toyota', model: 'Fortuner', color: 'Brown', year: 2022, fuelType: 'Diesel', registeredOwner: 'Sanjay Rawat', registrationState: 'Uttarakhand', status: 'Active', flagged: false },
  { id: 'V008', nodeType: 'Vehicle', licensePlate: 'CH01OP9012', make: 'Honda', model: 'City', color: 'White', year: 2023, fuelType: 'Petrol', registeredOwner: 'Ajay Singh', registrationState: 'Chandigarh', status: 'Active', flagged: false },
  { id: 'V009', nodeType: 'Vehicle', licensePlate: 'DL07QR3456', make: 'Range Rover', model: 'Sport', color: 'Black', year: 2024, fuelType: 'Petrol', registeredOwner: 'Bharat Malhotra', registrationState: 'Delhi', status: 'Active', flagged: false },
  { id: 'V010', nodeType: 'Vehicle', licensePlate: 'DL09ST7890', make: 'Toyota', model: 'Land Cruiser', color: 'White', year: 2023, fuelType: 'Diesel', registeredOwner: 'Manish Kapoor', registrationState: 'Delhi', status: 'Active', flagged: true },
  { id: 'V011', nodeType: 'Vehicle', licensePlate: 'UP32UV1234', make: 'Toyota', model: 'Camry', color: 'Silver', year: 2022, fuelType: 'Hybrid', registeredOwner: 'Om Prakash', registrationState: 'Uttar Pradesh', status: 'Active', flagged: false },
  { id: 'V012', nodeType: 'Vehicle', licensePlate: 'UP85WX5678', make: 'Mahindra', model: 'Bolero', color: 'Beige', year: 2017, fuelType: 'Diesel', registeredOwner: 'UNREGISTERED', registrationState: 'Uttar Pradesh', status: 'Suspect', flagged: true },
  { id: 'V013', nodeType: 'Vehicle', licensePlate: 'MH12YZ9012', make: 'Hyundai', model: 'Creta', color: 'Red', year: 2021, fuelType: 'Petrol', registeredOwner: 'Deepak Patel', registrationState: 'Maharashtra', status: 'Active', flagged: false },
  { id: 'V014', nodeType: 'Vehicle', licensePlate: 'RJ14AB3456', make: 'Maruti', model: 'Swift', color: 'Blue', year: 2020, fuelType: 'Petrol', registeredOwner: 'Sunita Sharma', registrationState: 'Rajasthan', status: 'Active', flagged: false },
  { id: 'V015', nodeType: 'Vehicle', licensePlate: 'PB10CD7890', make: 'Toyota', model: 'Prado', color: 'Black', year: 2023, fuelType: 'Diesel', registeredOwner: 'Kuldeep Nanda', registrationState: 'Punjab', status: 'Active', flagged: true },
];

// ============================================================
// ORGANISATIONS (12)
// ============================================================
export const ORGANISATIONS: Organisation[] = [
  { id: 'O001', nodeType: 'Organization', name: 'Shree Trading Co.', type: 'Private Limited', cin: 'U51900MH2015PTC267890', gstin: '27AABCS1429B1ZF', incorporationDate: '2015-04-01', registeredAddress: 'Andheri West, Mumbai', city: 'Mumbai', state: 'Maharashtra', director: 'Arjun Mehta', turnover: '₹12.4 Cr (2024-25)', status: 'Active', flagged: true, businessNature: 'Import-Export, Commodity Trading' },
  { id: 'O002', nodeType: 'Organization', name: 'Apex Logistics Pvt. Ltd.', type: 'Private Limited', cin: 'U63090DL2012PTC134567', gstin: '07AACCA1234D1ZP', incorporationDate: '2012-06-15', registeredAddress: 'Connaught Place, Delhi', city: 'Delhi', state: 'Delhi', director: 'Vikram Sinha', turnover: '₹8.7 Cr (2024-25)', status: 'Active', flagged: true, businessNature: 'Freight Forwarding, Customs Clearance' },
  { id: 'O003', nodeType: 'Organization', name: 'SS Enterprises', type: 'Proprietorship', gstin: '08AAJFS1234E1ZY', registeredAddress: 'Vaishali Nagar, Jaipur', city: 'Jaipur', state: 'Rajasthan', director: 'Sunita Sharma', turnover: '₹3.2 Cr (2024-25)', status: 'Active', flagged: false, businessNature: 'Textile Trading' },
  { id: 'O004', nodeType: 'Organization', name: 'Global Finance Services', type: 'NBFC', cin: 'U65100MH2010PLC198765', registeredAddress: 'Fort Area, Mumbai', city: 'Mumbai', state: 'Maharashtra', director: 'Unknown', turnover: 'Undisclosed', status: 'Under Investigation', flagged: true, businessNature: 'Informal Money Lending, Exchange' },
  { id: 'O005', nodeType: 'Organization', name: 'Nanda Currency Exchange', type: 'Proprietorship', gstin: '03AAKFN1234G1ZW', registeredAddress: 'Katra, Amritsar', city: 'Amritsar', state: 'Punjab', director: 'Kuldeep Nanda', turnover: '₹2.1 Cr (2024-25)', status: 'Active', flagged: true, businessNature: 'Foreign Currency Exchange, Hawala Suspected' },
  { id: 'O006', nodeType: 'Organization', name: 'Jain Textiles', type: 'Proprietorship', gstin: '09AABEJ1234H1ZV', registeredAddress: 'Vaishali, Ghaziabad', city: 'Ghaziabad', state: 'Uttar Pradesh', director: 'Seema Jain', turnover: '₹5.6 Cr (2024-25)', status: 'Active', flagged: false, businessNature: 'Textile Manufacturing' },
  { id: 'O007', nodeType: 'Organization', name: 'Kapoor Imports', type: 'Private Limited', cin: 'U74140DL2018PTC301234', gstin: '07AACCK2345I1ZO', incorporationDate: '2018-09-01', registeredAddress: 'Friends Colony, Delhi', city: 'Delhi', state: 'Delhi', director: 'Manish Kapoor', turnover: '₹9.3 Cr (2024-25)', status: 'Active', flagged: true, businessNature: 'Import of Electronics, Pharmaceuticals' },
  { id: 'O008', nodeType: 'Organization', name: 'Malhotra Builders', type: 'Private Limited', cin: 'U45201DL2009PTC167890', gstin: '07AACCM1234J1ZN', registeredAddress: 'Race Course Road, Delhi', city: 'Delhi', state: 'Delhi', director: 'Bharat Malhotra', turnover: '₹31 Cr (2024-25)', status: 'Active', flagged: false, businessNature: 'Real Estate Development' },
  { id: 'O009', nodeType: 'Organization', name: 'Rawat Hotels & Resorts', type: 'Private Limited', registeredAddress: 'Rajpur Road, Dehradun', city: 'Dehradun', state: 'Uttarakhand', director: 'Sanjay Rawat', turnover: '₹4.8 Cr (2024-25)', status: 'Active', flagged: false, businessNature: 'Hospitality' },
  { id: 'O010', nodeType: 'Organization', name: 'Star Shell Trading', type: 'Private Limited', cin: 'U51109MH2020PTC400123', registeredAddress: 'BKC, Mumbai', city: 'Mumbai', state: 'Maharashtra', director: 'Unknown (Nominee Director)', turnover: 'Minimal Declared', status: 'Shell Company Suspected', flagged: true, businessNature: 'Trading (Shell Entity Suspected)' },
  { id: 'O011', nodeType: 'Organization', name: 'Agarwal Gold & Jewels', type: 'Proprietorship', gstin: '09AABPA1234K1ZU', registeredAddress: 'Sadar Bazaar, Agra', city: 'Agra', state: 'Uttar Pradesh', director: 'Pawan Agarwal', turnover: '₹7.2 Cr (2024-25)', status: 'Active', flagged: true, businessNature: 'Gold & Jewellery Trading, Cash Purchases' },
  { id: 'O012', nodeType: 'Organization', name: 'Bihar Contractors Association', type: 'Association', registeredAddress: 'Gandhi Maidan, Patna', city: 'Patna', state: 'Bihar', director: 'Ravi Kumar', status: 'Active', flagged: false, businessNature: 'Trade Association, Government Contracts' },
];

// ============================================================
// BANK ACCOUNTS (15)
// ============================================================
export const ACCOUNTS: Account[] = [
  { id: 'ACC001', nodeType: 'Account', accountNumber: 'ACC-MH-001-2019', bank: 'State Bank of India', branch: 'Andheri West, Mumbai', ifsc: 'SBIN0001234', accountType: 'Current', linkedPerson: 'P001', openedDate: '2019-03-15', suspiciousActivity: true, frozenStatus: false },
  { id: 'ACC002', nodeType: 'Account', accountNumber: 'ACC-DL-002-2020', bank: 'HDFC Bank', branch: 'Connaught Place, Delhi', ifsc: 'HDFC0001234', accountType: 'Current', linkedPerson: 'P002', openedDate: '2020-01-10', suspiciousActivity: true, frozenStatus: false },
  { id: 'ACC003', nodeType: 'Account', accountNumber: 'ACC-UP-003-2018', bank: 'Punjab National Bank', branch: 'Civil Lines, Kanpur', ifsc: 'PUNB0123456', accountType: 'Savings', linkedPerson: 'P003', openedDate: '2018-07-20', suspiciousActivity: false, frozenStatus: false },
  { id: 'ACC004', nodeType: 'Account', accountNumber: 'ACC-GJ-004-2021', bank: 'Axis Bank', branch: 'Navrangpura, Ahmedabad', ifsc: 'UTIB0001234', accountType: 'Current', linkedPerson: 'P004', openedDate: '2021-05-05', suspiciousActivity: true, frozenStatus: false },
  { id: 'ACC005', nodeType: 'Account', accountNumber: 'ACC-RJ-005-2017', bank: 'Bank of Rajasthan', branch: 'Vaishali Nagar, Jaipur', ifsc: 'ICIC0001234', accountType: 'Savings', linkedPerson: 'P005', openedDate: '2017-11-22', suspiciousActivity: false, frozenStatus: false },
  { id: 'ACC006', nodeType: 'Account', accountNumber: 'ACC-BR-006-2022', bank: 'Bihar Grameen Bank', branch: 'Boring Road, Patna', ifsc: 'BDBL0001234', accountType: 'Savings', linkedPerson: 'P009', openedDate: '2022-03-01', suspiciousActivity: true, frozenStatus: false },
  { id: 'ACC007', nodeType: 'Account', accountNumber: 'ACC-MH-007-2019', bank: 'ICICI Bank', branch: 'BKC, Mumbai', ifsc: 'ICIC0005678', accountType: 'Current', linkedOrg: 'O001', openedDate: '2019-08-14', suspiciousActivity: true, frozenStatus: false },
  { id: 'ACC008', nodeType: 'Account', accountNumber: 'ACC-DL-008-2020', bank: 'Yes Bank', branch: 'Nehru Place, Delhi', ifsc: 'YESB0001234', accountType: 'Current', linkedOrg: 'O002', openedDate: '2020-04-20', suspiciousActivity: true, frozenStatus: false },
  { id: 'ACC009', nodeType: 'Account', accountNumber: 'ACC-PB-009-2018', bank: 'Punjab & Sind Bank', branch: 'Katra, Amritsar', ifsc: 'PSIB0001234', accountType: 'Current', linkedPerson: 'P022', openedDate: '2018-01-15', suspiciousActivity: true, frozenStatus: false },
  { id: 'ACC010', nodeType: 'Account', accountNumber: 'ACC-DL-010-2023', bank: 'Kotak Mahindra Bank', branch: 'Friends Colony, Delhi', ifsc: 'KKBK0001234', accountType: 'Current', linkedPerson: 'P025', openedDate: '2023-06-01', suspiciousActivity: true, frozenStatus: false },
  { id: 'ACC011', nodeType: 'Account', accountNumber: 'ACC-SHELL-011', bank: 'Unknown Offshore', branch: 'Unknown', ifsc: 'UNKNOWN', accountType: 'Current', linkedOrg: 'O010', openedDate: '2021-01-01', suspiciousActivity: true, frozenStatus: true },
  { id: 'ACC012', nodeType: 'Account', accountNumber: 'ACC-UP-012-2016', bank: 'Allahabad Bank', branch: 'Sadar Bazaar, Agra', ifsc: 'ALLA0210112', accountType: 'Current', linkedPerson: 'P028', openedDate: '2016-09-01', suspiciousActivity: true, frozenStatus: false },
  { id: 'ACC013', nodeType: 'Account', accountNumber: 'ACC-MH-013-2020', bank: 'Union Bank', branch: 'Fort, Mumbai', ifsc: 'UBIN0001234', accountType: 'Current', linkedOrg: 'O004', openedDate: '2020-06-10', suspiciousActivity: true, frozenStatus: false },
  { id: 'ACC014', nodeType: 'Account', accountNumber: 'ACC-MH-014-2022', bank: 'HDFC Bank', branch: 'Bandra, Mumbai', ifsc: 'HDFC0005678', accountType: 'Savings', linkedPerson: 'P015', openedDate: '2022-01-01', suspiciousActivity: false, frozenStatus: false },
  { id: 'ACC015', nodeType: 'Account', accountNumber: 'ACC-UP-015-2019', bank: 'State Bank of India', branch: 'Hazratganj, Lucknow', ifsc: 'SBIN0005678', accountType: 'Current', linkedOrg: 'O006', openedDate: '2019-11-11', suspiciousActivity: false, frozenStatus: false },
];

// ============================================================
// LOCATIONS (12)
// ============================================================
export const LOCATIONS: Location[] = [
  { id: 'L001', nodeType: 'Location', name: 'Kanpur Central Railway Station', type: 'Transit Hub', address: 'Station Road, Kanpur', city: 'Kanpur', state: 'Uttar Pradesh', pincode: '208001', lat: 26.4499, lng: 80.3319, significance: 'Suspected goods handoff point; multiple POIs observed here on 14 Jan 2026' },
  { id: 'L002', nodeType: 'Location', name: 'Lotus Hotel, Mumbai', type: 'Hospitality', address: 'Juhu, Mumbai', city: 'Mumbai', state: 'Maharashtra', pincode: '400049', lat: 19.0990, lng: 72.8295, significance: 'Meeting venue 3 Feb 2026; P001, P002, P003, P014 observed' },
  { id: 'L003', nodeType: 'Location', name: 'Shree Trading Co. Warehouse', type: 'Commercial', address: 'MIDC, Andheri East, Mumbai', city: 'Mumbai', state: 'Maharashtra', pincode: '400093', lat: 19.1136, lng: 72.8697, significance: 'Origin point for smuggled goods in FIR-2026-00451' },
  { id: 'L004', nodeType: 'Location', name: 'Apex Logistics Depot', type: 'Commercial', address: 'Patparganj Industrial Area, Delhi', city: 'Delhi', state: 'Delhi', pincode: '110092', lat: 28.6245, lng: 77.3063, significance: 'Destination point; customs irregularities flagged' },
  { id: 'L005', nodeType: 'Location', name: 'Nanda Currency Exchange', type: 'Commercial', address: 'Katra, Amritsar', city: 'Amritsar', state: 'Punjab', pincode: '143001', lat: 31.6340, lng: 74.8723, significance: 'Suspected hawala hub; cross-border flows detected' },
  { id: 'L006', nodeType: 'Location', name: 'Varanasi Ghats Area', type: 'Landmark', address: 'Assi Ghat, Varanasi', city: 'Varanasi', state: 'Uttar Pradesh', pincode: '221005', lat: 25.2677, lng: 82.9986, significance: 'Regular meeting point for C2 community members' },
  { id: 'L007', nodeType: 'Location', name: 'Border Check Post — Wagah', type: 'Border', address: 'GT Road, Wagah', city: 'Amritsar', state: 'Punjab', lat: 31.6053, lng: 74.5733, significance: 'Cross-border intel link; Kuldeep Nanda vehicle sighted 3 times' },
  { id: 'L008', nodeType: 'Location', name: 'Delhi IGI Airport', type: 'Transit Hub', address: 'NH 48, New Delhi', city: 'Delhi', state: 'Delhi', pincode: '110037', lat: 28.5562, lng: 77.0999, significance: 'Manish Kapoor deported imports; Vikram Sinha frequent flyer' },
  { id: 'L009', nodeType: 'Location', name: 'Agarwal Gold & Jewels', type: 'Commercial', address: 'Sadar Bazaar, Agra', city: 'Agra', state: 'Uttar Pradesh', pincode: '282001', lat: 27.1767, lng: 78.0081, significance: 'High-value cash purchase of gold bullion; no KYC' },
  { id: 'L010', nodeType: 'Location', name: 'Patna Junction Railway Station', type: 'Transit Hub', address: 'Station Road, Patna', city: 'Patna', state: 'Bihar', pincode: '800001', lat: 25.5941, lng: 85.1376, significance: 'P009 and P007 regularly observed here; suspected handoff' },
  { id: 'L011', nodeType: 'Location', name: 'Chandigarh Customs Office', type: 'Government', address: 'Sector 17, Chandigarh', city: 'Chandigarh', state: 'Chandigarh', pincode: '160017', lat: 30.7333, lng: 76.7794, significance: 'P014 (Ajay Singh) — Customs agent; potential insider risk' },
  { id: 'L012', nodeType: 'Location', name: 'Shell Trading Office', type: 'Commercial', address: 'BKC, Mumbai', city: 'Mumbai', state: 'Maharashtra', pincode: '400051', lat: 19.0652, lng: 72.8649, significance: 'Registered address of Star Shell Trading; suspected shell company' },
];

// ============================================================
// FIR RECORDS (6)
// ============================================================
export const FIR_RECORDS: FIR[] = [
  { id: 'FIR001', firNumber: 'FIR-2026-00451', station: 'Kanpur Central PS', district: 'Kanpur Nagar', state: 'Uttar Pradesh', filedDate: '2026-01-15', filedBy: 'Inspector A.K. Singh', sections: ['IPC 420', 'IPC 120B', 'NDPS Act Sec 8', 'Customs Act Sec 135'], description: 'Cross-state smuggling of contraband goods via freight trucks. Three suspects (P001, P002, P003) identified at Kanpur Central Station. Contraband estimated value ₹4.2 Crore.', complainant: 'State — suo motu', accused: ['Arjun Mehta (P001)', 'Vikram Sinha (P002)', 'Ramesh Gupta (P003)'], status: 'Active', priority: 'Critical', linkedEntities: ['P001','P002','P003','V004','L001','L003','L004'] },
  { id: 'FIR002', firNumber: 'FIR-2026-00892', station: 'Fraser Road PS', district: 'Patna', state: 'Bihar', filedDate: '2026-02-08', filedBy: 'DSP R. Verma', sections: ['PMLA 2002', 'IPC 420', 'FEMA 1999'], description: 'Hawala network operating through Nanda Currency Exchange and Bihar Contractors Association. Suspicious financial flows of ₹2.43 Cr traced across 6 accounts in a circular pattern.', complainant: 'Enforcement Directorate', accused: ['Ravi Kumar (P009)', 'Kuldeep Nanda (P022)'], status: 'Active', priority: 'High', linkedEntities: ['P009','P022','ACC006','ACC009','ACC011','O005','O012'] },
  { id: 'FIR003', firNumber: 'FIR-2026-01234', station: 'Cyber Crime Cell, Hyderabad', district: 'Hyderabad', state: 'Telangana', filedDate: '2026-03-12', filedBy: 'Inspector M. Rao', sections: ['IT Act Sec 66D', 'IPC 384', 'IPC 420'], description: 'Digital extortion ring targeting businessmen. Suspects used spoofed numbers and social engineering. Imran Siddiqui identified as handler. Financial trail traced to multiple accounts.', complainant: 'Multiple victims', accused: ['Imran Siddiqui (P020)', 'Rahul Shukla (P029)'], status: 'Active', priority: 'High', linkedEntities: ['P020','P029','PH018','PH025'] },
  { id: 'FIR004', firNumber: 'FIR-2026-00102', station: 'Wagah Border Post', district: 'Amritsar', state: 'Punjab', filedDate: '2026-01-03', filedBy: 'BSF Intelligence', sections: ['Customs Act Sec 135', 'IPC 120B', 'NDPS Act Sec 29'], description: 'Intelligence report of cross-border smuggling attempt via Wagah corridor. Vehicle V015 (Kuldeep Nanda) flagged 3 times at Wagah. Currency and contraband suspected.', complainant: 'BSF — suo motu', accused: ['Kuldeep Nanda (P022)'], status: 'Under Investigation', priority: 'High', linkedEntities: ['P022','V015','L007','O005'] },
  { id: 'FIR005', firNumber: 'FIR-2025-09876', station: 'Agra PS', district: 'Agra', state: 'Uttar Pradesh', filedDate: '2025-12-20', filedBy: 'Inspector P. Kumar', sections: ['PML Act', 'Prevention of Corruption Act'], description: 'Suspicious cash purchase of gold bullion without KYC. Pawan Agarwal (Agarwal Gold & Jewels) suspected of money laundering via gold purchases totaling ₹3.6 Cr in 2025.', complainant: 'Income Tax Department', accused: ['Pawan Agarwal (P028)'], status: 'Pending', priority: 'Medium', linkedEntities: ['P028','O011','ACC012','L009'] },
  { id: 'FIR006', firNumber: 'FIR-2026-01567', station: 'EOW Mumbai', district: 'Mumbai', state: 'Maharashtra', filedDate: '2026-04-05', filedBy: 'EOW ACP M. Sharma', sections: ['Companies Act 2013 Sec 447', 'IPC 420', 'PMLA 2002'], description: 'Shell company fraud. Star Shell Trading Pvt. Ltd. (O010) incorporated with nominee directors. ₹8.7 Cr routed through ACC011 (suspected offshore). Funds linked to Arjun Mehta.', complainant: 'EOW Mumbai', accused: ['Arjun Mehta (P001)', 'Unknown Nominee Directors'], status: 'Active', priority: 'Critical', linkedEntities: ['P001','O010','ACC011','ACC001','L012'] },
];

// ============================================================
// CDR RECORDS (40 key records)
// ============================================================
export const CDR_RECORDS: CDRRecord[] = [
  { id: 'CDR001', callerId: 'P001', calleeId: 'P002', callerNumber: '9876543210', calleeNumber: '9871234567', duration: 342, type: 'CALL', timestamp: '2026-01-13T09:30:00', towerLocation: 'Mumbai-Andheri', flagged: false },
  { id: 'CDR002', callerId: 'P001', calleeId: 'P003', callerNumber: '9876543210', calleeNumber: '9450123456', duration: 567, type: 'CALL', timestamp: '2026-01-13T11:15:00', towerLocation: 'Mumbai-Andheri', flagged: false },
  { id: 'CDR003', callerId: 'P001', calleeId: 'P009', callerNumber: '9876543210', calleeNumber: '8987654321', duration: 289, type: 'CALL', timestamp: '2026-01-14T08:00:00', towerLocation: 'Mumbai-Juhu', flagged: true, flagReason: 'Known associate of P009' },
  { id: 'CDR004', callerId: 'P003', calleeId: 'P007', callerNumber: '9450123456', calleeNumber: '9415678901', duration: 421, type: 'CALL', timestamp: '2026-01-14T10:00:00', towerLocation: 'Kanpur-Civil Lines', flagged: false },
  { id: 'CDR005', callerId: 'P009', calleeId: 'P007', callerNumber: '8987654321', calleeNumber: '9415678901', duration: 198, type: 'CALL', timestamp: '2026-01-22T11:00:00', towerLocation: 'Patna-Boring Road', flagged: true, flagReason: 'Part of communication spike' },
  { id: 'CDR006', callerId: 'P009', calleeId: 'P006', callerNumber: '8987654321', calleeNumber: '9334567890', duration: 87, type: 'CALL', timestamp: '2026-01-22T11:12:00', towerLocation: 'Patna-Boring Road', flagged: true, flagReason: 'Part of communication spike' },
  { id: 'CDR007', callerId: 'P009', calleeId: 'P022', callerNumber: '8987654321', calleeNumber: '9815123456', duration: 312, type: 'CALL', timestamp: '2026-01-22T11:25:00', towerLocation: 'Patna-Boring Road', flagged: true, flagReason: 'Hawala suspect Kuldeep Nanda' },
  { id: 'CDR008', callerId: 'P009', calleeId: 'P005', callerNumber: '8987654321', calleeNumber: '9414123456', duration: 156, type: 'CALL', timestamp: '2026-01-22T12:10:00', towerLocation: 'Patna-Boring Road', flagged: true, flagReason: 'Part of communication spike' },
  { id: 'CDR009', callerId: 'P009', calleeId: 'PH011', callerNumber: '8987654321', calleeNumber: '7777888899', duration: 432, type: 'CALL', timestamp: '2026-01-22T12:45:00', towerLocation: 'Patna-Boring Road', flagged: true, flagReason: 'Unregistered SIM' },
  { id: 'CDR010', callerId: 'P009', calleeId: 'P028', callerNumber: '8987654321', calleeNumber: '9456789012', duration: 267, type: 'CALL', timestamp: '2026-01-22T13:05:00', towerLocation: 'Patna-Boring Road', flagged: true, flagReason: 'Part of communication spike; 7th contact in 3 hrs' },
  { id: 'CDR011', callerId: 'P001', calleeId: 'P016', callerNumber: '9876543210', calleeNumber: '9415234567', duration: 489, type: 'CALL', timestamp: '2026-01-25T14:00:00', towerLocation: 'Mumbai-Bandra', flagged: false },
  { id: 'CDR012', callerId: 'P002', calleeId: 'P014', callerNumber: '9871234567', calleeNumber: '9876012345', duration: 201, type: 'CALL', timestamp: '2026-01-28T16:30:00', towerLocation: 'Delhi-CP', flagged: false },
  { id: 'CDR013', callerId: 'P014', calleeId: 'P024', callerNumber: '9876012345', calleeNumber: '9450987654', duration: 345, type: 'CALL', timestamp: '2026-01-29T09:00:00', towerLocation: 'Chandigarh-Sector9', flagged: false },
  { id: 'CDR014', callerId: 'P022', calleeId: 'P001', callerNumber: '9815123456', calleeNumber: '9876543210', duration: 567, type: 'CALL', timestamp: '2026-02-01T10:00:00', towerLocation: 'Amritsar-Katra', flagged: true, flagReason: 'Hawala suspect calling P001' },
  { id: 'CDR015', callerId: 'P001', calleeId: 'P025', callerNumber: '9876543210', calleeNumber: '9810234567', duration: 234, type: 'CALL', timestamp: '2026-02-03T18:00:00', towerLocation: 'Mumbai-Juhu', flagged: false },
  { id: 'CDR016', callerId: 'P003', calleeId: 'P024', callerNumber: '9450123456', calleeNumber: '9450987654', duration: 412, type: 'CALL', timestamp: '2026-02-05T10:30:00', towerLocation: 'Kanpur-Civil Lines', flagged: false },
  { id: 'CDR017', callerId: 'PH011', calleeId: 'P001', callerNumber: '7777888899', calleeNumber: '9876543210', duration: 312, type: 'CALL', timestamp: '2026-02-10T20:00:00', towerLocation: 'Varanasi-Unknown', flagged: true, flagReason: 'Unregistered SIM calling P001' },
  { id: 'CDR018', callerId: 'P007', calleeId: 'P009', callerNumber: '9415678901', calleeNumber: '8987654321', duration: 189, type: 'CALL', timestamp: '2026-02-12T15:00:00', towerLocation: 'Varanasi-Assi Ghat', flagged: false },
  { id: 'CDR019', callerId: 'P020', calleeId: 'P029', callerNumber: '9849012345', calleeNumber: '9713456789', duration: 521, type: 'CALL', timestamp: '2026-03-01T11:00:00', towerLocation: 'Hyderabad-Charminar', flagged: true, flagReason: 'Extortion ring members' },
  { id: 'CDR020', callerId: 'P025', calleeId: 'P002', callerNumber: '9810234567', calleeNumber: '9871234567', duration: 378, type: 'CALL', timestamp: '2026-03-05T14:00:00', towerLocation: 'Delhi-Friends Colony', flagged: false },
  { id: 'CDR021', callerId: 'P001', calleeId: 'P004', callerNumber: '9876543210', calleeNumber: '9712345678', duration: 267, type: 'CALL', timestamp: '2026-03-10T09:30:00', towerLocation: 'Mumbai-Andheri', flagged: false },
  { id: 'CDR022', callerId: 'P004', calleeId: 'P022', callerNumber: '9712345678', calleeNumber: '9815123456', duration: 198, type: 'CALL', timestamp: '2026-03-10T10:00:00', towerLocation: 'Ahmedabad-Navrangpura', flagged: true, flagReason: 'P004 → P022 (Hawala suspect) chain' },
  { id: 'CDR023', callerId: 'P022', calleeId: 'P009', callerNumber: '9815123456', calleeNumber: '8987654321', duration: 445, type: 'CALL', timestamp: '2026-03-11T14:00:00', towerLocation: 'Amritsar-Katra', flagged: true, flagReason: 'Hawala chain: P022 → P009' },
  { id: 'CDR024', callerId: 'P028', calleeId: 'P001', callerNumber: '9456789012', calleeNumber: '9876543210', duration: 312, type: 'CALL', timestamp: '2026-03-15T16:00:00', towerLocation: 'Agra-Sadar', flagged: false },
  { id: 'CDR025', callerId: 'P017', calleeId: 'P001', callerNumber: '9999123456', calleeNumber: '9876543210', duration: 567, type: 'CALL', timestamp: '2026-03-20T11:00:00', towerLocation: 'Delhi-Race Course Road', flagged: false },
  { id: 'CDR026', callerId: 'P001', calleeId: 'P011', callerNumber: '9876543210', calleeNumber: '9897123456', duration: 234, type: 'CALL', timestamp: '2026-03-25T13:00:00', towerLocation: 'Mumbai-Andheri', flagged: false },
  { id: 'CDR027', callerId: 'P009', calleeId: 'P019', callerNumber: '8987654321', calleeNumber: '9816345678', duration: 156, type: 'CALL', timestamp: '2026-04-01T09:00:00', towerLocation: 'Patna-Boring Road', flagged: false },
  { id: 'CDR028', callerId: 'P007', calleeId: 'P006', callerNumber: '9415678901', calleeNumber: '9334567890', duration: 287, type: 'CALL', timestamp: '2026-04-03T15:00:00', towerLocation: 'Varanasi-Assi', flagged: false },
  { id: 'CDR029', callerId: 'P014', calleeId: 'P001', callerNumber: '9876012345', calleeNumber: '9876543210', duration: 421, type: 'CALL', timestamp: '2026-04-08T10:00:00', towerLocation: 'Chandigarh-Sector9', flagged: false },
  { id: 'CDR030', callerId: 'P001', calleeId: 'P027', callerNumber: '9876543210', calleeNumber: '9415678902', duration: 189, type: 'CALL', timestamp: '2026-04-10T14:30:00', towerLocation: 'Mumbai-Andheri', flagged: false },
  { id: 'CDR031', callerId: 'PH011', calleeId: 'P009', callerNumber: '7777888899', calleeNumber: '8987654321', duration: 278, type: 'CALL', timestamp: '2026-04-12T20:00:00', towerLocation: 'UP-Unknown Tower', flagged: true, flagReason: 'Unregistered SIM P011' },
  { id: 'CDR032', callerId: 'P022', calleeId: 'P025', callerNumber: '9815123456', calleeNumber: '9810234567', duration: 345, type: 'CALL', timestamp: '2026-04-15T11:00:00', towerLocation: 'Amritsar-Katra', flagged: true, flagReason: 'Hawala suspect → Import/Export' },
  { id: 'CDR033', callerId: 'P005', calleeId: 'P028', callerNumber: '9414123456', calleeNumber: '9456789012', duration: 212, type: 'CALL', timestamp: '2026-04-18T09:00:00', towerLocation: 'Jaipur-Vaishali', flagged: false },
  { id: 'CDR034', callerId: 'P016', calleeId: 'P003', callerNumber: '9415234567', calleeNumber: '9450123456', duration: 389, type: 'CALL', timestamp: '2026-04-20T15:00:00', towerLocation: 'Allahabad-Civil Lines', flagged: false },
  { id: 'CDR035', callerId: 'P020', calleeId: 'P006', callerNumber: '9849012345', calleeNumber: '9334567890', duration: 156, type: 'SMS', timestamp: '2026-04-22T10:00:00', towerLocation: 'Hyderabad-Charminar', flagged: false },
  { id: 'CDR036', callerId: 'P001', calleeId: 'P030', callerNumber: '9876543210', calleeNumber: '9871234567', duration: 267, type: 'CALL', timestamp: '2026-04-25T13:00:00', towerLocation: 'Mumbai-Andheri', flagged: false },
  { id: 'CDR037', callerId: 'P009', calleeId: 'P024', callerNumber: '8987654321', calleeNumber: '9450987654', duration: 312, type: 'CALL', timestamp: '2026-05-01T11:00:00', towerLocation: 'Patna-Boring Road', flagged: false },
  { id: 'CDR038', callerId: 'P014', calleeId: 'P016', callerNumber: '9876012345', calleeNumber: '9415234567', duration: 234, type: 'CALL', timestamp: '2026-05-05T09:00:00', towerLocation: 'Chandigarh-Sector9', flagged: false },
  { id: 'CDR039', callerId: 'P025', calleeId: 'P017', callerNumber: '9810234567', calleeNumber: '9999123456', duration: 445, type: 'CALL', timestamp: '2026-05-10T14:00:00', towerLocation: 'Delhi-Friends Colony', flagged: false },
  { id: 'CDR040', callerId: 'P022', calleeId: 'P006', callerNumber: '9815123456', calleeNumber: '9334567890', duration: 198, type: 'CALL', timestamp: '2026-05-15T16:00:00', towerLocation: 'Amritsar-Katra', flagged: true, flagReason: 'Hawala network expansion' },
];

// ============================================================
// FINANCIAL TRANSACTIONS (30)
// ============================================================
export const TRANSACTIONS: FinancialTransaction[] = [
  { id: 'TXN001', fromAccountId: 'ACC001', toAccountId: 'ACC007', fromAccount: 'ACC-MH-001-2019', toAccount: 'ACC-MH-007-2019', amount: 500000, currency: 'INR', date: '2026-01-20', channel: 'NEFT', narration: 'Business Payment', referenceNo: 'NEFT26200112345', flagged: true, flagReason: 'Large transfer; part of circular chain' },
  { id: 'TXN002', fromAccountId: 'ACC007', toAccountId: 'ACC008', fromAccount: 'ACC-MH-007-2019', toAccount: 'ACC-DL-008-2020', amount: 480000, currency: 'INR', date: '2026-01-21', channel: 'RTGS', narration: 'Freight Services', referenceNo: 'RTGS26210012346', flagged: true, flagReason: 'Circular chain hop 2' },
  { id: 'TXN003', fromAccountId: 'ACC008', toAccountId: 'ACC004', fromAccount: 'ACC-DL-008-2020', toAccount: 'ACC-GJ-004-2021', amount: 460000, currency: 'INR', date: '2026-01-22', channel: 'NEFT', narration: 'Commission', referenceNo: 'NEFT26220023456', flagged: true, flagReason: 'Circular chain hop 3' },
  { id: 'TXN004', fromAccountId: 'ACC004', toAccountId: 'ACC005', fromAccount: 'ACC-GJ-004-2021', toAccount: 'ACC-RJ-005-2017', amount: 440000, currency: 'INR', date: '2026-01-23', channel: 'IMPS', narration: 'Services', referenceNo: 'IMPS2623100001', flagged: true, flagReason: 'Circular chain hop 4' },
  { id: 'TXN005', fromAccountId: 'ACC005', toAccountId: 'ACC011', fromAccount: 'ACC-RJ-005-2017', toAccount: 'ACC-SHELL-011', amount: 420000, currency: 'INR', date: '2026-01-24', channel: 'Wire', narration: 'Consulting Fee', referenceNo: 'WIRE202601240001', flagged: true, flagReason: 'To shell account' },
  { id: 'TXN006', fromAccountId: 'ACC011', toAccountId: 'ACC003', fromAccount: 'ACC-SHELL-011', toAccount: 'ACC-UP-003-2018', amount: 400000, currency: 'INR', date: '2026-01-25', channel: 'NEFT', narration: 'Unknown', referenceNo: 'NEFT26250034567', flagged: true, flagReason: 'From shell to circular origin' },
  { id: 'TXN007', fromAccountId: 'ACC003', toAccountId: 'ACC001', fromAccount: 'ACC-UP-003-2018', toAccount: 'ACC-MH-001-2019', amount: 380000, currency: 'INR', date: '2026-01-26', channel: 'NEFT', narration: 'Loan Repayment', referenceNo: 'NEFT26260045678', flagged: true, flagReason: 'Circular chain complete; return to P001' },
  { id: 'TXN008', fromAccountId: 'ACC002', toAccountId: 'ACC002', fromAccount: 'ACC-DL-002-2020', toAccount: 'ACC-DL-002-2020', amount: 85000, currency: 'INR', date: '2026-03-01', channel: 'Cash Deposit', narration: 'Cash Deposit', referenceNo: 'CD20260301001', flagged: true, flagReason: 'Structuring — Deposit 1 of 4' },
  { id: 'TXN009', fromAccountId: 'ACC002', toAccountId: 'ACC002', fromAccount: 'ACC-DL-002-2020', toAccount: 'ACC-DL-002-2020', amount: 88000, currency: 'INR', date: '2026-03-01', channel: 'Cash Deposit', narration: 'Cash Deposit', referenceNo: 'CD20260301002', flagged: true, flagReason: 'Structuring — Deposit 2 of 4' },
  { id: 'TXN010', fromAccountId: 'ACC002', toAccountId: 'ACC002', fromAccount: 'ACC-DL-002-2020', toAccount: 'ACC-DL-002-2020', amount: 90000, currency: 'INR', date: '2026-03-01', channel: 'Cash Deposit', narration: 'Cash Deposit', referenceNo: 'CD20260301003', flagged: true, flagReason: 'Structuring — Deposit 3 of 4' },
  { id: 'TXN011', fromAccountId: 'ACC002', toAccountId: 'ACC002', fromAccount: 'ACC-DL-002-2020', toAccount: 'ACC-DL-002-2020', amount: 87000, currency: 'INR', date: '2026-03-01', channel: 'Cash Deposit', narration: 'Cash Deposit', referenceNo: 'CD20260301004', flagged: true, flagReason: 'Structuring — Deposit 4 of 4; total ₹3.5L in 3 hrs' },
  { id: 'TXN012', fromAccountId: 'ACC009', toAccountId: 'ACC011', fromAccount: 'ACC-PB-009-2018', toAccount: 'ACC-SHELL-011', amount: 750000, currency: 'INR', date: '2026-02-10', channel: 'RTGS', narration: 'Business Investment', referenceNo: 'RTGS26210056789', flagged: true, flagReason: 'Hawala → Shell account' },
  { id: 'TXN013', fromAccountId: 'ACC010', toAccountId: 'ACC007', fromAccount: 'ACC-DL-010-2023', toAccount: 'ACC-MH-007-2019', amount: 300000, currency: 'INR', date: '2026-02-15', channel: 'NEFT', narration: 'Purchase Order', referenceNo: 'NEFT26460067890', flagged: false },
  { id: 'TXN014', fromAccountId: 'ACC012', toAccountId: 'ACC011', fromAccount: 'ACC-UP-012-2016', toAccount: 'ACC-SHELL-011', amount: 600000, currency: 'INR', date: '2026-03-05', channel: 'RTGS', narration: 'Gold Purchase', referenceNo: 'RTGS26630078901', flagged: true, flagReason: 'Jeweller → Shell; no invoice' },
  { id: 'TXN015', fromAccountId: 'ACC013', toAccountId: 'ACC011', fromAccount: 'ACC-MH-013-2020', toAccount: 'ACC-SHELL-011', amount: 450000, currency: 'INR', date: '2026-03-10', channel: 'Wire', narration: 'Overseas Consulting', referenceNo: 'WIRE20260310002', flagged: true, flagReason: 'Informal finance → Shell' },
  { id: 'TXN016', fromAccountId: 'ACC001', toAccountId: 'ACC010', fromAccount: 'ACC-MH-001-2019', toAccount: 'ACC-DL-010-2023', amount: 200000, currency: 'INR', date: '2026-03-15', channel: 'NEFT', narration: 'Commission', referenceNo: 'NEFT26750089012', flagged: false },
  { id: 'TXN017', fromAccountId: 'ACC006', toAccountId: 'ACC009', fromAccount: 'ACC-BR-006-2022', toAccount: 'ACC-PB-009-2018', amount: 350000, currency: 'INR', date: '2026-03-20', channel: 'IMPS', narration: 'Contract Payment', referenceNo: 'IMPS20260320001', flagged: true, flagReason: 'Ravi Kumar → Kuldeep Nanda (Hawala)' },
  { id: 'TXN018', fromAccountId: 'ACC003', toAccountId: 'ACC006', fromAccount: 'ACC-UP-003-2018', toAccount: 'ACC-BR-006-2022', amount: 180000, currency: 'INR', date: '2026-03-22', channel: 'NEFT', narration: 'Labour Payment', referenceNo: 'NEFT26810090123', flagged: false },
  { id: 'TXN019', fromAccountId: 'ACC007', toAccountId: 'ACC013', fromAccount: 'ACC-MH-007-2019', toAccount: 'ACC-MH-013-2020', amount: 220000, currency: 'INR', date: '2026-04-01', channel: 'NEFT', narration: 'Trade Payment', referenceNo: 'NEFT26910101234', flagged: false },
  { id: 'TXN020', fromAccountId: 'ACC008', toAccountId: 'ACC010', fromAccount: 'ACC-DL-008-2020', toAccount: 'ACC-DL-010-2023', amount: 170000, currency: 'INR', date: '2026-04-05', channel: 'IMPS', narration: 'Logistics Fee', referenceNo: 'IMPS20260405001', flagged: false },
  { id: 'TXN021', fromAccountId: 'ACC004', toAccountId: 'ACC013', fromAccount: 'ACC-GJ-004-2021', toAccount: 'ACC-MH-013-2020', amount: 130000, currency: 'INR', date: '2026-04-10', channel: 'NEFT', narration: 'Accounting Services', referenceNo: 'NEFT27000112345', flagged: false },
  { id: 'TXN022', fromAccountId: 'ACC011', toAccountId: 'ACC009', fromAccount: 'ACC-SHELL-011', toAccount: 'ACC-PB-009-2018', amount: 890000, currency: 'INR', date: '2026-04-15', channel: 'Wire', narration: 'Return of Funds', referenceNo: 'WIRE20260415001', flagged: true, flagReason: 'Shell returning funds to hawala network' },
  { id: 'TXN023', fromAccountId: 'ACC009', toAccountId: 'ACC006', fromAccount: 'ACC-PB-009-2018', toAccount: 'ACC-BR-006-2022', amount: 420000, currency: 'INR', date: '2026-04-16', channel: 'RTGS', narration: 'Business', referenceNo: 'RTGS27000123456', flagged: true, flagReason: 'Hawala → Ravi Kumar (laundering)' },
  { id: 'TXN024', fromAccountId: 'ACC006', toAccountId: 'ACC003', fromAccount: 'ACC-BR-006-2022', toAccount: 'ACC-UP-003-2018', amount: 390000, currency: 'INR', date: '2026-04-17', channel: 'NEFT', narration: 'Payment', referenceNo: 'NEFT27070134567', flagged: true, flagReason: 'Ravi Kumar → Ramesh Gupta chain' },
  { id: 'TXN025', fromAccountId: 'ACC001', toAccountId: 'ACC008', fromAccount: 'ACC-MH-001-2019', toAccount: 'ACC-DL-008-2020', amount: 275000, currency: 'INR', date: '2026-05-01', channel: 'RTGS', narration: 'Import Advance', referenceNo: 'RTGS27210145678', flagged: false },
  { id: 'TXN026', fromAccountId: 'ACC015', toAccountId: 'ACC003', fromAccount: 'ACC-UP-015-2019', toAccount: 'ACC-UP-003-2018', amount: 95000, currency: 'INR', date: '2026-05-05', channel: 'NEFT', narration: 'Textile Supply', referenceNo: 'NEFT27250156789', flagged: false },
  { id: 'TXN027', fromAccountId: 'ACC010', toAccountId: 'ACC008', fromAccount: 'ACC-DL-010-2023', toAccount: 'ACC-DL-008-2020', amount: 160000, currency: 'INR', date: '2026-05-10', channel: 'IMPS', narration: 'Clearing', referenceNo: 'IMPS20260510001', flagged: false },
  { id: 'TXN028', fromAccountId: 'ACC012', toAccountId: 'ACC009', fromAccount: 'ACC-UP-012-2016', toAccount: 'ACC-PB-009-2018', amount: 500000, currency: 'INR', date: '2026-05-15', channel: 'RTGS', narration: 'Gold Sourcing', referenceNo: 'RTGS27350167890', flagged: true, flagReason: 'Jeweller → Hawala network' },
  { id: 'TXN029', fromAccountId: 'ACC011', toAccountId: 'ACC001', fromAccount: 'ACC-SHELL-011', toAccount: 'ACC-MH-001-2019', amount: 1200000, currency: 'INR', date: '2026-05-20', channel: 'Wire', narration: 'Profit Share', referenceNo: 'WIRE20260520001', flagged: true, flagReason: 'Large wire from shell to P001; possible layering completion' },
  { id: 'TXN030', fromAccountId: 'ACC007', toAccountId: 'ACC015', fromAccount: 'ACC-MH-007-2019', toAccount: 'ACC-UP-015-2019', amount: 140000, currency: 'INR', date: '2026-05-25', channel: 'NEFT', narration: 'Supply Payment', referenceNo: 'NEFT27450178901', flagged: false },
];

// ============================================================
// SURVEILLANCE REPORTS (8)
// ============================================================
export const SURVEILLANCE_REPORTS: SurveillanceReport[] = [
  { id: 'SR001', reportNumber: 'SURV-2026-001', date: '2026-01-14', time: '10:30', location: 'Kanpur Central Railway Station', reportingOfficer: 'Inspector A.K. Singh', personsObserved: ['P001', 'P002', 'P003'], description: 'Three suspects observed near Platform 3 for approximately 45 minutes. P001 (Arjun Mehta) seen exchanging a bag with P003 (Ramesh Gupta). Vehicle V004 (MH-02-AB-1234) spotted in station parking. P002 arrived separately in V003.', evidenceRef: 'CCTV-KAN-20260114-001', priority: 'Critical' },
  { id: 'SR002', reportNumber: 'SURV-2026-002', date: '2026-01-22', time: '11:00', location: 'Boring Road, Patna', reportingOfficer: 'DSP R. Verma', personsObserved: ['P009'], description: 'P009 (Ravi Kumar) observed making 7 phone calls from a PCO booth and personal mobile within 3 hours. One call lasted 432 seconds to unregistered number 7777888899. Subject appeared anxious and checked surroundings repeatedly.', evidenceRef: 'SURV-PATNA-20260122', priority: 'High' },
  { id: 'SR003', reportNumber: 'SURV-2026-003', date: '2026-02-03', time: '19:00', location: 'Lotus Hotel, Juhu, Mumbai', reportingOfficer: 'Inspector S. Patil', personsObserved: ['P001', 'P002', 'P003', 'P014'], description: 'Multi-party gathering at Suite 402, Lotus Hotel. P001, P002, P003, and P014 arrived within 30 minutes of each other. An unidentified male (possible P015/Deepak Patel cross) was also observed. Meeting lasted approximately 3 hours.', evidenceRef: 'CCTV-LOTUS-20260203-001', priority: 'Critical' },
  { id: 'SR004', reportNumber: 'SURV-2026-004', date: '2026-02-15', time: '09:00', location: 'Wagah Border Post, Amritsar', reportingOfficer: 'BSF Intelligence Unit', personsObserved: ['P022'], description: 'Vehicle V015 (PB10CD7890, Kuldeep Nanda) flagged at Wagah for the third time this year. Declared exports did not match cargo manifest. Currency amount declared: ₹10,000. Suspected actual: significantly higher. Vehicle cleared after document inspection.', evidenceRef: 'BSF-WAGAH-20260215', priority: 'High' },
  { id: 'SR005', reportNumber: 'SURV-2026-005', date: '2026-03-01', time: '14:00', location: 'Varanasi Ghats, UP', reportingOfficer: 'Inspector K. Mishra', personsObserved: ['P007', 'P009', 'P006'], description: 'C2 community members observed at Dashaswamedh Ghat. P009 arrived from Patna by train. P007 and P006 were already present. Conversation lasted 1.5 hrs. Handover of sealed envelope from P009 to P007 observed.', evidenceRef: 'SURV-VAR-20260301', priority: 'Medium' },
  { id: 'SR006', reportNumber: 'SURV-2026-006', date: '2026-03-20', time: '16:00', location: 'Chandigarh Customs Office, Sector 17', reportingOfficer: 'Intelligence Bureau Unit', personsObserved: ['P014'], description: 'P014 (Ajay Singh, Customs Agent) observed with unknown individual outside customs office. Documents exchanged. P014 made several calls immediately after. Cross-reference with CDR-038 confirms call to P016 at same timestamp.', evidenceRef: 'IB-CHD-20260320', priority: 'High' },
  { id: 'SR007', reportNumber: 'SURV-2026-007', date: '2026-04-10', time: '12:00', location: 'Sadar Bazaar, Agra', reportingOfficer: 'Inspector P. Kumar', personsObserved: ['P028'], description: 'P028 (Pawan Agarwal) observed at Agarwal Gold & Jewels conducting cash transaction with two unidentified buyers. No GST invoice issued. Approximately 2.5 kg gold bullion purchased in cash. Total estimated ₹1.4 Cr in cash on premises.', evidenceRef: 'SURV-AGRA-20260410', priority: 'High' },
  { id: 'SR008', reportNumber: 'SURV-2026-008', date: '2026-05-05', time: '20:00', location: 'Delhi IGI Airport, Terminal 3', reportingOfficer: 'CISF Intelligence', personsObserved: ['P002', 'P025'], description: 'P002 (Vikram Sinha) and P025 (Manish Kapoor) arrived on same international flight from Dubai (EK-510). Both declared minimal goods. Baggage scanned; contents declared as electronics samples. P002 contacted P001 within minutes of clearing customs.', evidenceRef: 'CISF-IGI-20260505', priority: 'High' },
];

// ============================================================
// GRAPH RELATIONSHIPS (for network graph)
// ============================================================
export const GRAPH_EDGES = [
  // C1 core connections
  { source: 'P001', target: 'P002', type: 'ASSOCIATED_WITH', confidence: 0.92, source_ref: 'CDR001,SR003' },
  { source: 'P001', target: 'P003', type: 'ASSOCIATED_WITH', confidence: 0.88, source_ref: 'CDR002,SR001' },
  { source: 'P001', target: 'P004', type: 'ASSOCIATED_WITH', confidence: 0.71, source_ref: 'CDR021' },
  { source: 'P001', target: 'P016', type: 'ASSOCIATED_WITH', confidence: 0.75, source_ref: 'CDR011' },
  { source: 'P001', target: 'P017', type: 'ASSOCIATED_WITH', confidence: 0.68, source_ref: 'CDR025' },
  { source: 'P001', target: 'P025', type: 'ASSOCIATED_WITH', confidence: 0.70, source_ref: 'CDR015' },
  { source: 'P002', target: 'P014', type: 'ASSOCIATED_WITH', confidence: 0.65, source_ref: 'CDR012' },
  { source: 'P001', target: 'P030', type: 'ASSOCIATED_WITH', confidence: 0.60, source_ref: 'CDR036' },
  { source: 'P001', target: 'P027', type: 'ASSOCIATED_WITH', confidence: 0.55, source_ref: 'CDR030' },
  { source: 'P001', target: 'P011', type: 'ASSOCIATED_WITH', confidence: 0.58, source_ref: 'CDR026' },
  // C2 core connections
  { source: 'P009', target: 'P007', type: 'CALLS', confidence: 0.97, source_ref: 'CDR005' },
  { source: 'P009', target: 'P006', type: 'CALLS', confidence: 0.94, source_ref: 'CDR006' },
  { source: 'P009', target: 'P022', type: 'CALLS', confidence: 0.91, source_ref: 'CDR007' },
  { source: 'P009', target: 'P005', type: 'CALLS', confidence: 0.89, source_ref: 'CDR008' },
  { source: 'P009', target: 'P028', type: 'CALLS', confidence: 0.85, source_ref: 'CDR010' },
  { source: 'P009', target: 'P019', type: 'ASSOCIATED_WITH', confidence: 0.62, source_ref: 'CDR027' },
  { source: 'P007', target: 'P006', type: 'CALLS', confidence: 0.88, source_ref: 'CDR028' },
  { source: 'P022', target: 'P001', type: 'CALLS', confidence: 0.87, source_ref: 'CDR014' },
  { source: 'P022', target: 'P025', type: 'CALLS', confidence: 0.80, source_ref: 'CDR032' },
  { source: 'P022', target: 'P006', type: 'CALLS', confidence: 0.76, source_ref: 'CDR040' },
  // Cross-community bridges
  { source: 'P001', target: 'P009', type: 'CALLS', confidence: 0.95, source_ref: 'CDR003' },
  { source: 'P004', target: 'P022', type: 'CALLS', confidence: 0.78, source_ref: 'CDR022' },
  { source: 'P014', target: 'P024', type: 'CALLS', confidence: 0.82, source_ref: 'CDR013' },
  { source: 'P014', target: 'P001', type: 'CALLS', confidence: 0.77, source_ref: 'CDR029' },
  { source: 'P014', target: 'P016', type: 'CALLS', confidence: 0.72, source_ref: 'CDR038' },
  { source: 'P003', target: 'P007', type: 'ASSOCIATED_WITH', confidence: 0.84, source_ref: 'CDR004' },
  { source: 'P003', target: 'P024', type: 'ASSOCIATED_WITH', confidence: 0.80, source_ref: 'CDR016' },
  { source: 'P009', target: 'P024', type: 'CALLS', confidence: 0.74, source_ref: 'CDR037' },
  { source: 'P025', target: 'P002', type: 'ASSOCIATED_WITH', confidence: 0.75, source_ref: 'CDR020' },
  { source: 'P025', target: 'P017', type: 'ASSOCIATED_WITH', confidence: 0.70, source_ref: 'CDR039' },
  { source: 'P016', target: 'P003', type: 'CALLS', confidence: 0.71, source_ref: 'CDR034' },
  { source: 'P020', target: 'P029', type: 'ASSOCIATED_WITH', confidence: 0.93, source_ref: 'CDR019' },
  { source: 'P020', target: 'P006', type: 'ASSOCIATED_WITH', confidence: 0.65, source_ref: 'CDR035' },
  { source: 'P005', target: 'P028', type: 'CALLS', confidence: 0.68, source_ref: 'CDR033' },
  // Owns relationships
  { source: 'P001', target: 'PH001', type: 'OWNS', confidence: 0.99, source_ref: 'TELECOM-RECORDS' },
  { source: 'P001', target: 'PH002', type: 'OWNS', confidence: 0.99, source_ref: 'TELECOM-RECORDS' },
  { source: 'P001', target: 'V001', type: 'OWNS', confidence: 0.99, source_ref: 'RC-RECORDS' },
  { source: 'P001', target: 'ACC001', type: 'OWNS', confidence: 0.99, source_ref: 'BANK-RECORDS' },
  { source: 'P001', target: 'O001', type: 'WORKS_FOR', confidence: 0.99, source_ref: 'MCA-RECORDS' },
  { source: 'P009', target: 'PH010', type: 'OWNS', confidence: 0.99, source_ref: 'TELECOM-RECORDS' },
  { source: 'P009', target: 'ACC006', type: 'OWNS', confidence: 0.99, source_ref: 'BANK-RECORDS' },
  { source: 'P022', target: 'PH019', type: 'OWNS', confidence: 0.99, source_ref: 'TELECOM-RECORDS' },
  { source: 'P022', target: 'O005', type: 'WORKS_FOR', confidence: 0.99, source_ref: 'MCA-RECORDS' },
  { source: 'P022', target: 'V015', type: 'OWNS', confidence: 0.99, source_ref: 'RC-RECORDS' },
  { source: 'P003', target: 'V004', type: 'OWNS', confidence: 0.99, source_ref: 'RC-RECORDS' },
  { source: 'P003', target: 'V005', type: 'OWNS', confidence: 0.99, source_ref: 'RC-RECORDS' },
  // Financial links
  { source: 'ACC001', target: 'ACC007', type: 'FINANCIAL_TRANSACTION', confidence: 0.99, source_ref: 'TXN001' },
  { source: 'ACC007', target: 'ACC008', type: 'FINANCIAL_TRANSACTION', confidence: 0.99, source_ref: 'TXN002' },
  { source: 'ACC008', target: 'ACC004', type: 'FINANCIAL_TRANSACTION', confidence: 0.99, source_ref: 'TXN003' },
  { source: 'ACC004', target: 'ACC005', type: 'FINANCIAL_TRANSACTION', confidence: 0.99, source_ref: 'TXN004' },
  { source: 'ACC005', target: 'ACC011', type: 'FINANCIAL_TRANSACTION', confidence: 0.99, source_ref: 'TXN005' },
  { source: 'ACC011', target: 'ACC003', type: 'FINANCIAL_TRANSACTION', confidence: 0.99, source_ref: 'TXN006' },
  { source: 'ACC003', target: 'ACC001', type: 'FINANCIAL_TRANSACTION', confidence: 0.99, source_ref: 'TXN007' },
  { source: 'ACC009', target: 'ACC011', type: 'FINANCIAL_TRANSACTION', confidence: 0.99, source_ref: 'TXN012' },
  { source: 'ACC011', target: 'ACC001', type: 'FINANCIAL_TRANSACTION', confidence: 0.99, source_ref: 'TXN029' },
  // FIR associations
  { source: 'P001', target: 'FIR001', type: 'APPEARED_IN_CASE', confidence: 0.99, source_ref: 'FIR-RECORD' },
  { source: 'P002', target: 'FIR001', type: 'APPEARED_IN_CASE', confidence: 0.99, source_ref: 'FIR-RECORD' },
  { source: 'P003', target: 'FIR001', type: 'APPEARED_IN_CASE', confidence: 0.99, source_ref: 'FIR-RECORD' },
  { source: 'P009', target: 'FIR002', type: 'APPEARED_IN_CASE', confidence: 0.99, source_ref: 'FIR-RECORD' },
  { source: 'P022', target: 'FIR002', type: 'APPEARED_IN_CASE', confidence: 0.99, source_ref: 'FIR-RECORD' },
  { source: 'P020', target: 'FIR003', type: 'APPEARED_IN_CASE', confidence: 0.99, source_ref: 'FIR-RECORD' },
  // Unregistered phone
  { source: 'PH011', target: 'P001', type: 'CALLS', confidence: 0.91, source_ref: 'CDR017' },
  { source: 'PH011', target: 'P009', type: 'CALLS', confidence: 0.88, source_ref: 'CDR031' },
  // Location associations
  { source: 'P001', target: 'L001', type: 'LOCATED_AT', confidence: 0.90, source_ref: 'SR001' },
  { source: 'P001', target: 'L002', type: 'LOCATED_AT', confidence: 0.88, source_ref: 'SR003' },
  { source: 'P001', target: 'L003', type: 'LOCATED_AT', confidence: 0.95, source_ref: 'FIR001' },
  { source: 'P022', target: 'L007', type: 'LOCATED_AT', confidence: 0.92, source_ref: 'SR004' },
  { source: 'P009', target: 'L006', type: 'LOCATED_AT', confidence: 0.85, source_ref: 'SR005' },
  { source: 'P028', target: 'L009', type: 'LOCATED_AT', confidence: 0.97, source_ref: 'SR007' },
];

// ============================================================
// HELPER: all entities as unified list
// ============================================================
export interface CaseEntity {
  id: string;
  nodeType: 'Case';
  name: string;
  firNumber: string;
  station?: string;
  district?: string;
  state?: string;
  filedDate?: string;
  filedBy?: string;
  sections?: string[];
  description?: string;
  complainant?: string;
  accused?: string[];
  status?: string;
  priority?: string;
  linkedEntities?: string[];
}

export const CASE_ENTITIES: CaseEntity[] = FIR_RECORDS.map(fir => ({
  ...fir,
  nodeType: 'Case' as const,
  name: fir.firNumber,
}));

export type AnyEntity = Person | Phone | Vehicle | Organisation | Account | Location | CaseEntity;

export const ALL_ENTITIES: AnyEntity[] = [
  ...PERSONS, ...PHONES, ...VEHICLES, ...ORGANISATIONS, ...ACCOUNTS, ...LOCATIONS, ...CASE_ENTITIES,
];

export const ENTITY_COUNTS = {
  persons: PERSONS.length,
  phones: PHONES.length,
  vehicles: VEHICLES.length,
  organisations: ORGANISATIONS.length,
  accounts: ACCOUNTS.length,
  locations: LOCATIONS.length,
  firs: FIR_RECORDS.length,
  cdrRecords: CDR_RECORDS.length,
  transactions: TRANSACTIONS.length,
  surveillanceReports: SURVEILLANCE_REPORTS.length,
  totalEntities: ALL_ENTITIES.length,
  totalRelationships: GRAPH_EDGES.length,
};
