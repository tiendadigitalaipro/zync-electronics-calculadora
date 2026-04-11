'use client';

import { useEffect } from 'react';
import { LicenseGate } from '@/components/license-gate';
import { useLicenseStore } from '@/lib/license-store';

export default function Home() {
  const setShowAdminPanel = useLicenseStore((s) => s.setShowAdminPanel);

  // Access admin panel via #admin hash in URL
  useEffect(() => {
    if (window.location.hash === '#admin') {
      setShowAdminPanel(true);
    }
  }, [setShowAdminPanel]);

  return <LicenseGate />;
}
