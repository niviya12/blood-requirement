import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldAlert,
  Users,
  Building2,
  Package,
  TrendingUp,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  RotateCcw,
  Sparkles,
  MapPin,
  Clock,
  Radio,
  Sliders,
} from 'lucide-react';
import { BloodGroup, Role, UserAccount, BloodRequest, SystemLog } from '../types';
import { dbStore } from '../services/store';
import { StatCard } from '../components/StatCard';
import { DemandPredictionCharts } from '../components/DemandPredictionCharts';
import { rankDonorsForRequest } from '../utils/matchingAlgorithm';
import { MapView } from '../components/MapView';

interface AdminDashboardProps {
  currentUser: UserAccount;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export function AdminDashboard({
  currentUser,
  activeTab = 'dashboard',
  onSelectTab,
}: AdminDashboardProps) {
  const [currentTab, setCurrentTab] = useState(activeTab);

  // Simulator for Donor Matching Hub (Section 30)
  const [simGroup, setSimGroup] = useState<BloodGroup>('O+');
  const [simRadius, setSimRadius] = useState<number>(25);

  const stats = dbStore.getSystemSummaryStats();
  const donors = dbStore.getDonors();
  const hospitals = dbStore.getHospitals();
  const bloodBanks = dbStore.getBloodBanks();
  const requests = dbStore.getBloodRequests();
  const auditLogs = dbStore.getAuditLogs();

  const handleVerifyHospital = (hospitalId: string, approve: boolean) => {
    dbStore.verifyHospital(hospitalId, approve ? 'VERIFIED' : 'REJECTED');
    if (approve) {
      try {
        confetti({ particleCount: 50, spread: 50 });
      } catch (e) {
        // ignore
      }
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset database to clean default seed data?')) {
      dbStore.resetToDefaults();
      window.location.reload();
    }
  };

  // Run matching simulator
  const simMatches = rankDonorsForRequest(
    simGroup,
    9.4533, // Sivakasi center
    77.7979,
    donors,
    simRadius,
    true
  );


  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950 text-white shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-600 border-2 border-rose-400 flex items-center justify-center text-2xl font-bold shadow-lg shadow-rose-900/40">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white font-display">
                  Central Healthcare Administration
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  State Operations Hub
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Regional dispatch oversight across Sivakasi, Virudhunagar, Madurai & South Tamil Nadu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetData}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            Reset Seed Data
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs (Section 35 & 48) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'dashboard', label: 'System Overview' },
          { id: 'donor_matching', label: 'Donor Matching Hub' },
          { id: 'demand_prediction', label: 'Demand Prediction (ML)' },
          { id: 'donors', label: `Donors (${donors.length})` },
          { id: 'hospitals', label: `Hospitals (${hospitals.length})` },
          { id: 'blood_banks', label: `Blood Banks (${bloodBanks.length})` },
          { id: 'live_map', label: 'Live Geo Radar' },
          { id: 'system_logs', label: `Audit Logs (${auditLogs.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCurrentTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap ${
              currentTab === tab.id
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: SYSTEM OVERVIEW */}
      {currentTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Top 6 Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <StatCard
              label="Total Donors"
              value={stats.totalDonors}
              subValue={`${stats.availableDonors} Available`}
              icon={<Users className="w-4 h-4 text-rose-600" />}
              badge="Active"
              badgeColor="emerald"
            />
            <StatCard
              label="Hospitals"
              value={stats.totalHospitals}
              subValue="5 In Network"
              icon={<Building2 className="w-4 h-4 text-indigo-600" />}
              badge="Licensed"
              badgeColor="blue"
            />
            <StatCard
              label="Blood Banks"
              value={stats.totalBloodBanks}
              subValue="3 Centers"
              icon={<Package className="w-4 h-4 text-blue-600" />}
              badge="Certified"
              badgeColor="blue"
            />
            <StatCard
              label="Active Requests"
              value={stats.openRequests}
              subValue={`${stats.criticalRequests} Critical`}
              icon={<ShieldAlert className="w-4 h-4 text-rose-600" />}
              badge={stats.criticalRequests > 0 ? 'Urgent' : 'Normal'}
              badgeColor="rose"
              highlight={stats.criticalRequests > 0}
            />
            <StatCard
              label="Fulfilled"
              value={stats.fulfilledRequests}
              subValue="Successfully saved"
              icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              badge="100% Verified"
              badgeColor="emerald"
            />
            <StatCard
              label="Bank Units"
              value={stats.totalUnitsInStock}
              subValue="Reserve units"
              icon={<Sparkles className="w-4 h-4 text-indigo-600" />}
              badge="8 Groups"
              badgeColor="blue"
            />
          </div>

          {/* Live System Requests Overview */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Live Regional Emergency Queue
                </h3>
                <p className="text-xs text-slate-500">
                  Global feed of patient requirements, triage scores, and dispatch logs
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {requests.length} Total Historical
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-y border-slate-100">
                  <tr>
                    <th className="py-3 px-3">Req ID</th>
                    <th className="py-3 px-3">Hospital</th>
                    <th className="py-3 px-3">Patient & Diagnosis</th>
                    <th className="py-3 px-3">Group</th>
                    <th className="py-3 px-3">Units</th>
                    <th className="py-3 px-3">Severity Score</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Donors Willing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((r: BloodRequest) => (
                    <tr key={r.requestId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {r.requestId.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {r.hospitalName}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{r.patientName || r.patientId}</span>
                        <span className="text-[11px] text-slate-500">{r.caseType}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-rose-100 text-rose-800">
                          {r.bloodGroup}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {r.unitsRequired} Units
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-rose-600">{r.severityScore}/100</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === 'OPEN'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600">
                        {r.respondingDonorIds.length} Donors
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DONOR MATCHING HUB (Section 30) */}
      {currentTab === 'donor_matching' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  AI Smart Matching Algorithm Simulator
                </h3>
                <p className="text-xs text-slate-500">
                  Simulate ranking for any blood group based on eligibility, distance, interval & responsiveness
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={simGroup}
                  onChange={(e) => setSimGroup(e.target.value as BloodGroup)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-rose-600 bg-white"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>
                      Simulate {bg}
                    </option>
                  ))}
                </select>

                <select
                  value={simRadius}
                  onChange={(e) => setSimRadius(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
                >
                  <option value={10}>10 km Radius</option>
                  <option value={25}>25 km Radius</option>
                  <option value={50}>50 km Radius</option>
                </select>
              </div>
            </div>

            {/* Formula Explanation Banner */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono">
              <strong>Match Score Formula:</strong> (Blood Compatibility × 40) + (Distance Proximity × 30) + (Interval Eligibility × 15) + (Response Reliability × 10) + (Emergency Availability × 5)
            </div>

            {/* Matching Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {simMatches.map((m, idx) => (
                <div
                  key={m.donor.donorId}
                  className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 font-extrabold flex items-center justify-center text-xs">
                        #{idx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{m.donor.name}</h4>
                        <span className="text-[11px] text-slate-400">
                          {m.donor.city} • ~{m.match.distanceKm} km away
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                      {m.match.matchScore}%
                    </span>

                  </div>

                  <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2 rounded-lg">
                    <div className="flex justify-between">
                      <span>Blood Group:</span>
                      <strong className="text-slate-900">{m.donor.bloodGroup}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Eligibility:</span>
                      <span className={m.donor.eligible ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                        {m.donor.eligible ? 'Eligible' : 'In Cooldown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Past Donations:</span>
                      <span>{m.donor.totalDonationsCount} donations</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DEMAND PREDICTION ML */}
      {currentTab === 'demand_prediction' && (
        <DemandPredictionCharts currentStockByGroup={stats.stockByGroup} />
      )}

      {/* TAB 4: MANAGE DONORS (Section 36) */}
      {currentTab === 'donors' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Registered Donors Directory
              </h3>
              <p className="text-xs text-slate-500">
                Total {donors.length} registered voluntary blood donors
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-y border-slate-100">
                <tr>
                  <th className="py-3 px-3">Donor Name</th>
                  <th className="py-3 px-3">Blood Group</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">District / City</th>
                  <th className="py-3 px-3">Emergency Status</th>
                  <th className="py-3 px-3">Total Donated</th>
                  <th className="py-3 px-3">Eligibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donors.map((d) => (
                  <tr key={d.donorId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">{d.name}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-rose-100 text-rose-800">
                        {d.bloodGroup}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{d.phone}</td>
                    <td className="py-3 px-3 text-slate-600">
                      {d.city}, {d.district}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.available ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {d.available ? 'AVAILABLE' : 'PAUSED'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {d.totalDonationsCount} Units
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.eligible ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {d.eligible ? 'ELIGIBLE' : 'COOLDOWN'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: MANAGE HOSPITALS (Section 37: Verify / Reject Hospitals) */}
      {currentTab === 'hospitals' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Hospital Network Verification
              </h3>
              <p className="text-xs text-slate-500">
                Review and approve medical licenses for trauma center dispatch authority
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-y border-slate-100">
                <tr>
                  <th className="py-3 px-3">Hospital Name</th>
                  <th className="py-3 px-3">Medical Reg. ID</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Emergency Contact</th>
                  <th className="py-3 px-3">Capacity</th>
                  <th className="py-3 px-3">Verification Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hospitals.map((h) => (
                  <tr key={h.hospitalId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{h.hospitalName}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{h.registrationId}</td>
                    <td className="py-3 px-3 text-slate-600">
                      {h.city}, {h.district}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{h.emergencyContact}</td>
                    <td className="py-3 px-3 text-slate-600">
                      {h.bedCapacity} Beds ({h.icuCapacity} ICU)
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          h.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : h.verificationStatus === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {h.verificationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {h.verificationStatus !== 'VERIFIED' ? (
                        <button
                          type="button"
                          onClick={() => handleVerifyHospital(h.hospitalId, true)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors"
                        >
                          Approve ✓
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleVerifyHospital(h.hospitalId, false)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: MANAGE BLOOD BANKS (Section 38) */}
      {currentTab === 'blood_banks' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bloodBanks.map((bb) => (
            <div key={bb.bloodBankId} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <h4 className="font-bold text-sm text-slate-900">{bb.name}</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                  {bb.verificationStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Lic: {bb.registrationId} • {bb.city}, {bb.district}
              </p>
              <div className="text-xs text-slate-600">
                Emergency: <strong>{bb.emergencyContact}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 7: LIVE GEO RADAR MAP */}
      {currentTab === 'live_map' && (
        <MapView
          donors={donors}
          hospitals={hospitals}
          bloodBanks={bloodBanks}
          requests={requests}
          selectedRadiusKm={30}
          heightClass="h-[620px]"
        />
      )}

      {/* TAB 8: AUDIT LOGS (Section 40) */}
      {currentTab === 'system_logs' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Real-Time System Audit Trail
              </h3>
              <p className="text-xs text-slate-500">
                Cryptographic immutable dispatch events and hospital requests
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Total {auditLogs.length} events logged
            </span>
          </div>

          <div className="divide-y divide-slate-100 font-mono text-[11px]">
            {auditLogs.slice(0, 20).map((log: any) => (
              <div key={log.id || log.logId} className="py-2.5 flex items-start justify-between gap-4">

                <div className="flex items-start gap-2.5">
                  <span className="text-slate-400 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                  </span>
                  <div>
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-800 font-bold mr-2">
                      {log.action}
                    </span>
                    <span className="text-slate-700">{log.details}</span>
                  </div>
                </div>
                <span className="text-slate-400 shrink-0">{log.actor}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
