'use client';

import { useEffect } from 'react';
import { useLicenseStore } from '@/lib/license-store';
import { TradingDashboard } from '@/components/trading-dashboard';
import {
  RegistrationScreen,
  LicenseActivationScreen,
  DemoExpiredScreen,
  LicensePausedScreen,
  LicenseBlockedScreen,
} from '@/components/license-activation';
import { AdminPanel } from '@/components/admin-panel';
import { Loader2 } from 'lucide-react';

export function LicenseGate() {
  const {
    licenseStatus,
    isLoading,
    initialized,
    showAdminPanel,
    initializeLicense,
  } = useLicenseStore();

  // Initialize on mount
  useEffect(() => {
    if (!initialized) {
      initializeLicense();
    }
  }, [initialized, initializeLicense]);

  // ─── LOADING ──────────────────────────────────────
  if (isLoading || !initialized) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <img
              src="/logo-a2k-pro.png"
              alt="SynthTrade Pro"
              className="w-12 h-12 rounded-xl object-cover"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <Loader2 className="h-3 w-3 text-amber-400 animate-spin" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            SynthTrade<span className="text-amber-400">Pro</span>
          </h1>
          <p className="text-xs text-muted-foreground">Verificando licencia...</p>
        </div>
      </div>
    );
  }

  // ─── ADMIN PANEL ─────────────────────────────────
  if (showAdminPanel) {
    return <AdminPanel />;
  }

  // ─── ROUTING BY LICENSE STATUS ───────────────────
  switch (licenseStatus) {
    case 'none':
      return <RegistrationScreen />;

    case 'demo':
      return <TradingDashboard />;

    case 'expired':
      // Check if it was a demo expiration (no license key) or PRO expiration
      const store = useLicenseStore.getState();
      if (store.licenseKey) {
        // PRO license expired - show activation with pricing
        return <LicenseActivationScreen />;
      }
      // Demo expired - show demo expired screen with pricing
      return <DemoExpiredScreen />;

    case 'active':
      return <TradingDashboard />;

    case 'paused':
      return <LicensePausedScreen />;

    case 'blocked':
      return <LicenseBlockedScreen />;

    default:
      return <RegistrationScreen />;
  }
}
