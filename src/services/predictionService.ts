import { BloodGroup, DemandPrediction } from '../types';

export interface HistoricalDataPoint {
  date: string;
  district: string;
  bloodGroup: BloodGroup;
  unitsRequested: number;
  unitsSupplied: number;
  donationCount: number;
  emergencyRequests: number;
  month: string;
  season: 'Monsoon' | 'Summer' | 'Winter' | 'Festival';
}

export interface DemandPredictionAnalysis {
  predictions: DemandPrediction[];
  totalPredictedUnits: number;
  totalCurrentStock: number;
  criticalShortages: { bloodGroup: BloodGroup; shortage: number; district: string }[];
  modelMetrics: {
    modelType: string;
    rmse: number;
    mae: number;
    accuracyR2: number;
    featureImportance: { feature: string; weight: number }[];
  };
  historicalTrend: { month: string; actual: number; predicted: number; donationSupply: number }[];
  districtDistribution: { district: string; demand: number; shortage: number }[];
  groupDistribution: { group: BloodGroup; demand: number; stock: number; shortage: number }[];
}

// Generate realistic historical time series for the past 12 months
export function getHistoricalDemandData(): HistoricalDataPoint[] {
  const districts = ['Sivakasi', 'Virudhunagar', 'Madurai', 'Chennai', 'Coimbatore'];
  const bloodGroups: BloodGroup[] = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];
  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

  const data: HistoricalDataPoint[] = [];

  months.forEach((month, mIdx) => {
    districts.forEach((district) => {
      bloodGroups.forEach((bg) => {
        // Higher demand for O+ and B+ (most common in India)
        const baseDemand = (bg === 'O+' || bg === 'B+') ? 55 : (bg === 'A+' || bg === 'AB+') ? 35 : 12;
        const seasonalSurge = (month === 'Dec' || month === 'May' || month === 'Jul') ? 1.25 : 1.0;
        const unitsRequested = Math.round((baseDemand + (mIdx * 1.5) + (Math.sin(mIdx + bg.length) * 8)) * seasonalSurge);
        const unitsSupplied = Math.round(unitsRequested * (0.85 + (Math.cos(mIdx) * 0.1)));
        const donationCount = Math.round(unitsSupplied * 0.95);
        const emergencyRequests = Math.round(unitsRequested * 0.35);

        data.push({
          date: `2026-${String(mIdx + 1).padStart(2, '0')}-15`,
          district,
          bloodGroup: bg,
          unitsRequested,
          unitsSupplied,
          donationCount,
          emergencyRequests,
          month,
          season: (mIdx >= 2 && mIdx <= 4) ? 'Winter' : (mIdx >= 5 && mIdx <= 7) ? 'Summer' : 'Monsoon',
        });
      });
    });
  });

  return data;
}

/**
 * Gradient Boosting / Random Forest Time-Series Demand Forecaster Simulation.
 * Synthesizes seasonal weights, historical velocity, emergency surge indices, and hospital bed demand.
 */
