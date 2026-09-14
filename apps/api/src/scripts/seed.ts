import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { initPostgres, query, withTransaction } from '../db/postgres';
import { initNeo4j, runCypherQuery } from '../db/neo4j';
import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { generateEvidenceHash, generateBlockHash } from '../utils/crypto';

// ============================================================
// SYNTHETIC DATA GENERATOR — No real personal data
// ============================================================

const PERSONS = [
  { id: 'P001', name: 'Arjun Mehta', alias: 'AJ', age: 34, gender: 'Male', location: 'Mumbai', communityId: 'C1', riskScore: 0.72, centralityScore: 0.85, betweennessScore: 0.78 },
  { id: 'P002', name: 'Vikram Sinha', alias: 'VK', age: 41, gender: 'Male', location: 'Delhi', communityId: 'C1', riskScore: 0.45, centralityScore: 0.42, betweennessScore: 0.38 },
  { id: 'P003', name: 'Ramesh Gupta', alias: 'Ram', age: 29, gender: 'Male', location: 'Kanpur', communityId: 'C1', riskScore: 0.61, centralityScore: 0.55, betweennessScore: 0.60 },
  { id: 'P004', name: 'Sunita Sharma', alias: 'Suni', age: 37, gender: 'Female', location: 'Lucknow', communityId: 'C1', riskScore: 0.38, centralityScore: 0.33, betweennessScore: 0.29 },
  { id: 'P005', name: 'Deepak Patel', alias: 'DK', age: 45, gender: 'Male', location: 'Ahmedabad', communityId: 'C1', riskScore: 0.55, centralityScore: 0.48, betweennessScore: 0.52 },
  { id: 'P006', name: 'Priya Nair', alias: 'PD', age: 31, gender: 'Female', location: 'Chennai', communityId: 'C2', riskScore: 0.29, centralityScore: 0.28, betweennessScore: 0.22 },
  { id: 'P007', name: 'Suresh Yadav', alias: 'SY', age: 38, gender: 'Male', location: 'Varanasi', communityId: 'C2', riskScore: 0.67, centralityScore: 0.62, betweennessScore: 0.70 },
  { id: 'P008', name: 'Anjali Mishra', alias: 'AnjM', age: 26, gender: 'Female', location: 'Allahabad', communityId: 'C2', riskScore: 0.41, centralityScore: 0.37, betweennessScore: 0.35 },
  { id: 'P009', name: 'Ravi Kumar', alias: 'RK', age: 52, gender: 'Male', location: 'Patna', communityId: 'C2', riskScore: 0.78, centralityScore: 0.80, betweennessScore: 0.82 },
  { id: 'P010', name: 'Kavya Reddy', alias: 'KR', age: 33, gender: 'Female', location: 'Hyderabad', communityId: 'C2', riskScore: 0.35, centralityScore: 0.30, betweennessScore: 0.25 },
  { id: 'P011', name: 'Mohan Das', alias: 'MD', age: 47, gender: 'Male', location: 'Kolkata', communityId: 'C3', riskScore: 0.59, centralityScore: 0.54, betweennessScore: 0.58 },
  { id: 'P012', name: 'Rohit Saxena', alias: 'RS', age: 30, gender: 'Male', location: 'Agra', communityId: 'C3', riskScore: 0.43, centralityScore: 0.40, betweennessScore: 0.36 },
  { id: 'P013', name: 'Neha Joshi', alias: 'NJ', age: 28, gender: 'Female', location: 'Jaipur', communityId: 'C3', riskScore: 0.32, centralityScore: 0.29, betweennessScore: 0.24 },
  { id: 'P014', name: 'Ajay Singh', alias: 'AS', age: 43, gender: 'Male', location: 'Chandigarh', communityId: 'C3', riskScore: 0.65, centralityScore: 0.68, betweennessScore: 0.72 },
  { id: 'P015', name: 'Pooja Verma', alias: 'PV', age: 35, gender: 'Female', location: 'Pune', communityId: 'C3', riskScore: 0.38, centralityScore: 0.34, betweennessScore: 0.30 },
  { id: 'P016', name: 'Alok Trivedi', alias: 'AT', age: 49, gender: 'Male', location: 'Bhopal', communityId: 'C1', riskScore: 0.70, centralityScore: 0.75, betweennessScore: 0.68 },
  { id: 'P017', name: 'Shyam Rawat', alias: 'ShyR', age: 36, gender: 'Male', location: 'Dehradun', communityId: 'C2', riskScore: 0.48, centralityScore: 0.44, betweennessScore: 0.41 },
  { id: 'P018', name: 'Geeta Kaur', alias: 'GK', age: 40, gender: 'Female', location: 'Amritsar', communityId: 'C1', riskScore: 0.25, centralityScore: 0.22, betweennessScore: 0.18 },
  { id: 'P019', name: 'Harish Chandra', alias: 'HC', age: 55, gender: 'Male', location: 'Nagpur', communityId: 'C3', riskScore: 0.62, centralityScore: 0.58, betweennessScore: 0.66 },
  { id: 'P020', name: 'Rekha Tiwari', alias: 'RT', age: 32, gender: 'Female', location: 'Surat', communityId: 'C2', riskScore: 0.36, centralityScore: 0.31, betweennessScore: 0.28 },
  // Extended persons for richer graph
  { id: 'P021', name: 'Vijay Malhotra', alias: 'VM', age: 44, gender: 'Male', location: 'Noida', communityId: 'C1', riskScore: 0.53, centralityScore: 0.50, betweennessScore: 0.55 },
  { id: 'P022', name: 'Sanjay Dubey', alias: 'SD', age: 39, gender: 'Male', location: 'Indore', communityId: 'C1', riskScore: 0.47, centralityScore: 0.43, betweennessScore: 0.40 },
  { id: 'P023', name: 'Lakshmi Rao', alias: 'LR', age: 27, gender: 'Female', location: 'Bangalore', communityId: 'C2', riskScore: 0.28, centralityScore: 0.25, betweennessScore: 0.20 },
  { id: 'P024', name: 'Girish Pandey', alias: 'GP', age: 50, gender: 'Male', location: 'Kanpur', communityId: 'C3', riskScore: 0.74, centralityScore: 0.78, betweennessScore: 0.76 },
  { id: 'P025', name: 'Meena Bajaj', alias: 'MB', age: 33, gender: 'Female', location: 'Jodhpur', communityId: 'C3', riskScore: 0.33, centralityScore: 0.30, betweennessScore: 0.27 },
  { id: 'P026', name: 'Kamlesh Tomar', alias: 'KT', age: 46, gender: 'Male', location: 'Gwalior', communityId: 'C1', riskScore: 0.58, centralityScore: 0.55, betweennessScore: 0.60 },
  { id: 'P027', name: 'Divya Shah', alias: 'DS', age: 29, gender: 'Female', location: 'Vadodara', communityId: 'C2', riskScore: 0.31, centralityScore: 0.27, betweennessScore: 0.23 },
  { id: 'P028', name: 'Narayan Pillai', alias: 'NP', age: 53, gender: 'Male', location: 'Kochi', communityId: 'C3', riskScore: 0.66, centralityScore: 0.70, betweennessScore: 0.64 },
  { id: 'P029', name: 'Savita Rani', alias: 'SR', age: 38, gender: 'Female', location: 'Faridabad', communityId: 'C1', riskScore: 0.40, centralityScore: 0.36, betweennessScore: 0.33 },
  { id: 'P030', name: 'Bharat Thakur', alias: 'BT', age: 42, gender: 'Male', location: 'Meerut', communityId: 'C2', riskScore: 0.57, centralityScore: 0.52, betweennessScore: 0.56 },
];

