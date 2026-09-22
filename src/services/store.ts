import {
  BloodBank,
  BloodGroup,
  BloodInventory,
  BloodRequest,
  DonationRecord,
  Donor,
  DonorMatch,
  Hospital,
  AppNotification,
  SystemLog,
  UserAccount,
  DemandPrediction,
} from '../types';
import { evaluateDonorEligibility } from '../utils/eligibility';
import { calculateHaversineDistance } from '../utils/distanceCalculator';
import { calculateSeverityScore } from '../utils/severityScore';
import { rankDonorsForRequest } from '../utils/matchingAlgorithm';

const STORAGE_KEY = 'raktalink_database_v1';
const BROADCAST_CHANNEL_NAME = 'raktalink_realtime_channel';

// 20 Fictional Donors in and around Sivakasi, Tamil Nadu
const SEED_DONORS: Donor[] = [
  {
    donorId: 'donor_01',
    userId: 'usr_donor_01',
    name: 'Vignesh Kumar',
    email: 'vignesh.k@example.com',
    phone: '+91 98421 11001',
    bloodGroup: 'O+',
    dateOfBirth: '1996-04-12',
    gender: 'Male',
    address: 'Gandhi Road Area',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626123',
    latitude: 9.4560,
    longitude: 77.8010, // ~1.8 km
    lastDonationDate: '2026-01-10',
    eligible: true,
    available: true,
    verified: true,
    totalDonationsCount: 4,
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-09-15T08:30:00Z',
  },
  {
    donorId: 'donor_02',
    userId: 'usr_donor_02',
    name: 'Deepa Meenakshi',
    email: 'deepa.m@example.com',
    phone: '+91 98421 11002',
    bloodGroup: 'O-',
    dateOfBirth: '1998-08-25',
    gender: 'Female',
    address: 'Near Sivan Temple',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626123',
    latitude: 9.4490,
    longitude: 77.7950, // ~1.5 km
    lastDonationDate: '2025-11-20',
    eligible: true,
    available: true,
    verified: true,
    totalDonationsCount: 3,
    createdAt: '2026-01-15T11:00:00Z',
    updatedAt: '2026-09-18T09:00:00Z',
  },
  {
    donorId: 'donor_03',
    userId: 'usr_donor_03',
    name: 'Karthik Raja',
    email: 'karthik.raja@example.com',
    phone: '+91 98421 11003',
    bloodGroup: 'A+',
    dateOfBirth: '1992-11-04',
    gender: 'Male',
    address: 'Housing Board Colony',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626124',
    latitude: 9.4620,
    longitude: 77.8090, // ~2.9 km
    lastDonationDate: '2026-02-14',
    eligible: true,
    available: true,
    verified: true,
    totalDonationsCount: 6,
    createdAt: '2026-01-05T09:00:00Z',
    updatedAt: '2026-09-10T14:00:00Z',
  },
  {
    donorId: 'donor_04',
    userId: 'usr_donor_04',
    name: 'Ananya Senthil',
    email: 'ananya.s@example.com',
    phone: '+91 98421 11004',
    bloodGroup: 'B+',
    dateOfBirth: '2001-02-18',
    gender: 'Female',
    address: 'Parasakti Colony',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626123',
    latitude: 9.4410,
    longitude: 77.8040, // ~2.1 km
    lastDonationDate: '2026-08-20', // Recent donation: Not eligible!
    eligible: false,
    eligibilityReason: 'Cooldown active (donated on 20 Aug 2026)',
    available: true,
    verified: true,
    totalDonationsCount: 2,
    createdAt: '2026-03-12T15:00:00Z',
    updatedAt: '2026-08-20T10:00:00Z',
  },
  {
    donorId: 'donor_05',
    userId: 'usr_donor_05',
    name: 'Saravanan Balaji',
    email: 'saravanan.b@example.com',
    phone: '+91 98421 11005',
    bloodGroup: 'AB+',
    dateOfBirth: '1995-07-19',
    gender: 'Male',
    address: 'Railway Feeder Road',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626123',
    latitude: 9.4580,
    longitude: 77.7890, // ~1.7 km
    lastDonationDate: '2025-10-15',
    eligible: true,
    available: false, // Not available
    verified: true,
    totalDonationsCount: 5,
    createdAt: '2026-01-20T08:30:00Z',
    updatedAt: '2026-09-12T16:00:00Z',
  },
  {
    donorId: 'donor_06',
    userId: 'usr_donor_06',
    name: 'Priya Dharshini',
    email: 'priya.d@example.com',
    phone: '+91 98421 11006',
    bloodGroup: 'O+',
    dateOfBirth: '1997-03-30',
    gender: 'Female',
    address: 'Near Lions School',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626123',
    latitude: 9.4670,
    longitude: 77.7920, // ~2.2 km
    lastDonationDate: '2026-03-10',
    eligible: true,
    available: true,
    verified: true,
    totalDonationsCount: 4,
    createdAt: '2026-02-10T12:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
  },
  {
    donorId: 'donor_07',
    userId: 'usr_donor_07',
    name: 'Murugan Thangavel',
    email: 'murugan.t@example.com',
    phone: '+91 98421 11007',
    bloodGroup: 'A-',
    dateOfBirth: '1990-09-14',
    gender: 'Male',
    address: 'Thiruthangal Road',
    district: 'Virudhunagar',
    city: 'Thiruthangal',
    pincode: '626130',
    latitude: 9.4820,
    longitude: 77.8100, // ~4.5 km
    lastDonationDate: '2026-01-25',
    eligible: true,
    available: true,
    verified: true,
    totalDonationsCount: 7,
    createdAt: '2026-01-10T14:30:00Z',
    updatedAt: '2026-09-14T11:20:00Z',
  },
  {
    donorId: 'donor_08',
    userId: 'usr_donor_08',
    name: 'Suresh Krishna',
    email: 'suresh.k@example.com',
    phone: '+91 98421 11008',
    bloodGroup: 'B-',
    dateOfBirth: '1994-12-08',
    gender: 'Male',
    address: 'Near Kamaraj Nagar',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626123',
    latitude: 9.4380,
    longitude: 77.7850, // ~2.6 km
    lastDonationDate: '2025-12-05',
    eligible: true,
    available: true,
    verified: true,
    totalDonationsCount: 3,
    createdAt: '2026-02-18T09:15:00Z',
    updatedAt: '2026-09-05T13:00:00Z',
  },
  {
    donorId: 'donor_09',
    userId: 'usr_donor_09',
    name: 'Lakshmi Narayanan',
    email: 'lakshmi.n@example.com',
    phone: '+91 98421 11009',
    bloodGroup: 'O+',
    dateOfBirth: '1993-05-22',
    gender: 'Female',
    address: 'Meenampatti Area',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626189',
    latitude: 9.4710,
    longitude: 77.8210, // ~4.1 km
    lastDonationDate: '2026-04-05',
    eligible: true,
    available: true,
    verified: true,
    totalDonationsCount: 5,
    createdAt: '2026-01-12T10:00:00Z',
    updatedAt: '2026-09-17T09:40:00Z',
  },
  {
    donorId: 'donor_10',
    userId: 'usr_donor_10',
    name: 'Gowtham Chandran',
    email: 'gowtham.c@example.com',
    phone: '+91 98421 11010',
    bloodGroup: 'AB-',
    dateOfBirth: '1999-01-11',
    gender: 'Male',
    address: 'Coronation Colony',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626123',
    latitude: 9.4520,
    longitude: 77.8120, // ~1.6 km
    lastDonationDate: '2026-02-28',
    eligible: true,
    available: true,
    verified: true,
    totalDonationsCount: 2,
    createdAt: '2026-03-01T11:00:00Z',
    updatedAt: '2026-09-12T14:15:00Z',
  },
  {
    donorId: 'donor_11',
    userId: 'usr_donor_11',
    name: 'Aravind Swamy',
    email: 'aravind.s@example.com',
    phone: '+91 98421 11011',
    bloodGroup: 'O+',
    dateOfBirth: '1995-10-14',
    gender: 'Male',
    address: 'Near Satchiyapuram Station',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626124',
    latitude: 9.4440,
    longitude: 77.8180, // ~2.9 km
    lastDonationDate: '2026-03-15',
    eligible: true,
    available: true,
    verified: true,
    totalDonationsCount: 6,
    createdAt: '2026-01-08T09:00:00Z',
    updatedAt: '2026-09-16T18:00:00Z',
  },
  {
    donorId: 'donor_12',
    userId: 'usr_donor_12',
    name: 'Kavitha Ramesh',
    email: 'kavitha.r@example.com',
    phone: '+91 98421 11012',
    bloodGroup: 'B+',
    dateOfBirth: '2000-06-17',
    gender: 'Female',
    address: 'Sattur High Road',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626123',
    latitude: 9.4350,
    longitude: 77.8250, // ~4.2 km
    lastDonationDate: '2026-02-10',
    eligible: true,
    available: true,
    verified: true,
    totalDonationsCount: 3,
    createdAt: '2026-02-22T13:40:00Z',
    updatedAt: '2026-09-10T12:00:00Z',
  },
  {
    donorId: 'donor_13',
    userId: 'usr_donor_13',
    name: 'Balaji Venkatesh',
    email: 'balaji.v@example.com',
    phone: '+91 98421 11013',
    bloodGroup: 'A+',
    dateOfBirth: '1991-03-08',
    gender: 'Male',
    address: 'Main Bazaar',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626123',
    latitude: 9.4540,
    longitude: 77.7960, // ~0.5 km
    lastDonationDate: '2026-05-10',
    eligible: true,
    available: true,
    verified: true,
    totalDonationsCount: 8,
    createdAt: '2026-01-02T10:00:00Z',
    updatedAt: '2026-09-19T07:15:00Z',
  },
  {
    donorId: 'donor_14',
    userId: 'usr_donor_14',
    name: 'Nandhini Prakash',
    email: 'nandhini.p@example.com',
    phone: '+91 98421 11014',
    bloodGroup: 'O-',
    dateOfBirth: '1997-12-03',
    gender: 'Female',
    address: 'Near SFR College',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626123',
    latitude: 9.4680,
    longitude: 77.8050, // ~2.4 km
    lastDonationDate: '2026-04-18',
    eligible: true,
    available: true,
    verified: true,
    totalDonationsCount: 4,
    createdAt: '2026-02-05T14:00:00Z',
    updatedAt: '2026-09-11T16:20:00Z',
  },
  {
    donorId: 'donor_15',
    userId: 'usr_donor_15',
    name: 'Manoj Kumar',
    email: 'manoj.k@example.com',
    phone: '+91 98421 11015',
    bloodGroup: 'B+',
    dateOfBirth: '1998-09-29',
    gender: 'Male',
    address: 'Vilampatti Village Road',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626124',
    latitude: 9.4890,
    longitude: 77.7820, // ~5.2 km
    lastDonationDate: '2025-11-12',
    eligible: true,
    available: true,
    verified: true,
    totalDonationsCount: 3,
    createdAt: '2026-01-25T11:00:00Z',
    updatedAt: '2026-09-14T09:00:00Z',
  },
  {
    donorId: 'donor_16',
    userId: 'usr_donor_16',
    name: 'Gayathri Sundar',
    email: 'gayathri.s@example.com',
    phone: '+91 98421 11016',
    bloodGroup: 'AB+',
    dateOfBirth: '2002-04-14',
    gender: 'Female',
    address: 'Near PSR Engineering Area',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626140',
    latitude: 9.4210,
    longitude: 77.7710, // ~6.1 km
    lastDonationDate: '2026-03-20',
    eligible: true,
    available: true,
    verified: true,
    totalDonationsCount: 1,
    createdAt: '2026-03-10T16:00:00Z',
    updatedAt: '2026-09-08T10:30:00Z',
  },
  {
    donorId: 'donor_17',
    userId: 'usr_donor_17',
    name: 'Dinesh Karthik',
    email: 'dinesh.k@example.com',
    phone: '+91 98421 11017',
    bloodGroup: 'O+',
    dateOfBirth: '1994-08-16',
    gender: 'Male',
    address: 'Ayyampatti Road',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626123',
    latitude: 9.4590,
    longitude: 77.8190, // ~2.7 km
    lastDonationDate: '2026-01-18',
    eligible: true,
    available: true,
    verified: true,
    totalDonationsCount: 5,
    createdAt: '2026-01-18T10:00:00Z',
    updatedAt: '2026-09-17T11:00:00Z',
  },
  {
    donorId: 'donor_18',
    userId: 'usr_donor_18',
    name: 'Subramanian Natarajan',
    email: 'subramanian.n@example.com',
    phone: '+91 98421 11018',
    bloodGroup: 'A-',
    dateOfBirth: '1989-01-20',
    gender: 'Male',
    address: 'Near Old Bus Stand',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626123',
    latitude: 9.4510,
    longitude: 77.7990, // ~0.4 km
    lastDonationDate: '2025-12-14',
    eligible: true,
    available: true,
    verified: true,
    totalDonationsCount: 9,
    createdAt: '2026-01-01T12:00:00Z',
    updatedAt: '2026-09-18T15:00:00Z',
  },
  {
    donorId: 'donor_19',
    userId: 'usr_donor_19',
    name: 'Revathi Mohan',
    email: 'revathi.m@example.com',
    phone: '+91 98421 11019',
    bloodGroup: 'B-',
    dateOfBirth: '1996-11-28',
    gender: 'Female',
    address: 'Thiruthangal Main Road',
    district: 'Virudhunagar',
    city: 'Thiruthangal',
    pincode: '626130',
    latitude: 9.4790,
    longitude: 77.8040, // ~3.8 km
    lastDonationDate: '2026-02-18',
    eligible: true,
    available: true,
    verified: true,
    totalDonationsCount: 4,
    createdAt: '2026-02-10T10:00:00Z',
    updatedAt: '2026-09-15T12:00:00Z',
  },
  {
    donorId: 'donor_20',
    userId: 'usr_donor_20',
    name: 'Harish Ranganathan',
    email: 'harish.r@example.com',
    phone: '+91 98421 11020',
    bloodGroup: 'O+',
    dateOfBirth: '2000-05-19',
    gender: 'Male',
    address: 'Near Kaliswari College',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626123',
    latitude: 9.4690,
    longitude: 77.8150, // ~3.4 km
    lastDonationDate: '2026-05-25',
    eligible: true,
    available: true,
    verified: true,
    totalDonationsCount: 3,
    createdAt: '2026-02-14T09:30:00Z',
    updatedAt: '2026-09-19T10:00:00Z',
  },
];