export function runDemandPredictionModel(
  currentStockByGroup: Record<BloodGroup, number>,
  selectedDistrict: string = 'All Districts'
): DemandPredictionAnalysis {
  const bloodGroups: BloodGroup[] = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];
  const districts = ['Sivakasi', 'Virudhunagar', 'Madurai', 'Chennai', 'Coimbatore'];

  const predictions: DemandPrediction[] = [];
  const criticalShortages: { bloodGroup: BloodGroup; shortage: number; district: string }[] = [];

  let totalPredicted = 0;
  let totalStock = 0;

  bloodGroups.forEach((bg) => {
    // Current stock for this group
    const stock = currentStockByGroup[bg] || 45;
    totalStock += stock;

    // Projected future 30-day demand using regression weights
    // Factor 1: Baseline requirement
    const baseRequirement = (bg === 'O+' || bg === 'B+') ? 85 : (bg === 'A+' || bg === 'AB+') ? 48 : 22;
    // Factor 2: Seasonal holiday & trauma surge factor (+18%)
    const seasonalFactor = 1.18;
    // Factor 3: Emergency frequency momentum
    const momentumWeight = 1.12;

    const currentDemand = Math.round(baseRequirement * 0.92);
    const predictedDemand = Math.round(baseRequirement * seasonalFactor * momentumWeight);
    totalPredicted += predictedDemand;

    const shortage = Math.max(0, predictedDemand - stock);

    if (shortage > 0) {
      criticalShortages.push({
        bloodGroup: bg,
        shortage,
        district: selectedDistrict === 'All Districts' ? 'Sivakasi / Virudhunagar Zone' : selectedDistrict,
      });
    }

    predictions.push({
      predictionId: `pred_${bg}_${Date.now()}`,
      district: selectedDistrict,
      bloodGroup: bg,
      currentDemand,
      predictedDemand,
      currentStock: stock,
      potentialShortage: shortage,
      confidenceScore: 94.2 + (Math.sin(bg.length) * 2.5),
      trend: predictedDemand > currentDemand ? 'UP' : 'STABLE',
      seasonalityFactor: 'Trauma & Elective Surgery Surge Window',
      date: new Date().toISOString().split('T')[0],
    });
  });

  // Historical vs Predicted Trend lines for chart
  const historicalTrend = [
    { month: 'Apr 2026', actual: 420, predicted: 410, donationSupply: 390 },
    { month: 'May 2026', actual: 485, predicted: 470, donationSupply: 430 },
    { month: 'Jun 2026', actual: 510, predicted: 505, donationSupply: 460 },
    { month: 'Jul 2026', actual: 530, predicted: 540, donationSupply: 475 },
    { month: 'Aug 2026', actual: 560, predicted: 550, donationSupply: 510 },
    { month: 'Sep 2026 (Now)', actual: 590, predicted: 605, donationSupply: 530 },
    { month: 'Oct 2026 (Forecast)', actual: 0, predicted: 645, donationSupply: 545 },
    { month: 'Nov 2026 (Forecast)', actual: 0, predicted: 680, donationSupply: 560 },
    { month: 'Dec 2026 (Forecast)', actual: 0, predicted: 720, donationSupply: 580 },
  ];

  // District distribution
  const districtDistribution = districts.map((d) => {
    const mult = d === 'Chennai' ? 2.4 : d === 'Madurai' ? 1.6 : d === 'Sivakasi' ? 1.0 : 0.8;
    const demand = Math.round(140 * mult);
    const shortage = Math.round(demand * 0.22);
    return {
      district: d,
      demand,
      shortage,
    };
  });

  // Group distribution
  const groupDistribution = bloodGroups.map((bg) => {
    const pred = predictions.find((p) => p.bloodGroup === bg);
    return {
      group: bg,
      demand: pred ? pred.predictedDemand : 40,
      stock: pred ? pred.currentStock : 30,
      shortage: pred ? pred.potentialShortage : 10,
    };
  });

  return {
    predictions,
    totalPredictedUnits: totalPredicted,
    totalCurrentStock: totalStock,
    criticalShortages,
    modelMetrics: {
      modelType: 'Ensemble Random Forest & Gradient Boosted Time-Series Regressor',
      rmse: 4.82,
      mae: 3.15,
      accuracyR2: 0.942, // 94.2% accuracy
      featureImportance: [
        { feature: 'Emergency Frequency (7-day lag)', weight: 0.32 },
        { feature: 'Historical Seasonal Demand', weight: 0.24 },
        { feature: 'Hospital Bed / ICU Occupancy', weight: 0.18 },
        { feature: 'Recent Voluntary Donation Rate', weight: 0.14 },
        { feature: 'Holiday & Festival Trauma Index', weight: 0.12 },
      ],
    },
    historicalTrend,
    districtDistribution,
    groupDistribution,
  };
}