const PHONES = [
  { id: 'PH001', number: '9876543210', operator: 'Airtel', registeredTo: 'P001', location: 'Mumbai' },
  { id: 'PH002', number: '9765432109', operator: 'Jio', registeredTo: 'P001', location: 'Mumbai' },
  { id: 'PH003', number: '9654321098', operator: 'BSNL', registeredTo: 'P002', location: 'Delhi' },
  { id: 'PH004', number: '9543210987', operator: 'Vodafone', registeredTo: 'P003', location: 'Kanpur' },
  { id: 'PH005', number: '9432109876', operator: 'Airtel', registeredTo: 'P004', location: 'Lucknow' },
  { id: 'PH006', number: '9321098765', operator: 'Jio', registeredTo: 'P005', location: 'Ahmedabad' },
  { id: 'PH007', number: '9210987654', operator: 'BSNL', registeredTo: 'P006', location: 'Chennai' },
  { id: 'PH008', number: '9109876543', operator: 'Vodafone', registeredTo: 'P007', location: 'Varanasi' },
  { id: 'PH009', number: '9098765432', operator: 'Airtel', registeredTo: 'P008', location: 'Allahabad' },
  { id: 'PH010', number: '8987654321', operator: 'Jio', registeredTo: 'P009', location: 'Patna' },
  { id: 'PH011', number: '8876543210', operator: 'BSNL', registeredTo: 'P010', location: 'Hyderabad' },
  { id: 'PH012', number: '8765432109', operator: 'Airtel', registeredTo: 'P011', location: 'Kolkata' },
  { id: 'PH013', number: '8654321098', operator: 'Jio', registeredTo: 'P012', location: 'Agra' },
  { id: 'PH014', number: '8543210987', operator: 'Vodafone', registeredTo: 'P013', location: 'Jaipur' },
  { id: 'PH015', number: '8432109876', operator: 'Airtel', registeredTo: 'P014', location: 'Chandigarh' },
  // Unregistered / prepaid phones
  { id: 'PH016', number: '7777888899', operator: 'Unknown', registeredTo: null, location: 'Unknown' },
  { id: 'PH017', number: '7666777788', operator: 'Prepaid', registeredTo: null, location: 'Mumbai' },
  { id: 'PH018', number: '7555666677', operator: 'Prepaid', registeredTo: 'P016', location: 'Bhopal' },
  { id: 'PH019', number: '7444555566', operator: 'Airtel', registeredTo: 'P017', location: 'Dehradun' },
  { id: 'PH020', number: '7333444455', operator: 'Jio', registeredTo: 'P024', location: 'Kanpur' },
];

const VEHICLES = [
  { id: 'V001', licensePlate: 'MH02AB1234', type: 'Car', make: 'Toyota', model: 'Innova', color: 'White', registeredTo: 'P001', year: 2019 },
  { id: 'V002', licensePlate: 'DL01CD5678', type: 'SUV', make: 'Ford', model: 'Endeavour', color: 'Black', registeredTo: 'P002', year: 2020 },
  { id: 'V003', licensePlate: 'UP70EF9012', type: 'Car', make: 'Maruti', model: 'Swift', color: 'Red', registeredTo: 'P003', year: 2018 },
  { id: 'V004', licensePlate: 'GJ01GH3456', type: 'Truck', make: 'Tata', model: 'LPT', color: 'Blue', registeredTo: 'P005', year: 2017 },
  { id: 'V005', licensePlate: 'TN09IJ7890', type: 'Car', make: 'Honda', model: 'City', color: 'Silver', registeredTo: 'P006', year: 2021 },
  { id: 'V006', licensePlate: 'UP32KL2345', type: 'Bike', make: 'Bajaj', model: 'Pulsar', color: 'Black', registeredTo: 'P007', year: 2019 },
  { id: 'V007', licensePlate: 'BR01MN6789', type: 'Car', make: 'Hyundai', model: 'Creta', color: 'Grey', registeredTo: 'P009', year: 2020 },
  { id: 'V008', licensePlate: 'WB10OP1234', type: 'Car', make: 'Mahindra', model: 'Scorpio', color: 'White', registeredTo: 'P011', year: 2018 },
  { id: 'V009', licensePlate: 'RJ14QR5678', type: 'Bike', make: 'Hero', model: 'Splendor', color: 'Blue', registeredTo: null, year: 2016 },
  { id: 'V010', licensePlate: 'PB10ST9012', type: 'Car', make: 'Toyota', model: 'Fortuner', color: 'Black', registeredTo: 'P014', year: 2022 },
];

const ORGANIZATIONS = [
  { id: 'O001', name: 'Shree Trading Co.', type: 'Import/Export', location: 'Mumbai', registrationNo: 'REG-MH-2019-1234', communityId: 'C1' },
  { id: 'O002', name: 'Apex Logistics Pvt. Ltd.', type: 'Logistics', location: 'Delhi', registrationNo: 'REG-DL-2017-5678', communityId: 'C1' },
  { id: 'O003', name: 'Sunrise Finance Services', type: 'Finance', location: 'Ahmedabad', registrationNo: 'REG-GJ-2018-9012', communityId: 'C2' },
  { id: 'O004', name: 'Bharat Construction Ltd.', type: 'Construction', location: 'Patna', registrationNo: 'REG-BR-2016-3456', communityId: 'C2' },
  { id: 'O005', name: 'Eastern Exports', type: 'Export', location: 'Kolkata', registrationNo: 'REG-WB-2020-7890', communityId: 'C3' },
  { id: 'O006', name: 'Northern Pharma Distributors', type: 'Pharmaceutical', location: 'Chandigarh', registrationNo: 'REG-CH-2019-2345', communityId: 'C3' },
  { id: 'O007', name: 'Global IT Solutions', type: 'Technology', location: 'Bangalore', registrationNo: 'REG-KA-2021-6789', communityId: 'C2' },
  { id: 'O008', name: 'Vinayak Real Estate', type: 'Real Estate', location: 'Pune', registrationNo: 'REG-MH-2015-1234', communityId: 'C3' },
];

const LOCATIONS = [
  { id: 'L001', name: 'Kanpur Central Station', type: 'Railway Station', city: 'Kanpur', state: 'Uttar Pradesh', lat: '26.4499', lon: '80.3319' },
  { id: 'L002', name: 'Lotus Hotel, Mumbai', type: 'Hotel', city: 'Mumbai', state: 'Maharashtra', lat: '19.0760', lon: '72.8777' },
  { id: 'L003', name: 'Sector 18, Noida', type: 'Commercial Area', city: 'Noida', state: 'Uttar Pradesh', lat: '28.5706', lon: '77.3219' },
  { id: 'L004', name: 'Old Delhi Market', type: 'Market', city: 'Delhi', state: 'Delhi', lat: '28.6562', lon: '77.2323' },
  { id: 'L005', name: 'Patna Junction', type: 'Railway Station', city: 'Patna', state: 'Bihar', lat: '25.6122', lon: '85.1441' },
  { id: 'L006', name: 'Hiranandani Business Park, Pune', type: 'Business District', city: 'Pune', state: 'Maharashtra', lat: '18.5204', lon: '73.8567' },
  { id: 'L007', name: 'Sadar Bazar, Agra', type: 'Market', city: 'Agra', state: 'Uttar Pradesh', lat: '27.1767', lon: '78.0081' },
  { id: 'L008', name: 'MG Road, Bangalore', type: 'Commercial Area', city: 'Bangalore', state: 'Karnataka', lat: '12.9716', lon: '77.5946' },
  { id: 'L009', name: 'New Market, Kolkata', type: 'Market', city: 'Kolkata', state: 'West Bengal', lat: '22.5726', lon: '88.3639' },
  { id: 'L010', name: 'Andheri Industrial Estate', type: 'Industrial Area', city: 'Mumbai', state: 'Maharashtra', lat: '19.1136', lon: '72.8697' },
];

