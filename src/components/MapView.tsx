import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Building2,
  Droplets,
  Layers,
  ZoomIn,
  ZoomOut,
  Navigation2,
  Shield,
  Filter,
  Info,
} from 'lucide-react';
import { BloodBank, BloodGroup, BloodRequest, Donor, Hospital } from '../types';
import { calculateHaversineDistance, getApproximateLocationText } from '../utils/distanceCalculator';

interface MapViewProps {
  donors?: Donor[];
  hospitals?: Hospital[];
  bloodBanks?: BloodBank[];
  requests?: BloodRequest[];
  centerLat?: number;
  centerLon?: number;
  selectedRadiusKm?: number;
  highlightBloodGroup?: BloodGroup | 'ALL';
  onSelectEntity?: (type: 'donor' | 'hospital' | 'blood_bank' | 'request', entity: any) => void;
  heightClass?: string;
}

export function MapView({
  donors = [],
  hospitals = [],
  bloodBanks = [],
  requests = [],
  centerLat = 9.4533, // Sivakasi center
  centerLon = 77.7979,
  selectedRadiusKm = 25,
  highlightBloodGroup = 'ALL',
  onSelectEntity,
  heightClass = 'h-[500px]',
}: MapViewProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [filterLayer, setFilterLayer] = useState<'all' | 'donors' | 'hospitals' | 'blood_banks'>('all');
  const [activePin, setActivePin] = useState<any | null>(null);

  // SVG coordinate projection around center (latitude: 9.4533, longitude: 77.7979)
  // ~0.01 degree ~= 1.11 km
  const mapSpanKm = 60 / zoomLevel; // total visible width in km
  const kmPerDegLat = 110.574;
  const kmPerDegLon = 111.32 * Math.cos((centerLat * Math.PI) / 180);

  const projectCoords = (lat: number, lon: number): { x: number; y: number } => {
    const dLatKm = (lat - centerLat) * kmPerDegLat;
    const dLonKm = (lon - centerLon) * kmPerDegLon;

    // SVG width 800, height 600
    const centerX = 400;
    const centerY = 300;

    const scale = 360 / mapSpanKm; // pixels per km
    const x = centerX + dLonKm * scale;
    const y = centerY - dLatKm * scale; // invert Y for standard north-up coordinates

    return { x, y };
  };

  const centerPoint = { x: 400, y: 300 };

  // Calculate pixel radius for circle ring
  const radiusPx = (selectedRadiusKm * (360 / mapSpanKm));

  // Filter entities
  const visibleDonors = useMemo(() => {
    if (filterLayer !== 'all' && filterLayer !== 'donors') return [];
    return donors.filter((d) => {
      if (highlightBloodGroup !== 'ALL' && d.bloodGroup !== highlightBloodGroup) return false;
      const dist = calculateHaversineDistance(centerLat, centerLon, d.latitude, d.longitude);
      return dist <= selectedRadiusKm * 1.5;
    });
  }, [donors, centerLat, centerLon, selectedRadiusKm, highlightBloodGroup, filterLayer]);

  const visibleHospitals = useMemo(() => {
    if (filterLayer !== 'all' && filterLayer !== 'hospitals') return [];
    return hospitals;
  }, [hospitals, filterLayer]);

  const visibleBloodBanks = useMemo(() => {
    if (filterLayer !== 'all' && filterLayer !== 'blood_banks') return [];
    return bloodBanks;
  }, [bloodBanks, filterLayer]);

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm select-none`}>
      {/* Map Header Overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs font-medium text-slate-200 backdrop-blur-md">
          <Navigation2 className="w-3.5 h-3.5 text-rose-400" />
          <span>Sivakasi Region Hub</span>
          <span className="text-slate-400 text-[11px]">(9.45°N, 77.80°E)</span>
        </div>

        {/* Layer Filter Buttons */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900/90 border border-slate-700 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setFilterLayer('all')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
              filterLayer === 'all' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            All Pins
          </button>
          <button
            type="button"
            onClick={() => setFilterLayer('donors')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
              filterLayer === 'donors' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            🟢 Donors ({visibleDonors.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterLayer('hospitals')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
              filterLayer === 'hospitals' ? 'bg-rose-700 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            🔴 Hospitals
          </button>
          <button
            type="button"
            onClick={() => setFilterLayer('blood_banks')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
              filterLayer === 'blood_banks' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            🩸 Blood Banks
          </button>
        </div>
      </div>

      {/* Map Zoom Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.3))}
          className="p-2 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors shadow-md"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.3))}
          className="p-2 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors shadow-md"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* SVG Canvas Map */}
      <svg
        viewBox="0 0 800 600"
        className="w-full h-full cursor-grab active:cursor-grabbing"
        style={{ backgroundColor: '#0f172a' }}
      >
        <defs>
          {/* Subtle grid pattern */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" />
          </pattern>
          {/* Pulse gradient */}
          <radialGradient id="hospitalPulse">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="radiusGradient">
            <stop offset="0%" stopColor="#e11d48" stopOpacity="0.08" />
            <stop offset="90%" stopColor="#e11d48" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#e11d48" stopOpacity="0.3" />
          </radialGradient>
        </defs>

        {/* Map Grid & Roads simulation */}
        <rect width="800" height="600" fill="url(#grid)" />

        {/* Stylized arterial transit highways connecting Sivakasi - Thiruthangal - Virudhunagar */}
        <path
          d="M 100 520 Q 380 320 400 300 T 700 80"
          fill="none"
          stroke="#334155"
          strokeWidth="3"
          strokeDasharray="4 2"
        />
        <path
          d="M 120 180 Q 300 240 400 300 T 680 500"
          fill="none"
          stroke="#334155"
          strokeWidth="2.5"
        />
        <path
          d="M 400 300 L 410 120 M 400 300 L 320 480 M 400 300 L 620 280"
          fill="none"
          stroke="#1e293b"
          strokeWidth="2"
        />

        {/* Search Radius Ring around Center */}
        {radiusPx > 0 && (
          <g>
            <circle
              cx={centerPoint.x}
              cy={centerPoint.y}
              r={radiusPx}
              fill="url(#radiusGradient)"
              stroke="#f43f5e"
              strokeWidth="1.5"
              strokeDasharray="6 3"
              className="animate-pulse"
            />
            <text
              x={centerPoint.x + radiusPx - 38}
              y={centerPoint.y - 8}
              fill="#fb7185"
              fontSize="10"
              fontWeight="bold"
            >
              {selectedRadiusKm} KM RADIUS
            </text>
          </g>
        )}

        {/* Blood Banks Pins (Crimson/Blue) */}
        {visibleBloodBanks.map((bb) => {
          const pt = projectCoords(bb.latitude, bb.longitude);
          const isSelected = activePin?.id === bb.bloodBankId;
          return (
            <g
              key={bb.bloodBankId}
              transform={`translate(${pt.x}, ${pt.y})`}
              className="cursor-pointer transition-transform hover:scale-125"
              onClick={() => {
                setActivePin({
                  type: 'blood_bank',
                  id: bb.bloodBankId,
                  title: bb.name,
                  subtitle: `${bb.city}, ${bb.district}`,
                  badge: 'Blood Centre',
                  badgeColor: 'bg-blue-600',
                  details: `Stock reserve: 8 Blood Groups available`,
                  distance: calculateHaversineDistance(centerLat, centerLon, bb.latitude, bb.longitude),
                  phone: bb.emergencyContact,
                  raw: bb,
                });
                onSelectEntity?.('blood_bank', bb);
              }}
            >
              <circle r="14" fill="#1e3a8a" fillOpacity="0.4" />
              <circle r="8" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
              <text y="3" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                🩸
              </text>
            </g>
          );
        })}

        {/* Hospital Pins (Red Emergency Beacons) */}
        {visibleHospitals.map((h) => {
          const pt = projectCoords(h.latitude, h.longitude);
          const isSelected = activePin?.id === h.hospitalId;
          return (
            <g
              key={h.hospitalId}
              transform={`translate(${pt.x}, ${pt.y})`}
              className="cursor-pointer transition-transform hover:scale-125"
              onClick={() => {
                setActivePin({
                  type: 'hospital',
                  id: h.hospitalId,
                  title: h.hospitalName,
                  subtitle: `${h.city}, ${h.district}`,
                  badge: h.verified ? 'Verified Hospital' : 'Pending Verification',
                  badgeColor: 'bg-rose-600',
                  details: `Bed Capacity: ${h.bedCapacity} | ICU: ${h.icuCapacity}`,
                  distance: calculateHaversineDistance(centerLat, centerLon, h.latitude, h.longitude),
                  phone: h.emergencyContact,
                  raw: h,
                });
                onSelectEntity?.('hospital', h);
              }}
            >
              {/* Pulsing ring */}
              <circle r="22" fill="url(#hospitalPulse)" className="animate-ping" />
              <circle r="12" fill="#991b1b" stroke="#ffffff" strokeWidth="1.5" />
              <text y="4" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
                🏥
              </text>
            </g>
          );
        })}

        {/* Donors Pins (Green/Amber with Blood Group Badge) */}
        {visibleDonors.map((d) => {
          const pt = projectCoords(d.latitude, d.longitude);
          const dist = calculateHaversineDistance(centerLat, centerLon, d.latitude, d.longitude);
          const isEligible = d.eligible && d.available;
          return (
            <g
              key={d.donorId}
              transform={`translate(${pt.x}, ${pt.y})`}
              className="cursor-pointer transition-transform hover:scale-125"
              onClick={() => {
                setActivePin({
                  type: 'donor',
                  id: d.donorId,
                  title: d.name,
                  subtitle: getApproximateLocationText(d.city, d.district, dist),
                  badge: `${d.bloodGroup} • ${isEligible ? 'Available & Eligible' : 'Cooldown'}`,
                  badgeColor: isEligible ? 'bg-emerald-600' : 'bg-amber-600',
                  details: d.eligible
                    ? `Ready for emergency dispatch • Last donated: ${d.lastDonationDate || 'None'}`
                    : `Interval cooldown: ${d.eligibilityReason || 'Recently donated'}`,
                  distance: dist,
                  raw: d,
                });
                onSelectEntity?.('donor', d);
              }}
            >
              <circle
                r={isEligible ? 10 : 8}
                fill={isEligible ? '#059669' : '#d97706'}
                stroke="#ffffff"
                strokeWidth="1.5"
                fillOpacity={d.available ? 1 : 0.6}
              />
              <text
                y="3"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="7"
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                {d.bloodGroup}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Selected Pin Details Overlay Card */}
      {activePin && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-88 z-20 p-4 rounded-xl bg-slate-900/95 border border-slate-700 text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase ${activePin.badgeColor}`}>
                {activePin.badge}
              </span>
              <span className="text-[11px] text-slate-400">~{activePin.distance} km away</span>
            </div>
            <button
              type="button"
              onClick={() => setActivePin(null)}
              className="text-slate-400 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>

          <h4 className="font-bold text-sm text-slate-100 mt-2 truncate">{activePin.title}</h4>
          <p className="text-xs text-slate-400 mt-0.5">{activePin.subtitle}</p>

          <div className="mt-2.5 p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300">
            {activePin.details}
          </div>

          {activePin.type === 'donor' && (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400">
              <Shield className="w-3 h-3" />
              <span>Exact residential address is masked for donor privacy.</span>
            </div>
          )}
        </div>
      )}

      {/* Legend Footer */}
      <div className="absolute bottom-2 right-3 z-10 hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 backdrop-blur-xs">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Eligible Donor
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span> Hospital
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Blood Centre
        </span>
      </div>
    </div>
  );
}