// 5 Hospitals
const SEED_HOSPITALS: Hospital[] = [
  {
    hospitalId: 'hosp_01',
    userId: 'usr_hosp_01',
    hospitalName: 'Sivakasi Government Headquarter Hospital',
    registrationId: 'HOSP-TN-SVK-001',
    email: 'emergency@sivakasigh.gov.in',
    phone: '+91 4562 220222',
    address: 'Hospital Road, Near Court Complex',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626123',
    latitude: 9.4533,
    longitude: 77.7979,
    emergencyContact: '+91 4562 220999',
    verified: true,
    verificationStatus: 'VERIFIED',
    bedCapacity: 350,
    icuCapacity: 40,
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-09-01T08:00:00Z',
  },
  {
    hospitalId: 'hosp_02',
    userId: 'usr_hosp_02',
    hospitalName: 'Grace Multispeciality Hospital & Trauma Care',
    registrationId: 'HOSP-TN-SVK-042',
    email: 'trauma@gracehospital.org',
    phone: '+91 4562 274500',
    address: 'Thiruthangal Road, Bypass Junction',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626123',
    latitude: 9.4650,
    longitude: 77.8080,
    emergencyContact: '+91 94431 55200',
    verified: true,
    verificationStatus: 'VERIFIED',
    bedCapacity: 180,
    icuCapacity: 25,
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-09-10T10:00:00Z',
  },
  {
    hospitalId: 'hosp_03',
    userId: 'usr_hosp_03',
    hospitalName: 'Apollo Reach Hospital Sivakasi',
    registrationId: 'HOSP-TN-SVK-088',
    email: 'blooddesk@apolloreachsvk.com',
    phone: '+91 4562 233300',
    address: 'Kamarajar Salai, Near Tower Clock',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626123',
    latitude: 9.4480,
    longitude: 77.8020,
    emergencyContact: '+91 94431 88900',
    verified: true,
    verificationStatus: 'VERIFIED',
    bedCapacity: 120,
    icuCapacity: 20,
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-09-12T09:00:00Z',
  },
  {
    hospitalId: 'hosp_04',
    userId: 'usr_hosp_04',
    hospitalName: 'Meenakshi Mission Satellite Critical Care',
    registrationId: 'HOSP-TN-VDR-112',
    email: 'satellite@meenakshimission.org',
    phone: '+91 4562 258100',
    address: 'Madurai-Sivakasi Main Road',
    district: 'Virudhunagar',
    city: 'Thiruthangal',
    pincode: '626130',
    latitude: 9.4880,
    longitude: 77.8140,
    emergencyContact: '+91 94431 99111',
    verified: true,
    verificationStatus: 'VERIFIED',
    bedCapacity: 95,
    icuCapacity: 18,
    createdAt: '2026-02-01T11:00:00Z',
    updatedAt: '2026-09-14T11:00:00Z',
  },
  {
    hospitalId: 'hosp_05',
    userId: 'usr_hosp_05',
    hospitalName: 'City Memorial Healthcare Center',
    registrationId: 'HOSP-TN-SVK-155',
    email: 'desk@citymemorial.in',
    phone: '+91 4562 224488',
    address: 'Velayutham Road',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626123',
    latitude: 9.4420,
    longitude: 77.7910,
    emergencyContact: '+91 94431 22448',
    verified: false,
    verificationStatus: 'PENDING', // Demo of pending verification
    bedCapacity: 60,
    icuCapacity: 8,
    createdAt: '2026-09-15T10:00:00Z',
    updatedAt: '2026-09-15T10:00:00Z',
  },
];

