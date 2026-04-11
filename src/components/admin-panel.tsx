'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLicenseStore, type LicenseRecord, type DemoRecord } from '@/lib/license-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShieldCheck, Loader2, KeyRound, Copy, Check, Trash2, Ban, Pause,
  PlayCircle, Wrench, Plus, RefreshCw, LogOut, Users, Monitor,
  Activity, Clock, ArrowLeft, Eye, EyeOff, Download, XCircle
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN LOGIN
// ═══════════════════════════════════════════════════════════════════════════

function AdminLogin() {
  const { adminLogin, isLoading, error, setShowAdminPanel } = useLicenseStore();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!password) return;
    const success = await adminLogin(password);
    if (success) {
      setShowAdminPanel(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Acceso Administrador</h1>
          <p className="text-xs text-muted-foreground">SynthTrade Pro — Panel de control</p>
        </div>

        <Card className="bg-card/80 backdrop-blur-xl border-amber-500/20">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-pw" className="text-xs text-muted-foreground">Contraseña</Label>
              <div className="relative">
                <Input
                  id="admin-pw"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="bg-secondary/50 border-border/50 h-11 pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-400">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleLogin}
              disabled={isLoading || !password}
              className="w-full h-11 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Ingresar
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowAdminPanel(false)}
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS BADGE
// ═══════════════════════════════════════════════════════════════════════════

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">Activa</Badge>;
    case 'paused':
      return <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/30 text-[10px]">Pausada</Badge>;
    case 'blocked':
      return <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px]">Bloqueada</Badge>;
    default:
      return <Badge variant="secondary" className="text-[10px]">{status}</Badge>;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

