import { create } from 'zustand';
import { ref, set, get, update, remove, onValue } from 'firebase/database';
import { db } from './firebase-config';
import { getDeviceFingerprint, getDeviceInfo, type DeviceInfo } from './device-fingerprint';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export type LicenseStatus = 'none' | 'demo' | 'active' | 'paused' | 'blocked' | 'expired';
export type LicenseRecordStatus = 'active' | 'paused' | 'blocked';

export interface LicenseRecord {
  licenseKey: string;
  owner: string;
  email: string;
  deviceId: string;
  status: LicenseRecordStatus;
  plan: string; // '1 month', '3 months', '6 months', '12 months'
  createdAt: number;
  updatedAt: number;
  expiresAt: number; // When the license expires
}

export interface DemoRecord {
  deviceId: string;
  owner: string;
  email: string;
  startedAt: number;
  expiresAt: number;
}

// Local storage keys
const LS_LICENSE_KEY = 'stp_license_key';
const LS_DEMO_START = 'stp_demo_start';
const LS_DEMO_EXPIRES = 'stp_demo_expires';
const LS_LICENSE_STATUS = 'stp_license_status';
const LS_DEMO_OWNER = 'stp_demo_owner';
const LS_DEMO_EMAIL = 'stp_demo_email';
const LS_ADMIN_AUTH = 'stp_admin_auth';
const LS_LICENSE_OWNER = 'stp_license_owner';
const LS_LICENSE_EMAIL = 'stp_license_email';

// Default admin password
const DEFAULT_ADMIN_PASSWORD = 'a2k2024';
const DEMO_DAYS = 3;

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