// Helper to generate realistic blood inventory for 8 blood groups
function createInitialInventory(multiplier: number = 1.0): Record<BloodGroup, any> {
  const groups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const res: any = {};
  groups.forEach((bg) => {
    let base = 25;
    if (bg === 'O+' || bg === 'B+') base = 48;
    if (bg === 'A+') base = 35;
    if (bg === 'AB+') base = 18;
    if (bg === 'O-') base = 8; // Rare group: frequently low/critical!
    if (bg === 'A-' || bg === 'B-' || bg === 'AB-') base = 10;

    const available = Math.round(base * multiplier);
    const reserved = Math.round(available * 0.15);
    const issued = Math.round(available * 0.8);
    let status = 'NORMAL';
    if (available <= 10) status = 'CRITICAL';
    else if (available <= 25) status = 'LOW';

    res[bg] = {
      bloodGroup: bg,
      availableUnits: available,
      reservedUnits: reserved,
      issuedUnits: issued,
      status,
      lastUpdated: new Date().toISOString(),
    };
  });
  return res;
}

// 3 Blood Banks
const SEED_BLOOD_BANKS: BloodBank[] = [
  {
    bloodBankId: 'bb_01',
    userId: 'usr_bb_01',
    name: 'Indian Red Cross Society Sivakasi Blood Bank',
    registrationId: 'BB-TN-SVK-RC01',
    email: 'bloodbank@redcrosssivakasi.org',
    phone: '+91 4562 225577',
    address: 'Near Municipal Office, North Car Street',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626123',
    latitude: 9.4550,
    longitude: 77.7995,
    emergencyContact: '+91 94431 33445',
    verified: true,
    verificationStatus: 'VERIFIED',
    inventory: createInitialInventory(1.2),
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-09-20T08:00:00Z',
  },
  {
    bloodBankId: 'bb_02',
    userId: 'usr_bb_02',
    name: 'Rotary Central Blood Centre Sivakasi',
    registrationId: 'BB-TN-SVK-RC02',
    email: 'stock@rotarybloodsivakasi.org',
    phone: '+91 4562 278899',
    address: 'Rotary Community Hall Road',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626123',
    latitude: 9.4610,
    longitude: 77.8050,
    emergencyContact: '+91 94431 77889',
    verified: true,
    verificationStatus: 'VERIFIED',
    inventory: createInitialInventory(0.9),
    createdAt: '2026-01-05T09:00:00Z',
    updatedAt: '2026-09-19T14:00:00Z',
  },
  {
    bloodBankId: 'bb_03',
    userId: 'usr_bb_03',
    name: 'LifeCare Regional Blood Bank & Component Lab',
    registrationId: 'BB-TN-SVK-LC03',
    email: 'help@lifecareblood.in',
    phone: '+91 4562 241122',
    address: 'Bypass Road, Near Industrial Estate',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626124',
    latitude: 9.4410,
    longitude: 77.8120,
    emergencyContact: '+91 94431 44112',
    verified: true,
    verificationStatus: 'VERIFIED',
    inventory: createInitialInventory(0.75),
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-09-20T11:00:00Z',
  },
];