function AdminDashboard() {
  const {
    allLicenses, allDemos, isAdmin, error,
    adminLoadLicenses, adminCreateLicense, adminBlockLicense,
    adminPauseLicense, adminResumeLicense, adminDeleteLicense,
    adminFixDevice, adminDeleteDemo, extendDemo, setShowAdminPanel,
    logoutLicense
  } = useLicenseStore();

  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('1 mes');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState(3);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      adminLoadLicenses();
    }
  }, [isAdmin, adminLoadLicenses]);

  const handleCreateLicense = async () => {
    if (!newOwnerName.trim()) return;
    setLoadingAction('create');
    const key = await adminCreateLicense(newOwnerName.trim(), newOwnerEmail.trim(), selectedPlan);
    if (key) {
      setCreatedKey(key);
      setNewOwnerName('');
      setNewOwnerEmail('');
    }
    setLoadingAction(null);
  };

  const planOptions = [
    { value: '1 mes', label: '1 Mes', price: '$25' },
    { value: '3 meses', label: '3 Meses', price: '$60' },
    { value: '6 meses', label: '6 Meses', price: '$100' },
    { value: '12 meses', label: '12 Meses', price: '$180' },
  ];

  const handleAction = async (action: string, key: string) => {
    setLoadingAction(action);
    let success = false;
    switch (action) {
      case 'block': success = await adminBlockLicense(key); break;
      case 'pause': success = await adminPauseLicense(key); break;
      case 'resume': success = await adminResumeLicense(key); break;
      case 'fix': success = await adminFixDevice(key); break;
      case 'delete': success = await adminDeleteLicense(key); break;
    }
    setLoadingAction(null);
    setConfirmDelete(null);
  };

  const handleDeleteDemo = async (deviceId: string) => {
    setLoadingAction(`demo-${deviceId}`);
    await adminDeleteDemo(deviceId);
    setLoadingAction(null);
  };

  const handleExtendDemo = async (deviceId: string) => {
    setLoadingAction(`extend-${deviceId}`);
    await extendDemo(deviceId, extendDays);
    setLoadingAction(null);
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    });
  };

  const handleLogout = () => {
    setShowAdminPanel(false);
    logoutLicense();
  };

  // Stats
  const totalLicenses = allLicenses.length;
  const activeLicenses = allLicenses.filter(l => l.status === 'active').length;
  const pausedLicenses = allLicenses.filter(l => l.status === 'paused').length;
  const blockedLicenses = allLicenses.filter(l => l.status === 'blocked').length;
  const totalDemos = allDemos.length;
  const activeDemos = allDemos.filter(d => d.expiresAt > Date.now()).length;

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-[#0a0e17]/95 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-a2k-pro.png" alt="A2K" className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <h1 className="text-sm font-bold text-foreground">
                Panel de Administración
              </h1>
              <p className="text-[10px] text-muted-foreground">SynthTrade Pro</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => adminLoadLicenses()}
              className="text-xs text-muted-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Refrescar</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-xs text-red-400 hover:text-red-300"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-3 sm:px-4 py-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Licencias', value: totalLicenses, icon: KeyRound, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Activas', value: activeLicenses, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Pausadas', value: pausedLicenses, icon: Pause, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
            { label: 'Bloqueadas', value: blockedLicenses, icon: Ban, color: 'text-red-400', bg: 'bg-red-500/10' },
            { label: 'Total Demos', value: totalDemos, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Demos Activos', value: activeDemos, icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card/60 backdrop-blur-sm border-border/30">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {error && (
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-400">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="licenses" className="space-y-4">
          <TabsList className="bg-background/50 border border-border/30 h-10">
            <TabsTrigger value="licenses" className="text-xs gap-1.5 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <KeyRound className="h-3.5 w-3.5" />
              Licencias
            </TabsTrigger>
            <TabsTrigger value="create" className="text-xs gap-1.5 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <Plus className="h-3.5 w-3.5" />
              Crear
            </TabsTrigger>
            <TabsTrigger value="demos" className="text-xs gap-1.5 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <Users className="h-3.5 w-3.5" />
              Demos ({totalDemos})
            </TabsTrigger>
          </TabsList>

          {/* ═══ LICENSES TAB ═══ */}
          <TabsContent value="licenses">
            <Card className="bg-card/60 backdrop-blur-sm border-border/30">
              <CardContent className="p-4">
                <div className="max-h-[600px] overflow-y-auto space-y-2">
                  {allLicenses.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      No hay licencias registradas.
                    </p>
                  ) : (
                    allLicenses.map((license) => (
                      <div
                        key={license.licenseKey}
                        className="bg-secondary/30 border border-border/30 rounded-xl p-3 sm:p-4 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <code className="text-xs font-mono text-amber-400 font-semibold">
                                {license.licenseKey}
                              </code>
                              <StatusBadge status={license.status} />
                            </div>
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              <p><span className="text-foreground/70">Owner:</span> {license.owner}</p>
                              <p><span className="text-foreground/70">Email:</span> {license.email}</p>
                              {license.deviceId && (
                                <p className="flex items-center gap-1">
                                  <Monitor className="h-3 w-3" />
                                  <code className="text-[10px]">{license.deviceId.substring(0, 16)}...</code>
                                </p>
                              )}
                              <p className="text-[10px]">
                                Creada: {formatDate(license.createdAt)} — Actualizada: {formatDate(license.updatedAt)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {license.status === 'paused' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAction('resume', license.licenseKey)}
                              disabled={!!loadingAction}
                              className="h-7 text-[10px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 px-2"
                            >
                              {loadingAction === 'resume' ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlayCircle className="h-3 w-3 mr-1" />}
                              Reactivar
                            </Button>
                          )}
                          {license.status === 'active' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAction('pause', license.licenseKey)}
                              disabled={!!loadingAction}
                              className="h-7 text-[10px] text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 px-2"
                            >
                              {loadingAction === 'pause' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Pause className="h-3 w-3 mr-1" />}
                              Pausar
                            </Button>
                          )}
                          {license.status !== 'blocked' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAction('block', license.licenseKey)}
                              disabled={!!loadingAction}
                              className="h-7 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2"
                            >
                              {loadingAction === 'block' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3 mr-1" />}
                              Bloquear
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAction('fix', license.licenseKey)}
                            disabled={!!loadingAction}
                            className="h-7 text-[10px] text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-2"
                          >
                            {loadingAction === 'fix' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wrench className="h-3 w-3 mr-1" />}
                            Fix Device
                          </Button>
                          {confirmDelete === license.licenseKey ? (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleAction('delete', license.licenseKey)}
                                className="h-7 text-[10px] text-red-500 hover:bg-red-500/20 px-2"
                              >
                                Confirmar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirmDelete(null)}
                                className="h-7 text-[10px] text-muted-foreground px-2"
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmDelete(license.licenseKey)}
                              disabled={!!loadingAction}
                              className="h-7 text-[10px] text-red-400/60 hover:text-red-400 hover:bg-red-500/10 px-2"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Eliminar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ CREATE LICENSE TAB ═══ */}
          <TabsContent value="create">
            <Card className="bg-card/60 backdrop-blur-sm border-border/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4 text-amber-400" />
                  Generar Nueva Licencia
                </CardTitle>
                <CardDescription className="text-xs">
                  Crea una nueva licencia PRO para un usuario.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Nombre del titular</Label>
                    <Input
                      placeholder="Nombre completo"
                      value={newOwnerName}
                      onChange={(e) => setNewOwnerName(e.target.value)}
                      className="bg-secondary/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <Input
                      type="email"
                      placeholder="email@ejemplo.com"
                      value={newOwnerEmail}
                      onChange={(e) => setNewOwnerEmail(e.target.value)}
                      className="bg-secondary/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Plan de Suscripcion</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {planOptions.map((plan) => (
                        <button
                          key={plan.value}
                          onClick={() => setSelectedPlan(plan.value)}
                          className={`rounded-lg border p-2.5 text-left transition-all ${
                            selectedPlan === plan.value
                              ? 'border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/30'
                              : 'border-border/30 bg-secondary/30 hover:border-border/60'
                          }`}
                        >
                          <div className="text-xs font-semibold text-foreground">{plan.label}</div>
                          <div className="text-[10px] text-amber-400 font-bold">{plan.price}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCreateLicense}
                  disabled={loadingAction === 'create' || !newOwnerName.trim()}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl"
                >
                  {loadingAction === 'create' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4 mr-2" />
                  )}
                  Generar Licencia
                </Button>

                {createdKey && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                    <p className="text-xs text-emerald-400 font-medium">Licencia generada exitosamente:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-secondary/50 rounded-lg px-3 py-2 text-sm font-mono text-amber-400 font-bold tracking-wider">
                        {createdKey}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyKey(createdKey)}
                        className="shrink-0 h-9 w-9"
                      >
                        {copiedKey ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCreatedKey(null)}
                      className="text-xs text-muted-foreground"
                    >
                      Generar otra
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ DEMOS TAB ═══ */}
          <TabsContent value="demos">
            <Card className="bg-card/60 backdrop-blur-sm border-border/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  Registro de Demos
                </CardTitle>
                <CardDescription className="text-xs">
                  Gestiona las pruebas gratuitas de los usuarios.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="max-h-[600px] overflow-y-auto space-y-2">
                  {allDemos.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      No hay registros de demo.
                    </p>
                  ) : (
                    allDemos.map((demo) => {
                      const isActive = demo.expiresAt > Date.now();
                      const remaining = Math.ceil((demo.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
                      return (
                        <div
                          key={demo.deviceId}
                          className="bg-secondary/30 border border-border/30 rounded-xl p-3 sm:p-4 space-y-2"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <code className="text-[11px] font-mono text-blue-400">
                                  {demo.deviceId.substring(0, 16)}...
                                </code>
                                {isActive ? (
                                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                                    {remaining}d restantes
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px]">
                                    Expirada
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground space-y-0.5">
                                <p><span className="text-foreground/70">Owner:</span> {demo.owner}</p>
                                {demo.email && <p><span className="text-foreground/70">Email:</span> {demo.email}</p>}
                                <p className="text-[10px]">
                                  Inicio: {formatDate(demo.startedAt)} — Expira: {formatDate(demo.expiresAt)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <div className="flex items-center gap-1 mr-2">
                              <Input
                                type="number"
                                min={1}
                                max={30}
                                value={extendDays}
                                onChange={(e) => setExtendDays(parseInt(e.target.value) || 3)}
                                className="w-14 h-7 text-[10px] bg-secondary/50 border-border/50 text-center"
                              />
                              <span className="text-[10px] text-muted-foreground">días</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleExtendDemo(demo.deviceId)}
                              disabled={!!loadingAction}
                              className="h-7 text-[10px] text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-2"
                            >
                              {loadingAction === `extend-${demo.deviceId}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Clock className="h-3 w-3 mr-1" />
                              )}
                              Extender
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteDemo(demo.deviceId)}
                              disabled={!!loadingAction}
                              className="h-7 text-[10px] text-red-400/60 hover:text-red-400 hover:bg-red-500/10 px-2"
                            >
                              {loadingAction === `demo-${demo.deviceId}` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3 mr-1" />
                              )}
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN PANEL (exported)
// ═══════════════════════════════════════════════════════════════════════════

export function AdminPanel() {
  const { isAdmin } = useLicenseStore();

  if (!isAdmin) {
    return <AdminLogin />;
  }

  return <AdminDashboard />;
}