function generateLicenseKey(): string {
  const part = () => Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${part()}-${part()}-${part()}-${part()}-${part()}`;
}

function simpleStringHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h = ((h << 5) - h) + ch;
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

function maskKey(key: string): string {
  const parts = key.split('-');
  if (parts.length !== 5) return key;
  return `${parts[0]}-${parts[1]}-***-${parts[3]}-${parts[4]}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// License Store
// ═══════════════════════════════════════════════════════════════════════════

interface LicenseState {
  licenseKey: string | null;
  deviceFingerprint: string | null;
  deviceInfo: DeviceInfo | null;
  isLicenseActive: boolean;
  isDemoActive: boolean;
  demoStartDate: string | null;
  demoDaysRemaining: number;
  licenseOwner: string | null;
  licenseEmail: string | null;
  licenseStatus: LicenseStatus;
  isLoading: boolean;
  isAdmin: boolean;
  adminPassword: string | null;
  showAdminPanel: boolean;
  allLicenses: LicenseRecord[];
  allDemos: DemoRecord[];
  error: string | null;
  initialized: boolean;

  initializeLicense: () => Promise<void>;
  startDemo: (ownerName: string, ownerEmail: string) => Promise<boolean>;
  activateLicense: (key: string) => Promise<boolean>;
  checkLicenseStatus: () => Promise<void>;
  logoutLicense: () => void;
  setShowAdminPanel: (show: boolean) => void;
  adminLogin: (password: string) => Promise<boolean>;
  adminCreateLicense: (ownerName: string, ownerEmail: string) => Promise<string | null>;
  adminBlockLicense: (key: string) => Promise<boolean>;
  adminPauseLicense: (key: string) => Promise<boolean>;
  adminResumeLicense: (key: string) => Promise<boolean>;
  adminDeleteLicense: (key: string) => Promise<boolean>;
  adminFixDevice: (key: string) => Promise<boolean>;
  adminDeleteDemo: (deviceId: string) => Promise<boolean>;
  adminLoadLicenses: () => Promise<void>;
  extendDemo: (deviceId: string, days: number) => Promise<boolean>;
  maskKey: (key: string) => string;
}

export const useLicenseStore = create<LicenseState>((set, get) => ({
  licenseKey: null,
  deviceFingerprint: null,
  deviceInfo: null,
  isLicenseActive: false,
  isDemoActive: false,
  demoStartDate: null,
  demoDaysRemaining: 0,
  licenseOwner: null,
  licenseEmail: null,
  licenseStatus: 'none',
  isLoading: true,
  isAdmin: false,
  adminPassword: null,
  showAdminPanel: false,
  allLicenses: [],
  allDemos: [],
  error: null,
  initialized: false,

  // ═══════════════════════════════════════════════════════════════════════
  // INITIALIZE — On app load: check localStorage and validate against Firebase
  // ═══════════════════════════════════════════════════════════════════════
  initializeLicense: async () => {
    set({ isLoading: true, error: null });

    try {
      // Step 1: Get device fingerprint
      const fingerprint = await getDeviceFingerprint();
      const info = await getDeviceInfo();
      set({ deviceFingerprint: fingerprint, deviceInfo: info });

      // Step 2: Check localStorage for existing license
      const savedLicenseKey = localStorage.getItem(LS_LICENSE_KEY);
      const savedDemoStart = localStorage.getItem(LS_DEMO_START);
      const savedDemoExpires = localStorage.getItem(LS_DEMO_EXPIRES);
      const savedStatus = localStorage.getItem(LS_LICENSE_STATUS);
      const savedOwner = localStorage.getItem(LS_LICENSE_OWNER) || localStorage.getItem(LS_DEMO_OWNER);
      const savedEmail = localStorage.getItem(LS_LICENSE_EMAIL) || localStorage.getItem(LS_DEMO_EMAIL);

      // Step 3: If there's a license key, validate it against Firebase
      if (savedLicenseKey && savedStatus === 'active') {
        try {
          const licenseRef = ref(db, `licenses/${savedLicenseKey}`);
          const snapshot = await get(licenseRef);

          if (snapshot.exists()) {
            const data = snapshot.val();
            // Check if license status is still active
            if (data.status === 'active' && data.deviceId === fingerprint) {
              // Check if license has expired
              if (data.expiresAt && Date.now() > data.expiresAt) {
                // License expired - update status
                await update(licenseRef, { status: 'blocked', updatedAt: Date.now() });
                set({
                  licenseKey: savedLicenseKey,
                  licenseStatus: 'expired',
                  isLicenseActive: false,
                  isDemoActive: false,
                  licenseOwner: data.owner || savedOwner,
                  licenseEmail: data.email || savedEmail,
                  error: `Tu licencia (${data.plan || 'PRO'}) ha expirado. Renueva con el administrador.`,
                  isLoading: false,
                  initialized: true,
                });
                return;
              }
              // Update last seen
              await update(licenseRef, { updatedAt: Date.now() });
              set({
                licenseKey: savedLicenseKey,
                licenseStatus: 'active',
                isLicenseActive: true,
                isDemoActive: false,
                licenseOwner: data.owner || savedOwner,
                licenseEmail: data.email || savedEmail,
                isLoading: false,
                initialized: true,
              });
              return;
            } else if (data.status === 'paused') {
              set({
                licenseKey: savedLicenseKey,
                licenseStatus: 'paused',
                isLicenseActive: false,
                isDemoActive: false,
                licenseOwner: data.owner || savedOwner,
                licenseEmail: data.email || savedEmail,
                isLoading: false,
                initialized: true,
              });
              return;
            } else if (data.status === 'blocked') {
              set({
                licenseKey: savedLicenseKey,
                licenseStatus: 'blocked',
                isLicenseActive: false,
                isDemoActive: false,
                licenseOwner: data.owner || savedOwner,
                licenseEmail: data.email || savedEmail,
                isLoading: false,
                initialized: true,
              });
              return;
            } else if (data.deviceId !== fingerprint) {
              // Device mismatch - license bound to another device
              set({
                licenseStatus: 'blocked',
                isLicenseActive: false,
                isDemoActive: false,
                licenseOwner: data.owner || savedOwner,
                licenseEmail: data.email || savedEmail,
                error: 'Tu licencia está vinculada a otro dispositivo. Contacta al administrador.',
                isLoading: false,
                initialized: true,
              });
              return;
            }
          }
        } catch (err: any) {
          console.warn('License validation error:', err);
          // Firebase might not be configured - fall through to check demo
        }
      }

      // Step 4: If there's a demo, check if it's still valid
      if (savedDemoStart && savedDemoExpires) {
        const expiresAt = parseInt(savedDemoExpires, 10);
        const now = Date.now();

        if (now < expiresAt) {
          // Demo still active
          const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
          set({
            licenseStatus: 'demo',
            isDemoActive: true,
            isLicenseActive: false,
            demoStartDate: savedDemoStart,
            demoDaysRemaining: daysRemaining,
            licenseOwner: savedOwner,
            licenseEmail: savedEmail,
            isLoading: false,
            initialized: true,
          });
          return;
        } else {
          // Demo expired
          const daysExpired = Math.ceil((now - expiresAt) / (1000 * 60 * 60 * 24));
          set({
            licenseStatus: 'expired',
            isDemoActive: false,
            isLicenseActive: false,
            demoDaysRemaining: -daysExpired,
            licenseOwner: savedOwner,
            licenseEmail: savedEmail,
            isLoading: false,
            initialized: true,
          });
          return;
        }
      }

      // Step 5: No license, no demo — show registration
      set({
        licenseStatus: 'none',
        isLoading: false,
        initialized: true,
      });
    } catch (err: any) {
      console.error('License init error:', err);
      set({
        isLoading: false,
        initialized: true,
        error: 'Error inicializando licencia. Verifica tu conexión.',
      });
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // START DEMO — Register device and start 3-day trial
  // ═══════════════════════════════════════════════════════════════════════
  startDemo: async (ownerName: string, ownerEmail: string) => {
    const { deviceFingerprint } = get();
    if (!deviceFingerprint) return false;

    set({ isLoading: true, error: null });

    try {
      const now = Date.now();
      const expiresAt = now + (DEMO_DAYS * 24 * 60 * 60 * 1000);

      // Save to Firebase
      const demoRef = ref(db, `demos/${deviceFingerprint}`);
      await set(demoRef, {
        deviceId: deviceFingerprint,
        owner: ownerName,
        email: ownerEmail,
        startedAt: now,
        expiresAt: expiresAt,
      });

      // Save to localStorage
      localStorage.setItem(LS_DEMO_START, new Date(now).toISOString());
      localStorage.setItem(LS_DEMO_EXPIRES, expiresAt.toString());
      localStorage.setItem(LS_LICENSE_STATUS, 'demo');
      localStorage.setItem(LS_DEMO_OWNER, ownerName);
      localStorage.setItem(LS_DEMO_EMAIL, ownerEmail);

      set({
        licenseStatus: 'demo',
        isDemoActive: true,
        isLicenseActive: false,
        demoStartDate: new Date(now).toISOString(),
        demoDaysRemaining: DEMO_DAYS,
        licenseOwner: ownerName,
        licenseEmail: ownerEmail,
        isLoading: false,
      });

      return true;
    } catch (err: any) {
      console.error('Demo start error:', err);
      set({
        isLoading: false,
        error: 'Error al iniciar prueba. Verifica tu conexión.',
      });
      return false;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ACTIVATE LICENSE — Validate license key against Firebase
  // ═══════════════════════════════════════════════════════════════════════
  activateLicense: async (key: string) => {
    const { deviceFingerprint } = get();
    if (!deviceFingerprint) {
      set({ error: 'Error: no se pudo identificar el dispositivo.' });
      return false;
    }

    set({ isLoading: true, error: null });

    try {
      const licenseRef = ref(db, `licenses/${key}`);
      const snapshot = await get(licenseRef);

      if (!snapshot.exists()) {
        set({ isLoading: false, error: 'Licencia no encontrada. Verifica la clave.' });
        return false;
      }

      const data = snapshot.val();

      if (data.status === 'blocked') {
        set({ isLoading: false, error: 'Esta licencia ha sido bloqueada. Contacta al administrador.' });
        return false;
      }

      if (data.status === 'paused') {
        set({ isLoading: false, error: 'Esta licencia está pausada. Contacta al administrador.' });
        return false;
      }

      // Check device binding
      if (data.deviceId && data.deviceId !== deviceFingerprint && data.deviceId !== '') {
        set({ isLoading: false, error: 'Esta licencia ya está vinculada a otro dispositivo. Contacta al administrador para transferirla.' });
        return false;
      }

      // Bind license to this device
      await update(licenseRef, {
        deviceId: deviceFingerprint,
        status: 'active',
        updatedAt: Date.now(),
      });

      // Save to localStorage
      localStorage.setItem(LS_LICENSE_KEY, key);
      localStorage.setItem(LS_LICENSE_STATUS, 'active');
      localStorage.setItem(LS_LICENSE_OWNER, data.owner);
      localStorage.setItem(LS_LICENSE_EMAIL, data.email);
      // Clear demo data
      localStorage.removeItem(LS_DEMO_START);
      localStorage.removeItem(LS_DEMO_EXPIRES);
      localStorage.removeItem(LS_DEMO_OWNER);
      localStorage.removeItem(LS_DEMO_EMAIL);

      set({
        licenseKey: key,
        licenseStatus: 'active',
        isLicenseActive: true,
        isDemoActive: false,
        licenseOwner: data.owner,
        licenseEmail: data.email,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (err: any) {
      console.error('License activation error:', err);
      set({ isLoading: false, error: 'Error al activar licencia. Verifica tu conexión.' });
      return false;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CHECK LICENSE STATUS — Re-validate against Firebase
  // ═══════════════════════════════════════════════════════════════════════
  checkLicenseStatus: async () => {
    const { licenseKey, deviceFingerprint } = get();
    if (!licenseKey || !deviceFingerprint) return;

    try {
      const licenseRef = ref(db, `licenses/${licenseKey}`);
      const snapshot = await get(licenseRef);

      if (!snapshot.exists()) {
        set({ licenseStatus: 'expired', isLicenseActive: false });
        localStorage.setItem(LS_LICENSE_STATUS, 'expired');
        return;
      }

      const data = snapshot.val();
      if (data.status === 'active' && data.deviceId === deviceFingerprint) {
        set({ licenseStatus: 'active', isLicenseActive: true });
      } else if (data.status === 'paused') {
        set({ licenseStatus: 'paused', isLicenseActive: false });
      } else if (data.status === 'blocked') {
        set({ licenseStatus: 'blocked', isLicenseActive: false });
      } else {
        set({ licenseStatus: 'expired', isLicenseActive: false });
      }
    } catch (err) {
      console.warn('License check error:', err);
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // LOGOUT — Clear local license data
  // ═══════════════════════════════════════════════════════════════════════
  logoutLicense: () => {
    localStorage.removeItem(LS_LICENSE_KEY);
    localStorage.removeItem(LS_LICENSE_STATUS);
    localStorage.removeItem(LS_LICENSE_OWNER);
    localStorage.removeItem(LS_LICENSE_EMAIL);
    set({
      licenseKey: null,
      licenseStatus: 'none',
      isLicenseActive: false,
      isDemoActive: false,
      demoStartDate: null,
      demoDaysRemaining: 0,
      licenseOwner: null,
      licenseEmail: null,
      error: null,
    });
  },

  setShowAdminPanel: (show: boolean) => set({ showAdminPanel: show }),

  // ═══════════════════════════════════════════════════════════════════════
  // ADMIN LOGIN — Validate admin password
  // ═══════════════════════════════════════════════════════════════════════
  adminLogin: async (password: string) => {
    try {
      const adminRef = ref(db, 'admin/password');
      const snapshot = await get(adminRef);

      let storedPassword = DEFAULT_ADMIN_PASSWORD;
      if (snapshot.exists()) {
        storedPassword = snapshot.val();
      } else {
        // First time: initialize admin password
        const hashed = simpleStringHash(password);
        await set(adminRef, hashed);
        set({ isAdmin: true, adminPassword: password });
        localStorage.setItem(LS_ADMIN_AUTH, 'true');
        return true;
      }

      // Compare hashes
      const inputHash = simpleStringHash(password);
      if (inputHash === storedPassword) {
        set({ isAdmin: true, adminPassword: password });
        localStorage.setItem(LS_ADMIN_AUTH, 'true');
        return true;
      } else {
        set({ error: 'Contraseña incorrecta' });
        return false;
      }
    } catch (err) {
      console.error('Admin login error:', err);
      // If Firebase fails, allow local fallback with default password
      if (password === DEFAULT_ADMIN_PASSWORD) {
        set({ isAdmin: true, adminPassword: password });
        localStorage.setItem(LS_ADMIN_AUTH, 'true');
        return true;
      }
      set({ error: 'Error de conexión. Intenta de nuevo.' });
      return false;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ADMIN: CREATE LICENSE
  // ═══════════════════════════════════════════════════════════════════════
  adminCreateLicense: async (ownerName: string, ownerEmail: string, plan: string = '1 mes') => {
    try {
      const key = generateLicenseKey();
      const planMonths: Record<string, number> = {
        '1 mes': 1,
        '3 meses': 3,
        '6 meses': 6,
        '12 meses': 12,
      };
      const months = planMonths[plan] || 1;
      const expiresAt = Date.now() + (months * 30 * 24 * 60 * 60 * 1000); // ~30 days per month
      const licenseRef = ref(db, `licenses/${key}`);
      await set(licenseRef, {
        owner: ownerName,
        email: ownerEmail,
        deviceId: '',
        status: 'active',
        plan: plan,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        expiresAt: expiresAt,
      });
      await get().adminLoadLicenses();
      return key;
    } catch (err: any) {
      console.error('Create license error:', err);
      set({ error: 'Error al crear licencia.' });
      return null;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ADMIN: BLOCK LICENSE
  // ═══════════════════════════════════════════════════════════════════════
  adminBlockLicense: async (key: string) => {
    try {
      await update(ref(db, `licenses/${key}`), {
        status: 'blocked',
        updatedAt: Date.now(),
      });
      await get().adminLoadLicenses();
      return true;
    } catch (err) {
      set({ error: 'Error al bloquear licencia.' });
      return false;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ADMIN: PAUSE LICENSE
  // ═══════════════════════════════════════════════════════════════════════
  adminPauseLicense: async (key: string) => {
    try {
      await update(ref(db, `licenses/${key}`), {
        status: 'paused',
        updatedAt: Date.now(),
      });
      await get().adminLoadLicenses();
      return true;
    } catch (err) {
      set({ error: 'Error al pausar licencia.' });
      return false;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ADMIN: RESUME LICENSE
  // ═══════════════════════════════════════════════════════════════════════
  adminResumeLicense: async (key: string) => {
    try {
      await update(ref(db, `licenses/${key}`), {
        status: 'active',
        updatedAt: Date.now(),
      });
      await get().adminLoadLicenses();
      return true;
    } catch (err) {
      set({ error: 'Error al reactivar licencia.' });
      return false;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ADMIN: DELETE LICENSE
  // ═══════════════════════════════════════════════════════════════════════
  adminDeleteLicense: async (key: string) => {
    try {
      await remove(ref(db, `licenses/${key}`));
      await get().adminLoadLicenses();
      return true;
    } catch (err) {
      set({ error: 'Error al eliminar licencia.' });
      return false;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ADMIN: FIX DEVICE (clear device binding)
  // ═══════════════════════════════════════════════════════════════════════
  adminFixDevice: async (key: string) => {
    try {
      await update(ref(db, `licenses/${key}`), {
        deviceId: '',
        updatedAt: Date.now(),
      });
      await get().adminLoadLicenses();
      return true;
    } catch (err) {
      set({ error: 'Error al resetear dispositivo.' });
      return false;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ADMIN: DELETE DEMO
  // ═══════════════════════════════════════════════════════════════════════
  adminDeleteDemo: async (deviceId: string) => {
    try {
      await remove(ref(db, `demos/${deviceId}`));
      await get().adminLoadLicenses();
      return true;
    } catch (err) {
      set({ error: 'Error al eliminar demo.' });
      return false;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ADMIN: EXTEND DEMO
  // ═══════════════════════════════════════════════════════════════════════
  extendDemo: async (deviceId: string, days: number) => {
    try {
      const demoRef = ref(db, `demos/${deviceId}`);
      const snapshot = await get(demoRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const newExpiry = Math.max(Date.now(), data.expiresAt) + (days * 24 * 60 * 60 * 1000);
        await update(demoRef, { expiresAt: newExpiry });
      } else {
        const now = Date.now();
        await set(demoRef, {
          deviceId,
          owner: 'Extended',
          email: '',
          startedAt: now,
          expiresAt: now + (days * 24 * 60 * 60 * 1000),
        });
      }
      await get().adminLoadLicenses();
      return true;
    } catch (err) {
      set({ error: 'Error al extender demo.' });
      return false;
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ADMIN: LOAD ALL LICENSES AND DEMOS
  // ═══════════════════════════════════════════════════════════════════════
  adminLoadLicenses: async () => {
    try {
      // Load licenses
      const licensesRef = ref(db, 'licenses');
      const licensesSnap = await get(licensesRef);
      const licenses: LicenseRecord[] = [];
      if (licensesSnap.exists()) {
        licensesSnap.forEach((child) => {
          licenses.push({
            licenseKey: child.key!,
            ...child.val(),
          });
        });
      }

      // Load demos
      const demosRef = ref(db, 'demos');
      const demosSnap = await get(demosRef);
      const demos: DemoRecord[] = [];
      if (demosSnap.exists()) {
        demosSnap.forEach((child) => {
          demos.push({
            ...child.val(),
            deviceId: child.key!,
          });
        });
      }

      set({ allLicenses: licenses, allDemos: demos });
    } catch (err) {
      console.error('Load licenses error:', err);
    }
  },

  maskKey: (key: string) => maskKey(key),
}));
