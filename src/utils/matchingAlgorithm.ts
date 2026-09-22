import { BloodGroup, Donor, DonorMatch } from '../types';
import { calculateHaversineDistance, getApproximateLocationText } from './distanceCalculator';

/**
 * Standard ABO and Rh Blood Group Compatibility Matrix.
 * Keys = Recipient (Patient) Blood Group
 * Values = Array of compatible Donor Blood Groups
 */
export const COMPATIBLE_DONORS_FOR_RECIPIENT: Record<BloodGroup, BloodGroup[]> = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal recipient
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'], // Universal donor can only receive O-
};

export function isBloodCompatible(recipientGroup: BloodGroup, donorGroup: BloodGroup): boolean {
  const allowed = COMPATIBLE_DONORS_FOR_RECIPIENT[recipientGroup] || [];
  return allowed.includes(donorGroup);
}

export interface MatchScoringFactors {
  compatibilityScore: number; // 40 max
  distanceScore: number;      // 30 max
  availabilityScore: number;  // 20 max
  recencyScore: number;       // 10 max
  totalScore: number;         // 0 - 100
  reasons: string[];
}

export function computeDonorMatchScore(
  recipientBloodGroup: BloodGroup,
  hospitalLat: number,
  hospitalLon: number,
  donor: Donor,
  isEmergency: boolean = false
): MatchScoringFactors {
  const reasons: string[] = [];

  // 1. Blood Compatibility (0 or 40 pts)
  const isCompatible = isBloodCompatible(recipientBloodGroup, donor.bloodGroup);
  let compatibilityScore = 0;
  if (isCompatible) {
    if (recipientBloodGroup === donor.bloodGroup) {
      compatibilityScore = 40; // Exact match bonus
      reasons.push(`Exact blood group match (${donor.bloodGroup})`);
    } else {
      compatibilityScore = 36;
      reasons.push(`Compatible group (${donor.bloodGroup} for ${recipientBloodGroup})`);
    }
  } else {
    reasons.push(`Incompatible blood group (${donor.bloodGroup})`);
  }

  // 2. Distance Score (0 to 30 pts)
  const distance = calculateHaversineDistance(hospitalLat, hospitalLon, donor.latitude, donor.longitude);
  let distanceScore = 0;
  if (distance <= 5) {
    distanceScore = 30;
    reasons.push(`Very close proximity (${distance} km)`);
  } else if (distance <= 15) {
    distanceScore = 24;
    reasons.push(`Within immediate reach (${distance} km)`);
  } else if (distance <= 30) {
    distanceScore = 18;
    reasons.push(`Moderate transit distance (${distance} km)`);
  } else if (distance <= 50) {
    distanceScore = 10;
    reasons.push(`Extended radius (${distance} km)`);
  } else {
    distanceScore = Math.max(0, Math.round(30 - distance * 0.4));
  }

  // 3. Availability Score (0 or 20 pts)
  let availabilityScore = 0;
  if (donor.available) {
    availabilityScore = 20;
    reasons.push('Emergency availability active 🟢');
  } else {
    availabilityScore = isEmergency ? 0 : 5; // Heavily penalize unavailable donors in emergency
    reasons.push('Currently marked unavailable ⚪');
  }

  // 4. Eligibility & Recency (0 to 10 pts)
  let recencyScore = 0;
  if (donor.eligible) {
    recencyScore = 10;
    reasons.push('Interval verified eligible ✓');
  } else {
    recencyScore = 0;
    reasons.push('Cooldown period active');
  }

  // Calculate Total
  let totalScore = compatibilityScore + distanceScore + availabilityScore + recencyScore;
  
  // Strict filter: If not compatible, total score drops
  if (!isCompatible) {
    totalScore = Math.min(totalScore, 15);
  }
  // If not eligible, score capped
  if (!donor.eligible) {
    totalScore = Math.min(totalScore, 25);
  }

  return {
    compatibilityScore,
    distanceScore,
    availabilityScore,
    recencyScore,
    totalScore: Math.min(100, Math.max(0, totalScore)),
    reasons,
  };
}

export function rankDonorsForRequest(
  recipientBloodGroup: BloodGroup,
  hospitalLat: number,
  hospitalLon: number,
  donors: Donor[],
  maxDistanceKm: number = 50,
  isEmergency: boolean = true
): { donor: Donor; match: DonorMatch; factors: MatchScoringFactors }[] {
  const results = donors.map((donor) => {
    const distanceKm = calculateHaversineDistance(hospitalLat, hospitalLon, donor.latitude, donor.longitude);
    const factors = computeDonorMatchScore(recipientBloodGroup, hospitalLat, hospitalLon, donor, isEmergency);
    const approxLoc = getApproximateLocationText(donor.city, donor.district);

    const match: DonorMatch = {
      matchId: `match_${donor.donorId}_${Date.now()}`,
      requestId: '',
      donorId: donor.donorId,
      donorName: donor.name,
      bloodGroup: donor.bloodGroup,
      donorLocationApprox: approxLoc,
      distanceKm,
      bloodCompatibility: isBloodCompatible(recipientBloodGroup, donor.bloodGroup),
      eligibility: donor.eligible,
      availability: donor.available,
      matchScore: factors.totalScore,
      lastDonationDate: donor.lastDonationDate,
      status: 'MATCHED',
      createdAt: new Date().toISOString(),
    };

    return { donor, match, factors };
  });

  // Filter out completely incompatible or beyond radius if requested
  const filtered = results.filter((item) => {
    if (maxDistanceKm > 0 && item.match.distanceKm > maxDistanceKm) return false;
    return true;
  });

  // Sort by highest match score first, then shortest distance
  filtered.sort((a, b) => {
    if (b.match.matchScore !== a.match.matchScore) {
      return b.match.matchScore - a.match.matchScore;
    }
    return a.match.distanceKm - b.match.distanceKm;
  });

  return filtered;
}
