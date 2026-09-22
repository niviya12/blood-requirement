import { CaseType, EmergencyPriority } from '../types';

export interface SeverityEvaluation {
  score: number; // 0 to 100
  priority: EmergencyPriority;
  caseWeight: number;
  urgencyWeight: number;
  unitsWeight: number;
  stockScarcityWeight: number;
  donorAvailabilityWeight: number;
  summary: string;
  isCritical: boolean;
}

/**
 * AI-based Severity Scoring Mechanism for Operational Prioritization.
 * Evaluates clinical urgency flags, units demanded, regional stock deficit, and nearby donor density.
 */
export function calculateSeverityScore(params: {
  caseType: CaseType;
  emergencyLevel: EmergencyPriority;
  unitsRequired: number;
  availableStockUnits?: number;
  nearbyEligibleDonorCount?: number;
  hoursRemaining?: number;
}): SeverityEvaluation {
  const {
    caseType,
    emergencyLevel,
    unitsRequired,
    availableStockUnits = 5,
    nearbyEligibleDonorCount = 3,
    hoursRemaining = 4,
  } = params;

  // 1. Case Type Weight (up to 30)
  let caseWeight = 10;
  switch (caseType) {
    case 'Accident':
      caseWeight = 30; // Trauma / hemorrhaging
      break;
    case 'Emergency':
      caseWeight = 28;
      break;
    case 'Surgery':
      caseWeight = 20;
      break;
    case 'General Requirement':
      caseWeight = 10;
      break;
    case 'Other':
    default:
      caseWeight = 8;
      break;
  }

  // 2. Emergency Urgency Level declared (up to 30)
  let urgencyWeight = 10;
  switch (emergencyLevel) {
    case 'CRITICAL':
      urgencyWeight = 30;
      break;
    case 'HIGH':
      urgencyWeight = 22;
      break;
    case 'MEDIUM':
      urgencyWeight = 14;
      break;
    case 'LOW':
    default:
      urgencyWeight = 6;
      break;
  }

  // 3. Units Volume Factor (up to 15)
  // Large requisitions (e.g. 4+ units) create immense systemic strain
  let unitsWeight = Math.min(15, Math.round(unitsRequired * 3.5));

  // 4. Regional Stock Scarcity Factor (up to 15)
  // If stock < units required, scarcity is acute
  let stockScarcityWeight = 0;
  if (availableStockUnits <= 0) {
    stockScarcityWeight = 15;
  } else if (availableStockUnits < unitsRequired) {
    stockScarcityWeight = 12;
  } else if (availableStockUnits < unitsRequired * 2) {
    stockScarcityWeight = 6;
  } else {
    stockScarcityWeight = 2;
  }

  // 5. Donor Availability Deficit (up to 10)
  let donorAvailabilityWeight = 0;
  if (nearbyEligibleDonorCount === 0) {
    donorAvailabilityWeight = 10;
  } else if (nearbyEligibleDonorCount <= 2) {
    donorAvailabilityWeight = 6;
  } else {
    donorAvailabilityWeight = 2;
  }

  // Time remaining modifier
  if (hoursRemaining <= 1) {
    urgencyWeight = Math.min(30, urgencyWeight + 5);
  }

  const rawScore = caseWeight + urgencyWeight + unitsWeight + stockScarcityWeight + donorAvailabilityWeight;
  const score = Math.min(100, Math.max(0, rawScore));

  // Prioritize based on defined thresholds:
  // 0–30 = LOW
  // 31–60 = MEDIUM
  // 61–80 = HIGH
  // 81–100 = CRITICAL
  let calculatedPriority: EmergencyPriority = 'LOW';
  if (score >= 81) {
    calculatedPriority = 'CRITICAL';
  } else if (score >= 61) {
    calculatedPriority = 'HIGH';
  } else if (score >= 31) {
    calculatedPriority = 'MEDIUM';
  } else {
    calculatedPriority = 'LOW';
  }

  let summary = '';
  if (score >= 81) {
    summary = `Immediate life-threatening triage (${score}/100): ${caseType} requires ${unitsRequired} units with low regional stock reserves. High priority dispatcher alert triggered.`;
  } else if (score >= 61) {
    summary = `High urgency triage (${score}/100): Expedited donor & blood bank matching initiated.`;
  } else if (score >= 31) {
    summary = `Moderate priority triage (${score}/100): Standard hospital queue with scheduled donor pairing.`;
  } else {
    summary = `Elective / Low urgency priority (${score}/100): Routine processing and inventory allocation.`;
  }

  return {
    score,
    priority: calculatedPriority,
    caseWeight,
    urgencyWeight,
    unitsWeight,
    stockScarcityWeight,
    donorAvailabilityWeight,
    summary,
    isCritical: calculatedPriority === 'CRITICAL' || calculatedPriority === 'HIGH',
  };
}

export const SEVERITY_DISCLAIMER =
  'Notice: The AI Severity Score is an operational logistics and resource-prioritization score designed to accelerate emergency blood procurement. It does NOT constitute medical triage, clinical diagnosis, or treatment prescription.';
