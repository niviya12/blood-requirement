import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Package,
  AlertTriangle,
  Building2,
  CheckCircle2,
  TrendingUp,
  Plus,
  Minus,
  RefreshCw,
  Clock,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { BloodBank, BloodGroup, BloodRequest, UserAccount } from '../types';
import { dbStore } from '../services/store';
import { StatCard } from '../components/StatCard';
import { DemandPredictionCharts } from '../components/DemandPredictionCharts';
import { MedicalSafetyDisclaimer } from '../components/Disclaimers';

interface BloodBankDashboardProps {
  currentUser: UserAccount;
  bloodBank: BloodBank;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export function BloodBankDashboard({
  currentUser,
  bloodBank,
  activeTab = 'dashboard',
  onSelectTab,
}: BloodBankDashboardProps) {
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [localInventory, setLocalInventory] = useState(bloodBank.inventory);
  const [toastMsg, setToastMsg] = useState('');

  const requests = dbStore.getBloodRequests();
  const openRequests = requests.filter((r: BloodRequest) => r.status === 'OPEN');
  const hospitals = dbStore.getHospitals();


  // Inventory totals
  const totalAvailable = Object.values(localInventory).reduce((acc, i) => acc + i.availableUnits, 0);
  const totalReserved = Object.values(localInventory).reduce((acc, i) => acc + i.reservedUnits, 0);
  const lowStockCount = Object.values(localInventory).filter((i) => i.availableUnits < 8).length;

  const currentStockByGroup: Record<BloodGroup, number> = {
    'A+': localInventory['A+']?.availableUnits || 0,
    'A-': localInventory['A-']?.availableUnits || 0,
    'B+': localInventory['B+']?.availableUnits || 0,
    'B-': localInventory['B-']?.availableUnits || 0,
    'AB+': localInventory['AB+']?.availableUnits || 0,
    'AB-': localInventory['AB-']?.availableUnits || 0,
    'O+': localInventory['O+']?.availableUnits || 0,
    'O-': localInventory['O-']?.availableUnits || 0,
  };

  const handleUpdateUnit = (bg: BloodGroup, delta: number) => {
    const current = localInventory[bg]?.availableUnits || 0;
    const nextVal = Math.max(0, current + delta);
    dbStore.updateBloodBankInventory(bloodBank.bloodBankId, bg, nextVal);
    const updated = {
      ...localInventory,
      [bg]: {
        ...localInventory[bg],
        availableUnits: nextVal,
        lastUpdated: new Date().toISOString(),
      },
    };
    setLocalInventory(updated);
    setToastMsg(`Updated ${bg} stock to ${nextVal} units.`);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleFulfillEmergency = (req: BloodRequest) => {
    const bg = req.bloodGroup;
    const available = localInventory[bg]?.availableUnits || 0;

    if (available < req.unitsRequired) {
      alert(`Cannot fulfill: Only ${available} units of ${bg} in stock, but ${req.unitsRequired} required.`);
      return;
    }

    // Deduct stock
    handleUpdateUnit(bg, -req.unitsRequired);

    // Fulfill request in store
    dbStore.fulfillBloodRequest(req.requestId, {
      type: 'blood_bank',
      sourceId: bloodBank.bloodBankId,
      sourceName: bloodBank.name,
      units: req.unitsRequired,
    });

    // Notify hospital
    dbStore.addNotification({
      receiverId: req.hospitalId,
      type: 'REQUEST_FULFILLED',
      priority: 'CRITICAL',
      title: 'Blood Bank Stock Dispatched!',
      message: `${bloodBank.name} has dispatched ${req.unitsRequired} units of ${bg} for patient ${req.patientName || req.patientId}.`,
      requestId: req.requestId,
    });


    try {
      confetti({
        particleCount: 90,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#059669', '#e11d48'],
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 border-2 border-blue-400 flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-900/40">
              🏦
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white font-display">
                  {bloodBank.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Certified Regional Bank
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                License: {bloodBank.registrationId} • {bloodBank.city}, {bloodBank.district} • Contact: {bloodBank.emergencyContact}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              Live Stock: <strong className="text-white text-sm">{totalAvailable}</strong> Units
            </span>
          </div>
        </div>
      </div>

      <MedicalSafetyDisclaimer compact />

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'dashboard', label: 'Inventory & Operations' },
          { id: 'emergency_fulfill', label: `Emergency Requisitions (${openRequests.length})` },
          { id: 'demand_forecast', label: 'Demand Prediction (ML Engine)' },
          { id: 'hospitals', label: 'Connected Hospitals' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCurrentTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap ${
              currentTab === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: INVENTORY & OPERATIONS */}
      {currentTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Available Blood Units"
              value={totalAvailable}
              subValue="Across 8 blood groups"
              icon={<Package className="w-5 h-5 text-blue-600" />}
              badge="Normal Reserve"
              badgeColor="blue"
            />
            <StatCard
              label="Reserved / Quarantined"
              value={totalReserved}
              subValue="Committed for surgeries"
              icon={<Clock className="w-5 h-5 text-slate-600" />}
              badge="Locked"
              badgeColor="amber"
            />
            <StatCard
              label="Deficit / Low Groups"
              value={lowStockCount}
              subValue="Groups below threshold"
              icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
              badge={lowStockCount > 0 ? 'Replenish' : 'Healthy'}
              badgeColor={lowStockCount > 0 ? 'rose' : 'emerald'}
              highlight={lowStockCount > 0}
            />
            <StatCard
              label="Regional Hospitals"
              value={hospitals.length}
              subValue="Supplied in zone"
              icon={<Building2 className="w-5 h-5 text-indigo-600" />}
              badge="Connected"
              badgeColor="blue"
            />
          </div>

          {/* 8-Blood Groups Live Inventory Table (Section 25) */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Live Blood Inventory Registry (8 Blood Groups)
                </h3>
                <p className="text-xs text-slate-500">
                  Instant real-time stock adjustments with cross-tab broadcast synchronization
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Last verified: Just now
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-y border-slate-100">
                  <tr>
                    <th className="py-3 px-3">Blood Group</th>
                    <th className="py-3 px-3">Available Units</th>
                    <th className="py-3 px-3">Reserved</th>
                    <th className="py-3 px-3">Issued</th>
                    <th className="py-3 px-3">Inventory Status</th>
                    <th className="py-3 px-3 text-right">Quick Stock Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as BloodGroup[]).map((bg) => {
                    const inv = localInventory[bg] || {
                      bloodGroup: bg,
                      availableUnits: 0,
                      reservedUnits: 0,
                      issuedUnits: 0,
                      status: 'LOW',
                    };
                    const isLow = inv.availableUnits < 6;
                    const isCrit = inv.availableUnits < 3;

                    return (
                      <tr key={bg} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 font-black text-sm text-slate-900">
                            {bg}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="text-base font-bold text-slate-900 font-display">
                            {inv.availableUnits}
                          </span>
                          <span className="text-[11px] text-slate-500 ml-1">Units</span>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-600">
                          {inv.reservedUnits} Units
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-600">
                          {inv.issuedUnits} Units
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isCrit
                                ? 'bg-rose-100 text-rose-800'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isCrit ? 'CRITICAL DEFICIT' : isLow ? 'LOW STOCK' : 'NORMAL'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateUnit(bg, -1)}
                              disabled={inv.availableUnits <= 0}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30"
                              title="Deduct 1 unit"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center font-bold text-slate-800 text-xs">
                              {inv.availableUnits}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateUnit(bg, 1)}
                              className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                              title="Add 1 unit"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EMERGENCY REQUISITIONS FROM HOSPITALS (Section 26 & 27) */}
      {currentTab === 'emergency_fulfill' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Hospital Emergency Blood Requisitions
                </h3>
                <p className="text-xs text-slate-500">
                  Fulfill urgent hospital trauma needs directly from available bank reserves
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700">
                {openRequests.length} Open Requisitions
              </span>
            </div>

            {openRequests.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No open hospital requisitions in your dispatch territory.
              </div>
            ) : (
              <div className="space-y-3">
                {openRequests.map((req: BloodRequest) => {
                  const availableUnits = localInventory[req.bloodGroup]?.availableUnits || 0;

                  const canFulfill = availableUnits >= req.unitsRequired;

                  return (
                    <div
                      key={req.requestId}
                      className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-rose-100 text-rose-800">
                            {req.bloodGroup}
                          </span>
                          <h4 className="font-bold text-xs text-slate-900">{req.hospitalName}</h4>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              req.priority === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {req.priority}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Patient: <strong>{req.patientName}</strong> • {req.caseType} • {req.unitsRequired} Units Required
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Needed: {req.requiredTime} ({req.requiredDate}) • Severity Index: {req.severityScore}/100
                        </p>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-bold block text-slate-800">
                            {availableUnits} Units in Bank Stock
                          </span>
                          <span
                            className={`text-[10px] font-semibold ${
                              canFulfill ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {canFulfill ? 'Sufficient stock available' : 'Stock deficit!'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleFulfillEmergency(req)}
                          disabled={!canFulfill}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          DISPATCH & FULFILL
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DEMAND PREDICTION (ML FORECAST) */}
      {currentTab === 'demand_forecast' && (
        <DemandPredictionCharts currentStockByGroup={currentStockByGroup} />
      )}

      {/* TAB 4: CONNECTED HOSPITALS */}
      {currentTab === 'hospitals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hospitals.map((h) => (
            <div key={h.hospitalId} className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-start justify-between">
                <h4 className="font-bold text-xs text-slate-900">{h.hospitalName}</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  {h.verificationStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500">{h.city}, {h.district}</p>
              <div className="text-xs text-slate-600 pt-1 border-t border-slate-100">
                Contact: <strong>{h.emergencyContact}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
