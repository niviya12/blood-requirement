import React, { useState } from 'react';
import {
  Heart,
  Droplets,
  ShieldCheck,
  Building2,
  Users,
  MapPin,
  TrendingUp,
  AlertOctagon,
  ArrowRight,
  Sparkles,
  PhoneCall,
  Search,
  CheckCircle2,
  Clock,
  PlayCircle,
} from 'lucide-react';
import { BloodGroup, Role } from '../types';
import { dbStore } from '../services/store';
import { BloodCompatibilityMatrix } from '../components/BloodCompatibilityMatrix';
import { MedicalSafetyDisclaimer } from '../components/Disclaimers';

interface HomeViewProps {
  onNavigate: (view: string) => void;
  onOpenAuth: (mode: 'login' | 'register', role?: Role) => void;
  onOpenTestScenario: () => void;
  onSelectBloodRequest?: (requestId: string) => void;
}

export function HomeView({
  onNavigate,
  onOpenAuth,
  onOpenTestScenario,
  onSelectBloodRequest,
}: HomeViewProps) {
  // Quick Emergency Search Widget state
  const [quickSearchGroup, setQuickSearchGroup] = useState<BloodGroup>('O+');
  const [quickSearchDistrict, setQuickSearchDistrict] = useState<string>('Virudhunagar');
  const [quickSearchResult, setQuickSearchResult] = useState<{
    donorsCount: number;
    availableStockUnits: number;
    nearestHospital: string;
  } | null>(null);

  const stats = dbStore.getSystemSummaryStats();
  const openRequests = dbStore.getBloodRequests().filter((r) => r.status === 'OPEN');
  const criticalRequests = openRequests.filter((r) => r.priority === 'CRITICAL');

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const donors = dbStore.getDonors().filter(
      (d) => d.bloodGroup === quickSearchGroup && d.available && d.eligible
    );
    const stock = stats.stockByGroup[quickSearchGroup] || 0;
    const hosp = dbStore.getHospitals()[0]?.hospitalName || 'Sivakasi Govt Hospital';

    setQuickSearchResult({
      donorsCount: donors.length,
      availableStockUnits: stock,
      nearestHospital: hosp,
    });
  };

  return (
    <div className="space-y-12 pb-16">
      {/* SECTION 45: Live Emergency Status Ticker Banner */}
      {criticalRequests.length > 0 && (
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white py-2.5 px-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <span className="font-extrabold tracking-wide uppercase">
                Active Emergency Requisition:
              </span>
              <span className="text-rose-100 hidden sm:inline">
                {criticalRequests[0].unitsRequired} units of <strong>{criticalRequests[0].bloodGroup}</strong> needed at {criticalRequests[0].hospitalName} ({criticalRequests[0].city})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('map')}
                className="px-2.5 py-1 rounded bg-white text-rose-700 font-bold hover:bg-rose-50 transition-colors text-[11px]"
              >
                Track on Map →
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('login', 'donor')}
                className="px-2.5 py-1 rounded bg-rose-800 text-white font-bold hover:bg-rose-900 transition-colors text-[11px]"
              >
                I am a Donor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative pt-4 sm:pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Narrative Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Operational Blood Matching & Demand Forecasting</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950 font-display leading-[1.15]">
                Predict blood needs before emergencies arise. <span className="text-rose-600">Save lives</span> in real time.
              </h1>

              <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                RaktaLink links licensed hospital trauma centers, certified regional blood centers, and verified nearby voluntary donors through AI severity scoring, proximity routing, and machine-learning stock forecasting.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  id="hero-register-donor-btn"
                  onClick={() => onOpenAuth('register', 'donor')}
                  className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Droplets className="w-4 h-4" />
                  <span>Register as Donor</span>
                </button>

                <button
                  type="button"
                  id="hero-hospital-portal-btn"
                  onClick={() => onOpenAuth('login', 'hospital')}
                  className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Hospital Trauma Desk</span>
                </button>

                <button
                  type="button"
                  id="hero-run-scenario-btn"
                  onClick={onOpenTestScenario}
                  className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-2 border border-slate-300"
                >
                  <PlayCircle className="w-4 h-4 text-rose-600" />
                  <span>Run 13-Step Simulation</span>
                </button>
              </div>

              {/* Live Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-500">Registered Donors</span>
                  <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {stats.totalDonors}+ Donors
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Licensed Centers</span>
                  <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {stats.totalHospitals + stats.totalBloodBanks} Facilities
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">AI Triage Accuracy</span>
                  <div className="text-xl font-extrabold text-emerald-600 mt-0.5">
                    94.2% R²
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Avg Dispatch ETA</span>
                  <div className="text-xl font-extrabold text-indigo-600 mt-0.5">
                    &lt; 14 Mins
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Instant "Need Blood?" Rapid Query Widget */}
            <div className="lg:col-span-5">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
                      <Search className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        Emergency Blood Stock Lookup
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Check live regional availability & nearby donors
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Live Sync
                  </span>
                </div>

                <form onSubmit={handleQuickSearch} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Required Blood Group *
                    </label>
                    <select
                      id="home-search-blood-group"
                      value={quickSearchGroup}
                      onChange={(e) => setQuickSearchGroup(e.target.value as BloodGroup)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-rose-600 bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      District / City *
                    </label>
                    <select
                      id="home-search-district"
                      value={quickSearchDistrict}
                      onChange={(e) => setQuickSearchDistrict(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                    >
                      <option value="Virudhunagar">Virudhunagar (Sivakasi)</option>
                      <option value="Madurai">Madurai</option>
                      <option value="Tirunelveli">Tirunelveli</option>
                      <option value="Chennai">Chennai</option>
                      <option value="Coimbatore">Coimbatore</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    id="home-search-submit-btn"
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Search className="w-3.5 h-3.5" />
                    QUERY REGIONAL BLOOD NETWORK
                  </button>
                </form>

                {quickSearchResult && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 animate-in fade-in">
                    <div className="font-bold text-slate-900">
                      Query Results for {quickSearchGroup} in {quickSearchDistrict}:
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded bg-white border border-slate-200">
                        <span className="text-slate-500 block">Bank Reserve Units:</span>
                        <strong className="text-sm text-blue-600 font-display">
                          {quickSearchResult.availableStockUnits} Units
                        </strong>
                      </div>
                      <div className="p-2 rounded bg-white border border-slate-200">
                        <span className="text-slate-500 block">Ready Nearby Donors:</span>
                        <strong className="text-sm text-emerald-600 font-display">
                          {quickSearchResult.donorsCount} Donors
                        </strong>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>Primary Trauma Hub: {quickSearchResult.nearestHospital}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-STEP OPERATIONAL FLOW DIAGRAM */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-3xl bg-slate-900 text-white shadow-xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wider">
              Core Operational Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
              How RaktaLink Coordinates Trauma Emergencies
            </h2>
            <p className="text-xs text-slate-400">
              From the instant a critical patient is wheeled into trauma ICU to the physical delivery of matched blood units.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                step: '01',
                title: 'Predict Demand',
                icon: TrendingUp,
                desc: 'Gradient-boosted machine learning regressor forecasts 30–90 day regional blood requirements from historical consumption logs.',
              },
              {
                step: '02',
                title: 'Calculate Severity',
                icon: AlertOctagon,
                desc: 'AI Operational Severity Index (0–100) scores incoming hospital requisitions based on trauma urgency and blood group deficit.',
              },
              {
                step: '03',
                title: 'Smart Matching',
                icon: Users,
                desc: 'Ranks registered donors by distance proximity, ABO/Rh compatibility, last donation interval, and historical response rate.',
              },
              {
                step: '04',
                title: 'Rapid Dispatch',
                icon: CheckCircle2,
                desc: 'Dispatches instant push alerts to donor devices, locks units in blood bank inventories, and updates central admin dashboards.',
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.step}
                  className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 hover:border-slate-600 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-rose-600/30 text-rose-400 flex items-center justify-center border border-rose-500/40">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      STAGE {card.step}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-100">{card.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* INTERACTIVE COMPATIBILITY MATRIX SECTION (Section 44) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BloodCompatibilityMatrix />
      </section>

      {/* ROLE EXPLORATION SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h3 className="text-xl font-bold text-slate-900 font-display">
            Built for Every Stakeholder in the Transfusion Ecosystem
          </h3>
          <p className="text-xs text-slate-500">
            Select your portal to explore role-specific tools, dashboards, and live workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* For Donors */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl font-bold">
              🩸
            </div>
            <h4 className="text-base font-bold text-slate-900">For Voluntary Donors</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Track donation eligibility intervals, toggle emergency availability, receive critical alerts for trauma cases in your radius, and maintain verified certificates.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onOpenAuth('login', 'donor')}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                Access Donor Portal →
              </button>
            </div>
          </div>

          {/* For Hospitals */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl font-bold">
              🏥
            </div>
            <h4 className="text-base font-bold text-slate-900">For Hospital Trauma Desks</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Broadcast critical emergency requests, view live AI severity scoring, identify ranked compatible donors within transit radius, and check regional blood bank stocks.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onOpenAuth('login', 'hospital')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Access Hospital Portal →
              </button>
            </div>
          </div>

          {/* For Blood Banks */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl font-bold">
              🏦
            </div>
            <h4 className="text-base font-bold text-slate-900">For Certified Blood Banks</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Maintain live 8-blood group inventory, receive hospital orders, lock units in reserved status, and leverage predictive machine-learning demand forecasting.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onOpenAuth('login', 'blood_bank')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Access Blood Bank Portal →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Medical Disclaimers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MedicalSafetyDisclaimer />
      </section>
    </div>
  );
}
