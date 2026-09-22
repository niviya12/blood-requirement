export type Role = 'donor' | 'hospital' | 'blood_bank' | 'admin';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type CaseType = 'Accident' | 'Surgery' | 'Emergency' | 'General Requirement' | 'Other';

export type EmergencyPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Priority = EmergencyPriority;

export type RequestStatus = 
  | 'PENDING' 
  | 'MATCHING' 
  | 'DONOR_FOUND' 
  | 'BLOOD_BANK_FOUND' 
  | 'IN_PROGRESS' 
  | 'FULFILLED' 
  | 'CANCELLED'
  | 'OPEN';


export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type StockStatus = 'NORMAL' | 'LOW' | 'CRITICAL';

export interface UserAccount {
  uid: string;
  email: string;
  role: Role;
  displayName: string;
  phone?: string;
  createdAt: string;
  avatarUrl?: string;
}

export interface Donor {
  donorId: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  bloodGroup: BloodGroup;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  district: string;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
  lastDonationDate: string; // YYYY-MM-DD
  eligible: boolean;
  eligibilityReason?: string;
  available: boolean; // Emergency availability toggle
  verified: boolean;
  totalDonationsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Hospital {
  hospitalId: string;
  userId: string;
  hospitalName: string;
  registrationId: string;
  email: string;
  phone: string;
  address: string;
  district: string;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
  emergencyContact: string;
  verified: boolean;
  verificationStatus: VerificationStatus;
  bedCapacity?: number;
  icuCapacity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BloodStockItem {
  bloodGroup: BloodGroup;
  availableUnits: number;
  reservedUnits: number;
  issuedUnits: number;
  status: StockStatus;
  lastUpdated: string;
}

export type BloodInventory = Record<BloodGroup, BloodStockItem>;


export interface BloodBank {
  bloodBankId: string;
  userId: string;
  name: string;
  registrationId: string;
  email: string;
  phone: string;
  address: string;
  district: string;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
  emergencyContact: string;
  verified: boolean;
  verificationStatus: VerificationStatus;
  inventory: Record<BloodGroup, BloodStockItem>;
  createdAt: string;
  updatedAt: string;
}

export interface BloodRequest {
  requestId: string;
  hospitalId: string;
  hospitalName: string;
  patientId: string;
  patientName?: string;
  doctorName?: string;
  bloodGroup: BloodGroup;

  unitsRequired: number;
  caseType: CaseType;
  priority: EmergencyPriority;
  severityScore: number;
  severityFactors?: {
    caseWeight: number;
    urgencyWeight: number;
    stockScarcityWeight: number;
    donorAvailabilityWeight: number;
    unitsWeight: number;
  };
  latitude: number;
  longitude: number;
  district: string;
  city: string;
  status: RequestStatus;
  requiredDate: string;
  requiredTime: string;
  notes?: string;
  matchedDonorIds: string[];
  respondingDonorIds: string[];
  fulfilledBy?: {
    type: 'donor' | 'blood_bank';
    sourceId: string;
    sourceName: string;
    units: number;
    fulfilledAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DonorMatch {
  matchId: string;
  requestId: string;
  donorId: string;
  donorName: string;
  bloodGroup: BloodGroup;
  donorLocationApprox: string;
  distanceKm: number;
  bloodCompatibility: boolean;
  eligibility: boolean;
  availability: boolean;
  matchScore: number;
  lastDonationDate: string;
  status: 'MATCHED' | 'NOTIFIED' | 'RESPONDED' | 'DECLINED' | 'COMPLETED';
  responseNotes?: string;
  createdAt: string;
  respondedAt?: string;
}

export interface DonationRecord {
  donationId: string;
  donorId: string;
  donorName: string;
  bloodGroup: BloodGroup;
  facilityName: string; // Hospital or Blood Bank
  facilityType: 'Hospital' | 'Blood Bank';
  unitsDonated: number;
  date: string;
  status: 'Completed' | 'Deferred' | 'Scheduled';
  notes?: string;
}

export interface AppNotification {
  notificationId: string;
  receiverId: string; // userId or 'all' or role
  receiverRole?: Role;
  requestId?: string;
  type: 
    | 'EMERGENCY_REQUEST' 
    | 'NEW_DONOR_MATCH' 
    | 'DONOR_RESPONSE' 
    | 'BLOOD_BANK_STOCK_AVAILABLE' 
    | 'REQUEST_ACCEPTED' 
    | 'REQUEST_FULFILLED' 
    | 'REQUEST_CANCELLED' 
    | 'LOW_BLOOD_STOCK'
    | 'SYSTEM_ALERT';
  title: string;
  message: string;
  priority: EmergencyPriority;
  read: boolean;
  data?: any;
  createdAt: string;
}

export interface DemandPrediction {
  predictionId: string;
  district: string;
  bloodGroup: BloodGroup;
  currentDemand: number;
  predictedDemand: number;
  currentStock: number;
  potentialShortage: number;
  confidenceScore: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  seasonalityFactor: string;
  date: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  actorRole: Role;
  details: string;
  severity: 'info' | 'warning' | 'critical';
}
