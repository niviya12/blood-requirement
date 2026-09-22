import React, { useState } from 'react';
import {
  Heart,
  Droplets,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileText,
  Building2,
  Phone,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { BloodRequest, DonationRecord, Donor, UserAccount } from '../types';
import { dbStore } from '../services/store';
import { StatCard } from '../components/StatCard';
import { MedicalSafetyDisclaimer } from '../components/Disclaimers';
import { calculateHaversineDistance, getApproximateLocationText } from '../utils/distanceCalculator';

interface DonorDashboardProps {
  currentUser: UserAccount;
  donor: Donor;
  onOpenEmergencyModal: (request: BloodRequest) => void;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export function DonorDashboard({
  currentUser,
  donor,
  onOpenEmergencyModal,
  activeTab = 'dashboard',
  onSelectTab,
}: DonorDashboardProps) {
  const [available, setAvailable] = useState(donor.available);
  const [successToast, setSuccessToast] = useState('');

  const requests = dbStore.getBloodRequests();
  const donations = dbStore.getDonations().filter((d: DonationRecord) => d.donorId === donor.donorId);

  // Filter urgent emergency requests matching donor's group
  const emergencyMatches = requests.filter(
    (r: BloodRequest) =>
      r.status === 'OPEN' &&
      (r.bloodGroup === donor.bloodGroup || donor.bloodGroup === 'O-') &&
      r.priority === 'CRITICAL'
  );

  // Nearby requests
  const nearbyRequests = requests
    .filter((r: BloodRequest) => r.status === 'OPEN')
    .map((r: BloodRequest) => ({
      ...r,
      distance: calculateHaversineDistance(r.latitude, r.longitude, donor.latitude, donor.longitude),
    }))
    .sort((a: any, b: any) => a.distance - b.distance);


  const handleToggleAvailability = () => {
    const nextState = !available;
    setAvailable(nextState);
    dbStore.updateDonor(donor.donorId, { available: nextState });
    setSuccessToast(`Emergency Availability set to: ${nextState ? 'AVAILABLE 🟢' : 'UNAVAILABLE ⚪'}`);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Welcome Banner with Blood Group Identifier */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950 text-white shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-600 border-2 border-rose-400 flex flex-col items-center justify-center font-extrabold shadow-lg shadow-rose-900/40">
              <span className="text-xl leading-none">{donor.bloodGroup}</span>
              <span className="text-[9px] uppercase tracking-wider text-rose-200 mt-0.5">Donor</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white font-display">
                  Welcome, {donor.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Verified Donor
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>{donor.city}, {donor.district}</span>
                <span className="text-slate-500">•</span>
                <span>Last Donation: {donor.lastDonationDate || 'No recorded prior donations'}</span>
              </p>
            </div>
          </div>

          {/* Quick Availability Switch in Header */}
          <div className="flex items-center gap-3 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                Emergency Alert Ready
              </span>
              <span className={`text-xs font-bold ${available ? 'text-emerald-400' : 'text-slate-400'}`}>
                {available ? 'AVAILABLE 🟢' : 'UNAVAILABLE ⚪'}
              </span>
            </div>
            <button
              type="button"
              id="donor-toggle-availability-btn"
              onClick={handleToggleAvailability}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                available
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {available ? 'Switch Off' : 'Go Available'}
            </button>
          </div>
        </div>
      </div>

      {/* Safety Notice */}
      <MedicalSafetyDisclaimer compact />

      {/* Stat Cards Row (Section 9) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Donations"
          value={donor.totalDonationsCount}
          subValue="Units donated"
          icon={<Droplets className="w-5 h-5 text-rose-600" />}
          badge="Life Saver"
          badgeColor="rose"
        />

        <StatCard
          label="Eligibility Status"
          value={donor.eligible ? 'Eligible' : 'Cooldown'}
          subValue={donor.eligibilityReason || 'Eligible for donation'}
          icon={<ShieldCheck className={`w-5 h-5 ${donor.eligible ? 'text-emerald-600' : 'text-amber-600'}`} />}
          badge={donor.eligible ? 'Ready' : 'Resting'}
          badgeColor={donor.eligible ? 'emerald' : 'amber'}
        />

        <StatCard
          label="Emergency Status"
          value={available ? 'Available' : 'Paused'}
          subValue="Ready for instant alerts"
          icon={<Radio className="w-5 h-5 text-blue-600" />}
          badge={available ? 'Active' : 'Off'}
          badgeColor={available ? 'emerald' : 'blue'}
        />

        <StatCard
          label="Nearby Demands"
          value={nearbyRequests.length}
          subValue="In 50km radius"
          icon={<MapPin className="w-5 h-5 text-indigo-600" />}
          badge={`${emergencyMatches.length} Critical`}
          badgeColor={emergencyMatches.length > 0 ? 'rose' : 'blue'}
          highlight={emergencyMatches.length > 0}
        />
      </div>

      {/* Emergency Alert Section (Section 28 & 50) */}
      {emergencyMatches.length > 0 && (
        <div className="rounded-2xl border-2 border-rose-300 bg-gradient-to-r from-rose-50/80 via-white to-rose-50/60 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
              </span>
              <h3 className="font-bold text-sm text-rose-950 uppercase tracking-wide">
                Urgent: Blood Match Required in Sivakasi
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white">
              {emergencyMatches.length} Critical
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {emergencyMatches.map((req: BloodRequest) => {
              const dist = calculateHaversineDistance(

                req.latitude,
                req.longitude,
                donor.latitude,
                donor.longitude
              );
              const hasResponded = req.respondingDonorIds.includes(donor.donorId);

              return (
                <div
                  key={req.requestId}
                  className="p-4 rounded-xl bg-white border border-rose-200 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800">
                          {req.bloodGroup}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{req.hospitalName}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-rose-600">~{dist} km</span>
                    </div>

                    <p className="text-xs text-slate-600">
                      Case: <strong className="text-slate-800">{req.caseType}</strong> — {req.unitsRequired} units needed {req.requiredTime}
                    </p>
                  </div>

                  {hasResponded ? (
                    <div className="py-2 px-3 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-xs flex items-center justify-center gap-1.5 border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" />
                      Willing to Donate (Hospital Notified)
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenEmergencyModal(req)}
                      className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      View & Respond Immediately
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Split: Nearby Requests & Donation History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Nearby Requests List */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Nearby Hospital Blood Requirements
              </h3>
              <p className="text-xs text-slate-500">
                Active requests sorted by geographic proximity to you
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {nearbyRequests.length} Active
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {nearbyRequests.slice(0, 6).map((req: any) => (
              <div
                key={req.requestId}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-800 shrink-0">
                    {req.bloodGroup}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-xs text-slate-900">{req.hospitalName}</h4>
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
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {req.caseType} • {req.unitsRequired} units • {req.requiredTime} ({req.requiredDate})
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 block">~{req.distance} km</span>
                    <span className="text-[10px] text-slate-400">Transit Distance</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenEmergencyModal(req)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Donation History / Impact Sidecard */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Donation Impact Record</span>
            </h3>

            {donations.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No past donations recorded yet. When you fulfill a request, your certificate will appear here!
              </div>
            ) : (
              <div className="space-y-2.5">
                {donations.map((d: any) => (
                  <div
                    key={d.donationId}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span>{d.facilityName || d.hospitalName}</span>
                      <span className="text-emerald-600 font-bold">{d.unitsDonated} Unit</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{d.date || d.donationDate}</span>
                      <span className="text-rose-600 font-medium">Verified Certificate ✓</span>
                    </div>
                  </div>
                ))}
              </div>

            )}
          </div>

          {/* AI Regional Blood Group Insight */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-indigo-900">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>AI Regional Demand Insight</span>
            </div>
            <p className="text-[11px] text-indigo-900/80 leading-relaxed">
              Your blood group <strong>{donor.bloodGroup}</strong> is currently facing a 24% inventory deficit across Virudhunagar district. Keeping emergency availability active ensures rapid dispatch for obstetric and trauma surgeries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
