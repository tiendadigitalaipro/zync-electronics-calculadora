'use client';

import { useLicenseStore } from '@/lib/license-store';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowRight, Crown } from 'lucide-react';
import { useEffect, useState } from 'react';

export function DemoBanner() {
  const { demoDaysRemaining, licenseStatus } = useLicenseStore();
  const [liveDays, setLiveDays] = useState(demoDaysRemaining);

  // Sync from store prop using a timeout (inside setInterval callback, not in effect body)
  useEffect(() => {
    const interval = setInterval(() => {
      // Read from localStorage for live countdown
      const expires = localStorage.getItem('stp_demo_expires');
      if (expires) {
        const remaining = Math.ceil((parseInt(expires, 10) - Date.now()) / (1000 * 60 * 60 * 24));
        setLiveDays(Math.max(0, remaining));
      }
    }, 60000); // every minute

    return () => clearInterval(interval);
  }, []);

  if (licenseStatus !== 'demo') return null;

  // Use live countdown, falling back to store value
  const days = liveDays;

  return (
    <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 border-b border-amber-500/30 px-3 sm:px-4 py-2">
      <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-[10px] px-2 py-0">
            <Clock className="h-3 w-3 mr-1" />
            DEMO
          </Badge>
          <span className="text-xs sm:text-sm text-amber-200">
            {days > 1
              ? `${days} dias restantes de prueba`
              : days === 1
                ? 'Ultimo dia de prueba'
                : 'Prueba expirando hoy'}
          </span>
        </div>
        <button
          onClick={() => {
            const store = useLicenseStore.getState();
            store.logoutLicense();
            store.initializeLicense();
          }}
          className="flex items-center gap-1.5 text-xs sm:text-sm text-amber-400 hover:text-amber-300 transition-colors font-semibold"
        >
          <Crown className="h-3.5 w-3.5" />
          Comprar PRO
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
