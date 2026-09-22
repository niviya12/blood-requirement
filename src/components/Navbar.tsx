import React, { useState } from 'react';
import {
  Heart,
  Droplet,
  ShieldCheck,
  Building2,
  Users,
  MapPin,
  TrendingUp,
  PlayCircle,
  LogOut,
  User,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { Role, UserAccount } from '../types';
import { NotificationBell } from './NotificationBell';

interface NavbarProps {
  currentUser: UserAccount | null;
  activeView: string;
  onNavigate: (view: string) => void;
  onOpenAuth: (mode: 'login' | 'register', role?: Role) => void;
  onLogout: () => void;
  onSwitchDemo: (role: Role) => void;
  onOpenTestScenario: () => void;
  onRequestSelect?: (requestId: string) => void;
}

export function Navbar({
  currentUser,
  activeView,
  onNavigate,
  onOpenAuth,
  onLogout,
  onSwitchDemo,
  onOpenTestScenario,
  onRequestSelect,
}: NavbarProps) {
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onNavigate('home')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <Droplet className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 font-display">
                  Rakta<span className="text-rose-600">Link</span>
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 uppercase tracking-wide">
                  AI v2.4
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-tight hidden md:block">
                Predict • Match • Prioritize • Respond
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-600">
            {currentUser && (
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className={`px-3 py-2 rounded-lg transition-colors font-bold ${
                  activeView === 'dashboard' ? 'text-rose-600 bg-rose-50' : 'text-slate-900 hover:bg-slate-100'
                }`}
              >
                Dashboard
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                activeView === 'home' ? 'text-rose-600 bg-rose-50' : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Home
            </button>

            <button
              type="button"
              onClick={() => onNavigate('how_it_works')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                activeView === 'how_it_works' ? 'text-rose-600 bg-rose-50' : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => onNavigate('map')}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1 ${
                activeView === 'map' ? 'text-rose-600 bg-rose-50' : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              Live Map
            </button>
            <button
              type="button"
              onClick={() => onNavigate('demand_prediction')}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1 ${
                activeView === 'demand_prediction' ? 'text-rose-600 bg-rose-50' : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
              Demand Prediction
            </button>
            <button
              type="button"
              onClick={() => onNavigate('about')}
              className={`px-3 py-2 rounded-lg transition-colors ${
                activeView === 'about' ? 'text-rose-600 bg-rose-50' : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              About
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Interactive Section 50 Test Walkthrough Launcher */}
            <button
              type="button"
              onClick={onOpenTestScenario}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-bold shadow-xs hover:shadow transition-all"
              title="Run Complete 13-Step Real-Time End-to-End Test"
            >
              <PlayCircle className="w-3.5 h-3.5 fill-white/20 text-white" />
              <span className="hidden sm:inline">Run 13-Step</span> Scenario
            </button>

            {/* Quick Role Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                id="role-switch-btn"
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                title="Switch test persona"
              >
                <span className="hidden md:inline text-slate-500 font-normal">Switch Role:</span>
                <span className="capitalize font-bold text-slate-900">
                  {currentUser ? currentUser.role.replace('_', ' ') : 'Select'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 text-xs">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Instant Demo Login
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchDemo('donor');
                      setDemoMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                  >
                    <span>🩸</span>
                    <div>
                      <div className="font-semibold text-slate-900">Demo Donor</div>
                      <div className="text-[10px] text-slate-400">Vignesh Kumar (O+)</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchDemo('hospital');
                      setDemoMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                  >
                    <span>🏥</span>
                    <div>
                      <div className="font-semibold text-slate-900">Demo Hospital</div>
                      <div className="text-[10px] text-slate-400">Sivakasi Govt Hospital</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchDemo('blood_bank');
                      setDemoMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                  >
                    <span>🏦</span>
                    <div>
                      <div className="font-semibold text-slate-900">Demo Blood Bank</div>
                      <div className="text-[10px] text-slate-400">Indian Red Cross Sivakasi</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchDemo('admin');
                      setDemoMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium border-t border-slate-100"
                  >
                    <span>🛡️</span>
                    <div>
                      <div className="font-semibold text-slate-900">System Admin</div>
                      <div className="text-[10px] text-slate-400">Central Admin Panel</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <NotificationBell
              userId={currentUser?.uid}
              userRole={currentUser?.role}
              onRequestSelect={onRequestSelect}
            />

            {/* Auth Buttons / Profile */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="nav-login-btn"
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors"
                >
                  Login
                </button>
                <button
                  type="button"
                  id="nav-register-btn"
                  onClick={() => onOpenAuth('register')}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
