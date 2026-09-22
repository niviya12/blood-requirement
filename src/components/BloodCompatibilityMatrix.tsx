import React, { useState } from 'react';
import { BloodGroup } from '../types';
import { COMPATIBILITY_MATRIX } from '../utils/eligibility';

export function BloodCompatibilityMatrix() {
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup>('O+');
  const allGroups: BloodGroup[] = ['O-', 'O+', 'B-', 'B+', 'A-', 'A+', 'AB-', 'AB+'];

  const canReceiveFrom = COMPATIBILITY_MATRIX[selectedGroup] || [];

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900">
            Clinical Blood Group Compatibility Matrix
          </h3>
          <p className="text-xs text-slate-500">
            Interactive Red Blood Cell (RBC) donor-to-recipient transfusion suitability
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-semibold">Select Recipient:</span>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value as BloodGroup)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-rose-600 bg-white"
          >
            {allGroups.map((bg) => (
              <option key={bg} value={bg}>
                {bg} Recipient
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Interactive Helper Banner */}
      <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 text-xs text-rose-950 flex flex-wrap items-center justify-between gap-2">
        <div>
          A patient with <strong>{selectedGroup}</strong> can safely receive blood from:{' '}
          <strong className="text-rose-700">{canReceiveFrom.join(', ')}</strong>
        </div>
        {selectedGroup === 'O-' && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
            Universal Donor Group
          </span>
        )}
        {selectedGroup === 'AB+' && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
            Universal Recipient Group
          </span>
        )}
      </div>

      {/* 8x8 Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-center text-xs">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="py-2.5 px-3 text-left font-bold text-slate-700">Recipient ↓ / Donor →</th>
              {allGroups.map((bg) => (
                <th key={bg} className="py-2.5 px-2 font-bold text-slate-800">
                  {bg}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {allGroups.map((recipient) => {
              const isSelected = recipient === selectedGroup;
              const compatibleDonors = COMPATIBILITY_MATRIX[recipient] || [];

              return (
                <tr
                  key={recipient}
                  className={`transition-colors ${
                    isSelected ? 'bg-rose-50/80 font-semibold' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <td className="py-2.5 px-3 text-left font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-6 text-center">{recipient}</span>
                    {isSelected && (
                      <span className="text-[10px] text-rose-600 font-bold">Selected</span>
                    )}
                  </td>
                  {allGroups.map((donor) => {
                    const isMatch = compatibleDonors.includes(donor);
                    return (
                      <td key={donor} className="py-2.5 px-2">
                        {isMatch ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                            ✓
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-300 text-xs">
                            —
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
