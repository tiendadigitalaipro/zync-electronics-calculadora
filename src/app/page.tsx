'use client';

import { useState, useEffect, useCallback, useRef, type FormEvent, type ChangeEvent } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase-config';

// ─── Types ─────────────────────────────────────────────────────────────────
interface License {
  id: string;
  salonName: string;
  ownerName: string;
  ownerPhone: string;
  plan: 'mensual' | 'trimestral' | 'semestral' | 'anual';
  startDate: string; // ISO date string
  expirationDate: string; // ISO date string
  status: 'active' | 'expired' | 'suspended';
  createdAt: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────
const MASTER_PASSWORD = 'MBP2026MASTER';

const PLANS = [
  { value: 'mensual', label: 'Mensual', price: 20, unit: 'mes', days: 30 },
  { value: 'trimestral', label: 'Trimestral', price: 50, unit: 'trim', days: 90 },
  { value: 'semestral', label: 'Semestral', price: 90, unit: 'sem', days: 180 },
  { value: 'anual', label: 'Anual', price: 150, unit: 'año', days: 365 },
] as const;

const STATUS_LABELS: Record<string, string> = {
  active: 'Activa',
  expired: 'Expirada',
  suspended: 'Suspendida',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  expired: 'bg-rose-100 text-rose-700 border-rose-200',
  suspended: 'bg-amber-100 text-amber-700 border-amber-200',
};

// ─── Helpers ───────────────────────────────────────────────────────────────
function calcExpiration(startDate: string, planValue: string): string {
  const plan = PLANS.find((p) => p.value === planValue);
  if (!plan) return startDate;
  const d = new Date(startDate);
  d.setDate(d.getDate() + plan.days);
  return d.toISOString().split('T')[0];
}

function formatPrice(planValue: string): string {
  const plan = PLANS.find((p) => p.value === planValue);
  if (!plan) return '-';
  return `$${plan.price}/${plan.unit}`;
}

function formatDate(isoStr: string): string {
  if (!isoStr) return '-';
  const d = new Date(isoStr + 'T00:00:00');
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isExpired(expirationDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(expirationDate + 'T00:00:00') < today;
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [firebaseError, setFirebaseError] = useState('');

  // Dashboard state
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loadingLicenses, setLoadingLicenses] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form fields
  const [formSalonName, setFormSalonName] = useState('');
  const [formOwnerName, setFormOwnerName] = useState('');
  const [formOwnerPhone, setFormOwnerPhone] = useState('');
  const [formPlan, setFormPlan] = useState<License['plan']>('mensual');
  const [formStartDate, setFormStartDate] = useState(todayISO());

  // Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importing, setImporting] = useState(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Firebase Connection ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function initFirebase() {
      try {
        // Dynamic import of Firebase to not block render
        await import('firebase/firestore');
        if (!cancelled) {
          setFirebaseReady(true);
          setFirebaseError('');
        }
      } catch (err) {
        console.error('Firebase init error:', err);
        if (!cancelled) {
          setFirebaseError('Error al conectar con Firebase');
        }
      }
    }

    initFirebase();

    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Real-time listener ─────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (unsubscribeRef.current) return;

