import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { EmergencyAlertModal } from './components/EmergencyAlertModal';
import { TestScenarioRunner } from './components/TestScenarioRunner';
import { HomeView } from './views/HomeView';
import { HowItWorksView } from './views/HowItWorksView';
import { AboutView } from './views/AboutView';
import { DonorDashboard } from './views/DonorDashboard';
import { HospitalDashboard } from './views/HospitalDashboard';
import { BloodBankDashboard } from './views/BloodBankDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { MapView } from './components/MapView';
import { DemandPredictionCharts } from './components/DemandPredictionCharts';
import { authService, AuthSession } from './services/auth';
import { dbStore } from './services/store';
import { BloodRequest, Role } from './types';

export default function App() {
  const [session, setSession] = useState<AuthSession>(authService.getSession());
  const [activeView, setActiveView] = useState<string>('home');
  const [sidebarTab, setSidebarTab] = useState<string>('dashboard');

  // Modal states
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    mode: 'login' | 'register';
    role?: Role;
  }>({
    isOpen: false,
    mode: 'login',
  });

  const [emergencyModalRequest, setEmergencyModalRequest] = useState<BloodRequest | null>(null);
  const [showTestScenario, setShowTestScenario] = useState<boolean>(false);

  // Subscribe to auth state changes
  useEffect(() => {
    return authService.subscribe((newSession) => {
      setSession(newSession);
    });
  }, []);

  // Listen for dbStore updates so state is always reactive
  const [storeVersion, setStoreVersion] = useState(0);
  useEffect(() => {
    return dbStore.subscribe(() => {
      setStoreVersion((v) => v + 1);
    });
  }, []);

  // Handle switching to a demo account
  const handleSwitchDemo = (role: Role) => {
    authService.switchDemoAccount(role);
    setActiveView('dashboard');
    setSidebarTab('dashboard');
  };

  const handleLogout = () => {
    authService.logout();
    setActiveView('home');
  };

  // Open emergency modal for a specific blood request
  const handleOpenEmergencyModal = (request: BloodRequest) => {
    setEmergencyModalRequest(request);
  };

  const currentUser = session.user;
  const donorProfile = session.donorProfile;
  const hospitalProfile = session.hospitalProfile;
  const bloodBankProfile = session.bloodBankProfile;

  // Selected blood bank stock for charts
  const stats = dbStore.getSystemSummaryStats();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        activeView={activeView}
        onNavigate={(view) => {
          setActiveView(view);
          if (view === 'dashboard') {
            setSidebarTab('dashboard');
          }
        }}
        onOpenAuth={(mode, role) => setAuthModal({ isOpen: true, mode, role })}
        onLogout={handleLogout}
        onSwitchDemo={handleSwitchDemo}
        onOpenTestScenario={() => setShowTestScenario(true)}
        onRequestSelect={(reqId) => {
          const r = dbStore.getBloodRequests().find((req) => req.requestId === reqId);
          if (r) {
            setEmergencyModalRequest(r);
          }
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* If user is viewing the dashboard and logged in, show the Dark Navy Sidebar */}
        {activeView === 'dashboard' && currentUser ? (
          <div className="flex w-full min-h-[calc(100vh-4rem)]">
            <Sidebar
              currentUser={currentUser}
              activeTab={sidebarTab}
              onSelectTab={(tab) => setSidebarTab(tab)}
              onLogout={handleLogout}
              entityDetails={
                currentUser.role === 'donor'
                  ? donorProfile
                  : currentUser.role === 'hospital'
                  ? hospitalProfile
                  : currentUser.role === 'blood_bank'
                  ? bloodBankProfile
                  : null
              }
            />

            {/* Dashboard Workspace */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto overflow-y-auto">
              {currentUser.role === 'donor' && donorProfile && (
                <DonorDashboard
                  currentUser={currentUser}
                  donor={donorProfile}
                  onOpenEmergencyModal={handleOpenEmergencyModal}
                  activeTab={sidebarTab}
                  onSelectTab={setSidebarTab}
                />
              )}

              {currentUser.role === 'hospital' && hospitalProfile && (
                <HospitalDashboard
                  currentUser={currentUser}
                  hospital={hospitalProfile}
                  activeTab={sidebarTab}
                  onSelectTab={setSidebarTab}
                />
              )}

              {currentUser.role === 'blood_bank' && bloodBankProfile && (
                <BloodBankDashboard
                  currentUser={currentUser}
                  bloodBank={bloodBankProfile}
                  activeTab={sidebarTab}
                  onSelectTab={setSidebarTab}
                />
              )}

              {currentUser.role === 'admin' && (
                <AdminDashboard
                  currentUser={currentUser}
                  activeTab={sidebarTab}
                  onSelectTab={setSidebarTab}
                />
              )}
            </main>
          </div>
        ) : (
          /* Public Views: Home, How It Works, Live Map, Demand Prediction, About */
          <main className="flex-1 w-full">
            {activeView === 'home' && (
              <HomeView
                onNavigate={setActiveView}
                onOpenAuth={(mode, role) => setAuthModal({ isOpen: true, mode, role })}
                onOpenTestScenario={() => setShowTestScenario(true)}
                onSelectBloodRequest={(reqId) => {
                  const req = dbStore.getBloodRequests().find((r) => r.requestId === reqId);
                  if (req) setEmergencyModalRequest(req);
                }}
              />
            )}

            {activeView === 'how_it_works' && <HowItWorksView />}

            {activeView === 'about' && <AboutView />}

            {activeView === 'map' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 font-display">
                      Regional Blood Logistics Live Map
                    </h2>
                    <p className="text-xs text-slate-500">
                      Visualizing active hospitals, regional blood centers, and verified donors in Sivakasi
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAuthModal({ isOpen: true, mode: 'register', role: 'donor' })}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
                    >
                      Join as Nearby Donor
                    </button>
                  </div>
                </div>

                <MapView
                  donors={dbStore.getDonors()}
                  hospitals={dbStore.getHospitals()}
                  bloodBanks={dbStore.getBloodBanks()}
                  requests={dbStore.getBloodRequests()}
                  selectedRadiusKm={30}
                  heightClass="h-[650px]"
                />
              </div>
            )}

            {activeView === 'demand_prediction' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 font-display">
                    Regional Blood Demand Forecasting & AI Analytics
                  </h2>
                  <p className="text-xs text-slate-500">
                    Predictive 30–90 day machine-learning modeling of trauma requirements and inventory deficits
                  </p>
                </div>
                <DemandPredictionCharts currentStockByGroup={stats.stockByGroup} />
              </div>
            )}
          </main>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-8 border-t border-slate-900 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-sm font-display tracking-tight">
              Rakta<span className="text-rose-500">Link</span>
            </span>
            <span>— AI-Driven Blood Requirement & Smart Matching Network</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <button type="button" onClick={() => setActiveView('about')} className="hover:text-slate-300">
              About
            </button>
            <button type="button" onClick={() => setActiveView('how_it_works')} className="hover:text-slate-300">
              How It Works
            </button>
            <button type="button" onClick={() => setShowTestScenario(true)} className="hover:text-rose-400 font-semibold">
              13-Step Test Scenario
            </button>
          </div>
        </div>
      </footer>

      {/* Auth Modal (Login / Register for all 4 roles) */}
      {authModal.isOpen && (
        <AuthModal
          initialMode={authModal.mode}
          initialRole={authModal.role || 'donor'}
          onClose={() => setAuthModal({ ...authModal, isOpen: false })}
          onSuccess={(role) => {
            setActiveView('dashboard');
            setSidebarTab('dashboard');
          }}
        />
      )}

      {/* Emergency Alert Modal for Donors (Section 28 & 50) */}
      {emergencyModalRequest && donorProfile && (
        <EmergencyAlertModal
          request={emergencyModalRequest}
          donor={donorProfile}
          onClose={() => setEmergencyModalRequest(null)}
        />
      )}

      {/* 13-Step Real-Time End-to-End Simulation Modal (Section 50) */}
      {showTestScenario && (
        <TestScenarioRunner
          onClose={() => setShowTestScenario(false)}
          onNavigateRole={(role) => {
            handleSwitchDemo(role);
            setShowTestScenario(false);
          }}
        />
      )}
    </div>
  );
}
