import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

export function MedicalSafetyDisclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900 leading-relaxed">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>Medical Safety Notice:</strong> RaktaLink is an operational prioritization and matching platform. Final donor eligibility and cross-matching must be verified clinically by qualified medical personnel.
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 p-4 text-xs text-amber-950">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-100 rounded-lg text-amber-700 shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-semibold text-amber-900 text-sm">Medical & Operational Compliance Notice</h4>
          <p className="text-amber-800 leading-relaxed">
            This platform facilitates emergency donor coordination, logistical routing, and predictive blood inventory management. It does not provide medical diagnoses, treatment decisions, or legal clinical certifications. All donors undergo mandatory pre-transfusion hemoglobin and serological screening at the receiving healthcare facility.
          </p>
        </div>
      </div>
    </div>
  );
}

export function SeverityDisclaimer() {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
      <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
      <div>
        <span className="font-medium text-slate-900">Operational Severity Index (0–100):</span>{' '}
        Calculated from clinical trauma case flags, units demanded, regional stock scarcity, and donor availability. Used strictly for dispatch prioritization, not clinical prognostic scoring.
      </div>
    </div>
  );
}