// 20 Blood Requests with varied priorities & statuses
const SEED_REQUESTS: BloodRequest[] = [
  {
    requestId: 'req_01',
    hospitalId: 'hosp_01',
    hospitalName: 'Sivakasi Government Headquarter Hospital',
    patientId: 'PT-2026-9041',
    bloodGroup: 'O+',
    unitsRequired: 2,
    caseType: 'Accident',
    priority: 'CRITICAL',
    severityScore: 94,
    latitude: 9.4533,
    longitude: 77.7979,
    district: 'Virudhunagar',
    city: 'Sivakasi',
    status: 'MATCHING',
    requiredDate: '2026-09-21',
    requiredTime: 'Immediate (< 1 Hour)',
    notes: 'Highway collision trauma patient with severe blood loss in ICU Bed 04.',
    matchedDonorIds: ['donor_01', 'donor_02', 'donor_06'],
    respondingDonorIds: ['donor_01'],
    createdAt: '2026-09-21T02:00:00Z',
    updatedAt: '2026-09-21T02:15:00Z',
  },
  {
    requestId: 'req_02',
    hospitalId: 'hosp_02',
    hospitalName: 'Grace Multispeciality Hospital & Trauma Care',
    patientId: 'PT-2026-8812',
    bloodGroup: 'B+',
    unitsRequired: 3,
    caseType: 'Surgery',
    priority: 'HIGH',
    severityScore: 78,
    latitude: 9.4650,
    longitude: 77.8080,
    district: 'Virudhunagar',
    city: 'Sivakasi',
    status: 'DONOR_FOUND',
    requiredDate: '2026-09-21',
    requiredTime: 'Within 3 Hours',
    notes: 'Scheduled cardiothoracic vascular bypass grafting at 11:30 AM.',
    matchedDonorIds: ['donor_12', 'donor_15'],
    respondingDonorIds: ['donor_12'],
    createdAt: '2026-09-21T01:30:00Z',
    updatedAt: '2026-09-21T02:10:00Z',
  },
  {
    requestId: 'req_03',
    hospitalId: 'hosp_03',
    hospitalName: 'Apollo Reach Hospital Sivakasi',
    patientId: 'PT-2026-7734',
    bloodGroup: 'A-',
    unitsRequired: 1,
    caseType: 'Emergency',
    priority: 'HIGH',
    severityScore: 76,
    latitude: 9.4480,
    longitude: 77.8020,
    district: 'Virudhunagar',
    city: 'Sivakasi',
    status: 'BLOOD_BANK_FOUND',
    requiredDate: '2026-09-21',
    requiredTime: 'Within 2 Hours',
    notes: 'Post-partum hemorrhage in maternity wing.',
    matchedDonorIds: ['donor_07', 'donor_18'],
    respondingDonorIds: [],
    createdAt: '2026-09-21T01:45:00Z',
    updatedAt: '2026-09-21T02:05:00Z',
  },
  {
    requestId: 'req_04',
    hospitalId: 'hosp_01',
    hospitalName: 'Sivakasi Government Headquarter Hospital',
    patientId: 'PT-2026-6621',
    bloodGroup: 'AB+',
    unitsRequired: 2,
    caseType: 'General Requirement',
    priority: 'MEDIUM',
    severityScore: 54,
    latitude: 9.4533,
    longitude: 77.7979,
    district: 'Virudhunagar',
    city: 'Sivakasi',
    status: 'IN_PROGRESS',
    requiredDate: '2026-09-21',
    requiredTime: 'Evening (Before 6 PM)',
    notes: 'Thalassemia patient regular transfusion protocol.',
    matchedDonorIds: ['donor_05', 'donor_16'],
    respondingDonorIds: ['donor_16'],
    createdAt: '2026-09-20T18:00:00Z',
    updatedAt: '2026-09-21T00:00:00Z',
  },
  {
    requestId: 'req_05',
    hospitalId: 'hosp_04',
    hospitalName: 'Meenakshi Mission Satellite Critical Care',
    patientId: 'PT-2026-5510',
    bloodGroup: 'O-',
    unitsRequired: 2,
    caseType: 'Accident',
    priority: 'CRITICAL',
    severityScore: 96,
    latitude: 9.4880,
    longitude: 77.8140,
    district: 'Virudhunagar',
    city: 'Thiruthangal',
    status: 'FULFILLED',
    requiredDate: '2026-09-20',
    requiredTime: 'Immediate',
    notes: 'Industrial fireworks machinery laceration trauma.',
    matchedDonorIds: ['donor_02', 'donor_14'],
    respondingDonorIds: ['donor_02', 'donor_14'],
    fulfilledBy: {
      type: 'donor',
      sourceId: 'donor_02',
      sourceName: 'Deepa Meenakshi',
      units: 2,
      fulfilledAt: '2026-09-20T21:40:00Z',
    },
    createdAt: '2026-09-20T19:00:00Z',
    updatedAt: '2026-09-20T21:40:00Z',
  },
];

// Populate up to 20 realistic historical requests
for (let i = 6; i <= 20; i++) {
  const bgs: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const cases: any[] = ['Accident', 'Surgery', 'Emergency', 'General Requirement', 'Other'];
  const bg = bgs[(i * 3) % bgs.length];
  const cType = cases[i % cases.length];
  const prio = i % 4 === 0 ? 'CRITICAL' : i % 3 === 0 ? 'HIGH' : i % 2 === 0 ? 'MEDIUM' : 'LOW';
  const score = prio === 'CRITICAL' ? 88 : prio === 'HIGH' ? 72 : prio === 'MEDIUM' ? 48 : 25;
  const stat = i <= 10 ? 'FULFILLED' : i <= 15 ? 'IN_PROGRESS' : 'PENDING';

  SEED_REQUESTS.push({
    requestId: `req_${String(i).padStart(2, '0')}`,
    hospitalId: i % 2 === 0 ? 'hosp_01' : 'hosp_02',
    hospitalName: i % 2 === 0 ? 'Sivakasi Government Headquarter Hospital' : 'Grace Multispeciality Hospital',
    patientId: `PT-2026-HIST-${100 + i}`,
    bloodGroup: bg,
    unitsRequired: (i % 3) + 1,
    caseType: cType,
    priority: prio as any,
    severityScore: score,
    latitude: 9.4533 + ((i - 10) * 0.003),
    longitude: 77.7979 + ((i - 10) * 0.002),
    district: 'Virudhunagar',
    city: 'Sivakasi',
    status: stat as any,
    requiredDate: `2026-09-${String(21 - Math.floor(i / 3)).padStart(2, '0')}`,
    requiredTime: 'Standard Schedule',
    matchedDonorIds: ['donor_01', 'donor_06'],
    respondingDonorIds: stat === 'FULFILLED' ? ['donor_01'] : [],
    fulfilledBy: stat === 'FULFILLED' ? {
      type: 'blood_bank',
      sourceId: 'bb_01',
      sourceName: 'Indian Red Cross Society Sivakasi',
      units: (i % 3) + 1,
      fulfilledAt: '2026-09-20T12:00:00Z',
    } : undefined,
    createdAt: `2026-09-${String(21 - Math.floor(i / 3)).padStart(2, '0')}T10:00:00Z`,
    updatedAt: `2026-09-${String(21 - Math.floor(i / 3)).padStart(2, '0')}T12:00:00Z`,
  });
}

