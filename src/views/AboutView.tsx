import React from 'react';
import { Shield, Heart, Building2, MapPin, Award, Lock, FileText } from 'lucide-react';
import { MedicalSafetyDisclaimer } from '../components/Disclaimers';

export function AboutView() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Hero */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700 uppercase tracking-wider">
          About RaktaLink
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 font-display">
          Bridging the Critical Minutes in Blood Supply
        </h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          RaktaLink is an operational coordination platform engineered to eliminate preventable delays in emergency blood procurement across hospitals, regional blood centres, and voluntary donors.
        </p>
      </div>

      <MedicalSafetyDisclaimer />

      {/* 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Voluntary Donor Respect</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Protecting donors from notification fatigue with smart interval tracking, proximity radius limits, and complete control over emergency availability toggles.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Privacy & Data Safeguards</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Exact donor addresses are never exposed. The system only provides approximate transit areas to authorized emergency responders during active medical incidents.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Verified Healthcare Network</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every hospital and blood bank on RaktaLink is verified by health authorities with registered government clinical establishment IDs and cold-chain compliance.
          </p>
        </div>
      </div>

      {/* Geographical Context & Demographics */}
      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-rose-600" />
          <span>Regional Hub: Virudhunagar & South Tamil Nadu</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Centered around Sivakasi, Thiruthangal, and Virudhunagar, RaktaLink provides rapid blood logistical support for industrial centers, agricultural belts, and highway trauma corridors connecting Madurai and Tirunelveli.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-white border border-slate-200">
            <span className="text-slate-400 block text-[11px]">Primary Center:</span>
            <strong className="text-slate-900">Sivakasi (9.45°N, 77.80°E)</strong>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200">
            <span className="text-slate-400 block text-[11px]">Transit Corridor:</span>
            <strong className="text-slate-900">NH-7 / SH-186 Highway</strong>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200">
            <span className="text-slate-400 block text-[11px]">Hospital Network:</span>
            <strong className="text-slate-900">5 Regional Trauma ICUs</strong>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200">
            <span className="text-slate-400 block text-[11px]">Blood Bank Hubs:</span>
            <strong className="text-slate-900">3 Cold-Chain Centers</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
