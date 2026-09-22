import { BloodBank, Donor, Hospital, Role, UserAccount } from '../types';
import { dbStore } from './store';

const AUTH_STORAGE_KEY = 'raktalink_auth_user_v1';

export interface AuthSession {
  user: UserAccount | null;
  donorProfile?: Donor;
  hospitalProfile?: Hospital;
  bloodBankProfile?: BloodBank;
}

class AuthService {
  private session: AuthSession;
  private listeners: Set<(session: AuthSession) => void> = new Set();

  constructor() {
    this.session = this.loadSession();
  }

  private loadSession(): AuthSession {
    if (typeof window === 'undefined') return { user: null };
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.user) {
          // Re-hydrate full profile from dbStore
          return this.enrichSession(parsed.user);
        }
      }
    } catch (e) {
      console.warn('Could not read auth session', e);
    }
    return { user: null };
  }

  private enrichSession(user: UserAccount): AuthSession {
    let donorProfile: Donor | undefined;
    let hospitalProfile: Hospital | undefined;
    let bloodBankProfile: BloodBank | undefined;

    if (user.role === 'donor') {
      donorProfile = dbStore.getDonors().find((d) => d.userId === user.uid || d.email === user.email);
    } else if (user.role === 'hospital') {
      hospitalProfile = dbStore.getHospitals().find((h) => h.userId === user.uid || h.email === user.email);
    } else if (user.role === 'blood_bank') {
      bloodBankProfile = dbStore.getBloodBanks().find((b) => b.userId === user.uid || b.email === user.email);
    }

    return {
      user,
      donorProfile,
      hospitalProfile,
      bloodBankProfile,
    };
  }

  private saveSession(session: AuthSession) {
    this.session = session;
    if (typeof window !== 'undefined') {
      if (session.user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: session.user }));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    this.notifyListeners();
  }

  public subscribe(listener: (session: AuthSession) => void): () => void {
    this.listeners.add(listener);
    listener(this.session);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.session));
  }

  public getSession(): AuthSession {
    // Re-check profile in case it was updated in store
    if (this.session.user) {
      return this.enrichSession(this.session.user);
    }
    return this.session;
  }

  public getCurrentUser(): UserAccount | null {
    return this.session.user;
  }

  public login(email: string, role: Role): { success: boolean; message: string } {
    const trimmedEmail = email.trim().toLowerCase();

    if (role === 'donor') {
      const donor = dbStore.getDonors().find((d) => d.email.toLowerCase() === trimmedEmail);
      if (!donor) {
        return { success: false, message: 'No registered donor account found with this email.' };
      }
      const user: UserAccount = {
        uid: donor.userId,
        email: donor.email,
        displayName: donor.name,
        role: 'donor',
        phone: donor.phone,
        createdAt: donor.createdAt,
      };
      this.saveSession(this.enrichSession(user));
      return { success: true, message: `Welcome back, ${donor.name}!` };
    }

    if (role === 'hospital') {
      const hosp = dbStore.getHospitals().find((h) => h.email.toLowerCase() === trimmedEmail);
      if (!hosp) {
        return { success: false, message: 'No registered hospital account found with this email.' };
      }
      const user: UserAccount = {
        uid: hosp.userId,
        email: hosp.email,
        displayName: hosp.hospitalName,
        role: 'hospital',
        phone: hosp.phone,
        createdAt: hosp.createdAt,
      };
      this.saveSession(this.enrichSession(user));
      return { success: true, message: `Welcome, ${hosp.hospitalName}!` };
    }

    if (role === 'blood_bank') {
      const bb = dbStore.getBloodBanks().find((b) => b.email.toLowerCase() === trimmedEmail);
      if (!bb) {
        return { success: false, message: 'No registered blood bank found with this email.' };
      }
      const user: UserAccount = {
        uid: bb.userId,
        email: bb.email,
        displayName: bb.name,
        role: 'blood_bank',
        phone: bb.phone,
        createdAt: bb.createdAt,
      };
      this.saveSession(this.enrichSession(user));
      return { success: true, message: `Welcome, ${bb.name}!` };
    }

    if (role === 'admin') {
      if (trimmedEmail.includes('admin') || trimmedEmail === 'nniviya2@gmail.com' || trimmedEmail === 'admin@raktalink.org') {
        const user: UserAccount = {
          uid: 'usr_admin_master',
          email: trimmedEmail,
          displayName: 'Central System Administrator',
          role: 'admin',
          phone: '+91 94431 00001',
          createdAt: '2026-01-01T00:00:00Z',
        };
        this.saveSession({ user });
        return { success: true, message: 'Welcome to Central Admin Control Panel.' };
      }
      return { success: false, message: 'Invalid admin credentials or unauthorized account.' };
    }

    return { success: false, message: 'Invalid role selection.' };
  }

  /**
   * One-click demo login convenience for reviewers & testers
   */
  public switchDemoAccount(role: Role) {
    if (role === 'donor') {
      const donor = dbStore.getDonors()[0]; // Vignesh Kumar
      this.login(donor.email, 'donor');
    } else if (role === 'hospital') {
      const hosp = dbStore.getHospitals()[0]; // Sivakasi GH
      this.login(hosp.email, 'hospital');
    } else if (role === 'blood_bank') {
      const bb = dbStore.getBloodBanks()[0]; // Indian Red Cross
      this.login(bb.email, 'blood_bank');
    } else if (role === 'admin') {
      this.login('admin@raktalink.org', 'admin');
    }
  }

  public registerDonor(donorData: Omit<Donor, 'donorId' | 'userId' | 'verified' | 'totalDonationsCount' | 'createdAt' | 'updatedAt' | 'eligible'>): Donor {
    const donorId = `donor_${Date.now()}`;
    const userId = `usr_${Date.now()}`;

    const newDonor: Donor = {
      ...donorData,
      donorId,
      userId,
      verified: true,
      totalDonationsCount: donorData.lastDonationDate ? 1 : 0,
      eligible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = dbStore.addDonor(newDonor);

    const user: UserAccount = {
      uid: userId,
      email: saved.email,
      displayName: saved.name,
      role: 'donor',
      phone: saved.phone,
      createdAt: saved.createdAt,
    };
    this.saveSession(this.enrichSession(user));
    return saved;
  }

  public registerHospital(hospData: Omit<Hospital, 'hospitalId' | 'userId' | 'verified' | 'verificationStatus' | 'createdAt' | 'updatedAt'>): Hospital {
    const hospitalId = `hosp_${Date.now()}`;
    const userId = `usr_hosp_${Date.now()}`;

    const newHosp: Hospital = {
      ...hospData,
      hospitalId,
      userId,
      verified: false,
      verificationStatus: 'PENDING', // Initial pending state
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = dbStore.addHospital(newHosp);

    const user: UserAccount = {
      uid: userId,
      email: saved.email,
      displayName: saved.hospitalName,
      role: 'hospital',
      phone: saved.phone,
      createdAt: saved.createdAt,
    };
    this.saveSession(this.enrichSession(user));
    return saved;
  }

  public registerBloodBank(bbData: Omit<BloodBank, 'bloodBankId' | 'userId' | 'verified' | 'verificationStatus' | 'inventory' | 'createdAt' | 'updatedAt'>): BloodBank {
    const bloodBankId = `bb_${Date.now()}`;
    const userId = `usr_bb_${Date.now()}`;

    // Create default starter inventory for 8 groups
    const groups: any[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const inventory: any = {};
    groups.forEach((bg) => {
      inventory[bg] = {
        bloodGroup: bg,
        availableUnits: 15,
        reservedUnits: 2,
        issuedUnits: 5,
        status: 'NORMAL',
        lastUpdated: new Date().toISOString(),
      };
    });

    const newBB: BloodBank = {
      ...bbData,
      bloodBankId,
      userId,
      verified: false,
      verificationStatus: 'PENDING',
      inventory,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = dbStore.addBloodBank(newBB);

    const user: UserAccount = {
      uid: userId,
      email: saved.email,
      displayName: saved.name,
      role: 'blood_bank',
      phone: saved.phone,
      createdAt: saved.createdAt,
    };
    this.saveSession(this.enrichSession(user));
    return saved;
  }

  public logout() {
    this.saveSession({ user: null });
  }
}

export const authService = new AuthService();
