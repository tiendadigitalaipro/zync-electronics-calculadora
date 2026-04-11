'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLicenseStore } from '@/lib/license-store';
import { getDeviceFingerprint } from '@/lib/device-fingerprint';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ShieldCheck, AlertTriangle, XCircle, Clock, Copy, Check, Loader2,
  Monitor, Mail, User, KeyRound, Info
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// LOGO HEADER
// ═══════════════════════════════════════════════════════════════════════════

function LogoHeader({ subtitle }: { subtitle?: string }) {
  return (
    <div className="text-center space-y-2 mb-6">
      <img
        src="/logo-a2k-pro.png"
        alt="A2K Digital Studio"
        className="w-16 h-16 mx-auto rounded-2xl object-cover shadow-lg shadow-amber-900/30 ring-2 ring-amber-500/20"
      />
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          SynthTrade<span className="text-amber-400">Pro</span>
        </h1>
        <p className="text-xs text-muted-foreground tracking-wider uppercase">
          by A2K Digital Studio
        </p>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN A: REGISTRATION (first visit)
// ═══════════════════════════════════════════════════════════════════════════

export function RegistrationScreen() {
  const { startDemo, isLoading, error, deviceFingerprint } = useLicenseStore();
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState('');
  const [fingerprint, setFingerprint] = useState(deviceFingerprint || '...');

  useEffect(() => {
    getDeviceFingerprint().then(fp => setFingerprint(fp));
  }, []);

  const handleStartDemo = async () => {
    setLocalError('');

    if (!ownerName.trim()) {
      setLocalError('Ingresa tu nombre completo');
      return;
    }
    if (!ownerEmail.trim() || !ownerEmail.includes('@')) {
      setLocalError('Ingresa un correo electrónico válido');
      return;
    }
    if (!accepted) {
      setLocalError('Debes aceptar los términos de uso');
      return;
    }

    await startDemo(ownerName.trim(), ownerEmail.trim());
  };

  const copyDeviceId = () => {
    navigator.clipboard.writeText(fingerprint).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LogoHeader subtitle="Activar cuenta de prueba — 3 días PRO" />

        <Card className="bg-card/80 backdrop-blur-xl border-amber-500/20 shadow-2xl shadow-amber-900/10">
          <CardContent className="p-6 space-y-5">
            {/* Device ID */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Monitor className="h-3.5 w-3.5" />
                ID de Dispositivo
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 font-mono text-xs text-foreground truncate">
                  {fingerprint}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyDeviceId}
                  className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground/70">
                Tu dispositivo queda registrado. Solo puedes usar el bot en ESTE dispositivo.
              </p>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="demo-name" className="text-xs text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Nombre completo
              </Label>
              <Input
                id="demo-name"
                placeholder="Tu nombre"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="bg-secondary/50 border-border/50 h-10"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="demo-email" className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Correo electrónico
              </Label>
              <Input
                id="demo-email"
                type="email"
                placeholder="tu@email.com"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                className="bg-secondary/50 border-border/50 h-10"
              />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="terms"
                checked={accepted}
                onCheckedChange={(v) => setAccepted(v === true)}
                className="mt-0.5 border-border/50"
              />
              <Label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                Acepto los términos de uso y la política de privacidad. Entiendo que la licencia está vinculada a mi dispositivo.
              </Label>
            </div>

            {/* Error */}
            {(error || localError) && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-400">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error || localError}</AlertDescription>
              </Alert>
            )}

            {/* Submit */}
            <Button
              onClick={handleStartDemo}
              disabled={isLoading}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-900/30 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Activando...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Activar Prueba GRATIS — 3 Días
                </>
              )}
            </Button>

            <p className="text-center text-[10px] text-muted-foreground/60 pt-1">
              Al activar, aceptas que tu dispositivo queda registrado de forma permanente.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN B: LICENSE ACTIVATION
// ═══════════════════════════════════════════════════════════════════════════

export function LicenseActivationScreen() {
  const { activateLicense, isLoading, error } = useLicenseStore();
  const [parts, setParts] = useState(['', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInput = useCallback((index: number, value: string) => {
    // Only allow alphanumeric characters
    const filtered = value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5);
    const newParts = [...parts];
    newParts[index] = filtered;
    setParts(newParts);

    // Auto-focus next input
    if (filtered.length === 5 && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [parts]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !parts[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === '-' || e.key === ' ') {
      e.preventDefault();
      if (index < 4) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  }, [parts]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9-]/g, '');
    const segments = text.split('-');
    if (segments.length === 5 && segments.every(s => s.length === 5)) {
      setParts(segments);
      inputRefs.current[4]?.focus();
    }
  }, []);

  const fullKey = parts.join('-');
  const isComplete = parts.every(p => p.length === 5);

  const handleActivate = async () => {
    if (!isComplete) return;
    await activateLicense(fullKey);
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LogoHeader subtitle="Ingresa tu licencia PRO para continuar" />

        <Card className="bg-card/80 backdrop-blur-xl border-amber-500/20 shadow-2xl shadow-amber-900/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-400" />
              Activar Licencia
            </CardTitle>
            <CardDescription className="text-xs">
              Tu período de prueba ha expirado. Ingresa tu licencia PRO para continuar usando SynthTrade Pro.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {/* License Key Input */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Clave de licencia</Label>
              <div className="flex items-center gap-1.5 justify-center">
                {parts.map((part, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Input
                      ref={(el) => { inputRefs.current[i] = el; }}
                      value={part}
                      onChange={(e) => handleInput(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      onPaste={i === 0 ? handlePaste : undefined}
                      className="w-[72px] sm:w-[80px] h-12 text-center font-mono text-sm font-bold tracking-wider bg-secondary/50 border-border/50 focus:border-amber-500/50"
                      maxLength={5}
                      placeholder="XXXXX"
                    />
                    {i < 4 && (
                      <span className="text-muted-foreground font-bold text-lg">-</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-400">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            {/* Activate Button */}
            <Button
              onClick={handleActivate}
              disabled={isLoading || !isComplete}
              className="w-full h-12 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-900/30 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Activando...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Activar Licencia
                </>
              )}
            </Button>

            {/* Contact info */}
            <div className="text-center space-y-1 pt-2">
              <p className="text-[11px] text-muted-foreground">
                ¿No tienes licencia?
              </p>
              <p className="text-xs text-amber-400 font-medium">
                Contacta al administrador para obtener una
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN C: DEMO EXPIRED
// ═══════════════════════════════════════════════════════════════════════════

export function DemoExpiredScreen() {
  const { demoDaysRemaining, deviceFingerprint } = useLicenseStore();
  const [copied, setCopied] = useState(false);
  const expiredDays = Math.abs(demoDaysRemaining);

  const copyDeviceId = () => {
    if (deviceFingerprint) {
      navigator.clipboard.writeText(deviceFingerprint).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LogoHeader />

        <Card className="bg-card/80 backdrop-blur-xl border-red-500/20 shadow-2xl shadow-red-900/10">
          <CardContent className="p-6 space-y-5 text-center">
            {/* Warning Icon */}
            <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-red-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                Período de prueba finalizado
              </h2>
              <p className="text-sm text-muted-foreground">
                Tu prueba gratuita de 3 días ha expirado hace <span className="text-red-400 font-semibold">{expiredDays} día{expiredDays !== 1 ? 's' : ''}</span>.
              </p>
              <p className="text-sm text-muted-foreground">
                Obtén tu licencia PRO para desbloquear todas las funciones.
              </p>
            </div>

            {/* Device ID */}
            {deviceFingerprint && (
              <div className="space-y-1.5 text-left">
                <Label className="text-xs text-muted-foreground">Tu ID de dispositivo:</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 font-mono text-[11px] text-foreground truncate">
                    {deviceFingerprint}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyDeviceId}
                    className="shrink-0 h-8 w-8"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground/70">
                  Envía este ID al administrador junto con tu solicitud de licencia.
                </p>
              </div>
            )}

            {/* CTA */}
            <Button
              onClick={() => {
                const store = useLicenseStore.getState();
                store.logoutLicense();
                store.initializeLicense();
              }}
              className="w-full h-12 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-900/30 transition-all"
            >
              <KeyRound className="h-4 w-4 mr-2" />
              Ingresar Licencia
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN D: LICENSE PAUSED
// ═══════════════════════════════════════════════════════════════════════════

export function LicensePausedScreen() {
  return (
    <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LogoHeader />

        <Card className="bg-card/80 backdrop-blur-xl border-yellow-500/20 shadow-2xl shadow-yellow-900/10">
          <CardContent className="p-6 space-y-5 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
              <Clock className="h-10 w-10 text-yellow-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                Licencia pausada temporalmente
              </h2>
              <p className="text-sm text-muted-foreground">
                Tu licencia PRO está actualmente en pausa. Contacta al administrador para reactivar tu acceso.
              </p>
            </div>

            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-xs text-yellow-400/80 flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                La pausa puede ser temporal por mantenimiento o por solicitud del titular. Tu licencia sigue siendo válida.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN E: LICENSE BLOCKED
// ═══════════════════════════════════════════════════════════════════════════

export function LicenseBlockedScreen() {
  return (
    <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LogoHeader />

        <Card className="bg-card/80 backdrop-blur-xl border-red-500/20 shadow-2xl shadow-red-900/10">
          <CardContent className="p-6 space-y-5 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-red-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                Licencia bloqueada
              </h2>
              <p className="text-sm text-muted-foreground">
                Tu licencia ha sido bloqueada. Contacta al administrador para más información.
              </p>
            </div>

            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <p className="text-xs text-red-400/80 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                El bloqueo puede deberse a violación de términos de uso, uso no autorizado, o solicitud del titular.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