const ACCOUNTS = [
  { id: 'ACC001', accountNumber: 'ACC-MH-001-2019', bank: 'State Bank', accountType: 'Current', holderName: 'Shree Trading Co.', balance: 2450000, ownedBy: 'P001', orgId: 'O001' },
  { id: 'ACC002', accountNumber: 'ACC-DL-002-2020', bank: 'HDFC Bank', accountType: 'Savings', holderName: 'Vikram Sinha', balance: 890000, ownedBy: 'P002', orgId: null },
  { id: 'ACC003', accountNumber: 'ACC-UP-003-2018', bank: 'Punjab National', accountType: 'Current', holderName: 'Ramesh Gupta', balance: 1230000, ownedBy: 'P003', orgId: null },
  { id: 'ACC004', accountNumber: 'ACC-GJ-004-2019', bank: 'Axis Bank', accountType: 'Current', holderName: 'Sunrise Finance', balance: 5670000, ownedBy: 'P005', orgId: 'O003' },
  { id: 'ACC005', accountNumber: 'ACC-BR-005-2017', bank: 'State Bank', accountType: 'Current', holderName: 'Bharat Construction', balance: 3450000, ownedBy: 'P009', orgId: 'O004' },
  { id: 'ACC006', accountNumber: 'ACC-WB-006-2020', bank: 'Canara Bank', accountType: 'Savings', holderName: 'Ravi Kumar', balance: 760000, ownedBy: 'P009', orgId: null },
  { id: 'ACC007', accountNumber: 'ACC-MH-007-2019', bank: 'ICICI Bank', accountType: 'Current', holderName: 'Apex Logistics', balance: 4230000, ownedBy: 'P002', orgId: 'O002' },
  { id: 'ACC008', accountNumber: 'ACC-CH-008-2021', bank: 'HDFC Bank', accountType: 'Savings', holderName: 'Ajay Singh', balance: 1120000, ownedBy: 'P014', orgId: null },
  { id: 'ACC009', accountNumber: 'ACC-UP-009-2020', bank: 'State Bank', accountType: 'Savings', holderName: 'Girish Pandey', balance: 560000, ownedBy: 'P024', orgId: null },
  { id: 'ACC010', accountNumber: 'ACC-KA-010-2022', bank: 'HDFC Bank', accountType: 'Current', holderName: 'Global IT Solutions', balance: 8900000, ownedBy: null, orgId: 'O007' },
  // Shell/suspicious accounts
  { id: 'ACC011', accountNumber: 'ACC-SHELL-011', bank: 'Unknown', accountType: 'Current', holderName: 'XYZ Enterprises', balance: 12500000, ownedBy: null, orgId: null },
  { id: 'ACC012', accountNumber: 'ACC-SHELL-012', bank: 'Unknown', accountType: 'Savings', holderName: 'Anonymous Holdings', balance: 4500000, ownedBy: null, orgId: null },
];

const CASES = [
  { id: 'CASE001', caseNumber: 'FIR-2026-00451', title: 'Suspected Smuggling Network — Northern Corridor', type: 'Smuggling', status: 'Active', filingDate: '2026-01-15', filedAt: 'Kanpur', assignedTo: 'Inspector Sharma' },
  { id: 'CASE002', caseNumber: 'FIR-2026-00892', title: 'Financial Fraud — Hawala Operation', type: 'Financial Fraud', status: 'Active', filingDate: '2026-02-08', filedAt: 'Mumbai', assignedTo: 'Inspector Verma' },
  { id: 'CASE003', caseNumber: 'FIR-2026-01234', title: 'Cybercrime — Online Extortion Syndicate', type: 'Cybercrime', status: 'Under Investigation', filingDate: '2026-03-12', filedAt: 'Bangalore', assignedTo: 'Inspector Gupta' },
  { id: 'CASE004', caseNumber: 'FIR-2026-01567', title: 'Vehicle Theft Ring — Multi-State', type: 'Property Crime', status: 'Active', filingDate: '2026-04-05', filedAt: 'Patna', assignedTo: 'Inspector Singh' },
  { id: 'CASE005', caseNumber: 'FIR-2025-08901', title: 'Drug Trafficking — Eastern Route', type: 'Narcotics', status: 'Closed', filingDate: '2025-11-20', filedAt: 'Kolkata', assignedTo: 'Inspector Rao' },
];

const EVENTS = [
  { id: 'EVT001', name: 'Kanpur Meeting', description: 'Suspected coordination meeting at Kanpur Central', date: '2026-01-14', location: 'L001', eventType: 'Meeting' },
  { id: 'EVT002', name: 'Mumbai Hotel Gathering', description: 'Group gathering at Lotus Hotel', date: '2026-02-03', location: 'L002', eventType: 'Meeting' },
  { id: 'EVT003', name: 'Delhi Handover', description: 'Suspected goods handover at Old Delhi Market', date: '2026-02-18', location: 'L004', eventType: 'Transaction' },
  { id: 'EVT004', name: 'Patna Coordination', description: 'Coordination event near Patna Junction', date: '2026-03-10', location: 'L005', eventType: 'Meeting' },
  { id: 'EVT005', name: 'Andheri Warehouse Activity', description: 'Suspicious activity at industrial estate', date: '2026-03-28', location: 'L010', eventType: 'Activity' },
];

