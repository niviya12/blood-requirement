import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  highlight?: boolean;
  badge?: string;
  badgeColor?: 'emerald' | 'rose' | 'amber' | 'blue';
}

export function StatCard({
  label,
  value,
  subValue,
  icon,
  trend,
  highlight = false,
  badge,
  badgeColor = 'blue',
}: StatCardProps) {
  const badgeClasses = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  }[badgeColor];

  return (
    <div
      className={`rounded-xl border p-5 transition-all duration-200 bg-white shadow-xs ${
        highlight
          ? 'border-rose-300 ring-1 ring-rose-200 bg-gradient-to-br from-white to-rose-50/30'
          : 'border-slate-200/80 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
          {label}
        </span>
        <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700">
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900 font-display">
          {value}
        </span>
        {subValue && (
          <span className="text-xs text-slate-500 font-medium">{subValue}</span>
        )}
      </div>

      {(trend || badge) && (
        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100">
          {trend && (
            <span
              className={`inline-flex items-center text-xs font-semibold ${
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
          {badge && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${badgeClasses}`}>
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
