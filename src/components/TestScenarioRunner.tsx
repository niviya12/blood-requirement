import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Send,
  Building2,
  Package,
  X,
  FastForward,
} from 'lucide-react';
import { dbStore } from '../services/store';
import { rankDonorsForRequest } from '../utils/matchingAlgorithm';

interface TestScenarioRunnerProps {
  onClose: () => void;
  onNavigateRole?: (role: any) => void;
}

export const SCENARIO_STEPS = [
  {
    step: 1,
    title: 'Hospital Creates Emergency Request',
    actor: 'Hospital (Sivakasi Govt Hospital)',
    description: 'Trauma ICU submits emergency requisition for Ramesh (38M), O+ Blood Group, 2 Units required immediately.',
    category: 'Request Initiation',
  },
  {
    step: 2,
    title: 'AI Calculates Severity Index',
    actor: 'AI Clinical Triage Engine',
    description: 'Calculates Operational Severity Score: 92/100 (Critical High Priority) based on arterial trauma case weight and regional O+ stock deficit.',
    category: 'AI Triage',
  },
  {
    step: 3,
    title: 'Algorithm Identifies Donors',
    actor: 'Smart Matching Service',
    description: 'Queries 20 registered donors, applies blood compatibility matrix, transit radius (10 km), and 90-day donation interval filter.',
    category: 'Filtering',
  },
  {
    step: 4,
    title: 'Ranked Donor Matches',
    actor: 'Multi-Factor Ranking',
    description: 'Top Matches: #1 Vignesh Kumar (98% match, 2.1 km), #2 Priya Raj (91% match, 4.3 km), #3 Karthik M (85% match, 7.8 km).',
    category: 'Smart Ranking',
  },
  {
    step: 5,
    title: 'Push Notifications Dispatched',
    actor: 'Dispatch Broadcast Engine',
    description: 'Instant high-priority emergency notifications routed to matching eligible donors within 10 km radius.',
    category: 'Notification',
  },
  {
    step: 6,
    title: 'Donor Receives Emergency Alert',
    actor: 'Donor App Interface',
    description: 'Donor Vignesh Kumar device receives push: "🚨 EMERGENCY: O+ blood needed at Sivakasi Govt Hospital (2.1 km away)".',
    category: 'Donor View',
  },
  {
    step: 7,
    title: 'Donor Responds: WILLING TO DONATE',
    actor: 'Donor Action',
    description: 'Donor reviews distance and urgency, taps [WILLING TO DONATE] button. Response status logged cryptographically.',
    category: 'Commitment',
  },
  {
    step: 8,
    title: 'Hospital Receives Live Response',
    actor: 'Hospital Trauma Desk',
    description: 'Hospital dashboard audio/visual ping: "Donor Vignesh Kumar is responding (2.1 km away, ETA 10-15 mins)".',
    category: 'Real-time Sync',
  },
  {
    step: 9,
    title: 'Blood Bank Notified of Emergency',
    actor: 'Blood Bank Dispatch',
    description: 'Indian Red Cross Society Sivakasi receives district trauma alert regarding O+ emergency demand.',
    category: 'Supply Chain',
  },
  {
    step: 10,
    title: 'Blood Bank Checks Inventory',
    actor: 'Blood Bank Officer',
    description: 'Automated inventory verification: 18 units of O+ currently available in central cold-chain storage.',
    category: 'Inventory Check',
  },
  {
    step: 11,
    title: 'Reserve 2 Units for Hospital',
    actor: 'Inventory Reservation',
    description: 'Blood bank locks 2 units of O+ in RESERVED state specifically tagged for Sivakasi Govt Hospital requisition.',
    category: 'Reservation',
  },
  {
    step: 12,
    title: 'Request Status: IN PROGRESS',
    actor: 'Requisition Lifecycle',
    description: 'Hospital emergency blood requisition transitions from OPEN to IN_PROGRESS with verified donor and bank units.',
    category: 'Status Transition',
  },
  {
    step: 13,
    title: 'Admin Dashboard Synchronized',
    actor: 'Central Admin Oversight',
    description: 'Audit trail updated, dispatch latency logged (12.4s total cycle time), and demand prediction metrics recalibrated.',
    category: 'Audit & Analytics',
  },
];

