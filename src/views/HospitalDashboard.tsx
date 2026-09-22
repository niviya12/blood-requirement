import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  PlusCircle,
  Search,
  Building2,
  AlertOctagon,
  Clock,
  CheckCircle2,
  Sparkles,
  MapPin,
  Send,
  Phone,
  ShieldCheck,
  Package,
  Layers,
  FileText,
} from 'lucide-react';
import { BloodBank, BloodGroup, BloodRequest, Donor, Hospital, Priority, UserAccount } from '../types';
import { dbStore } from '../services/store';
import { StatCard } from '../components/StatCard';
import { calculateSeverityScore } from '../utils/severityScore';
import { rankDonorsForRequest } from '../utils/matchingAlgorithm';
import { MapView } from '../components/MapView';
import { calculateHaversineDistance, getApproximateLocationText } from '../utils/distanceCalculator';
import { MedicalSafetyDisclaimer, SeverityDisclaimer } from '../components/Disclaimers';

interface HospitalDashboardProps {
  currentUser: UserAccount;
  hospital: Hospital;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export function HospitalDashboard({
  currentUser,
  hospital,
  activeTab = 'dashboard',
  onSelectTab,
}: HospitalDashboardProps) {
  const [currentTab, setCurrentTab] = useState(activeTab);

  // Form state for creating blood request (Section 17)
  const [requestForm, setRequestForm] = useState({
    patientName: 'Ramesh Sundaram',
    patientAge: 38,
    bloodGroup: 'O+' as BloodGroup,
    unitsRequired: 2,
    priority: 'CRITICAL' as Priority,
    caseType: 'Accident / Trauma',
    requiredDate: new Date().toISOString().split('T')[0],
    requiredTime: 'IMMEDIATELY (< 1 hour)',
    doctorName: 'Dr. S. K. Narayanan, MS Ortho',
    notes: 'Severe compound fracture with arterial bleed requiring immediate transfusion during surgery.',
  });

  const [createdRequestSuccess, setCreatedRequestSuccess] = useState<{
    request: BloodRequest;
    matchedDonorsCount: number;
    nearestBloodBankName: string;
  } | null>(null);

  // Filter state for Find Donors
  const [donorFilterGroup, setDonorFilterGroup] = useState<BloodGroup | 'ALL'>('O+');
  const [donorFilterRadius, setDonorFilterRadius] = useState<number>(25);

  // Filter state for Blood Banks
  const [bbSearchGroup, setBbSearchGroup] = useState<BloodGroup | 'ALL'>('O+');

  const requests = dbStore.getBloodRequests().filter((r) => r.hospitalId === hospital.hospitalId);
  const allRequests = dbStore.getBloodRequests();
  const donors = dbStore.getDonors();
  const bloodBanks = dbStore.getBloodBanks();

  // Real-time AI Severity preview calculation (Section 18 & 31)
  const calculatedSeverity = calculateSeverityScore({
    caseType: requestForm.caseType as any,
    emergencyLevel: requestForm.priority,
    unitsRequired: Number(requestForm.unitsRequired) || 1,
  });

  // Calculate live stats
  const activeRequests = requests.filter((r) => r.status === 'OPEN');
  const fulfilledRequests = requests.filter((r) => r.status === 'FULFILLED');
  const totalResponding = requests.reduce((acc, r) => acc + (r.respondingDonorIds?.length || 0), 0);

  // Handle Blood Request Creation (Section 17, 18, 19)
  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();

    const newReq = dbStore.createBloodRequest({
      hospitalId: hospital.hospitalId,
      hospitalName: hospital.hospitalName,
      patientName: requestForm.patientName,
      patientAge: Number(requestForm.patientAge),
      bloodGroup: requestForm.bloodGroup,
      unitsRequired: Number(requestForm.unitsRequired),
      priority: requestForm.priority,
      caseType: requestForm.caseType,
      requiredDate: requestForm.requiredDate,
      requiredTime: requestForm.requiredTime,
      doctorName: requestForm.doctorName,
      notes: requestForm.notes,
      district: hospital.district,
      city: hospital.city,
      latitude: hospital.latitude,
      longitude: hospital.longitude,
    });

    // Rank matching donors for feedback
    const rankedDonors = rankDonorsForRequest(
      newReq.bloodGroup,
      newReq.latitude,
      newReq.longitude,
      donors,
      25,
      true
    );
    const nearestBB = bloodBanks[0]?.name || 'Regional Blood Bank';

    setCreatedRequestSuccess({
      request: newReq,
      matchedDonorsCount: rankedDonors.length,
      nearestBloodBankName: nearestBB,
    });

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#e11d48', '#2563eb'],
      });
    } catch (e) {
      // ignore
    }
  };

  const handleFulfillRequest = (requestId: string) => {
    dbStore.fulfillBloodRequest(requestId, {
      type: 'hospital' as any,
      sourceId: hospital.hospitalId,
      sourceName: hospital.hospitalName,
      units: 1,
    });
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  };

  // Find Donors filtered & ranked
  const filteredDonors = rankDonorsForRequest(
    donorFilterGroup === 'ALL' ? 'O+' : donorFilterGroup,
    hospital.latitude,
    hospital.longitude,
    donors.filter((d) => (donorFilterGroup === 'ALL' ? true : d.bloodGroup === donorFilterGroup)),
    donorFilterRadius,
    true
  );


  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 border-2 border-indigo-400 flex items-center justify-center text-2xl font-bold shadow-lg shadow-indigo-900/40">
              🏥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white font-display">
                  {hospital.hospitalName}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  {hospital.verificationStatus}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span>{hospital.city}, {hospital.district}</span>
                <span className="text-slate-500">•</span>
                <span>Emergency Contact: {hospital.emergencyContact}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            id="hospital-create-req-banner-btn"
            onClick={() => {
              setCurrentTab('create_request');
              setCreatedRequestSuccess(null);
            }}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            CREATE BLOOD REQUEST
          </button>
        </div>
      </div>

      <MedicalSafetyDisclaimer compact />

      {/* Hospital Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'dashboard', label: 'Dashboard Overview' },
          { id: 'create_request', label: 'Create Blood Request' },
          { id: 'find_donors', label: 'Find Donors (AI Matched)' },
          { id: 'find_blood_banks', label: 'Find Blood Banks' },
          { id: 'live_map', label: 'Live Map Radar' },
          { id: 'request_history', label: 'Request History' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setCurrentTab(tab.id);
              if (tab.id === 'create_request') setCreatedRequestSuccess(null);
            }}
            className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap ${
              currentTab === tab.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: DASHBOARD OVERVIEW */}
      {currentTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Active Emergency Requests"
              value={activeRequests.length}
              subValue="Pending fulfillment"
              icon={<AlertOctagon className="w-5 h-5 text-rose-600" />}
              badge={`${activeRequests.filter((r) => r.priority === 'CRITICAL').length} Critical`}
              badgeColor="rose"
              highlight={activeRequests.some((r) => r.priority === 'CRITICAL')}
            />
            <StatCard
              label="Total Fulfilled"
              value={fulfilledRequests.length}
              subValue="Cases successfully resolved"
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              badge="100% Verified"
              badgeColor="emerald"
            />
            <StatCard
              label="Donors Responded"
              value={totalResponding}
              subValue="Willing donors ready"
              icon={<Sparkles className="w-5 h-5 text-blue-600" />}
              badge="En Route"
              badgeColor="blue"
            />
            <StatCard
              label="Regional Blood Banks"
              value={bloodBanks.length}
              subValue="Connected in network"
              icon={<Building2 className="w-5 h-5 text-indigo-600" />}
              badge="Live Inventory"
              badgeColor="blue"
            />
          </div>

          {/* Active Requests Table */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Current Hospital Blood Requests
                </h3>
                <p className="text-xs text-slate-500">
                  Track dispatch status, AI severity index, and donor willingness
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentTab('create_request')}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs transition-colors"
              >
                + New Request
              </button>
            </div>

            {requests.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No active or historical requests recorded for this hospital.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-y border-slate-100">
                    <tr>
                      <th className="py-3 px-3">Req ID / Time</th>
                      <th className="py-3 px-3">Blood Group</th>
                      <th className="py-3 px-3">Patient / Case</th>
                      <th className="py-3 px-3">Units</th>
                      <th className="py-3 px-3">Severity</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Donors Responding</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requests.map((req) => (
                      <tr key={req.requestId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-slate-900">{req.requestId.slice(-6).toUpperCase()}</span>
                          <span className="text-[10px] text-slate-400 block">{req.requiredTime}</span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-rose-100 text-rose-800">
                            {req.bloodGroup}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-semibold text-slate-800 block">{req.patientName}</span>
                          <span className="text-[11px] text-slate-500">{req.caseType}</span>
                        </td>
                        <td className="py-3.5 px-3 font-bold text-slate-900">
                          {req.unitsRequired} Units
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-rose-600">{req.severityScore}/100</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                req.priority === 'CRITICAL'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {req.priority}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              req.status === 'OPEN'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-semibold text-emerald-600">
                            {req.respondingDonorIds.length} Donors Willing
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          {req.status === 'OPEN' ? (
                            <button
                              type="button"
                              onClick={() => handleFulfillRequest(req.requestId)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors"
                            >
                              Mark Fulfilled ✓
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CREATE BLOOD REQUEST (Sections 17, 18, 19) */}
      {currentTab === 'create_request' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {createdRequestSuccess ? (
            /* Section 19: Request Created Success Confirmation Banner */
            <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl">
                ✓
              </div>
              <div>
                <h3 className="text-xl font-bold text-emerald-950 font-display">
                  REQUEST CREATED & DONOR MATCHING INITIATED
                </h3>
                <p className="text-xs text-emerald-800 mt-1">
                  Automated smart matching dispatched alerts to compatible nearby donors and regional blood centers.
                </p>
              </div>

              {/* Confirmation details */}
              <div className="p-4 rounded-xl bg-white border border-emerald-200 text-left grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Priority:</span>
                  <span className="font-bold text-rose-600 uppercase">
                    {createdRequestSuccess.request.priority}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Severity Score:</span>
                  <span className="font-bold text-rose-600 text-base">
                    {createdRequestSuccess.request.severityScore} / 100
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Donors Notified:</span>
                  <span className="font-bold text-emerald-600 text-base">
                    {createdRequestSuccess.matchedDonorsCount} Compatible Donors
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Nearest Blood Bank:</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {createdRequestSuccess.nearestBloodBankName}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentTab('find_donors')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                >
                  View Matched Donors Ranking
                </button>
                <button
                  type="button"
                  onClick={() => setCreatedRequestSuccess(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Create Another Request
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Column */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      Emergency Blood Requirement Form
                    </h3>
                    <p className="text-xs text-slate-500">
                      Dispatches immediate alerts to donors within transit radius
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700">
                    Trauma Dispatch Mode
                  </span>
                </div>

                <form onSubmit={handleCreateRequest} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Patient Name *
                      </label>
                      <input
                        type="text"
                        id="req-patient-name"
                        value={requestForm.patientName}
                        onChange={(e) => setRequestForm({ ...requestForm, patientName: e.target.value })}
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Patient Age
                      </label>
                      <input
                        type="number"
                        id="req-patient-age"
                        value={requestForm.patientAge}
                        onChange={(e) => setRequestForm({ ...requestForm, patientAge: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Blood Group *
                      </label>
                      <select
                        id="req-blood-group"
                        value={requestForm.bloodGroup}
                        onChange={(e) => setRequestForm({ ...requestForm, bloodGroup: e.target.value as BloodGroup })}
                        className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-rose-600 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Units Needed *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        id="req-units"
                        value={requestForm.unitsRequired}
                        onChange={(e) => setRequestForm({ ...requestForm, unitsRequired: Number(e.target.value) })}
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Priority Level *
                      </label>
                      <select
                        id="req-priority"
                        value={requestForm.priority}
                        onChange={(e) => setRequestForm({ ...requestForm, priority: e.target.value as Priority })}
                        className="w-full px-2 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="CRITICAL">CRITICAL (&lt; 1hr)</option>
                        <option value="URGENT">URGENT (&lt; 6hr)</option>
                        <option value="NORMAL">NORMAL (&lt; 24hr)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Clinical Case Type *
                      </label>
                      <select
                        id="req-case-type"
                        value={requestForm.caseType}
                        onChange={(e) => setRequestForm({ ...requestForm, caseType: e.target.value })}
                        className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Accident / Trauma">Accident / Trauma</option>
                        <option value="Surgery">Major Surgery</option>
                        <option value="Delivery / Maternal">Delivery / Maternal Emergency</option>
                        <option value="Thalassemia">Thalassemia / Dialysis</option>
                        <option value="Cancer / Oncology">Cancer / Oncology Care</option>
                        <option value="General Emergency">General Emergency</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Timeframe Required
                      </label>
                      <input
                        type="text"
                        value={requestForm.requiredTime}
                        onChange={(e) => setRequestForm({ ...requestForm, requiredTime: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Attending Doctor & Dept
                    </label>
                    <input
                      type="text"
                      value={requestForm.doctorName}
                      onChange={(e) => setRequestForm({ ...requestForm, doctorName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Clinical Notes & Specifications
                    </label>
                    <textarea
                      rows={2}
                      value={requestForm.notes}
                      onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                      placeholder="e.g. Cross-matching in progress at lab..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    id="submit-blood-request-btn"
                    className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    BROADCAST EMERGENCY REQUEST & NOTIFY DONORS
                  </button>
                </form>
              </div>

              {/* AI Severity Live Engine Sidecard (Section 18 & 31) */}
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-indigo-950 text-white border border-slate-800 shadow-md space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-400" />
                    <h4 className="font-bold text-sm">
                      AI Operational Severity Engine
                    </h4>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                      Calculated Severity Index
                    </span>
                    <div className="text-3xl font-black text-rose-400 mt-1 font-display">
                      {calculatedSeverity.score} <span className="text-xs text-slate-400">/ 100</span>
                    </div>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {calculatedSeverity.priority} PRIORITY
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-rose-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${calculatedSeverity.score}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Auto-triggers critical push radius when &gt; 80
                    </span>
                  </div>

                  {/* Breakdown details */}
                  <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Clinical Case Weight:</span>
                      <span className="font-semibold text-white">{calculatedSeverity.caseWeight} pts</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Volume Scarcity:</span>
                      <span className="font-semibold text-white">{calculatedSeverity.unitsWeight} pts</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Time Urgency:</span>
                      <span className="font-semibold text-white">{calculatedSeverity.urgencyWeight} pts</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Regional Blood Deficit:</span>
                      <span className="font-semibold text-white">{calculatedSeverity.stockScarcityWeight} pts</span>
                    </div>
                  </div>

                </div>

                <SeverityDisclaimer />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FIND DONORS (Section 20 & 30 Smart Matching) */}
      {currentTab === 'find_donors' && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">Filter Donors:</span>

              <select
                value={donorFilterGroup}
                onChange={(e) => setDonorFilterGroup(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-rose-600 bg-white"
              >
                <option value="ALL">All Compatible Groups</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>

              <select
                value={donorFilterRadius}
                onChange={(e) => setDonorFilterRadius(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
              >
                <option value={5}>Within 5 km</option>
                <option value={10}>Within 10 km</option>
                <option value={25}>Within 25 km</option>
                <option value={50}>Within 50 km</option>
              </select>
            </div>

            <span className="text-xs font-semibold text-slate-500">
              {filteredDonors.length} Eligible Nearby Donors
            </span>
          </div>

          {/* Privacy Note */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Privacy Protection:</strong> Donor residential streets are masked. Only validated hospital dispatchers can send notification requests or access emergency communication channels.
            </span>
          </div>

          {/* Donors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDonors.map((match) => {
              const d = match.donor;
              return (
                <div
                  key={d.donorId}
                  className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center font-extrabold text-sm text-rose-600">
                        {d.bloodGroup}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{d.name}</h4>
                        <span className="text-[11px] text-slate-400">
                          {getApproximateLocationText(d.city, d.district, match.match.distanceKm)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {match.match.matchScore}% Match
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-semibold text-emerald-600">
                        {d.available ? 'Available 🟢' : 'Unavailable ⚪'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transit Distance:</span>
                      <span className="font-bold text-slate-800">~{match.match.distanceKm} km</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Last Donated:</span>
                      <span>{d.lastDonationDate || 'First time donor'}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      dbStore.addNotification({
                        receiverId: d.userId,
                        type: 'EMERGENCY_REQUEST',
                        priority: 'CRITICAL',
                        title: `Emergency Blood Alert from ${hospital.hospitalName}`,
                        message: `Urgent requirement for ${d.bloodGroup} at ${hospital.hospitalName}. Please open RaktaLink to respond if available.`,
                      });
                      alert(`Emergency notification dispatched to ${d.name}!`);
                    }}
                    className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Notify Donor Directly
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: FIND BLOOD BANKS (Section 21) */}
      {currentTab === 'find_blood_banks' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bloodBanks.map((bb) => (
              <div
                key={bb.bloodBankId}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{bb.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {bb.city}, {bb.district} • Lic: {bb.registrationId}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                    Govt Certified
                  </span>
                </div>

                {/* 8 Blood Groups Inventory Display */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
                    Available Units In Stock:
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(bb.inventory).map(([bg, inv]) => (
                      <div
                        key={bg}
                        className={`p-2 rounded-lg border text-center ${
                          inv.availableUnits < 5
                            ? 'bg-amber-50 border-amber-200 text-amber-900'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <span className="text-[10px] font-bold block">{bg}</span>
                        <span className="text-xs font-black">{inv.availableUnits}u</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {bb.emergencyContact}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      alert(`Emergency reservation order initiated with ${bb.name}. Contacting dispatch desk.`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors"
                  >
                    Reserve Units
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: LIVE RADAR MAP */}
      {currentTab === 'live_map' && (
        <div className="space-y-4">
          <MapView
            centerLat={hospital.latitude}
            centerLon={hospital.longitude}
            donors={donors}
            hospitals={[hospital]}
            bloodBanks={bloodBanks}
            requests={requests}
            selectedRadiusKm={25}
            heightClass="h-[600px]"
          />
        </div>
      )}

      {/* TAB 6: REQUEST HISTORY */}
      {currentTab === 'request_history' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Hospital Requisition Log</h3>
          <div className="divide-y divide-slate-100 text-xs">
            {requests.map((r) => (
              <div key={r.requestId} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">{r.requestId}</span> — {r.bloodGroup} ({r.unitsRequired} units) for {r.patientName}
                  <span className="text-[11px] text-slate-500 block">{r.caseType} • Required {r.requiredTime}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    r.status === 'FULFILLED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