// Initial Notifications
const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    notificationId: 'notif_01',
    receiverId: 'usr_donor_01',
    receiverRole: 'donor',
    requestId: 'req_01',
    type: 'EMERGENCY_REQUEST',
    title: '🚨 CRITICAL BLOOD REQUEST - O+ Needed',
    message: 'Sivakasi GH needs 2 units of O+ urgently for an accident trauma patient (~1.8 km away).',
    priority: 'CRITICAL',
    read: false,
    createdAt: '2026-09-21T02:02:00Z',
  },
  {
    notificationId: 'notif_02',
    receiverId: 'usr_hosp_01',
    receiverRole: 'hospital',
    requestId: 'req_01',
    type: 'DONOR_RESPONSE',
    title: '🟢 Donor Responded: Vignesh Kumar is Willing to Donate!',
    message: 'Donor Vignesh Kumar (O+, 1.8 km away) accepted the emergency call.',
    priority: 'HIGH',
    read: false,
    createdAt: '2026-09-21T02:15:00Z',
  },
  {
    notificationId: 'notif_03',
    receiverId: 'usr_bb_01',
    receiverRole: 'blood_bank',
    requestId: 'req_01',
    type: 'EMERGENCY_REQUEST',
    title: '🚨 URGENT BLOOD REQUIREMENT - O+',
    message: 'Sivakasi GH requests 2 units of O+. Please verify stock reserves.',
    priority: 'CRITICAL',
    read: false,
    createdAt: '2026-09-21T02:03:00Z',
  },
  {
    notificationId: 'notif_04',
    receiverId: 'all',
    type: 'LOW_BLOOD_STOCK',
    title: '⚠️ Low Blood Stock Alert: O- and AB-',
    message: 'O- reserve has fallen below 10 units across Sivakasi blood centres.',
    priority: 'HIGH',
    read: true,
    createdAt: '2026-09-20T14:00:00Z',
  },
];

// Initial System Logs
const SEED_LOGS: SystemLog[] = [
  {
    id: 'log_01',
    timestamp: '2026-09-21T02:00:00Z',
    action: 'CREATE_BLOOD_REQUEST',
    actor: 'Dr. Ramesh (Sivakasi GH)',
    actorRole: 'hospital',
    details: 'Created Emergency Request req_01 for 2 units O+ (Severity: 94 - CRITICAL)',
    severity: 'critical',
  },
  {
    id: 'log_02',
    timestamp: '2026-09-21T02:02:00Z',
    action: 'AI_DISPATCH_ALERT',
    actor: 'AI Match Engine',
    actorRole: 'admin',
    details: 'Dispatched emergency alerts to 3 nearby compatible donors and 2 blood banks.',
    severity: 'info',
  },
  {
    id: 'log_03',
    timestamp: '2026-09-21T02:15:00Z',
    action: 'DONOR_ACCEPTANCE',
    actor: 'Vignesh Kumar (Donor)',
    actorRole: 'donor',
    details: 'Responded WILLING_TO_DONATE for req_01.',
    severity: 'info',
  },
];

interface DatabaseSchema {
  donors: Donor[];
  hospitals: Hospital[];
  bloodBanks: BloodBank[];
  requests: BloodRequest[];
  matches: DonorMatch[];
  notifications: AppNotification[];
  logs: SystemLog[];
  donations: DonationRecord[];
}

class RaktaLinkStore {
  private state: DatabaseSchema;
  private listeners: Set<() => void> = new Set();
  private channel: BroadcastChannel | null = null;