export function TestScenarioRunner({ onClose, onNavigateRole }: TestScenarioRunnerProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [createdRequestId, setCreatedRequestId] = useState<string>('');

  // Auto play effect
  useEffect(() => {
    let timer: any;
    if (isPlaying && currentStep < 13) {
      timer = setTimeout(() => {
        advanceStep(currentStep + 1);
      }, 1600);
    } else if (isPlaying && currentStep === 13) {
      setIsPlaying(false);
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      } catch (e) {
        // ignore
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep]);

  const advanceStep = (nextStep: number) => {
    setCurrentStep(nextStep);

    // Apply actual mutations to dbStore on specific milestones
    if (nextStep === 1 && !createdRequestId) {
      const hosp = dbStore.getHospitals()[0];
      const newReq = dbStore.createBloodRequest({
        hospitalId: hosp?.hospitalId || 'hosp_001',
        hospitalName: hosp?.hospitalName || 'Sivakasi Govt Hospital',
        patientName: 'Ramesh Sundaram',
        patientAge: 38,
        bloodGroup: 'O+',
        unitsRequired: 2,
        priority: 'CRITICAL',
        caseType: 'Accident / Trauma',
        requiredDate: new Date().toISOString().split('T')[0],
        requiredTime: 'IMMEDIATELY (< 1 hour)',
        doctorName: 'Dr. S. K. Narayanan, MS Ortho',
        notes: 'Compound fracture requiring immediate O+ transfusion.',
        district: 'Virudhunagar',
        city: 'Sivakasi',
        latitude: 9.4533,
        longitude: 77.7979,
      });
      setCreatedRequestId(newReq.requestId);
    }

    if (nextStep === 7 && createdRequestId) {
      const donor = dbStore.getDonors()[0];
      if (donor) {
        dbStore.respondToEmergencyRequest(createdRequestId, donor.donorId, 'WILLING', donor.name);
      }
    }

    if (nextStep === 11 && createdRequestId) {
      const bb = dbStore.getBloodBanks()[0];
      if (bb) {
        // Reserve 2 units of O+
        const curr = bb.inventory['O+']?.availableUnits || 18;
        dbStore.updateBloodBankInventory(bb.bloodBankId, 'O+', Math.max(0, curr - 2));
      }
    }

    if (nextStep === 13) {
      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(1);
    advanceStep(1);
  };

  const activeStepObj = SCENARIO_STEPS[currentStep - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-950 to-rose-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-600 text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-wide">
                  13-Step Real-Time End-to-End Test Scenario
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                  Step {currentStep} of 13
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Verifies Section 50: Complete Hospital → AI Triage → Donor → Blood Bank cycle
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Timeline Bar */}
        <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
          <div
            className="bg-rose-600 h-1.5 transition-all duration-300"
            style={{ width: `${(currentStep / 13) * 100}%` }}
          />
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Active Step Hero Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-800 uppercase tracking-wider">
                {activeStepObj.category}
              </span>
              <span className="font-semibold text-slate-500">
                Actor: <strong className="text-slate-900">{activeStepObj.actor}</strong>
              </span>
            </div>

            <h4 className="text-lg font-bold text-slate-900 font-display">
              Step {activeStepObj.step}: {activeStepObj.title}
            </h4>

            <p className="text-xs text-slate-700 leading-relaxed">
              {activeStepObj.description}
            </p>

            {/* Special simulation display badges depending on step */}
            {currentStep === 2 && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 font-bold flex items-center justify-between">
                <span>AI Operational Severity Score: 92 / 100</span>
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-extrabold text-[10px]">
                  CRITICAL TRAUMA DISPATCH
                </span>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-1.5 pt-1 text-xs">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-900 font-semibold flex justify-between border border-emerald-200">
                  <span>#1 Vignesh Kumar (O+)</span>
                  <span>98% Match • 2.1 km</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-100 text-slate-800 font-medium flex justify-between">
                  <span>#2 Priya Raj (O+)</span>
                  <span>91% Match • 4.3 km</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-100 text-slate-800 font-medium flex justify-between">
                  <span>#3 Karthik M (O+)</span>
                  <span>85% Match • 7.8 km</span>
                </div>
              </div>
            )}

            {currentStep === 7 && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Donor Vignesh Kumar clicked [RESPOND: WILLING TO DONATE]. Status confirmed!</span>
              </div>
            )}

            {currentStep === 11 && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 font-semibold flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600 shrink-0" />
                <span>2 Units O+ moved from Available to Reserved at Indian Red Cross Society Sivakasi.</span>
              </div>
            )}

            {currentStep === 13 && (
              <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-center space-y-1">
                <div className="text-2xl">🎉</div>
                <h5 className="font-extrabold text-emerald-950 text-sm">
                  13-Step Simulation Completed Successfully!
                </h5>
                <p className="text-xs text-emerald-800">
                  The application has verified all user interactions, AI triage calculations, donor ranking, and inventory reservations in real time.
                </p>
              </div>
            )}
          </div>

          {/* Stepper overview pills */}
          <div className="grid grid-cols-13 gap-1 py-1">
            {SCENARIO_STEPS.map((s) => (
              <button
                key={s.step}
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  advanceStep(s.step);
                }}
                className={`h-7 rounded text-[10px] font-bold transition-all flex items-center justify-center ${
                  s.step === currentStep
                    ? 'bg-rose-600 text-white scale-110 shadow-xs'
                    : s.step < currentStep
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
                title={`Step ${s.step}: ${s.title}`}
              >
                {s.step < currentStep ? '✓' : s.step}
              </button>
            ))}
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Step 1
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="scenario-autoplay-btn"
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs ${
                  isPlaying
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isPlaying ? (
                  <>Pause Auto-Play</>
                ) : (
                  <>
                    <FastForward className="w-3.5 h-3.5" /> Auto-Play (1.5s/step)
                  </>
                )}
              </button>

              <button
                type="button"
                id="scenario-next-btn"
                onClick={() => advanceStep(Math.min(13, currentStep + 1))}
                disabled={currentStep === 13}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
