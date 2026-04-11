'use client';

import { useEffect } from 'react';
import { LicenseGate } from '@/components/license-gate';
import { useLicenseStore } from '@/lib/license-store';

export default function Home() {
  const setShowAdminPanel = useLicenseStore((s) => s.setShowAdminPanel);

  useEffect(() => {
    // Check URL hash for admin access
    if (window.location.hash === '#admin') {
      setShowAdminPanel(true);
      window.location.hash = '';
    }

    // Keyboard shortcut: Ctrl + Shift + A to toggle admin panel
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setShowAdminPanel(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setShowAdminPanel]);

  return <LicenseGate />;
}
