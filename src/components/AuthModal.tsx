import React, { useState } from 'react';
import {
  Heart,
  Building2,
  Shield,
  Droplet,
  MapPin,
  CheckCircle2,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Navigation,
  Lock,
  Mail,
  Phone,
  User,
  Calendar,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BloodGroup, Role } from '../types';
import { authService } from '../services/auth';
import { detectDeviceLocation, POPULAR_DISTRICTS, SIVAKASI_COORDINATES } from '../services/locationService';

interface AuthModalProps {
  initialMode: 'login' | 'register';
  initialRole?: Role;
  onClose: () => void;
  onSuccess: (role: Role) => void;
}

export function AuthModal({
  initialMode,
  initialRole = 'donor',
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<Role>(initialRole);
  const [step, setStep] = useState<'choose_role' | 'form' | 'success'>(
    initialRole ? 'form' : 'choose_role'
  );

  // Common Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Donor Registration Fields
  const [donorForm, setDonorForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    bloodGroup: 'O+' as BloodGroup,
    dateOfBirth: '1998-05-15',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    address: '',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626123',
    lastDonationDate: '',
    available: true,
    consent: false,
    latitude: SIVAKASI_COORDINATES.latitude,
    longitude: SIVAKASI_COORDINATES.longitude,
  });

  // Hospital Registration Fields
  const [hospForm, setHospForm] = useState({
    hospitalName: '',
    registrationId: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626123',
    emergencyContact: '',
    latitude: 9.4533,
    longitude: 77.7979,
  });

  // Blood Bank Registration Fields
  const [bbForm, setBbForm] = useState({
    name: '',
    registrationId: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    district: 'Virudhunagar',
    city: 'Sivakasi',
    pincode: '626123',
    emergencyContact: '',
    latitude: 9.4550,
    longitude: 77.7995,
  });

  // Location detection status
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [createdDonorData, setCreatedDonorData] = useState<any>(null);

  // Location detector handler
  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    setLocationStatus('Detecting device coordinates...');
    try {
      const res = await detectDeviceLocation();
      setLocationStatus(res.message);
      if (res.granted) {
        setDonorForm((prev) => ({
          ...prev,
          latitude: res.coords.latitude,
          longitude: res.coords.longitude,
          district: res.coords.district || prev.district,
          city: res.coords.city || prev.city,
        }));
      }
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail.trim()) {
      setLoginError('Please enter your email or mobile number.');
      return;
    }

    const res = authService.login(loginEmail, role);
    if (res.success) {
      onSuccess(role);
      onClose();
    } else {
      setLoginError(res.message);
    }
  };

  const handleDonorRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!donorForm.name.trim()) return setLoginError('Full name is required.');
    if (!donorForm.email.includes('@')) return setLoginError('Please enter a valid email address.');
    if (donorForm.phone.length < 10) return setLoginError('Please enter a valid 10-digit mobile number.');
    if (donorForm.password.length < 6) return setLoginError('Password must be at least 6 characters.');
    if (donorForm.password !== donorForm.confirmPassword) return setLoginError('Passwords do not match.');
    if (!donorForm.consent) return setLoginError('Please agree to the privacy policy & emergency contact terms.');

    const newDonor = authService.registerDonor({
      name: donorForm.name,
      email: donorForm.email,
      phone: donorForm.phone,
      bloodGroup: donorForm.bloodGroup,
      dateOfBirth: donorForm.dateOfBirth,
      gender: donorForm.gender,
      address: donorForm.address || 'Central Sivakasi Area',
      district: donorForm.district,
      city: donorForm.city,
      pincode: donorForm.pincode,
      lastDonationDate: donorForm.lastDonationDate,
      available: donorForm.available,
      latitude: donorForm.latitude,
      longitude: donorForm.longitude,
    });

    setCreatedDonorData(newDonor);
    setStep('success');

    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#e11d48', '#059669', '#2563eb'],
      });
    } catch (err) {
      // ignore
    }
  };

  const handleHospitalRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!hospForm.hospitalName.trim()) return setLoginError('Hospital name is required.');
    if (!hospForm.registrationId.trim()) return setLoginError('Medical Registration ID is required.');
    if (!hospForm.email.includes('@')) return setLoginError('Valid hospital email is required.');
    if (hospForm.password !== hospForm.confirmPassword) return setLoginError('Passwords do not match.');

    authService.registerHospital({
      hospitalName: hospForm.hospitalName,
      registrationId: hospForm.registrationId,
      email: hospForm.email,
      phone: hospForm.phone || '+91 4562 220111',
      address: hospForm.address || 'Hospital Road',
      district: hospForm.district,
      city: hospForm.city,
      pincode: hospForm.pincode,
      emergencyContact: hospForm.emergencyContact || hospForm.phone,
      latitude: hospForm.latitude,
      longitude: hospForm.longitude,
    });

    onSuccess('hospital');
    onClose();
  };

  const handleBloodBankRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!bbForm.name.trim()) return setLoginError('Blood bank name is required.');
    if (!bbForm.registrationId.trim()) return setLoginError('Govt License / Registration ID is required.');
    if (!bbForm.email.includes('@')) return setLoginError('Valid email is required.');
    if (bbForm.password !== bbForm.confirmPassword) return setLoginError('Passwords do not match.');

    authService.registerBloodBank({
      name: bbForm.name,
      registrationId: bbForm.registrationId,
      email: bbForm.email,
      phone: bbForm.phone || '+91 4562 225500',
      address: bbForm.address || 'North Car Street',
      district: bbForm.district,
      city: bbForm.city,
      pincode: bbForm.pincode,
      emergencyContact: bbForm.emergencyContact || bbForm.phone,
      latitude: bbForm.latitude,
      longitude: bbForm.longitude,
    });

    onSuccess('blood_bank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-600 text-white">
              <Droplet className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">
                {step === 'choose_role'
                  ? 'Choose Account Type'
                  : mode === 'login'
                  ? `${role.toUpperCase().replace('_', ' ')} LOGIN`
                  : `${role.toUpperCase().replace('_', ' ')} REGISTRATION`}
              </h3>
              <p className="text-[11px] text-slate-400">
                RaktaLink Healthcare Dispatch Network
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Choose Account Type */}
        {step === 'choose_role' && (
          <div className="p-6 space-y-5">
            <div className="text-center space-y-1">
              <h4 className="font-bold text-lg text-slate-900 font-display">
                Select Your Role on RaktaLink
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Dedicated portals for voluntary donors, licensed hospital trauma units, and certified regional blood banks.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              {/* Donor Card */}
              <div
                onClick={() => {
                  setRole('donor');
                  setStep('form');
                }}
                className="p-4 rounded-xl border border-slate-200 hover:border-rose-400 hover:shadow-md cursor-pointer transition-all bg-gradient-to-b from-white to-rose-50/20 text-center space-y-2 group"
              >
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-2xl group-hover:scale-110 transition-transform">
                  🩸
                </div>
                <h5 className="font-bold text-sm text-slate-900">Blood Donor</h5>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Register, verify eligibility, set emergency availability, and save lives.
                </p>
                <button
                  type="button"
                  className="w-full mt-2 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
                >
                  {mode === 'login' ? 'Donor Login' : 'Register as Donor'}
                </button>
              </div>

              {/* Hospital Card */}
              <div
                onClick={() => {
                  setRole('hospital');
                  setStep('form');
                }}
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all bg-gradient-to-b from-white to-indigo-50/20 text-center space-y-2 group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto text-2xl group-hover:scale-110 transition-transform">
                  🏥
                </div>
                <h5 className="font-bold text-sm text-slate-900">Hospital</h5>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Raise emergency requests, calculate AI severity, and match nearby donors.
                </p>
                <button
                  type="button"
                  className="w-full mt-2 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
                >
                  {mode === 'login' ? 'Hospital Login' : 'Register as Hospital'}
                </button>
              </div>

              {/* Blood Bank Card */}
              <div
                onClick={() => {
                  setRole('blood_bank');
                  setStep('form');
                }}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all bg-gradient-to-b from-white to-blue-50/20 text-center space-y-2 group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto text-2xl group-hover:scale-110 transition-transform">
                  🏦
                </div>
                <h5 className="font-bold text-sm text-slate-900">Blood Bank</h5>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Manage live 8-group stock inventory, fulfill hospital orders, and reserve units.
                </p>
                <button
                  type="button"
                  className="w-full mt-2 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                >
                  {mode === 'login' ? 'Bank Login' : 'Register as Bank'}
                </button>
              </div>
            </div>

            {/* Quick Toggle between Login and Register */}
            <div className="pt-2 text-center text-xs text-slate-500">
              {mode === 'login' ? (
                <span>
                  Need an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="font-bold text-rose-600 hover:underline"
                  >
                    Register here
                  </button>
                </span>
              ) : (
                <span>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="font-bold text-rose-600 hover:underline"
                  >
                    Log in here
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Form (Login or Register for chosen role) */}
        {step === 'form' && (
          <div className="p-6 max-h-[80vh] overflow-y-auto space-y-5">
            {/* Top Back and Role Selector Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setStep('choose_role')}
                className="text-slate-500 hover:text-slate-800 font-medium"
              >
                ← Switch Role ({role.replace('_', ' ')})
              </button>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    mode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* LOGIN MODE */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
                  <div className="font-semibold text-slate-800 mb-1">
                    Demo Credentials (Click to pre-fill):
                  </div>
                  {role === 'donor' && (
                    <button
                      type="button"
                      onClick={() => {
                        setLoginEmail('vignesh.k@example.com');
                        setLoginPassword('password123');
                      }}
                      className="text-rose-600 font-bold hover:underline"
                    >
                      Use Demo Donor (Vignesh Kumar - O+)
                    </button>
                  )}
                  {role === 'hospital' && (
                    <button
                      type="button"
                      onClick={() => {
                        setLoginEmail('emergency@sivakasigh.gov.in');
                        setLoginPassword('password123');
                      }}
                      className="text-indigo-600 font-bold hover:underline"
                    >
                      Use Demo Hospital (Sivakasi Govt Hospital)
                    </button>
                  )}
                  {role === 'blood_bank' && (
                    <button
                      type="button"
                      onClick={() => {
                        setLoginEmail('bloodbank@redcrosssivakasi.org');
                        setLoginPassword('password123');
                      }}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Use Demo Blood Bank (Indian Red Cross Sivakasi)
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email / Mobile Number
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      id="login-email-input"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. name@example.com"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Password</label>
                    <span className="text-[11px] text-rose-600 hover:underline cursor-pointer">
                      Forgot Password?
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="login-password-input"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="login-submit-btn"
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all uppercase tracking-wider"
                >
                  LOGIN AS {role.replace('_', ' ')}
                </button>

                <div className="text-center text-xs text-slate-500 pt-1">
                  New {role.replace('_', ' ')}?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="font-bold text-rose-600 hover:underline"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            )}

            {/* DONOR REGISTRATION FORM (Sections 5 & 6) */}
            {mode === 'register' && role === 'donor' && (
              <form onSubmit={handleDonorRegister} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="donor-name-input"
                      value={donorForm.name}
                      onChange={(e) => setDonorForm({ ...donorForm, name: e.target.value })}
                      placeholder="e.g. Vignesh Kumar"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      id="donor-phone-input"
                      value={donorForm.phone}
                      onChange={(e) => setDonorForm({ ...donorForm, phone: e.target.value })}
                      placeholder="+91 98421 11001"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="donor-email-input"
                    value={donorForm.email}
                    onChange={(e) => setDonorForm({ ...donorForm, email: e.target.value })}
                    placeholder="name@example.com"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={donorForm.password}
                      onChange={(e) => setDonorForm({ ...donorForm, password: e.target.value })}
                      placeholder="Min. 6 characters"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      value={donorForm.confirmPassword}
                      onChange={(e) => setDonorForm({ ...donorForm, confirmPassword: e.target.value })}
                      placeholder="Repeat password"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                {/* Blood Group, DOB, Gender */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Blood Group *
                    </label>
                    <select
                      id="donor-blood-group-select"
                      value={donorForm.bloodGroup}
                      onChange={(e) => setDonorForm({ ...donorForm, bloodGroup: e.target.value as BloodGroup })}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-rose-600 outline-none focus:ring-2 focus:ring-rose-500 bg-white"
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
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      value={donorForm.dateOfBirth}
                      onChange={(e) => setDonorForm({ ...donorForm, dateOfBirth: e.target.value })}
                      required
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gender
                    </label>
                    <select
                      value={donorForm.gender}
                      onChange={(e) => setDonorForm({ ...donorForm, gender: e.target.value as any })}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Address & District */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      District *
                    </label>
                    <select
                      value={donorForm.district}
                      onChange={(e) => {
                        const dist = e.target.value;
                        const match = POPULAR_DISTRICTS.find((d) => d.district === dist);
                        setDonorForm({
                          ...donorForm,
                          district: dist,
                          city: match ? match.city : donorForm.city,
                          pincode: match ? match.pincode : donorForm.pincode,
                          latitude: match ? match.lat : donorForm.latitude,
                          longitude: match ? match.lon : donorForm.longitude,
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                    >
                      <option value="Virudhunagar">Virudhunagar (Sivakasi)</option>
                      <option value="Madurai">Madurai</option>
                      <option value="Tirunelveli">Tirunelveli</option>
                      <option value="Chennai">Chennai</option>
                      <option value="Coimbatore">Coimbatore</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      City / Area *
                    </label>
                    <input
                      type="text"
                      value={donorForm.city}
                      onChange={(e) => setDonorForm({ ...donorForm, city: e.target.value })}
                      placeholder="e.g. Sivakasi"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Donation Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={donorForm.lastDonationDate}
                    onChange={(e) => setDonorForm({ ...donorForm, lastDonationDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Leave empty if this is your first time donating blood.
                  </p>
                </div>

                {/* Section 6: Location Permission Block */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-xs text-slate-800">
                        Allow Location Access
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Used only to calculate transit distance to emergency hospital trauma centers.
                      </p>
                    </div>
                    <button
                      type="button"
                      id="donor-allow-location-btn"
                      onClick={handleDetectLocation}
                      disabled={detectingLocation}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      {detectingLocation ? 'Detecting...' : 'ALLOW LOCATION'}
                    </button>
                  </div>

                  {locationStatus && (
                    <div className="text-[11px] font-medium text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      ✓ {locationStatus} (Approx: {donorForm.city}, {donorForm.district})
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400">
                    * Exact residential address is never publicly displayed. Only masked area is shared with authorized dispatchers.
                  </div>
                </div>

                {/* Emergency Availability Toggle (Section 10) */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-50/50 border border-rose-100">
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">
                      Available for Emergency Donation?
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Receive immediate critical alerts for urgent hospital trauma cases.
                    </span>
                  </div>
                  <button
                    type="button"
                    id="donor-emergency-toggle-btn"
                    onClick={() => setDonorForm({ ...donorForm, available: !donorForm.available })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      donorForm.available
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {donorForm.available ? 'YES 🟢' : 'NO ⚪'}
                  </button>
                </div>

                {/* Consent Checkbox */}
                <div className="flex items-start gap-2 pt-1 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    id="donor-consent-check"
                    checked={donorForm.consent}
                    onChange={(e) => setDonorForm({ ...donorForm, consent: e.target.checked })}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <label htmlFor="donor-consent-check" className="cursor-pointer text-[11px]">
                    I consent to share my blood group, availability, and approximate distance with authorized healthcare facilities during medical emergencies under privacy compliance.
                  </label>
                </div>

                <button
                  type="submit"
                  id="donor-submit-register-btn"
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all uppercase tracking-wider"
                >
                  CREATE DONOR ACCOUNT
                </button>
              </form>
            )}

            {/* HOSPITAL REGISTRATION FORM (Section 14) */}
            {mode === 'register' && role === 'hospital' && (
              <form onSubmit={handleHospitalRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hospital Name *
                  </label>
                  <input
                    type="text"
                    value={hospForm.hospitalName}
                    onChange={(e) => setHospForm({ ...hospForm, hospitalName: e.target.value })}
                    placeholder="e.g. Sivakasi Govt Headquarter Hospital"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Govt / Medical Reg. ID *
                    </label>
                    <input
                      type="text"
                      value={hospForm.registrationId}
                      onChange={(e) => setHospForm({ ...hospForm, registrationId: e.target.value })}
                      placeholder="e.g. HOSP-TN-SVK-001"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Emergency Direct Contact *
                    </label>
                    <input
                      type="tel"
                      value={hospForm.emergencyContact}
                      onChange={(e) => setHospForm({ ...hospForm, emergencyContact: e.target.value })}
                      placeholder="+91 4562 220999"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hospital Official Email *
                  </label>
                  <input
                    type="email"
                    value={hospForm.email}
                    onChange={(e) => setHospForm({ ...hospForm, email: e.target.value })}
                    placeholder="emergency@hospital.org"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={hospForm.password}
                      onChange={(e) => setHospForm({ ...hospForm, password: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      value={hospForm.confirmPassword}
                      onChange={(e) => setHospForm({ ...hospForm, confirmPassword: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                  <strong>Verification Notice:</strong> New hospital accounts will initially hold <em>PENDING</em> verification status until validated by state health authorities.
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all uppercase tracking-wider"
                >
                  REGISTER HOSPITAL
                </button>
              </form>
            )}

            {/* BLOOD BANK REGISTRATION FORM (Section 22) */}
            {mode === 'register' && role === 'blood_bank' && (
              <form onSubmit={handleBloodBankRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Blood Bank / Center Name *
                  </label>
                  <input
                    type="text"
                    value={bbForm.name}
                    onChange={(e) => setBbForm({ ...bbForm, name: e.target.value })}
                    placeholder="e.g. Indian Red Cross Society Sivakasi"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Govt License / Reg. ID *
                    </label>
                    <input
                      type="text"
                      value={bbForm.registrationId}
                      onChange={(e) => setBbForm({ ...bbForm, registrationId: e.target.value })}
                      placeholder="e.g. BB-TN-SVK-RC01"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Direct Emergency Phone *
                    </label>
                    <input
                      type="tel"
                      value={bbForm.emergencyContact}
                      onChange={(e) => setBbForm({ ...bbForm, emergencyContact: e.target.value })}
                      placeholder="+91 4562 225577"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    value={bbForm.email}
                    onChange={(e) => setBbForm({ ...bbForm, email: e.target.value })}
                    placeholder="bloodbank@redcrosssivakasi.org"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={bbForm.password}
                      onChange={(e) => setBbForm({ ...bbForm, password: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      value={bbForm.confirmPassword}
                      onChange={(e) => setBbForm({ ...bbForm, confirmPassword: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all uppercase tracking-wider"
                >
                  REGISTER BLOOD BANK
                </button>
              </form>
            )}
          </div>
        )}

        {/* Step 3: Registration Confirmation Screen (Section 7) */}
        {step === 'success' && createdDonorData && (
          <div className="p-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl shadow-xs">
              ✓
            </div>

            <div className="space-y-1">
              <h4 className="font-extrabold text-xl text-slate-900 font-display">
                DONOR ACCOUNT CREATED
              </h4>
              <p className="text-xs text-slate-600">
                Welcome, <strong>{createdDonorData.name}</strong>
              </p>
            </div>

            {/* Donor confirmation detail card */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-left grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Blood Group:</span>
                <span className="font-bold text-rose-600 text-base">
                  {createdDonorData.bloodGroup}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Location:</span>
                <span className="font-bold text-slate-800">
                  {createdDonorData.city}, {createdDonorData.district}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Eligibility:</span>
                <span className="font-semibold text-emerald-600">
                  {createdDonorData.eligible ? 'Eligible ✓' : 'Cooldown'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Emergency Availability:</span>
                <span className="font-semibold text-emerald-600">
                  {createdDonorData.available ? 'ON 🟢' : 'OFF ⚪'}
                </span>
              </div>
            </div>

            <button
              type="button"
              id="donor-go-dashboard-btn"
              onClick={() => {
                onSuccess('donor');
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all uppercase tracking-wider"
            >
              GO TO DONOR DASHBOARD
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