// Relationship definitions
const PERSON_RELATIONSHIPS = [
  // Community 1 core network
  { from: 'P001', to: 'P002', type: 'ASSOCIATED_WITH', source: 'FIR-2026-00451', confidence: 0.89, timestamp: '2026-01-15T10:30:00Z', recordRef: 'REL-001', evidenceId: 'EVD-001' },
  { from: 'P001', to: 'P003', type: 'ASSOCIATED_WITH', source: 'FIR-2026-00451', confidence: 0.82, timestamp: '2026-01-15T10:30:00Z', recordRef: 'REL-002', evidenceId: 'EVD-002' },
  { from: 'P002', to: 'P003', type: 'RELATED_TO', source: 'CDR-2026-0041', confidence: 0.74, timestamp: '2026-01-20T14:00:00Z', recordRef: 'REL-003', evidenceId: 'EVD-003' },
  { from: 'P001', to: 'P016', type: 'WORKS_FOR', source: 'ORG-RECORD-001', confidence: 0.91, timestamp: '2026-01-01T00:00:00Z', recordRef: 'REL-004', evidenceId: 'EVD-004' },
  { from: 'P002', to: 'P016', type: 'WORKS_FOR', source: 'ORG-RECORD-002', confidence: 0.85, timestamp: '2026-01-01T00:00:00Z', recordRef: 'REL-005', evidenceId: 'EVD-005' },
  { from: 'P003', to: 'P004', type: 'ASSOCIATED_WITH', source: 'SURV-2026-034', confidence: 0.67, timestamp: '2026-02-10T16:00:00Z', recordRef: 'REL-006', evidenceId: 'EVD-006' },
  { from: 'P001', to: 'P005', type: 'ASSOCIATED_WITH', source: 'FIR-2026-00892', confidence: 0.71, timestamp: '2026-02-08T09:00:00Z', recordRef: 'REL-007', evidenceId: 'EVD-007' },
  { from: 'P016', to: 'P021', type: 'ASSOCIATED_WITH', source: 'SURV-2026-056', confidence: 0.63, timestamp: '2026-03-01T11:00:00Z', recordRef: 'REL-008', evidenceId: 'EVD-008' },
  { from: 'P021', to: 'P022', type: 'RELATED_TO', source: 'CDR-2026-0087', confidence: 0.58, timestamp: '2026-03-05T13:00:00Z', recordRef: 'REL-009', evidenceId: 'EVD-009' },
  { from: 'P022', to: 'P026', type: 'ASSOCIATED_WITH', source: 'SURV-2026-067', confidence: 0.62, timestamp: '2026-03-10T15:00:00Z', recordRef: 'REL-010', evidenceId: 'EVD-010' },
  // Community 2 network
  { from: 'P007', to: 'P009', type: 'ASSOCIATED_WITH', source: 'FIR-2026-01234', confidence: 0.88, timestamp: '2026-03-12T10:00:00Z', recordRef: 'REL-011', evidenceId: 'EVD-011' },
  { from: 'P007', to: 'P008', type: 'RELATED_TO', source: 'CDR-2026-0102', confidence: 0.76, timestamp: '2026-02-25T12:00:00Z', recordRef: 'REL-012', evidenceId: 'EVD-012' },
  { from: 'P009', to: 'P017', type: 'ASSOCIATED_WITH', source: 'SURV-2026-078', confidence: 0.65, timestamp: '2026-03-15T14:00:00Z', recordRef: 'REL-013', evidenceId: 'EVD-013' },
  { from: 'P009', to: 'P030', type: 'RELATED_TO', source: 'CDR-2026-0115', confidence: 0.59, timestamp: '2026-03-20T16:00:00Z', recordRef: 'REL-014', evidenceId: 'EVD-014' },
  // Community 3 network
  { from: 'P011', to: 'P019', type: 'ASSOCIATED_WITH', source: 'FIR-2025-08901', confidence: 0.84, timestamp: '2025-11-20T10:00:00Z', recordRef: 'REL-015', evidenceId: 'EVD-015' },
  { from: 'P014', to: 'P024', type: 'ASSOCIATED_WITH', source: 'SURV-2026-089', confidence: 0.80, timestamp: '2026-04-01T10:00:00Z', recordRef: 'REL-016', evidenceId: 'EVD-016' },
  { from: 'P024', to: 'P028', type: 'WORKS_FOR', source: 'ORG-RECORD-003', confidence: 0.86, timestamp: '2026-01-01T00:00:00Z', recordRef: 'REL-017', evidenceId: 'EVD-017' },
  // Cross-community bridges (key for betweenness centrality)
  { from: 'P003', to: 'P007', type: 'SHARED_LOCATION', source: 'LOC-2026-221', confidence: 0.72, timestamp: '2026-02-14T11:00:00Z', recordRef: 'REL-018', evidenceId: 'EVD-018' },
  { from: 'P005', to: 'P009', type: 'FINANCIAL_TRANSACTION', source: 'TXN-2026-0301', confidence: 0.78, timestamp: '2026-02-20T09:00:00Z', recordRef: 'REL-019', evidenceId: 'EVD-019' },
  { from: 'P014', to: 'P001', type: 'SHARED_CONTACT', source: 'CDR-2026-0142', confidence: 0.60, timestamp: '2026-04-05T13:00:00Z', recordRef: 'REL-020', evidenceId: 'EVD-020' },
];

// CDR records (caller-receiver)
const CDR_RECORDS = [
  { from: 'P001', to: 'P002', phone: 'PH001', toPhone: 'PH003', type: 'CALLS', duration: '245', timestamp: '2026-01-10T08:23:00Z', tower: 'TOWER-MH-001', source: 'CDR-2026-0001', recordRef: 'CDR-001', confidence: 0.98 },
  { from: 'P001', to: 'P003', phone: 'PH001', toPhone: 'PH004', type: 'CALLS', duration: '320', timestamp: '2026-01-11T09:15:00Z', tower: 'TOWER-MH-001', source: 'CDR-2026-0002', recordRef: 'CDR-002', confidence: 0.98 },
  { from: 'P002', to: 'P003', phone: 'PH003', toPhone: 'PH004', type: 'CALLS', duration: '180', timestamp: '2026-01-12T14:30:00Z', tower: 'TOWER-DL-002', source: 'CDR-2026-0003', recordRef: 'CDR-003', confidence: 0.98 },
  { from: 'P003', to: 'P007', phone: 'PH004', toPhone: 'PH008', type: 'CALLS', duration: '410', timestamp: '2026-01-15T16:45:00Z', tower: 'TOWER-UP-001', source: 'CDR-2026-0004', recordRef: 'CDR-004', confidence: 0.97 },
  { from: 'P001', to: 'P016', phone: 'PH001', toPhone: 'PH018', type: 'CALLS', duration: '560', timestamp: '2026-01-16T10:00:00Z', tower: 'TOWER-MH-001', source: 'CDR-2026-0005', recordRef: 'CDR-005', confidence: 0.96 },
  { from: 'P009', to: 'P007', phone: 'PH010', toPhone: 'PH008', type: 'CALLS', duration: '290', timestamp: '2026-01-18T11:30:00Z', tower: 'TOWER-BR-001', source: 'CDR-2026-0006', recordRef: 'CDR-006', confidence: 0.97 },
  { from: 'P001', to: 'P002', phone: 'PH002', toPhone: 'PH003', type: 'MESSAGES', duration: '0', timestamp: '2026-01-20T22:00:00Z', tower: 'TOWER-MH-001', source: 'CDR-2026-0007', recordRef: 'CDR-007', confidence: 0.95 },
  { from: 'P001', to: 'P002', phone: 'PH001', toPhone: 'PH003', type: 'CALLS', duration: '890', timestamp: '2026-01-22T07:30:00Z', tower: 'TOWER-MH-001', source: 'CDR-2026-0008', recordRef: 'CDR-008', confidence: 0.98 },
  { from: 'P003', to: 'P001', phone: 'PH004', toPhone: 'PH001', type: 'CALLS', duration: '340', timestamp: '2026-01-25T13:20:00Z', tower: 'TOWER-UP-001', source: 'CDR-2026-0009', recordRef: 'CDR-009', confidence: 0.97 },
  { from: 'P007', to: 'P009', phone: 'PH008', toPhone: 'PH010', type: 'CALLS', duration: '450', timestamp: '2026-01-28T15:00:00Z', tower: 'TOWER-UP-002', source: 'CDR-2026-0010', recordRef: 'CDR-010', confidence: 0.96 },
  // Anomalous spike for P009
  { from: 'P009', to: 'P001', phone: 'PH010', toPhone: 'PH001', type: 'CALLS', duration: '230', timestamp: '2026-02-01T09:00:00Z', tower: 'TOWER-BR-001', source: 'CDR-2026-0011', recordRef: 'CDR-011', confidence: 0.95 },
  { from: 'P009', to: 'P002', phone: 'PH010', toPhone: 'PH003', type: 'CALLS', duration: '180', timestamp: '2026-02-01T09:30:00Z', tower: 'TOWER-BR-001', source: 'CDR-2026-0012', recordRef: 'CDR-012', confidence: 0.95 },
  { from: 'P009', to: 'P003', phone: 'PH010', toPhone: 'PH004', type: 'CALLS', duration: '290', timestamp: '2026-02-01T10:00:00Z', tower: 'TOWER-BR-001', source: 'CDR-2026-0013', recordRef: 'CDR-013', confidence: 0.95 },
  { from: 'P009', to: 'P007', phone: 'PH010', toPhone: 'PH008', type: 'CALLS', duration: '310', timestamp: '2026-02-01T10:30:00Z', tower: 'TOWER-BR-001', source: 'CDR-2026-0014', recordRef: 'CDR-014', confidence: 0.95 },
  { from: 'P009', to: 'P016', phone: 'PH010', toPhone: 'PH018', type: 'CALLS', duration: '420', timestamp: '2026-02-01T11:00:00Z', tower: 'TOWER-BR-001', source: 'CDR-2026-0015', recordRef: 'CDR-015', confidence: 0.94 },
  { from: 'P009', to: 'P024', phone: 'PH010', toPhone: 'PH020', type: 'MESSAGES', duration: '0', timestamp: '2026-02-01T11:30:00Z', tower: 'TOWER-BR-001', source: 'CDR-2026-0016', recordRef: 'CDR-016', confidence: 0.94 },
  { from: 'P009', to: 'P014', phone: 'PH010', toPhone: 'PH015', type: 'CALLS', duration: '560', timestamp: '2026-02-01T12:00:00Z', tower: 'TOWER-BR-001', source: 'CDR-2026-0017', recordRef: 'CDR-017', confidence: 0.95 },
  // Additional CDR
  { from: 'P014', to: 'P001', phone: 'PH015', toPhone: 'PH001', type: 'CALLS', duration: '380', timestamp: '2026-02-05T14:00:00Z', tower: 'TOWER-PB-001', source: 'CDR-2026-0018', recordRef: 'CDR-018', confidence: 0.93 },
  { from: 'P024', to: 'P009', phone: 'PH020', toPhone: 'PH010', type: 'CALLS', duration: '260', timestamp: '2026-02-08T16:30:00Z', tower: 'TOWER-UP-003', source: 'CDR-2026-0019', recordRef: 'CDR-019', confidence: 0.94 },
  { from: 'P016', to: 'P021', phone: 'PH018', toPhone: 'PH016', type: 'CALLS', duration: '320', timestamp: '2026-02-10T09:00:00Z', tower: 'TOWER-MP-001', source: 'CDR-2026-0020', recordRef: 'CDR-020', confidence: 0.92 },
];

