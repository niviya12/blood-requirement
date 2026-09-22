import React from 'react';
import {
  TrendingUp,
  AlertOctagon,
  Users,
  Send,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Cpu,
} from 'lucide-react';
import { MedicalSafetyDisclaimer, SeverityDisclaimer } from '../components/Disclaimers';

export function HowItWorksView() {
  const steps = [
    {
      num: '01',
      title: 'Hospital Requisition & Emergency Intake',
      actor: 'Licensed Medical Facility',
      desc: 'When an emergency surgery or trauma admission requires blood, attending physicians log blood group, required units, patient age, diagnosis type, and required delivery window.',
      points: [
        'Supports all 8 clinical blood groups (A+, A-, B+, B-, AB+, AB-, O+, O-)',
        'Classifies clinical priority: CRITICAL (< 1 hour), URGENT (< 6 hours), NORMAL (< 24 hours)',
        'Captures exact trauma ward coordinates for distance transit modeling',
      ],
    },
    {
      num: '02',
      title: 'AI Operational Severity Index (0–100)',
      actor: 'AI Clinical Triage Engine',
      desc: 'The algorithm evaluates the multi-dimensional urgency of the requisition, weighting clinical case category (e.g. arterial trauma), requested units, time urgency, and regional deficit.',
      points: [
        'Scores above 80 automatically engage Critical Trauma Dispatch mode',
        'Considers regional blood group rarity and stock levels across nearby blood banks',
        'Transparent mathematical scoring model for clinical audit compliance',
      ],
    },
    {
      num: '03',
      title: 'Smart Donor Matching & Geo-Proximity Ranking',
      actor: 'Multi-Factor Matching Service',
      desc: 'The system filters verified donors within the transit radius (5km–50km) and scores each candidate across ABO/Rh compatibility, distance, interval eligibility, and past responsiveness.',
      points: [
        'Applies strict 90-day male / 120-day female donation interval cooldowns',
        'Preserves donor privacy by masking residential street numbers (only approximate city & transit distance displayed)',
        'Scores candidates from 0–100% to identify the fastest potential responder',
      ],
    },
    {
      num: '04',
      title: 'Automated Broadcast & Donor Willingness Confirmation',
      actor: 'Emergency Push Network',
      desc: 'High-priority notifications are dispatched to top-ranked donor devices. When a donor accepts, their status transitions to WILLING TO DONATE and notifies the hospital surgical desk.',
      points: [
        'Donors can toggle Emergency Availability ON/OFF at any time',
        'Hospital receives real-time response ping with donor contact channel and estimated arrival time',
        'Blood bank reserves matching inventory simultaneously for redundancy',
      ],
    },
    {
      num: '05',
      title: 'Machine Learning Demand Forecasting',
      actor: 'Predictive Inventory Engine',
      desc: 'An ensemble gradient-boosted time-series model forecasts regional requirement trends 30 to 90 days in advance, predicting festive seasonal surges and supply bottlenecks.',
      points: [
        'Trained on regional demographic density, trauma history, and inpatient logs',
        'Provides early alerts for anticipated shortages by individual blood group',
        'Enables proactive voluntary donor drives before crisis events occur',
      ],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700 uppercase tracking-wider">
          System Architecture
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 font-display">
          How RaktaLink Coordinates Emergency Blood Dispatch
        </h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          A synchronized operational network connecting patients in trauma ICUs with nearby voluntary donors and cold-chain certified blood banks.
        </p>
      </div>

      {/* Safety Notice */}
      <MedicalSafetyDisclaimer />

      {/* Step by Step Breakdown */}
      <div className="space-y-6">
        {steps.map((step) => (
          <div
            key={step.num}
            className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-slate-900 text-white font-extrabold flex items-center justify-center text-sm font-mono">
                  {step.num}
                </span>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{step.title}</h3>
                  <span className="text-xs font-semibold text-rose-600">{step.actor}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">{step.desc}</p>

            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {step.points.map((pt, i) => (
                <li
                  key={i}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-start gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <SeverityDisclaimer />
    </div>
  );
}