    const q = query(collection(db, 'licenses'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const docs: License[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          docs.push({
            id: docSnap.id,
            salonName: data.salonName || '',
            ownerName: data.ownerName || '',
            ownerPhone: data.ownerPhone || '',
            plan: data.plan || 'mensual',
            startDate: data.startDate || '',
            expirationDate: data.expirationDate || '',
            status: data.status || 'active',
            createdAt: data.createdAt || new Date().toISOString(),
          });
        });

        // Auto-detect expired
        const updated = docs.map((lic) => {
          if (lic.status === 'active' && isExpired(lic.expirationDate)) {
            updateDoc(doc(db, 'licenses', lic.id), { status: 'expired' });
            return { ...lic, status: 'expired' as const };
          }
          return lic;
        });

        setLicenses(updated);
        setLoadingLicenses(false);
      },
      (err) => {
        console.error('Firestore listener error:', err);
        setFirebaseError('Error al escuchar cambios en tiempo real');
        setLoadingLicenses(false);
      }
    );

    unsubscribeRef.current = unsub;
  }, []);

  useEffect(() => {
    if (authenticated && firebaseReady) {
      startListening();
    }
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [authenticated, firebaseReady, startListening]);

  // ─── Auth Handler ───────────────────────────────────────────────────────
  function handleLogin(e: FormEvent) {
    e.preventDefault();
    if (password === MASTER_PASSWORD) {
      setAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('Contraseña incorrecta');
    }
  }

  // ─── Stats Calculation ──────────────────────────────────────────────────
  const totalLicenses = licenses.length;
  const activeLicenses = licenses.filter((l) => l.status === 'active').length;
  const expiredLicenses = licenses.filter((l) => l.status === 'expired').length;

  // Revenue this month: sum of plan prices for active licenses
  const revenueThisMonth = licenses
    .filter((l) => l.status === 'active')
    .reduce((sum, l) => {
      const plan = PLANS.find((p) => p.value === l.plan);
      return sum + (plan?.price || 0);
    }, 0);

  // ─── Filtered Licenses ──────────────────────────────────────────────────
  const filteredLicenses = licenses.filter((l) => {
    const matchSearch =
      !searchTerm ||
      l.salonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.ownerPhone.includes(searchTerm);
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // ─── Form Helpers ───────────────────────────────────────────────────────
  function resetForm() {
    setFormSalonName('');
    setFormOwnerName('');
    setFormOwnerPhone('');
    setFormPlan('mensual');
    setFormStartDate(todayISO());
    setEditingLicense(null);
    setShowAddModal(false);
  }

  function openEditModal(license: License) {
    setEditingLicense(license);
    setFormSalonName(license.salonName);
    setFormOwnerName(license.ownerName);
    setFormOwnerPhone(license.ownerPhone);
    setFormPlan(license.plan);
    setFormStartDate(license.startDate);
    setShowAddModal(true);
  }

  async function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    if (!formSalonName.trim() || !formOwnerName.trim() || !formOwnerPhone.trim()) return;

    setFormSubmitting(true);
    const expiration = calcExpiration(formStartDate, formPlan);
    const status: License['status'] = isExpired(expiration) ? 'expired' : 'active';

    try {
      if (editingLicense) {
        await updateDoc(doc(db, 'licenses', editingLicense.id), {
          salonName: formSalonName.trim(),
          ownerName: formOwnerName.trim(),
          ownerPhone: formOwnerPhone.trim(),
          plan: formPlan,
          startDate: formStartDate,
          expirationDate: expiration,
          status,
        });
      } else {
        await addDoc(collection(db, 'licenses'), {
          salonName: formSalonName.trim(),
          ownerName: formOwnerName.trim(),
          ownerPhone: formOwnerPhone.trim(),
          plan: formPlan,
          startDate: formStartDate,
          expirationDate: expiration,
          status,
          createdAt: new Date().toISOString(),
        });
      }
      resetForm();
    } catch (err) {
      console.error('Error saving license:', err);
    } finally {
      setFormSubmitting(false);
    }
  }

  // ─── Delete ─────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!window.confirm('¿Estás segura de eliminar esta licencia?')) return;
    try {
      await deleteDoc(doc(db, 'licenses', id));
    } catch (err) {
      console.error('Error deleting license:', err);
    }
  }

  // ─── Toggle Status ──────────────────────────────────────────────────────
  async function handleToggleStatus(license: License) {
    const newStatus: License['status'] = license.status === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'licenses', license.id), { status: newStatus });
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  }

  // ─── Import JSON ────────────────────────────────────────────────────────
  async function handleImport() {
    if (!importJson.trim()) return;
    setImporting(true);
    try {
      const data = JSON.parse(importJson);
      const items = Array.isArray(data) ? data : [data];
      const batch = writeBatch(db);

      for (const item of items) {
        const salonName = item.salonName || item.nombre || item.salon || '';
        const ownerName = item.ownerName || item.propietario || item.owner || '';
        const ownerPhone = item.ownerPhone || item.telefono || item.phone || '';
        const planRaw = (item.plan || item.planType || 'mensual').toLowerCase();
        const planMap: Record<string, License['plan']> = {
          mensual: 'mensual', monthly: 'mensual', mes: 'mensual', '1mes': 'mensual',
          trimestral: 'trimestral', quarterly: 'trimestral', trim: 'trimestral', '3meses': 'trimestral',
          semestral: 'semestral', semiannual: 'semestral', sem: 'semestral', '6meses': 'semestral',
          anual: 'anual', annual: 'anual', año: 'anual', year: 'anual', '12meses': 'anual',
        };
        const plan = planMap[planRaw] || 'mensual';
        const startDate = item.startDate || item.fechaInicio || todayISO();
        const expiration = calcExpiration(startDate, plan);
        const status: License['status'] = isExpired(expiration) ? 'expired' : 'active';

        const docRef = doc(collection(db, 'licenses'));
        batch.set(docRef, {
          salonName, ownerName, ownerPhone, plan, startDate, expirationDate: expiration, status,
          createdAt: new Date().toISOString(),
        });
      }

      await batch.commit();
      setImportJson('');
      setShowImportModal(false);
      alert(`✅ ${items.length} licencia(s) importada(s) exitosamente`);
    } catch (err) {
      console.error('Import error:', err);
      alert('❌ Error al importar. Verifica el formato del JSON.');
    } finally {
      setImporting(false);
    }
  }

  // ─── Handle File Upload ─────────────────────────────────────────────────
  function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setImportJson(text);
    };
    reader.readAsText(file);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ═════════════════════════════════════════════════════════════════════════
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center mary-gradient p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-rose-200/50 p-8 fade-in">
            {/* Logo / Branding */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full mary-gradient-dark flex items-center justify-center shadow-lg shadow-rose-300/40">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4L22 12L30 14L22 16L20 24L18 16L10 14L18 12L20 4Z" fill="white" />
                  <path d="M12 18L13.5 23L18 24.5L13.5 26L12 31L10.5 26L6 24.5L10.5 23L12 18Z" fill="white" opacity="0.7" />
                  <path d="M28 18L29.5 23L34 24.5L29.5 26L28 31L26.5 26L22 24.5L26.5 23L28 18Z" fill="white" opacity="0.7" />
                  <path d="M20 28L21 31.5L24 32.5L21 33.5L20 37L19 33.5L16 32.5L19 31.5L20 28Z" fill="white" opacity="0.5" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold shimmer-text inline-block">Mary Bot</h1>
              <p className="text-rose-400 mt-2 text-sm font-medium tracking-wide">Panel Maestro de Licencias</p>
            </div>

            {/* Firebase Status */}
            {!firebaseReady && (
              <div className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
                Conectando con Firebase...
              </div>
            )}
            {firebaseError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm text-center">
                {firebaseError}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4 fade-in-delay">
              <div>
                <label className="block text-sm font-medium text-rose-900 mb-2">
                  🔑 Contraseña Maestra
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                  placeholder="Ingresa la contraseña"
                  className="w-full px-4 py-3 rounded-xl border border-rose-200 bg-white/70 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent text-rose-900 placeholder:text-rose-300 transition-all"
                  disabled={!firebaseReady}
                />
              </div>
              {passwordError && (
                <p className="text-rose-500 text-sm text-center animate-pulse">{passwordError}</p>
              )}
              <button
                type="submit"
                disabled={!firebaseReady}
                className="w-full py-3 px-4 rounded-xl mary-gradient-dark text-white font-semibold shadow-lg shadow-rose-300/30 hover:shadow-xl hover:shadow-rose-300/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Ingresar al Panel
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-xs text-rose-300 mt-6">
              © 2025 Mary Bot — Panel de Administración
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-md border-b border-rose-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full mary-gradient-dark flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
                  <path d="M20 4L22 12L30 14L22 16L20 24L18 16L10 14L18 12L20 4Z" fill="white" />
                  <path d="M12 18L13.5 23L18 24.5L13.5 26L12 31L10.5 26L6 24.5L10.5 23L12 18Z" fill="white" opacity="0.7" />
                  <path d="M28 18L29.5 23L34 24.5L29.5 26L28 31L26.5 26L22 24.5L26.5 23L28 18Z" fill="white" opacity="0.7" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-rose-900 leading-tight">Mary Bot</h1>
                <p className="text-xs text-rose-400">Panel Maestro</p>
              </div>
            </div>
            <button
              onClick={() => setAuthenticated(false)}
              className="text-sm text-rose-400 hover:text-rose-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-rose-50"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Licencias"
            value={totalLicenses}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
            color="rose"
          />
          <StatCard
            title="Activas"
            value={activeLicenses}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="emerald"
          />
          <StatCard
            title="Expiradas"
            value={expiredLicenses}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="amber"
          />
          <StatCard
            title="Ingresos/Mes"
            value={`$${revenueThisMonth}`}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="amber"
          />
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent text-sm text-rose-900 placeholder:text-rose-300"
              />
            </div>

            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-rose-200 bg-white text-sm text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-300 cursor-pointer"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="expired">Expiradas</option>
              <option value="suspended">Suspendidas</option>
            </select>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => { resetForm(); setShowAddModal(true); }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl mary-gradient-dark text-white text-sm font-medium shadow-sm hover:shadow-md transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Nueva Licencia</span>
                <span className="sm:hidden">Nueva</span>
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium shadow-sm hover:bg-amber-600 hover:shadow-md transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="hidden sm:inline">Importar JSON</span>
                <span className="sm:hidden">Importar</span>
              </button>
            </div>
          </div>
        </div>

        {/* License Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden">
          {loadingLicenses ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-3 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
              <p className="text-sm text-rose-400">Cargando licencias...</p>
            </div>
          ) : filteredLicenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-rose-400 font-medium">No se encontraron licencias</p>
              <p className="text-rose-300 text-sm">
                {searchTerm || filterStatus !== 'all'
                  ? 'Intenta ajustar el filtro de búsqueda'
                  : 'Agrega tu primera licencia con el botón de arriba'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-rose-50/80 text-rose-600">
                      <th className="text-left px-4 py-3 font-semibold">Salón</th>
                      <th className="text-left px-4 py-3 font-semibold">Propietaria</th>
                      <th className="text-left px-4 py-3 font-semibold">Teléfono</th>
                      <th className="text-left px-4 py-3 font-semibold">Plan</th>
                      <th className="text-center px-4 py-3 font-semibold">Estado</th>
                      <th className="text-left px-4 py-3 font-semibold">Vencimiento</th>
                      <th className="text-center px-4 py-3 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-50">
                    {filteredLicenses.map((lic) => (
                      <tr key={lic.id} className="hover:bg-rose-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-rose-900">{lic.salonName}</td>
                        <td className="px-4 py-3 text-rose-700">{lic.ownerName}</td>
                        <td className="px-4 py-3 text-rose-600">
                          <a href={`https://wa.me/${lic.ownerPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-green-600 transition-colors">
                            {lic.ownerPhone}
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                            {formatPrice(lic.plan)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[lic.status]}`}>
                            {STATUS_LABELS[lic.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-rose-600">{formatDate(lic.expirationDate)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEditModal(lic)}
                              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              title="Editar"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleToggleStatus(lic)}
                              className={`p-1.5 rounded-lg transition-colors ${lic.status === 'active' ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                              title={lic.status === 'active' ? 'Suspender' : 'Activar'}
                            >
                              {lic.status === 'active' ? (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(lic.id)}
                              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              title="Eliminar"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-rose-50 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {filteredLicenses.map((lic) => (
                  <div key={lic.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-rose-900">{lic.salonName}</h3>
                        <p className="text-sm text-rose-600">{lic.ownerName}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[lic.status]}`}>
                        {STATUS_LABELS[lic.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-rose-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {lic.ownerPhone}
                      </span>
                      <span>{formatPrice(lic.plan)}</span>
                      <span>Vence: {formatDate(lic.expirationDate)}</span>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => openEditModal(lic)}
                        className="flex-1 py-2 rounded-lg bg-rose-50 text-rose-600 text-sm font-medium hover:bg-rose-100 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleStatus(lic)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          lic.status === 'active' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {lic.status === 'active' ? 'Suspender' : 'Activar'}
                      </button>
                      <button
                        onClick={() => handleDelete(lic.id)}
                        className="py-2 px-3 rounded-lg bg-rose-50 text-rose-500 text-sm hover:bg-rose-100 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer count */}
              <div className="px-4 py-3 bg-rose-50/50 border-t border-rose-100 text-xs text-rose-400">
                Mostrando {filteredLicenses.length} de {totalLicenses} licencias
              </div>
            </>
          )}
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ADD / EDIT MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={resetForm} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar fade-in">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-rose-900">
                  {editingLicense ? 'Editar Licencia' : 'Nueva Licencia'}
                </h2>
                <button onClick={resetForm} className="p-1 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-rose-700 mb-1.5">Nombre del Salón *</label>
                  <input
                    type="text"
                    value={formSalonName}
                    onChange={(e) => setFormSalonName(e.target.value)}
                    placeholder="Ej: Glam Nails Studio"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent text-sm text-rose-900 placeholder:text-rose-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-rose-700 mb-1.5">Nombre de la Propietaria *</label>
                  <input
                    type="text"
                    value={formOwnerName}
                    onChange={(e) => setFormOwnerName(e.target.value)}
                    placeholder="Ej: María García"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent text-sm text-rose-900 placeholder:text-rose-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-rose-700 mb-1.5">Teléfono *</label>
                  <input
                    type="tel"
                    value={formOwnerPhone}
                    onChange={(e) => setFormOwnerPhone(e.target.value)}
                    placeholder="Ej: +52 55 1234 5678"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent text-sm text-rose-900 placeholder:text-rose-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-rose-700 mb-1.5">Plan</label>
                    <select
                      value={formPlan}
                      onChange={(e) => setFormPlan(e.target.value as License['plan'])}
                      className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm text-rose-900 cursor-pointer"
                    >
                      {PLANS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label} — ${p.price}/{p.unit}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-rose-700 mb-1.5">Fecha de Inicio</label>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm text-rose-900"
                    />
                  </div>
                </div>

                {/* Expiration preview */}
                <div className="bg-rose-50 rounded-xl p-3 flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-rose-600">
                    Vencimiento calculado: <strong>{formatDate(calcExpiration(formStartDate, formPlan))}</strong>
                  </span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 py-2.5 rounded-xl border border-rose-200 text-rose-600 text-sm font-medium hover:bg-rose-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="flex-1 py-2.5 rounded-xl mary-gradient-dark text-white text-sm font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                  >
                    {formSubmitting ? 'Guardando...' : editingLicense ? 'Actualizar' : 'Crear Licencia'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* IMPORT JSON MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => { setShowImportModal(false); setImportJson(''); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg fade-in">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-rose-900">Importar Licencias</h2>
                <button onClick={() => { setShowImportModal(false); setImportJson(''); }} className="p-1 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-rose-600">
                  Pega un JSON array con las licencias o sube un archivo .json. Campos soportados:
                  <code className="ml-1 px-1.5 py-0.5 bg-rose-50 rounded text-xs font-mono">salonName</code>,
                  <code className="ml-1 px-1.5 py-0.5 bg-rose-50 rounded text-xs font-mono">ownerName</code>,
                  <code className="ml-1 px-1.5 py-0.5 bg-rose-50 rounded text-xs font-mono">ownerPhone</code>,
                  <code className="ml-1 px-1.5 py-0.5 bg-rose-50 rounded text-xs font-mono">plan</code>,
                  <code className="ml-1 px-1.5 py-0.5 bg-rose-50 rounded text-xs font-mono">startDate</code>
                </p>

                {/* File upload */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 rounded-xl border-2 border-dashed border-rose-200 text-rose-400 text-sm hover:border-rose-300 hover:text-rose-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Subir archivo JSON
                  </button>
                </div>

                <textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder='[{"salonName": "Glam Nails", "ownerName": "María", "ownerPhone": "+52 55 1234", "plan": "mensual"}]'
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-rose-200 bg-rose-50/50 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent text-sm text-rose-900 placeholder:text-rose-300 font-mono resize-none custom-scrollbar"
                />

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowImportModal(false); setImportJson(''); }}
                    className="flex-1 py-2.5 rounded-xl border border-rose-200 text-rose-600 text-sm font-medium hover:bg-rose-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={importing || !importJson.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-medium shadow-sm hover:bg-amber-600 transition-all disabled:opacity-50"
                  >
                    {importing ? 'Importando...' : 'Importar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-rose-300">
        © 2025 Mary Bot — Panel Maestro de Licencias
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STAT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
function StatCard({ title, value, icon, color }: { title: string; value: number | string; icon: React.ReactNode; color: string }) {
  const colorClasses: Record<string, { bg: string; iconBg: string; iconText: string; valueText: string }> = {
    rose: { bg: 'bg-white', iconBg: 'bg-rose-100', iconText: 'text-rose-600', valueText: 'text-rose-900' },
    emerald: { bg: 'bg-white', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', valueText: 'text-emerald-700' },
    amber: { bg: 'bg-white', iconBg: 'bg-amber-100', iconText: 'text-amber-600', valueText: 'text-amber-700' },
  };
  const c = colorClasses[color] || colorClasses.rose;

  return (
    <div className={`${c.bg} rounded-2xl shadow-sm border border-rose-100 p-4 flex items-center gap-4`}>
      <div className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center ${c.iconText} shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-rose-400 font-medium truncate">{title}</p>
        <p className={`text-2xl font-bold ${c.valueText} leading-tight`}>{value}</p>
      </div>
    </div>
  );
}
