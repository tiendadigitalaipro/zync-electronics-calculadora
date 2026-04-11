'use client';

import { useLicenseStore } from '@/lib/license-store';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';

export function ProBanner() {
  const { licenseKey, licenseStatus } = useLicenseStore();

  if (licenseStatus !== 'active' || !licenseKey) return null;

  const masked = useLicenseStore.getState().maskKey(licenseKey);

  return (
    <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-emerald-500/10 border-b border-emerald-500/20 px-3 sm:px-4 py-1.5">
      <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] px-2 py-0">
            <ShieldCheck className="h-3 w-3 mr-1" />
            PRO — Activada
          </Badge>
          <span className="text-[10px] sm:text-xs text-muted-foreground font-mono">
            {masked}
          </span>
        </div>
      </div>
    </div>
  );
}
