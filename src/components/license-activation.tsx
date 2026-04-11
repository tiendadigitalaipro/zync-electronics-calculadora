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
  Monitor, Mail, User, KeyRound, Info, Crown, Star, Zap, ArrowRight,
  ChevronLeft, Sparkles, Gift
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// PRICING PLANS
// ═══════════════════════════════════════════════════════════════════════════

const PRICING_PLANS = [
  {
    id: '1 mes',
    label: '1 Mes',
    price: 25,
    period: '1 mes',
    features: ['Acceso completo al bot', 'Todos los mercados', 'Soporte por chat'],
    popular: false,
  },
  {
    id: '3 meses',
    label: '3 Meses',
    price: 60,
    period: '3 meses',
    features: ['Acceso completo al bot', 'Todos los mercados', 'Soporte prioritario', '20% de descuento'],
    popular: true,
  },
  {
    id: '6 meses',
    label: '6 Meses',
    price: 100,
    period: '6 meses',
    features: ['Acceso completo al bot', 'Todos los mercados', 'Soporte VIP', '33% de descuento'],
    popular: false,
  },
  {
    id: '12 meses',
    label: '12 Meses',
    price: 180,
    period: '12 meses',
    features: ['Acceso completo al bot', 'Todos los mercados', 'Soporte VIP 24/7', '40% de descuento', 'Actualizaciones gratuitas'],
    popular: false,
  },
];

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
// PRICING PLANS DISPLAY
// ═══════════════════════════════════════════════════════════════════════════

