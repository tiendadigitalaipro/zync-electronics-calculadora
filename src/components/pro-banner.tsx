'use client';

import { useLicenseStore } from '@/lib/license-store';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Calendar, Crown } from 'lucide-react';

export function ProBanner() {
  const { licenseKey, licenseStatus, licensePlan, licenseExpiresAt, licenseDaysRemaining } = useLicenseStore();

  if (licenseStatus !== 'active' || !licenseKey) return null;

  const masked = useLicenseStore.getState().maskKey(licenseKey);

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-emerald-500/10 border-b border-emerald-500/20 px-3 sm:px-4 py-1.5">
      <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] px-2 py-0">
            <Crown className="h-3 w-3 mr-1" />
            PRO — Activa
          </Badge>
          {licensePlan && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-amber-500/10 text-amber-400 border-amber-500/20">
              {licensePlan}
            </Badge>
          )}
          <span className="text-[10px] sm:text-xs text-muted-foreground font-mono hidden sm:inline">
            {masked}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {licenseExpiresAt && (
            <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Expira: {formatDate(licenseExpiresAt)}
              {licenseDaysRemaining > 0 && licenseDaysRemaining < 999 && (
                <span className={`ml-1 font-semibold ${licenseDaysRemaining <= 7 ? 'text-amber-400' : 'text-emerald-400/70'}`}>
                  ({licenseDaysRemaining}d)
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
