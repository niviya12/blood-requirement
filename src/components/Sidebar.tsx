import React from 'react';
import {
  LayoutDashboard,
  User,
  HeartHandshake,
  Clock,
  Bell,
  Sliders,
  Settings,
  LogOut,
  PlusCircle,
  Search,
  Building2,
  Package,
  TrendingUp,
  MapPin,
  ShieldCheck,
  FileText,
  Radio,
  AlertOctagon,
} from 'lucide-react';
import { Role, UserAccount } from '../types';

interface SidebarProps {
  currentUser: UserAccount;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  entityDetails?: any;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  highlight?: boolean;
}

export function Sidebar({
  currentUser,
  activeTab,
  onSelectTab,
  onLogout,
  entityDetails,
}: SidebarProps) {
  const role = currentUser.role;

  // Build menu list according to role specification
  const getMenuItems = (): MenuItem[] => {

    switch (role) {
      case 'donor':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'profile', label: 'My Profile', icon: User },
          { id: 'emergency_requests', label: 'Emergency Requests', icon: AlertOctagon, badge: 'Live' },
          { id: 'nearby_requests', label: 'Nearby Requests', icon: MapPin },
          { id: 'donation_history', label: 'Donation History', icon: Clock },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'availability', label: 'Availability Toggle', icon: Radio },
          { id: 'demand_prediction', label: 'Demand Prediction', icon: TrendingUp },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];
      case 'hospital':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'create_request', label: 'Create Blood Request', icon: PlusCircle, highlight: true },
          { id: 'find_donors', label: 'Find Donors', icon: Search },
          { id: 'find_blood_banks', label: 'Find Blood Banks', icon: Building2 },
          { id: 'emergency_requests', label: 'Emergency Requests', icon: AlertOctagon },
          { id: 'live_map', label: 'Interactive Live Map', icon: MapPin },
          { id: 'demand_prediction', label: 'Demand Prediction', icon: TrendingUp },
          { id: 'request_history', label: 'Request History', icon: FileText },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'profile', label: 'Hospital Profile', icon: User },
        ];
      case 'blood_bank':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'inventory', label: 'Blood Inventory (8 Groups)', icon: Package, highlight: true },
          { id: 'emergency_requests', label: 'Emergency Requests', icon: AlertOctagon },
          { id: 'hospitals', label: 'Hospitals Registry', icon: Building2 },
          { id: 'donors', label: 'Local Donors Registry', icon: HeartHandshake },
          { id: 'demand_prediction', label: 'Demand Forecast', icon: TrendingUp },
          { id: 'live_map', label: 'Regional Map', icon: MapPin },
          { id: 'request_history', label: 'Request History', icon: FileText },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'profile', label: 'Bank Profile', icon: User },
        ];
      case 'admin':
      default:
        return [
          { id: 'dashboard', label: 'System Overview', icon: LayoutDashboard },
          { id: 'donor_matching', label: 'Donor Matching Hub', icon: Search },
          { id: 'demand_prediction', label: 'Demand Prediction (ML)', icon: TrendingUp },
          { id: 'blood_inventory', label: 'Global Blood Inventory', icon: Package },
          { id: 'emergency_requests', label: 'Emergency Triage', icon: AlertOctagon },
          { id: 'donors', label: 'Manage Donors', icon: HeartHandshake },
          { id: 'hospitals', label: 'Manage Hospitals', icon: Building2 },
          { id: 'blood_banks', label: 'Manage Blood Banks', icon: ShieldCheck },
          { id: 'live_map', label: 'Live Geo-Dispatch Map', icon: MapPin },
          { id: 'system_logs', label: 'System Audit Logs', icon: FileText },
          { id: 'settings', label: 'Platform Settings', icon: Settings },
        ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className="w-64 shrink-0 bg-slate-950 text-slate-300 flex flex-col justify-between min-h-[calc(100vh-4rem)] border-r border-slate-900 shadow-xl">
      <div className="p-4 space-y-6">
        {/* Role Identity Card */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-xs ${
                role === 'donor'
                  ? 'bg-rose-600'
                  : role === 'hospital'
                  ? 'bg-indigo-600'
                  : role === 'blood_bank'
                  ? 'bg-blue-600'
                  : 'bg-emerald-600'
              }`}
            >
              {role === 'donor' ? (
                <span>{entityDetails?.bloodGroup || '🩸'}</span>
              ) : role === 'hospital' ? (
                <span>🏥</span>
              ) : role === 'blood_bank' ? (
                <span>🏦</span>
              ) : (
                <span>🛡️</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-100 truncate">
                {currentUser.displayName}
              </h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    role === 'donor'
                      ? entityDetails?.available ? 'bg-emerald-400' : 'bg-slate-400'
                      : 'bg-emerald-400'
                  }`}
                />
                <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                  {role.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick status pill for donor availability */}
          {role === 'donor' && entityDetails && (
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Emergency Status:</span>
              <span
                className={`font-semibold ${
                  entityDetails.available ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                {entityDetails.available ? 'AVAILABLE 🟢' : 'UNAVAILABLE ⚪'}
              </span>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                    : item.highlight
                    ? 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/40 border border-rose-900/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Section */}
      <div className="p-4 border-t border-slate-900">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out Account</span>
        </button>
      </div>
    </aside>
  );
}