function PricingPlans({ onSelectPlan }: { onSelectPlan?: () => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {PRICING_PLANS.map((plan) => (
        <div
          key={plan.id}
          className={`relative rounded-xl border p-4 transition-all hover:scale-[1.02] ${
            plan.popular
              ? 'border-amber-500/60 bg-gradient-to-b from-amber-500/10 to-amber-500/5 shadow-lg shadow-amber-900/20 ring-1 ring-amber-500/30'
              : 'border-border/40 bg-secondary/20 hover:border-border/70'
          }`}
        >
          {plan.popular && (
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
              <Badge className="bg-amber-500 text-black text-[9px] px-2 py-0 font-bold shadow-md">
                <Star className="h-2.5 w-2.5 mr-0.5" />
                POPULAR
              </Badge>
            </div>
          )}
          <div className="text-center space-y-2">
            <div className="text-sm font-bold text-foreground">{plan.label}</div>
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-2xl font-extrabold text-amber-400">${plan.price}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">USD / {plan.period}</div>
          </div>
          <ul className="mt-3 space-y-1">
            {plan.features.map((feat, i) => (
              <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                <Check className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                {feat}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// Badge component inline
function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${className || ''}`}>
      {children}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN A: REGISTRATION (first visit) — with PRO + Demo options
// ═══════════════════════════════════════════════════════════════════════════

export function RegistrationScreen() {
  const { startDemo, isLoading, error, deviceFingerprint } = useLicenseStore();
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState('');
  const [fingerprint, setFingerprint] = useState(deviceFingerprint || '...');
  const [showProActivation, setShowProActivation] = useState(false);

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
      setLocalError('Ingresa un correo electronico valido');
      return;
    }
    if (!accepted) {
      setLocalError('Debes aceptar los terminos de uso');
      return;
    }

    await startDemo(ownerName.trim(), ownerEmail.trim());
  };

  const handleGoToProActivation = () => {
    if (!ownerName.trim() || !ownerEmail.trim() || !ownerEmail.includes('@')) {
      setLocalError('Completa nombre y correo antes de activar PRO');
      return;
    }
    setShowProActivation(true);
  };

  const copyDeviceId = () => {
    navigator.clipboard.writeText(fingerprint).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // If user clicked "Activar PRO", show the license key screen
  if (showProActivation) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <LogoHeader subtitle="Ingresa tu licencia PRO para comenzar" />
          <LicenseKeyInput />
          <button
            onClick={() => setShowProActivation(false)}
            className="flex items-center justify-center gap-1 w-full text-xs text-muted-foreground hover:text-foreground mt-4 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Volver a registro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LogoHeader subtitle="Bienvenido a SynthTrade Pro" />

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
              <Label htmlFor="reg-name" className="text-xs text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Nombre completo
              </Label>
              <Input
                id="reg-name"
                placeholder="Tu nombre"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="bg-secondary/50 border-border/50 h-10"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-email" className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Correo electronico
              </Label>
              <Input
                id="reg-email"
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
                Acepto los terminos de uso y la politica de privacidad. Entiendo que la licencia esta vinculada a mi dispositivo.
              </Label>
            </div>

            {/* Error */}
            {(error || localError) && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-400">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error || localError}</AlertDescription>
              </Alert>
            )}

            {/* TWO MAIN BUTTONS */}
            <div className="space-y-3">
              {/* Button 1: DEMO */}
              <Button
                onClick={handleStartDemo}
                disabled={isLoading || !accepted}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-900/30 transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Activando...
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    Probar 3 Dias GRATIS
                  </>
                )}
              </Button>

              {/* Button 2: PRO */}
              <Button
                onClick={handleGoToProActivation}
                disabled={!accepted}
                className="w-full h-12 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-900/30 transition-all"
              >
                <Crown className="h-4 w-4 mr-2" />
                Activar Licencia PRO
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <p className="text-center text-[10px] text-muted-foreground/60 pt-1">
              Al activar, tu dispositivo queda registrado de forma permanente.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LICENSE KEY INPUT COMPONENT (reusable)
// ═══════════════════════════════════════════════════════════════════════════

function LicenseKeyInput() {
  const { activateLicense, isLoading, error } = useLicenseStore();
  const [parts, setParts] = useState(['', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInput = useCallback((index: number, value: string) => {
    const filtered = value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5);
    const newParts = [...parts];
    newParts[index] = filtered;
    setParts(newParts);

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
    <Card className="bg-card/80 backdrop-blur-xl border-amber-500/20 shadow-2xl shadow-amber-900/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-amber-400" />
          Ingresar Licencia PRO
        </CardTitle>
        <CardDescription className="text-xs">
          Ingresa la clave de 5 bloques que recibiste del administrador.
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
          className="w-full h-12 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-900/30 transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Activando licencia...
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4 mr-2" />
              Activar Licencia PRO
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN B: LICENSE ACTIVATION (after demo expired or from "Ya tengo licencia")
// ═══════════════════════════════════════════════════════════════════════════

export function LicenseActivationScreen() {
  const { demoDaysRemaining, licensePlan, deviceFingerprint } = useLicenseStore();
  const [copied, setCopied] = useState(false);

  const copyDeviceId = () => {
    if (deviceFingerprint) {
      navigator.clipboard.writeText(deviceFingerprint).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const isExpiredDemo = demoDaysRemaining < 0;
  const expiredDays = Math.abs(demoDaysRemaining);

  return (
    <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <LogoHeader />

        {/* Expiry message if coming from demo */}
        {isExpiredDemo && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <span className="text-sm font-bold text-red-400">
                {licensePlan ? `Licencia ${licensePlan} expirada` : 'Prueba expirada'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {licensePlan
                ? `Tu plan PRO (${licensePlan}) vencio hace ${expiredDays} dia${expiredDays !== 1 ? 's' : ''}. Renueva para seguir operando.`
                : `Tu prueba gratuita de 3 dias expiro hace ${expiredDays} dia${expiredDays !== 1 ? 's' : ''}.`
              }
            </p>
          </div>
        )}

        {/* Pricing Plans */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-400" />
            Planes Disponibles
          </h3>
          <PricingPlans />
        </div>

        {/* How to buy */}
        <div className="bg-secondary/30 border border-border/30 rounded-xl p-4 mb-4 space-y-2">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-blue-400" />
            Como obtener tu licencia
          </p>
          <ol className="text-[11px] text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Contacta al administrador y elige tu plan</li>
            <li>Realiza el pago por el medio indicado</li>
            <li>Recibe tu clave de licencia por correo o chat</li>
            <li>Ingresa la clave de 5 bloques abajo y activa</li>
          </ol>
        </div>

        {/* Device ID for reference */}
        {deviceFingerprint && (
          <div className="bg-secondary/20 border border-border/20 rounded-xl p-3 mb-4">
            <p className="text-[10px] text-muted-foreground mb-1.5">Tu ID de dispositivo (envialo al administrador):</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-secondary/50 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-foreground truncate">
                {deviceFingerprint}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyDeviceId}
                className="shrink-0 h-7 w-7"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        )}

        {/* License Key Input */}
        <LicenseKeyInput />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN C: DEMO EXPIRED
// ═══════════════════════════════════════════════════════════════════════════

export function DemoExpiredScreen() {
  const { deviceFingerprint } = useLicenseStore();
  const [copied, setCopied] = useState(false);

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
      <div className="w-full max-w-lg">
        <LogoHeader />

        {/* Warning */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mb-4 text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Periodo de prueba finalizado
          </h2>
          <p className="text-sm text-muted-foreground">
            Tu prueba gratuita de 3 dias ha expirado. Obtén tu licencia PRO para desbloquear todas las funciones.
          </p>
        </div>

        {/* Pricing Plans */}
        <div className="mb-4">
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-400" />
            Elije tu Plan PRO
          </h3>
          <PricingPlans />
        </div>

        {/* How to buy */}
        <div className="bg-secondary/30 border border-border/30 rounded-xl p-4 mb-4 space-y-2">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-blue-400" />
            Como activar
          </p>
          <ol className="text-[11px] text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Contacta al administrador con tu ID de dispositivo</li>
            <li>Elige tu plan y realiza el pago</li>
            <li>Recibe tu clave de licencia</li>
            <li>Ingresa la clave abajo para activar</li>
          </ol>
        </div>

        {/* Device ID */}
        {deviceFingerprint && (
          <div className="bg-secondary/20 border border-border/20 rounded-xl p-3 mb-4">
            <p className="text-[10px] text-muted-foreground mb-1.5">Tu ID de dispositivo:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-secondary/50 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-foreground truncate">
                {deviceFingerprint}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyDeviceId}
                className="shrink-0 h-7 w-7"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        )}

        {/* License Key Input */}
        <LicenseKeyInput />
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
                Tu licencia PRO esta actualmente en pausa. Contacta al administrador para reactivar tu acceso.
              </p>
            </div>

            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-xs text-yellow-400/80 flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                La pausa puede ser temporal por mantenimiento o por solicitud del titular. Tu licencia sigue siendo valida.
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
                Tu licencia ha sido bloqueada. Contacta al administrador para mas informacion.
              </p>
            </div>

            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <p className="text-xs text-red-400/80 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                El bloqueo puede deberse a violacion de terminos de uso, uso no autorizado, o solicitud del titular.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
