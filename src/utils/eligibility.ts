export interface EligibilityResult {
  isEligible: boolean;
  reason: string;
  daysSinceLastDonation: number | null;
  nextEligibleDate: string | null;
  age: number | null;
}

const MINIMUM_DONATION_INTERVAL_DAYS = 90; // Standard 3-month gap for whole blood
const MINIMUM_AGE = 18;
const MAXIMUM_AGE = 65;

export function evaluateDonorEligibility(
  dateOfBirth: string,
  lastDonationDate: string | null | undefined,
  currentDateStr?: string
): EligibilityResult {
  const today = currentDateStr ? new Date(currentDateStr) : new Date();

  // Age calculation
  let age: number | null = null;
  if (dateOfBirth) {
    const dob = new Date(dateOfBirth);
    age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    if (age < MINIMUM_AGE) {
      return {
        isEligible: false,
        reason: `Donor must be at least ${MINIMUM_AGE} years of age (current age: ${age}).`,
        daysSinceLastDonation: null,
        nextEligibleDate: null,
        age,
      };
    }

    if (age > MAXIMUM_AGE) {
      return {
        isEligible: false,
        reason: `Donor age exceeds standard guideline limit of ${MAXIMUM_AGE} years (current age: ${age}).`,
        daysSinceLastDonation: null,
        nextEligibleDate: null,
        age,
      };
    }
  }

  // Interval calculation
  if (!lastDonationDate || lastDonationDate.trim() === '') {
    return {
      isEligible: true,
      reason: 'First-time donor or no previous donation recorded. Eligible to donate.',
      daysSinceLastDonation: null,
      nextEligibleDate: null,
      age,
    };
  }

  const lastDate = new Date(lastDonationDate);
  const diffTime = today.getTime() - lastDate.getTime();
  const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (daysDiff < 0) {
    return {
      isEligible: false,
      reason: 'Last donation date is in the future. Please correct profile.',
      daysSinceLastDonation: daysDiff,
      nextEligibleDate: null,
      age,
    };
  }

  if (daysDiff < MINIMUM_DONATION_INTERVAL_DAYS) {
    const daysRemaining = MINIMUM_DONATION_INTERVAL_DAYS - daysDiff;
    const nextDate = new Date(lastDate.getTime() + MINIMUM_DONATION_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
    const formattedNext = nextDate.toISOString().split('T')[0];

    return {
      isEligible: false,
      reason: `Mandatory interval between donations is ${MINIMUM_DONATION_INTERVAL_DAYS} days. ${daysRemaining} day(s) remaining until next eligibility.`,
      daysSinceLastDonation: daysDiff,
      nextEligibleDate: formattedNext,
      age,
    };
  }

  return {
    isEligible: true,
    reason: `Interval verified (${daysDiff} days since last donation). Donor is active and eligible.`,
    daysSinceLastDonation: daysDiff,
    nextEligibleDate: null,
    age,
  };
}

export const COMPATIBILITY_MATRIX: Record<string, string[]> = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'],
};

export const COMPATIBLE_DONORS_FOR_RECIPIENT = COMPATIBILITY_MATRIX;

export const MEDICAL_SAFETY_NOTICE =
  'Notice: This automated evaluation is an operational heuristic based on entered interval and age. Final donation eligibility must be confirmed according to applicable blood-donation guidelines, hemoglobin testing, and clinical medical screening by qualified medical personnel.';