// Financial transactions (circular patterns)
const FINANCIAL_TRANSACTIONS = [
  // Main flow: ACC001 -> ACC007 -> ACC004 -> ACC005 -> ACC011 (structuring)
  { from: 'ACC001', to: 'ACC007', amount: 500000, timestamp: '2026-01-20T10:00:00Z', txType: 'Wire Transfer', ref: 'TXN-2026-0001', source: 'BANK-RECORD-001', confidence: 0.99 },
  { from: 'ACC007', to: 'ACC004', amount: 480000, timestamp: '2026-01-21T11:30:00Z', txType: 'Wire Transfer', ref: 'TXN-2026-0002', source: 'BANK-RECORD-002', confidence: 0.99 },
  { from: 'ACC004', to: 'ACC005', amount: 450000, timestamp: '2026-01-22T14:00:00Z', txType: 'RTGS', ref: 'TXN-2026-0003', source: 'BANK-RECORD-003', confidence: 0.99 },
  { from: 'ACC005', to: 'ACC011', amount: 430000, timestamp: '2026-01-23T09:00:00Z', txType: 'Wire Transfer', ref: 'TXN-2026-0004', source: 'BANK-RECORD-004', confidence: 0.99 },
  { from: 'ACC011', to: 'ACC003', amount: 400000, timestamp: '2026-01-24T15:30:00Z', txType: 'Wire Transfer', ref: 'TXN-2026-0005', source: 'BANK-RECORD-005', confidence: 0.99 },
  // Return flow (circular)
  { from: 'ACC003', to: 'ACC001', amount: 380000, timestamp: '2026-01-26T10:00:00Z', txType: 'NEFT', ref: 'TXN-2026-0006', source: 'BANK-RECORD-006', confidence: 0.99 },
  // Structuring pattern (multiple small transactions)
  { from: 'ACC002', to: 'ACC012', amount: 90000, timestamp: '2026-02-01T09:00:00Z', txType: 'Cash Deposit', ref: 'TXN-2026-0007', source: 'BANK-RECORD-007', confidence: 0.97 },
  { from: 'ACC002', to: 'ACC012', amount: 90000, timestamp: '2026-02-01T10:00:00Z', txType: 'Cash Deposit', ref: 'TXN-2026-0008', source: 'BANK-RECORD-008', confidence: 0.97 },
  { from: 'ACC002', to: 'ACC012', amount: 90000, timestamp: '2026-02-01T11:00:00Z', txType: 'Cash Deposit', ref: 'TXN-2026-0009', source: 'BANK-RECORD-009', confidence: 0.97 },
  { from: 'ACC002', to: 'ACC012', amount: 85000, timestamp: '2026-02-01T12:00:00Z', txType: 'Cash Deposit', ref: 'TXN-2026-0010', source: 'BANK-RECORD-010', confidence: 0.97 },
  // More transactions
  { from: 'ACC006', to: 'ACC005', amount: 250000, timestamp: '2026-02-10T14:00:00Z', txType: 'RTGS', ref: 'TXN-2026-0011', source: 'BANK-RECORD-011', confidence: 0.98 },
  { from: 'ACC005', to: 'ACC007', amount: 230000, timestamp: '2026-02-11T09:00:00Z', txType: 'Wire Transfer', ref: 'TXN-2026-0012', source: 'BANK-RECORD-012', confidence: 0.98 },
  { from: 'ACC008', to: 'ACC011', amount: 180000, timestamp: '2026-02-15T11:00:00Z', txType: 'NEFT', ref: 'TXN-2026-0013', source: 'BANK-RECORD-013', confidence: 0.97 },
  { from: 'ACC009', to: 'ACC011', amount: 120000, timestamp: '2026-02-18T15:00:00Z', txType: 'Wire Transfer', ref: 'TXN-2026-0014', source: 'BANK-RECORD-014', confidence: 0.96 },
  { from: 'ACC010', to: 'ACC001', amount: 350000, timestamp: '2026-02-22T10:00:00Z', txType: 'Wire Transfer', ref: 'TXN-2026-0015', source: 'BANK-RECORD-015', confidence: 0.95 },
];