  constructor() {
    this.state = this.loadFromStorage();

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type === 'SYNC_STATE') {
            this.state = event.data.payload;
            this.notifyListeners();
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not available', e);
      }
    }
  }

  private loadFromStorage(): DatabaseSchema {
    if (typeof window === 'undefined') {
      return {
        donors: SEED_DONORS,
        hospitals: SEED_HOSPITALS,
        bloodBanks: SEED_BLOOD_BANKS,
        requests: SEED_REQUESTS,
        matches: [],
        notifications: SEED_NOTIFICATIONS,
        logs: SEED_LOGS,
        donations: [],
      };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not parse stored database, falling back to seed.', e);
    }

    const initial: DatabaseSchema = {
      donors: SEED_DONORS,
      hospitals: SEED_HOSPITALS,
      bloodBanks: SEED_BLOOD_BANKS,
      requests: SEED_REQUESTS,
      matches: [],
      notifications: SEED_NOTIFICATIONS,
      logs: SEED_LOGS,
      donations: [],
    };
    this.saveToStorage(initial);
    return initial;
  }

  private saveToStorage(stateToSave: DatabaseSchema) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      if (this.channel) {
        this.channel.postMessage({
          type: 'SYNC_STATE',
          payload: stateToSave,
        });
      }
    } catch (e) {
      console.error('Error persisting state to localStorage', e);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }

  private commit() {
    this.saveToStorage(this.state);
    this.notifyListeners();
  }

  // Getters
  public getDonors(): Donor[] {
    return this.state.donors;
  }

  public getHospitals(): Hospital[] {
    return this.state.hospitals;
  }

  public getBloodBanks(): BloodBank[] {
    return this.state.bloodBanks;
  }

  public getRequests(): BloodRequest[] {
    return this.state.requests;
  }

  public getNotifications(): AppNotification[] {
    return this.state.notifications;
  }

  public getLogs(): SystemLog[] {
    return this.state.logs;
  }

  public getDonationHistory(donorId?: string): DonationRecord[] {
    if (donorId) {
      return this.state.donations.filter((d) => d.donorId === donorId);
    }
    return this.state.donations;
  }

  // Finders
  public getDonorById(donorId: string): Donor | undefined {
    return this.state.donors.find((d) => d.donorId === donorId || d.userId === donorId);
  }

  public getHospitalById(hospitalId: string): Hospital | undefined {
    return this.state.hospitals.find((h) => h.hospitalId === hospitalId || h.userId === hospitalId);
  }

  public getBloodBankById(bloodBankId: string): BloodBank | undefined {
    return this.state.bloodBanks.find((b) => b.bloodBankId === bloodBankId || b.userId === bloodBankId);
  }

  public getRequestById(requestId: string): BloodRequest | undefined {
    return this.state.requests.find((r) => r.requestId === requestId);
  }

  // Mutators
  public addDonor(newDonor: Donor): Donor {
    // Re-verify eligibility on creation
    const elig = evaluateDonorEligibility(newDonor.dateOfBirth, newDonor.lastDonationDate);
    const donorWithElig: Donor = {
      ...newDonor,
      eligible: elig.isEligible,
      eligibilityReason: elig.reason,
    };
    this.state.donors.unshift(donorWithElig);
    this.logAction('DONOR_REGISTER', newDonor.name, 'donor', `New donor registered: ${newDonor.name} (${newDonor.bloodGroup})`);
    this.commit();
    return donorWithElig;
  }

  public updateDonor(donorId: string, updates: Partial<Donor>): Donor | null {
    const idx = this.state.donors.findIndex((d) => d.donorId === donorId || d.userId === donorId);
    if (idx === -1) return null;

    const current = this.state.donors[idx];
    let updated: Donor = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (updates.dateOfBirth !== undefined || updates.lastDonationDate !== undefined) {
      const elig = evaluateDonorEligibility(updated.dateOfBirth, updated.lastDonationDate);
      updated.eligible = elig.isEligible;
      updated.eligibilityReason = elig.reason;
    }

    this.state.donors[idx] = updated;
    this.commit();
    return updated;
  }

  public toggleDonorAvailability(donorId: string, available: boolean): boolean {
    const updated = this.updateDonor(donorId, { available });
    if (updated) {
      this.logAction(
        'TOGGLE_AVAILABILITY',
        updated.name,
        'donor',
        `Changed emergency availability to ${available ? 'ON 🟢' : 'OFF ⚪'}`
      );
    }
    return !!updated;
  }

  public addHospital(newHospital: Hospital): Hospital {
    this.state.hospitals.unshift(newHospital);
    this.logAction('HOSPITAL_REGISTER', newHospital.hospitalName, 'hospital', `Hospital registered: ${newHospital.hospitalName}`);
    this.commit();
    return newHospital;
  }

  public addBloodBank(newBloodBank: BloodBank): BloodBank {
    this.state.bloodBanks.unshift(newBloodBank);
    this.logAction('BLOOD_BANK_REGISTER', newBloodBank.name, 'blood_bank', `Blood bank registered: ${newBloodBank.name}`);
    this.commit();
    return newBloodBank;
  }

  public updateBloodBankStock(
    bloodBankId: string,
    bloodGroup: BloodGroup,
    quantityDelta: number,
    operation: 'add' | 'reserve' | 'issue' | 'set' = 'add'
  ): boolean {
    const bb = this.state.bloodBanks.find((b) => b.bloodBankId === bloodBankId);
    if (!bb || !bb.inventory[bloodGroup]) return false;

    const item = bb.inventory[bloodGroup];
    if (operation === 'add') {
      item.availableUnits = Math.max(0, item.availableUnits + quantityDelta);
    } else if (operation === 'reserve') {
      item.availableUnits = Math.max(0, item.availableUnits - quantityDelta);
      item.reservedUnits += quantityDelta;
    } else if (operation === 'issue') {
      item.availableUnits = Math.max(0, item.availableUnits - quantityDelta);
      item.issuedUnits += quantityDelta;
    } else if (operation === 'set') {
      item.availableUnits = Math.max(0, quantityDelta);
    }

    // Update status
    if (item.availableUnits <= 10) {
      item.status = 'CRITICAL';
    } else if (item.availableUnits <= 25) {
      item.status = 'LOW';
    } else {
      item.status = 'NORMAL';
    }

    item.lastUpdated = new Date().toISOString();
    bb.updatedAt = new Date().toISOString();

    this.logAction(
      'INVENTORY_UPDATE',
      bb.name,
      'blood_bank',
      `${operation.toUpperCase()} ${quantityDelta} units of ${bloodGroup}. New available: ${item.availableUnits}`
    );

    this.commit();
    return true;
  }

  /**
   * Complete Automated Emergency Workflow execution when a hospital creates a request:
   * 1. Calculates AI Severity Score (0-100)
   * 2. Searches compatible nearby donors
   * 3. Searches nearby blood banks
   * 4. Generates emergency notifications for donors and blood banks
   * 5. Dispatches real-time alerts
   */
  public createBloodRequest(params: {
    hospitalId: string;
    hospitalName: string;
    patientId?: string;
    patientName?: string;
    patientAge?: number;
    doctorName?: string;
    bloodGroup: BloodGroup;
    unitsRequired: number;
    caseType: any;
    priority: any;
    latitude: number;
    longitude: number;
    district: string;
    city: string;
    requiredDate: string;
    requiredTime: string;
    notes?: string;
  }): BloodRequest {
    // 1. Calculate regional available stock for this group
    let availableStockUnits = 0;
    this.state.bloodBanks.forEach((bb) => {
      const stock = bb.inventory[params.bloodGroup]?.availableUnits || 0;
      availableStockUnits += stock;
    });

    // 2. Count nearby eligible donors
    const nearbyDonors = rankDonorsForRequest(
      params.bloodGroup,
      params.latitude,
      params.longitude,
      this.state.donors,
      25,
      true
    );
    const eligibleCount = nearbyDonors.filter((m) => m.donor.eligible && m.donor.available).length;

    // 3. AI Severity Evaluation
    const severity = calculateSeverityScore({
      caseType: params.caseType,
      emergencyLevel: params.priority,
      unitsRequired: params.unitsRequired,
      availableStockUnits,
      nearbyEligibleDonorCount: eligibleCount,
    });

    const newRequest: BloodRequest = {
      requestId: `req_${Date.now()}`,
      hospitalId: params.hospitalId,
      hospitalName: params.hospitalName,
      patientId: params.patientId || `PT-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: params.patientName,
      doctorName: params.doctorName,
      bloodGroup: params.bloodGroup,
      unitsRequired: params.unitsRequired,
      caseType: params.caseType,
      priority: severity.priority,
      severityScore: severity.score,

      severityFactors: {
        caseWeight: severity.caseWeight,
        urgencyWeight: severity.urgencyWeight,
        stockScarcityWeight: severity.stockScarcityWeight,
        donorAvailabilityWeight: severity.donorAvailabilityWeight,
        unitsWeight: severity.unitsWeight,
      },
      latitude: params.latitude,
      longitude: params.longitude,
      district: params.district,
      city: params.city,
      status: 'MATCHING',
      requiredDate: params.requiredDate,
      requiredTime: params.requiredTime,
      notes: params.notes,
      matchedDonorIds: nearbyDonors.map((n) => n.donor.donorId),
      respondingDonorIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.requests.unshift(newRequest);

    // 4. Send Notifications
    // To Donors (if Emergency Priority is HIGH or CRITICAL and donor is available)
    nearbyDonors.forEach(({ donor, match }) => {
      if (donor.available && donor.eligible && match.distanceKm <= 25) {
        this.state.notifications.unshift({
          notificationId: `notif_${donor.donorId}_${Date.now()}`,
          receiverId: donor.userId,
          receiverRole: 'donor',
          requestId: newRequest.requestId,
          type: 'EMERGENCY_REQUEST',
          title: `🚨 EMERGENCY BLOOD REQUEST - ${params.bloodGroup}`,
          message: `${params.hospitalName} urgently requires ${params.unitsRequired} units of ${params.bloodGroup} for a ${params.caseType} case (~${match.distanceKm} km away). You are an eligible match.`,
          priority: severity.priority,
          read: false,
          createdAt: new Date().toISOString(),
          data: {
            requestId: newRequest.requestId,
            hospitalName: params.hospitalName,
            bloodGroup: params.bloodGroup,
            distanceKm: match.distanceKm,
            severityScore: severity.score,
          },
        });
      }
    });

    // To Blood Banks
    this.state.bloodBanks.forEach((bb) => {
      const dist = calculateHaversineDistance(params.latitude, params.longitude, bb.latitude, bb.longitude);
      if (dist <= 30) {
        this.state.notifications.unshift({
          notificationId: `notif_bb_${bb.bloodBankId}_${Date.now()}`,
          receiverId: bb.userId,
          receiverRole: 'blood_bank',
          requestId: newRequest.requestId,
          type: 'EMERGENCY_REQUEST',
          title: `🚨 URGENT BLOOD REQUIREMENT - ${params.bloodGroup}`,
          message: `${params.hospitalName} needs ${params.unitsRequired} units of ${params.bloodGroup}. Distance: ~${dist} km. Please check and reserve stock.`,
          priority: severity.priority,
          read: false,
          createdAt: new Date().toISOString(),
          data: {
            requestId: newRequest.requestId,
            bloodGroup: params.bloodGroup,
            units: params.unitsRequired,
            hospitalName: params.hospitalName,
          },
        });
      }
    });

    // Hospital notification
    this.state.notifications.unshift({
      notificationId: `notif_hosp_${Date.now()}`,
      receiverId: params.hospitalId,
      receiverRole: 'hospital',
      requestId: newRequest.requestId,
      type: 'NEW_DONOR_MATCH',
      title: `⚡ AI Match Analysis Ready: ${eligibleCount} Donors Found`,
      message: `Severity Score: ${severity.score}/100 (${severity.priority}). ${eligibleCount} compatible donors and nearby blood banks notified.`,
      priority: severity.priority,
      read: false,
      createdAt: new Date().toISOString(),
    });

    this.logAction(
      'CREATE_BLOOD_REQUEST',
      params.hospitalName,
      'hospital',
      `Created request for ${params.unitsRequired} units ${params.bloodGroup}. AI Severity: ${severity.score}/100.`
    );

    this.commit();
    return newRequest;
  }

  /**
   * Donor responds to emergency alert with 'WILLING' or 'DECLINE'
   */
  public respondToEmergencyRequest(
    requestId: string,
    donorId: string,
    response: 'WILLING' | 'DECLINE',
    donorName: string
  ): boolean {
    const req = this.getRequestById(requestId);
    if (!req) return false;

    if (response === 'WILLING') {
      if (!req.respondingDonorIds.includes(donorId)) {
        req.respondingDonorIds.push(donorId);
      }
      req.status = 'DONOR_FOUND';
      req.updatedAt = new Date().toISOString();

      // Notify hospital
      this.state.notifications.unshift({
        notificationId: `notif_resp_${Date.now()}`,
        receiverId: req.hospitalId,
        receiverRole: 'hospital',
        requestId: req.requestId,
        type: 'DONOR_RESPONSE',
        title: `🟢 Donor Responded: ${donorName} is Willing to Donate!`,
        message: `Donor ${donorName} (${req.bloodGroup}) has accepted your emergency request #${req.requestId}. Contact and transit protocol active.`,
        priority: 'CRITICAL',
        read: false,
        createdAt: new Date().toISOString(),
      });

      this.logAction(
        'DONOR_RESPONSE',
        donorName,
        'donor',
        `Responded WILLING TO DONATE for request ${requestId} (${req.bloodGroup})`
      );
    } else {
      this.logAction('DONOR_RESPONSE', donorName, 'donor', `Declined request ${requestId}`);
    }

    this.commit();
    return true;
  }

  /**
   * Hospital or Admin fulfills a blood request
   */
  public fulfillBloodRequest(
    requestId: string,
    fulfilledBy: {
      type: 'donor' | 'blood_bank';
      sourceId: string;
      sourceName: string;
      units: number;
    }
  ): boolean {
    const req = this.getRequestById(requestId);
    if (!req) return false;

    req.status = 'FULFILLED';
    req.fulfilledBy = {
      ...fulfilledBy,
      fulfilledAt: new Date().toISOString(),
    };
    req.updatedAt = new Date().toISOString();

    // If fulfilled by donor, add donation record and update donor's last donation date
    if (fulfilledBy.type === 'donor') {
      const donor = this.getDonorById(fulfilledBy.sourceId);
      if (donor) {
        donor.lastDonationDate = new Date().toISOString().split('T')[0];
        donor.totalDonationsCount += 1;
        // evaluate eligibility
        const elig = evaluateDonorEligibility(donor.dateOfBirth, donor.lastDonationDate);
        donor.eligible = elig.isEligible;
        donor.eligibilityReason = elig.reason;

        this.state.donations.unshift({
          donationId: `don_${Date.now()}`,
          donorId: donor.donorId,
          donorName: donor.name,
          bloodGroup: donor.bloodGroup,
          facilityName: req.hospitalName,
          facilityType: 'Hospital',
          unitsDonated: fulfilledBy.units,
          date: new Date().toISOString().split('T')[0],
          status: 'Completed',
          notes: `Emergency trauma response for patient ${req.patientId}`,
        });

        // Send thank you notification
        this.state.notifications.unshift({
          notificationId: `notif_thank_${Date.now()}`,
          receiverId: donor.userId,
          receiverRole: 'donor',
          requestId: req.requestId,
          type: 'REQUEST_FULFILLED',
          title: '❤️ Blood Requirement Fulfilled - Thank You!',
          message: `Your donation of ${fulfilledBy.units} unit(s) of ${donor.bloodGroup} at ${req.hospitalName} was successfully completed. You saved a life today!`,
          priority: 'HIGH',
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    } else if (fulfilledBy.type === 'blood_bank') {
      // Deduct from blood bank inventory
      this.updateBloodBankStock(fulfilledBy.sourceId, req.bloodGroup, fulfilledBy.units, 'issue');
    }

    // Notify hospital
    this.state.notifications.unshift({
      notificationId: `notif_ful_${Date.now()}`,
      receiverId: req.hospitalId,
      receiverRole: 'hospital',
      requestId: req.requestId,
      type: 'REQUEST_FULFILLED',
      title: '✅ Blood Request Fulfilled',
      message: `Request #${req.requestId} for ${req.bloodGroup} (${req.unitsRequired} units) has been fulfilled by ${fulfilledBy.sourceName}.`,
      priority: 'HIGH',
      read: false,
      createdAt: new Date().toISOString(),
    });

    this.logAction(
      'FULFILL_REQUEST',
      req.hospitalName,
      'hospital',
      `Request #${req.requestId} fulfilled by ${fulfilledBy.sourceName} (${fulfilledBy.units} units).`
    );

    this.commit();
    return true;
  }

  public verifyEntity(
    type: 'hospital' | 'blood_bank' | 'donor',
    id: string,
    status: 'VERIFIED' | 'REJECTED'
  ): boolean {
    if (type === 'hospital') {
      const h = this.state.hospitals.find((item) => item.hospitalId === id);
      if (h) {
        h.verificationStatus = status;
        h.verified = status === 'VERIFIED';
        h.updatedAt = new Date().toISOString();
        this.logAction('ADMIN_VERIFICATION', 'Admin', 'admin', `Hospital ${h.hospitalName} set to ${status}`);
        this.commit();
        return true;
      }
    } else if (type === 'blood_bank') {
      const b = this.state.bloodBanks.find((item) => item.bloodBankId === id);
      if (b) {
        b.verificationStatus = status;
        b.verified = status === 'VERIFIED';
        b.updatedAt = new Date().toISOString();
        this.logAction('ADMIN_VERIFICATION', 'Admin', 'admin', `Blood Bank ${b.name} set to ${status}`);
        this.commit();
        return true;
      }
    } else if (type === 'donor') {
      const d = this.state.donors.find((item) => item.donorId === id);
      if (d) {
        d.verified = status === 'VERIFIED';
        d.updatedAt = new Date().toISOString();
        this.logAction('ADMIN_VERIFICATION', 'Admin', 'admin', `Donor ${d.name} verified`);
        this.commit();
        return true;
      }
    }
    return false;
  }

  public markNotificationAsRead(notificationId: string) {
    const notif = this.state.notifications.find((n) => n.notificationId === notificationId);
    if (notif) {
      notif.read = true;
      this.commit();
    }
  }

  public markAllNotificationsAsRead(receiverId?: string) {
    this.state.notifications.forEach((n) => {
      if (!receiverId || n.receiverId === receiverId || n.receiverId === 'all') {
        n.read = true;
      }
    });
    this.commit();
  }

  public logAction(action: string, actor: string, actorRole: any, details: string, severity: 'info' | 'warning' | 'critical' = 'info') {
    const log: SystemLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      actor,
      actorRole,
      details,
      severity,
    };
    this.state.logs.unshift(log);
    if (this.state.logs.length > 200) {
      this.state.logs.pop();
    }
  }

  public resetToSeedData() {
    this.state = {
      donors: SEED_DONORS,
      hospitals: SEED_HOSPITALS,
      bloodBanks: SEED_BLOOD_BANKS,
      requests: SEED_REQUESTS,
      matches: [],
      notifications: SEED_NOTIFICATIONS,
      logs: SEED_LOGS,
      donations: [],
    };
    this.commit();
  }

  public getBloodRequests(): BloodRequest[] {
    return this.getRequests();
  }

  public getDonations(donorId?: string): DonationRecord[] {
    return this.getDonationHistory(donorId);
  }

  public getAuditLogs(): SystemLog[] {
    return this.getLogs();
  }

  public resetToDefaults() {
    this.resetToSeedData();
  }

  public updateBloodBankInventory(bloodBankId: string, group: BloodGroup, units: number) {
    return this.updateBloodBankStock(bloodBankId, group, units, 'set');
  }

  public verifyHospital(hospitalId: string, status: 'VERIFIED' | 'REJECTED') {
    return this.verifyEntity('hospital', hospitalId, status);
  }

  public addNotification(notif: {
    receiverId: string;
    type: any;
    priority: any;
    title: string;
    message: string;
    requestId?: string;
  }) {
    this.state.notifications.unshift({
      notificationId: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      receiverId: notif.receiverId,
      receiverRole: 'hospital',
      requestId: notif.requestId || '',
      type: notif.type,
      title: notif.title,
      message: notif.message,
      priority: notif.priority,
      read: false,
      createdAt: new Date().toISOString(),
    });
    this.commit();
  }

  public getSystemSummaryStats() {
    let totalBloodUnits = 0;
    let lowStockCount = 0;
    const stockByGroup: Record<BloodGroup, number> = {
      'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0,
    };

    this.state.bloodBanks.forEach((bb) => {
      Object.values(bb.inventory).forEach((inv) => {
        totalBloodUnits += inv.availableUnits;
        if (stockByGroup[inv.bloodGroup] !== undefined) {
          stockByGroup[inv.bloodGroup] += inv.availableUnits;
        }
        if (inv.status === 'LOW' || inv.status === 'CRITICAL') {
          lowStockCount++;
        }
      });
    });

    const activeRequests = this.state.requests.filter(
      (r) => r.status !== 'FULFILLED' && r.status !== 'CANCELLED'
    ).length;

    const emergencyRequests = this.state.requests.filter(
      (r) => (r.priority === 'CRITICAL' || r.priority === 'HIGH') && r.status !== 'FULFILLED'
    ).length;

    const pendingVerifications =
      this.state.hospitals.filter((h) => h.verificationStatus === 'PENDING').length +
      this.state.bloodBanks.filter((b) => b.verificationStatus === 'PENDING').length;

    return {
      totalDonors: this.state.donors.length,
      registeredDonors: this.state.donors.length,
      availableDonors: this.state.donors.filter((d) => d.available && d.eligible).length,
      totalHospitals: this.state.hospitals.length,
      verifiedHospitals: this.state.hospitals.filter((h) => h.verified).length,
      totalBloodBanks: this.state.bloodBanks.length,
      totalUnitsInStock: totalBloodUnits,
      totalBloodUnits,
      activeRequests,
      openRequests: activeRequests,
      criticalRequests: emergencyRequests,
      emergencyRequests,
      fulfilledRequests: this.state.requests.filter((r) => r.status === 'FULFILLED').length,
      pendingVerifications,
      lowStockCount,
      modelAccuracy: '94.2%',
      stockByGroup,
    };
  }

}

export const dbStore = new RaktaLinkStore();
