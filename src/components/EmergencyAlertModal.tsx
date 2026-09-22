import React from 'react';
import confetti from 'canvas-confetti';
import { AlertCircle, Clock, MapPin, Building2, Droplets, CheckCircle, XCircle } from 'lucide-react';
import { BloodRequest, Donor } from '../types';
import { dbStore } from '../services/store';
import { calculateHaversineDistance, getApproximateLocationText } from '../utils/distanceCalculator';

interface EmergencyAlertModalProps {
  request: BloodRequest | null;
  donor: Donor;
  onClose: () => void;
}

export function EmergencyAlertModal({ request, donor, onClose }: EmergencyAlertModalProps) {
  if (!request) return null;

  const distance = calculateHaversineDistance(
    request.latitude,
    request.longitude,
    donor.latitude,
    donor.longitude
  );

  const hasAlreadyResponded = request.respondingDonorIds.includes(donor.donorId);

  const handleRespond = () => {
    dbStore.respondToEmergencyRequest(request.requestId, donor.donorId, 'WILLING', donor.name);
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e11d48', '#059669', '#2563eb'],
      });
    } catch (e) {
      // ignore
    }
  };

  const handleDecline = () => {
    dbStore.respondToEmergencyRequest(request.requestId, donor.donorId, 'DECLINE', donor.name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-rose-200 overflow-hidden">
        {/* Top Emergency Banner */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-red-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <h3 className="font-bold text-lg tracking-wide uppercase">
                Emergency Blood Request
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-white/20 text-white border border-white/30 backdrop-blur-xs">
              {request.priority} PRIORITY
            </span>
          </div>
          <p className="text-rose-100 text-xs mt-1">
            You are an eligible registered donor in the immediate transit radius.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-100 text-center">
              <span className="text-[11px] font-semibold text-rose-700 uppercase">Blood Group</span>
              <div className="text-2xl font-black text-rose-600 mt-0.5">{request.bloodGroup}</div>
              <span className="text-[10px] text-rose-500 font-medium">Compatible Match ✓</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Units Needed</span>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{request.unitsRequired}</div>
              <span className="text-[10px] text-slate-500 font-medium">Whole Blood Units</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Distance</span>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{distance} km</div>
              <span className="text-[10px] text-slate-500 font-medium">Est. 10–15 mins</span>
            </div>
          </div>

          {/* Hospital and Case Details */}
          <div className="space-y-2.5 rounded-xl bg-slate-50/70 p-4 border border-slate-200/80 text-xs">
            <div className="flex items-start gap-2.5">
              <Building2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500">Requesting Hospital:</span>
                <p className="font-semibold text-slate-900 text-sm mt-0.5">{request.hospitalName}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200/60">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500">Case Diagnosis & Context:</span>
                <p className="font-medium text-slate-800 mt-0.5">
                  <span className="font-semibold text-rose-700">{request.caseType}</span> — {request.notes || 'Emergency requirement for hospitalized trauma patient.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2 border-t border-slate-200/60 text-slate-600">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Timeframe: <strong>{request.requiredTime}</strong> ({request.requiredDate})</span>
            </div>

            <div className="flex items-center gap-2.5 text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Approx. Dispatch Hub: <strong>{getApproximateLocationText(request.city, request.district)}</strong></span>
            </div>
          </div>

          {/* Operational Severity Score Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">AI Operational Severity Index:</span>
              <span className="font-bold text-rose-600">{request.severityScore} / 100</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-rose-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${request.severityScore}%` }}
              />
            </div>
          </div>

          {hasAlreadyResponded ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
              <div className="inline-flex p-2 rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-emerald-900 text-sm">Response Recorded: WILLING TO DONATE</h4>
              <p className="text-xs text-emerald-800">
                The hospital blood bank team has been notified of your willingness. Please proceed safely to the hospital donor wing or await call.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
              >
                Close Window
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                id="emergency-respond-btn"
                onClick={handleRespond}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                RESPOND — WILLING TO DONATE
              </button>

              <button
                type="button"
                id="emergency-decline-btn"
                onClick={handleDecline}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                NOT AVAILABLE
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