async function seed(): Promise<void> {
  console.log('🌱 Starting CrimeGraph AI synthetic data seed...');

  try {
    await initPostgres();
    console.log('✅ PostgreSQL connected');

    await initNeo4j();
    console.log('✅ Neo4j connected');

    // =============================================
    // 1. Seed Users
    // =============================================
    console.log('👤 Seeding users...');
    const users = [
      { username: 'admin', email: 'admin@crimegraph.ai', password: 'Demo@1234', fullName: 'System Administrator', role: 'administrator', badge: 'ADMIN-001', dept: 'CrimeGraph AI' },
      { username: 'singh_si', email: 'inspector.singh@ncrb.gov.in', password: 'Demo@1234', fullName: 'Inspector Rajendra Singh', role: 'senior_investigator', badge: 'SI-2024-042', dept: 'NCRB — Women Safety Division' },
      { username: 'verma_inv', email: 'investigator.verma@ncrb.gov.in', password: 'Demo@1234', fullName: 'Sub-Inspector Priya Verma', role: 'investigator', badge: 'INV-2024-118', dept: 'NCRB — Organised Crime' },
      { username: 'analyst_gupta', email: 'analyst.gupta@ncrb.gov.in', password: 'Demo@1234', fullName: 'Data Analyst Suresh Gupta', role: 'analyst', badge: 'ANA-2024-023', dept: 'NCRB — Intelligence Cell' },
    ];

    for (const u of users) {
      const hash = await argon2.hash(u.password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
      await query(
        `INSERT INTO users (username, email, password_hash, full_name, role, badge_number, department)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (username) DO NOTHING`,
        [u.username, u.email, hash, u.fullName, u.role, u.badge, u.dept]
      );
    }
    console.log(`  ✅ ${users.length} users seeded`);

    // =============================================
    // 2. Seed Investigations (PostgreSQL)
    // =============================================
    console.log('🗂️ Seeding investigations...');
    const adminResult = await query("SELECT id FROM users WHERE username = 'admin'");
    const adminId = adminResult.rows[0]?.id;

    const investigations = [
      { caseNumber: 'CASE-2026-00451', title: 'Operation Northern Web — Smuggling Network Investigation', description: 'Investigation into suspected cross-state smuggling network operating through Kanpur-Mumbai-Patna corridor. Multiple persons of interest identified through CDR and financial analysis.', priority: 'critical', tags: ['smuggling', 'multi-state', 'financial-fraud'] },
      { caseNumber: 'CASE-2026-00892', title: 'Hawala Financial Network Analysis', description: 'Analysis of suspected hawala money-laundering network involving shell companies and circular transactions.', priority: 'high', tags: ['financial-fraud', 'hawala', 'money-laundering'] },
      { caseNumber: 'CASE-2026-01234', title: 'Cybercrime Extortion Ring — Digital Trail Analysis', description: 'Investigation into organized cybercrime extortion syndicate with digital footprints across multiple platforms.', priority: 'high', tags: ['cybercrime', 'extortion', 'digital'] },
    ];

    for (const inv of investigations) {
      await query(
        `INSERT INTO investigations (case_number, title, description, priority, tags, created_by, assigned_to, status)
         VALUES ($1, $2, $3, $4, $5, $6, $6, 'active')
         ON CONFLICT (case_number) DO NOTHING`,
        [inv.caseNumber, inv.title, inv.description, inv.priority, inv.tags, adminId]
      );
    }
    console.log(`  ✅ ${investigations.length} investigations seeded`);

    // =============================================
    // 3. Seed Neo4j Graph
    // =============================================
    console.log('🔵 Seeding Neo4j graph nodes...');

    // Persons
    for (const p of PERSONS) {
      await runCypherQuery(`
        MERGE (p:Person {id: $id})
        SET p.name = $name, p.alias = $alias, p.age = $age, p.gender = $gender,
            p.location = $location, p.communityId = $communityId, p.riskScore = $riskScore,
            p.centralityScore = $centralityScore, p.betweennessScore = $betweennessScore,
            p.nodeType = 'Person', p.createdAt = datetime()
      `, p);
    }
    console.log(`  ✅ ${PERSONS.length} persons seeded`);

    // Phones
    for (const ph of PHONES) {
      await runCypherQuery(`
        MERGE (ph:Phone {id: $id})
        SET ph.number = $number, ph.operator = $operator, ph.location = $location,
            ph.name = $number, ph.nodeType = 'Phone', ph.createdAt = datetime()
      `, { id: ph.id, number: ph.number, operator: ph.operator, location: ph.location });
    }
    console.log(`  ✅ ${PHONES.length} phones seeded`);

    // Vehicles
    for (const v of VEHICLES) {
      await runCypherQuery(`
        MERGE (v:Vehicle {id: $id})
        SET v.licensePlate = $licensePlate, v.type = $type, v.make = $make, v.model = $model,
            v.color = $color, v.year = $year, v.name = $licensePlate, v.nodeType = 'Vehicle',
            v.createdAt = datetime()
      `, { id: v.id, licensePlate: v.licensePlate, type: v.type, make: v.make, model: v.model, color: v.color, year: v.year });
    }
    console.log(`  ✅ ${VEHICLES.length} vehicles seeded`);

    // Organizations
    for (const o of ORGANIZATIONS) {
      await runCypherQuery(`
        MERGE (o:Organization {id: $id})
        SET o.name = $name, o.type = $type, o.location = $location,
            o.registrationNo = $registrationNo, o.communityId = $communityId,
            o.nodeType = 'Organization', o.createdAt = datetime()
      `, o);
    }
    console.log(`  ✅ ${ORGANIZATIONS.length} organizations seeded`);

    // Locations
    for (const l of LOCATIONS) {
      await runCypherQuery(`
        MERGE (l:Location {id: $id})
        SET l.name = $name, l.type = $type, l.city = $city, l.state = $state,
            l.lat = $lat, l.lon = $lon, l.nodeType = 'Location', l.createdAt = datetime()
      `, l);
    }
    console.log(`  ✅ ${LOCATIONS.length} locations seeded`);

    // Accounts
    for (const a of ACCOUNTS) {
      await runCypherQuery(`
        MERGE (a:Account {id: $id})
        SET a.accountNumber = $accountNumber, a.bank = $bank, a.accountType = $accountType,
            a.holderName = $holderName, a.balance = $balance,
            a.name = $accountNumber, a.nodeType = 'Account', a.createdAt = datetime()
      `, { id: a.id, accountNumber: a.accountNumber, bank: a.bank, accountType: a.accountType, holderName: a.holderName, balance: a.balance });
    }
    console.log(`  ✅ ${ACCOUNTS.length} accounts seeded`);

    // Cases
    for (const c of CASES) {
      await runCypherQuery(`
        MERGE (c:Case {id: $id})
        SET c.caseNumber = $caseNumber, c.title = $title, c.type = $type,
            c.status = $status, c.filingDate = $filingDate, c.filedAt = $filedAt,
            c.name = $caseNumber, c.nodeType = 'Case', c.createdAt = datetime()
      `, c);
    }
    console.log(`  ✅ ${CASES.length} cases seeded`);

    // Events
    for (const e of EVENTS) {
      await runCypherQuery(`
        MERGE (e:Event {id: $id})
        SET e.name = $name, e.description = $description, e.date = $date,
            e.eventType = $eventType, e.nodeType = 'Event', e.createdAt = datetime()
      `, { id: e.id, name: e.name, description: e.description, date: e.date, eventType: e.eventType });
    }
    console.log(`  ✅ ${EVENTS.length} events seeded`);

    // =============================================
    // 4. Seed Relationships
    // =============================================
    console.log('🔗 Seeding graph relationships...');

    // Person-Phone OWNS
    for (const ph of PHONES.filter(p => p.registeredTo)) {
      await runCypherQuery(`
        MATCH (p:Person {id: $personId}), (ph:Phone {id: $phoneId})
        MERGE (p)-[r:OWNS]->(ph)
        SET r.source = 'TELECOM-RECORDS', r.confidence = 0.99, r.timestamp = '2026-01-01T00:00:00Z',
            r.recordRef = $ref, r.evidenceId = $evdId
      `, { personId: ph.registeredTo, phoneId: ph.id, ref: `OWNS-${ph.id}`, evdId: `EVD-OWN-${ph.id}` });
    }

    // Person-Vehicle OWNS
    for (const v of VEHICLES.filter(v => v.registeredTo)) {
      await runCypherQuery(`
        MATCH (p:Person {id: $personId}), (v:Vehicle {id: $vehicleId})
        MERGE (p)-[r:OWNS]->(v)
        SET r.source = 'RTO-RECORDS', r.confidence = 0.99, r.timestamp = '2026-01-01T00:00:00Z',
            r.recordRef = $ref, r.evidenceId = $evdId
      `, { personId: v.registeredTo, vehicleId: v.id, ref: `OWNS-${v.id}`, evdId: `EVD-OWN-${v.id}` });
    }

    // Person-Organization WORKS_FOR
    const personOrgLinks = [
      { personId: 'P001', orgId: 'O001', role: 'Director' }, { personId: 'P002', orgId: 'O002', role: 'Partner' },
      { personId: 'P005', orgId: 'O003', role: 'Owner' }, { personId: 'P009', orgId: 'O004', role: 'Director' },
      { personId: 'P011', orgId: 'O005', role: 'Manager' }, { personId: 'P014', orgId: 'O006', role: 'Partner' },
      { personId: 'P016', orgId: 'O001', role: 'Employee' }, { personId: 'P024', orgId: 'O006', role: 'Associate' },
    ];

    for (const link of personOrgLinks) {
      await runCypherQuery(`
        MATCH (p:Person {id: $personId}), (o:Organization {id: $orgId})
        MERGE (p)-[r:WORKS_FOR]->(o)
        SET r.role = $role, r.source = 'COMPANY-REGISTRY', r.confidence = 0.95,
            r.timestamp = '2026-01-01T00:00:00Z', r.recordRef = $ref, r.evidenceId = $evdId
      `, { personId: link.personId, orgId: link.orgId, role: link.role, ref: `WORKS-${link.personId}-${link.orgId}`, evdId: `EVD-WF-${link.personId}` });
    }

    // Person-Account OWNS
    for (const acc of ACCOUNTS.filter(a => a.ownedBy)) {
      await runCypherQuery(`
        MATCH (p:Person {id: $personId}), (a:Account {id: $accountId})
        MERGE (p)-[r:OWNS]->(a)
        SET r.source = 'BANK-KYC', r.confidence = 0.99, r.timestamp = '2026-01-01T00:00:00Z',
            r.recordRef = $ref, r.evidenceId = $evdId
      `, { personId: acc.ownedBy, accountId: acc.id, ref: `OWNS-ACC-${acc.id}`, evdId: `EVD-OWN-ACC-${acc.id}` });
    }

    // Person-Location LOCATED_AT (from events)
    const personLocLinks = [
      { personId: 'P001', locId: 'L001', timestamp: '2026-01-14T10:00:00Z', source: 'SURV-2026-001' },
      { personId: 'P002', locId: 'L001', timestamp: '2026-01-14T10:00:00Z', source: 'SURV-2026-001' },
      { personId: 'P003', locId: 'L001', timestamp: '2026-01-14T10:00:00Z', source: 'SURV-2026-001' },
      { personId: 'P001', locId: 'L002', timestamp: '2026-02-03T18:00:00Z', source: 'SURV-2026-022' },
      { personId: 'P005', locId: 'L002', timestamp: '2026-02-03T18:00:00Z', source: 'SURV-2026-022' },
      { personId: 'P009', locId: 'L005', timestamp: '2026-03-10T09:00:00Z', source: 'SURV-2026-045' },
      { personId: 'P007', locId: 'L005', timestamp: '2026-03-10T09:00:00Z', source: 'SURV-2026-045' },
      { personId: 'P016', locId: 'L010', timestamp: '2026-03-28T20:00:00Z', source: 'SURV-2026-067' },
      { personId: 'P021', locId: 'L010', timestamp: '2026-03-28T20:00:00Z', source: 'SURV-2026-067' },
    ];

    for (const link of personLocLinks) {
      await runCypherQuery(`
        MATCH (p:Person {id: $personId}), (l:Location {id: $locId})
        MERGE (p)-[r:LOCATED_AT {timestamp: $timestamp}]->(l)
        SET r.source = $source, r.confidence = 0.85, r.recordRef = $ref, r.evidenceId = $evdId
      `, { personId: link.personId, locId: link.locId, timestamp: link.timestamp, source: link.source, ref: `LOC-${link.personId}-${link.locId}`, evdId: `EVD-LOC-${link.personId}` });
    }

    // Person-Case APPEARED_IN_CASE
    const personCaseLinks = [
      { personId: 'P001', caseId: 'CASE001', role: 'Person of Interest' },
      { personId: 'P002', caseId: 'CASE001', role: 'Person of Interest' },
      { personId: 'P003', caseId: 'CASE001', role: 'Associate' },
      { personId: 'P005', caseId: 'CASE002', role: 'Person of Interest' },
      { personId: 'P009', caseId: 'CASE002', role: 'Person of Interest' },
      { personId: 'P007', caseId: 'CASE003', role: 'Suspect' },
      { personId: 'P014', caseId: 'CASE004', role: 'Person of Interest' },
      { personId: 'P016', caseId: 'CASE001', role: 'Associate' },
    ];

    for (const link of personCaseLinks) {
      await runCypherQuery(`
        MATCH (p:Person {id: $personId}), (c:Case {id: $caseId})
        MERGE (p)-[r:APPEARED_IN_CASE]->(c)
        SET r.role = $role, r.source = 'FIR-RECORD', r.confidence = 0.90,
            r.timestamp = '2026-01-15T00:00:00Z', r.recordRef = $ref, r.evidenceId = $evdId
      `, { personId: link.personId, caseId: link.caseId, role: link.role, ref: `CASE-${link.personId}-${link.caseId}`, evdId: `EVD-CASE-${link.personId}` });
    }

    // Person-Event ATTENDED_EVENT
    const eventAttendees = [
      { personId: 'P001', eventId: 'EVT001' }, { personId: 'P002', eventId: 'EVT001' },
      { personId: 'P003', eventId: 'EVT001' }, { personId: 'P001', eventId: 'EVT002' },
      { personId: 'P005', eventId: 'EVT002' }, { personId: 'P009', eventId: 'EVT004' },
      { personId: 'P007', eventId: 'EVT004' }, { personId: 'P016', eventId: 'EVT005' },
      { personId: 'P021', eventId: 'EVT005' },
    ];

    for (const a of eventAttendees) {
      await runCypherQuery(`
        MATCH (p:Person {id: $personId}), (e:Event {id: $eventId})
        MERGE (p)-[r:ATTENDED_EVENT]->(e)
        SET r.source = 'SURVEILLANCE', r.confidence = 0.80,
            r.timestamp = '2026-01-14T10:00:00Z', r.recordRef = $ref, r.evidenceId = $evdId
      `, { personId: a.personId, eventId: a.eventId, ref: `EVT-${a.personId}-${a.eventId}`, evdId: `EVD-EVT-${a.personId}` });
    }

    // Person-Person relationships
    for (const rel of PERSON_RELATIONSHIPS) {
      await runCypherQuery(`
        MATCH (a:Person {id: $from}), (b:Person {id: $to})
        MERGE (a)-[r:${rel.type} {recordRef: $recordRef}]->(b)
        SET r.source = $source, r.confidence = $confidence, r.timestamp = $timestamp,
            r.evidenceId = $evidenceId
      `, rel);
    }
    console.log(`  ✅ ${PERSON_RELATIONSHIPS.length} person-person relationships seeded`);

    // CDR Call relationships
    for (const cdr of CDR_RECORDS) {
      await runCypherQuery(`
        MATCH (a:Person {id: $from}), (b:Person {id: $to})
        MERGE (a)-[r:${cdr.type} {recordRef: $recordRef}]->(b)
        SET r.duration = $duration, r.tower = $tower, r.source = $source,
            r.confidence = $confidence, r.timestamp = $timestamp, r.evidenceId = $recordRef
      `, cdr);

      // Also link phones
      await runCypherQuery(`
        MATCH (ph1:Phone {id: $fromPhone}), (ph2:Phone {id: $toPhone})
        MERGE (ph1)-[r:${cdr.type} {recordRef: $recordRef}]->(ph2)
        SET r.duration = $duration, r.tower = $tower, r.source = $source,
            r.confidence = $confidence, r.timestamp = $timestamp
      `, { fromPhone: cdr.phone, toPhone: cdr.toPhone, type: cdr.type, duration: cdr.duration, tower: cdr.tower, source: cdr.source, confidence: cdr.confidence, timestamp: cdr.timestamp, recordRef: cdr.recordRef });
    }
    console.log(`  ✅ ${CDR_RECORDS.length} CDR relationships seeded`);

    // Financial transaction relationships
    for (const tx of FINANCIAL_TRANSACTIONS) {
      await runCypherQuery(`
        MATCH (a:Account {id: $from}), (b:Account {id: $to})
        MERGE (a)-[r:FINANCIAL_TRANSACTION {recordRef: $ref}]->(b)
        SET r.amount = $amount, r.txType = $txType, r.timestamp = $timestamp,
            r.source = $source, r.confidence = $confidence
      `, { from: tx.from, to: tx.to, amount: tx.amount, txType: tx.txType, timestamp: tx.timestamp, source: tx.source, confidence: tx.confidence, ref: tx.ref });
    }
    console.log(`  ✅ ${FINANCIAL_TRANSACTIONS.length} financial transactions seeded`);

    // Vehicle-Location SHARED_LOCATION
    await runCypherQuery(`
      MATCH (v:Vehicle {id: 'V001'}), (l:Location {id: 'L002'})
      MERGE (v)-[r:LOCATED_AT]->(l)
      SET r.source = 'CCTV-2026-001', r.confidence = 0.75, r.timestamp = '2026-02-03T18:30:00Z', r.recordRef = 'VEH-LOC-001', r.evidenceId = 'EVD-VL-001'
    `);

    await runCypherQuery(`
      MATCH (v:Vehicle {id: 'V004'}), (l:Location {id: 'L001'})
      MERGE (v)-[r:LOCATED_AT]->(l)
      SET r.source = 'CCTV-2026-002', r.confidence = 0.82, r.timestamp = '2026-01-14T09:45:00Z', r.recordRef = 'VEH-LOC-002', r.evidenceId = 'EVD-VL-002'
    `);

    // =============================================
    // 5. Seed Alerts
    // =============================================
    console.log('⚠️ Seeding alerts...');
    const alertsSql = `
      INSERT INTO alerts (alert_type, severity, title, description, entity_id, entity_type, entity_label, evidence, is_acknowledged)
      VALUES
        ('COMMUNICATION_SPIKE', 'high', 'Unusual Communication Spike Detected', 'Entity Ravi Kumar (P009) shows 7 communication contacts within a 3-hour window on 2026-02-01 — approximately 4.2x above the 30-day baseline. Potentially unusual coordination activity.', 'P009', 'Person', 'Ravi Kumar', '[{"ref":"CDR-2026-0011","type":"CDR"},{"ref":"CDR-2026-0017","type":"CDR"}]', false),
        ('CIRCULAR_TRANSACTION', 'critical', 'Potential Circular Financial Transaction Pattern', 'Multi-hop transaction chain detected: ACC001 → ACC007 → ACC004 → ACC005 → ACC011 → ACC003 → ACC001 totaling ₹2.43M over 6 days. Pattern resembles potential fund cycling — requires investigation.', 'ACC001', 'Account', 'ACC-MH-001-2019', '[{"ref":"TXN-2026-0001","type":"BANK"},{"ref":"TXN-2026-0006","type":"BANK"}]', false),
        ('STRUCTURING_PATTERN', 'high', 'Possible Structuring Pattern — Multiple Small Deposits', 'Account ACC-DL-002-2020 shows 4 deposits of ₹85,000–₹90,000 within 3 hours on 2026-02-01. Pattern may indicate structured deposits to avoid reporting threshold.', 'ACC002', 'Account', 'ACC-DL-002-2020', '[{"ref":"TXN-2026-0007","type":"BANK"},{"ref":"TXN-2026-0010","type":"BANK"}]', false),
        ('HIGH_CENTRALITY', 'medium', 'High Network Influence Node Identified', 'Arjun Mehta (P001) identified as a high-centrality network node with 12+ direct connections spanning 3 detected communities. Network influence indicator does not imply criminal activity.', 'P001', 'Person', 'Arjun Mehta', '[{"ref":"REL-001","type":"GRAPH"},{"ref":"REL-007","type":"GRAPH"}]', false),
        ('LOCATION_OVERLAP', 'medium', 'Multiple Persons of Interest at Common Location', 'Three persons (P001, P002, P003) from separate community clusters were observed at Kanpur Central Station simultaneously on 2026-01-14. Cross-community location overlap — potential coordination.', 'L001', 'Location', 'Kanpur Central Station', '[{"ref":"SURV-2026-001","type":"SURVEILLANCE"}]', false),
        ('UNREGISTERED_PHONE', 'low', 'Unregistered Phone Linked to Person of Interest', 'Phone PH016 (7777888899, operator: Unknown) has communication links to P001 and P009 despite having no registered owner. May indicate use of prepaid/anonymous SIM.', 'PH016', 'Phone', '7777888899', '[{"ref":"CDR-2026-0020","type":"CDR"}]', false)
      ON CONFLICT DO NOTHING
    `;
    await query(alertsSql);
    console.log('  ✅ Alerts seeded');

    // =============================================
    // 6. Seed Evidence Ledger (Genesis Block)
    // =============================================
    console.log('🔒 Seeding evidence ledger (genesis block)...');
    const genesisData = {
      recordType: 'GENESIS',
      description: 'CrimeGraph AI Evidence Ledger — Genesis Block',
      systemVersion: '1.0.0',
      timestamp: new Date().toISOString(),
    };
    const genesisHash = generateEvidenceHash(genesisData);
    const ZERO_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
    
    await query(
      `INSERT INTO evidence_ledger (evidence_id, evidence_type, entity_ref, source_document, data_hash, previous_hash, block_data, is_genesis, created_by)
       VALUES ('EVD-GENESIS-001', 'genesis', null, null, $1, $2, $3, true, $4)
       ON CONFLICT (evidence_id) DO NOTHING`,
      [genesisHash, ZERO_HASH, JSON.stringify(genesisData), adminId]
    );

    // Add a few real evidence records
    const evidenceRecords = [
      { id: 'EVD-FIR-00451', type: 'fir', entityRef: 'P001', source: 'FIR-2026-00451', data: { firNumber: 'FIR-2026-00451', filedAt: 'Kanpur', date: '2026-01-15', subject: 'Suspected Smuggling Activity', entityMentioned: 'Arjun Mehta' } },
      { id: 'EVD-CDR-0001', type: 'cdr_record', entityRef: 'PH001', source: 'CDR-2026-0001', data: { caller: '9876543210', receiver: '9654321098', duration: 245, timestamp: '2026-01-10T08:23:00Z', tower: 'TOWER-MH-001' } },
      { id: 'EVD-TXN-0001', type: 'financial_record', entityRef: 'ACC001', source: 'TXN-2026-0001', data: { from: 'ACC-MH-001-2019', to: 'ACC-MH-007-2019', amount: 500000, txType: 'Wire Transfer', timestamp: '2026-01-20T10:00:00Z' } },
    ];

    let prevHash = genesisHash;
    for (const evd of evidenceRecords) {
      const dataHash = generateEvidenceHash(evd.data);
      const ts = new Date().toISOString();
      const blockHash = generateBlockHash(evd.id, dataHash, prevHash, ts);
      
      await query(
        `INSERT INTO evidence_ledger (evidence_id, evidence_type, entity_ref, source_document, data_hash, previous_hash, block_data, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (evidence_id) DO NOTHING`,
        [evd.id, evd.type, evd.entityRef, evd.source, blockHash, prevHash, JSON.stringify({ ...evd.data, timestamp: ts }), adminId]
      );
      prevHash = blockHash;
    }
    console.log('  ✅ Evidence ledger seeded');

    console.log('\n🎉 CrimeGraph AI synthetic data seed complete!');
    console.log('\n📋 Demo Credentials:');
    console.log('   Admin:       admin@crimegraph.ai / Demo@1234');
    console.log('   Senior SI:   inspector.singh@ncrb.gov.in / Demo@1234');
    console.log('   Investigator: investigator.verma@ncrb.gov.in / Demo@1234');
    console.log('   Analyst:     analyst.gupta@ncrb.gov.in / Demo@1234');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
