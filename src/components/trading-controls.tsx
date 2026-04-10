'use client';

import { useState } from 'react';
import { useTradingStore } from '@/lib/store';
import { SYNTHETIC_MARKETS, getDerivContractType } from '@/lib/strategies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Loader2, DollarSign, Clock, Zap } from 'lucide-react';

export function TradingControls() {
  const {
    isConnected, isAuthorized, currentSymbol, currentMarket, currentPrice,
    tradeAmount, contractDuration, contractDurationUnit,
    setTradeAmount, setContractDuration, placeTrade,
    isAutoTrading, lastSignal, currentProposal,
  } = useTradingStore();

  const [busy, setBusy] = useState(false);
  const handleTrade = async (t: 'CALL' | 'PUT') => { if (busy) return; setBusy(true); try { await placeTrade(t); } finally { setBusy(false); } };
  const canTrade = isConnected && isAuthorized && currentPrice > 0 && isFinite(currentPrice);
  const market = currentMarket || SYNTHETIC_MARKETS.find((m) => m.symbol === currentSymbol);

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <DollarSign className="h-4 w-4 text-amber-400" />Controles
          {isAutoTrading && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] ml-auto"><Zap className="h-2.5 w-2.5 mr-1 animate-pulse" />AUTO</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {market && (
          <div className="rounded-lg bg-background/50 border border-border/30 p-2 space-y-0.5">
            <div className="flex justify-between"><span className="text-[10px] text-muted-foreground">Mercado:</span><span className="text-[11px] font-semibold">{market.name}</span></div>
            <div className="flex justify-between"><span className="text-[10px] text-muted-foreground">Símbolo:</span><span className="text-[10px] font-mono text-amber-400">{market.symbol}</span></div>
            <div className="flex justify-between">
              <span className="text-[10px] text-muted-foreground">Tipo:</span>
              <Badge className={`text-[8px] px-1.5 py-0 ${market.supportsCallPut ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                {market.supportsCallPut ? 'CALL / PUT' : 'DIGIT (Boom/Crash)'}
              </Badge>
            </div>
            {!market.supportsCallPut && (
              <p className="text-[9px] text-amber-400/70">⚠ Boom/Crash usan contratos digit. CALL → DIGITMATCH, PUT → DIGITDIFF</p>
            )}
            {market.minDurationMinutes > 0 && (
              <p className="text-[9px] text-yellow-400/70">⚠ Mínimo {market.minDurationMinutes} minutos para metales</p>
            )}
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Monto (USD)</Label>
          <Input type="number" value={tradeAmount} onChange={(e) => setTradeAmount(parseFloat(e.target.value) || 0)} min={0.35} step={0.5} className="h-9 text-sm font-mono bg-background/50" />
          <div className="flex gap-1.5 mt-1">
            {[0.5, 1, 2, 5, 10].map((a) => (
              <button key={a} onClick={() => setTradeAmount(a)} className={`flex-1 text-[10px] py-1 rounded transition-colors ${tradeAmount === a ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-background/50 text-muted-foreground hover:bg-background/80 border border-border/30'}`}>${a}</button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider"><Clock className="h-3 w-3 inline mr-1" />Duración</Label>
          <div className="flex gap-2">
            <Input type="number" value={contractDuration} onChange={(e) => setContractDuration(parseInt(e.target.value) || 1)} min={1} className="h-9 text-sm font-mono bg-background/50 flex-1" />
            <Select value={contractDurationUnit} onValueChange={(v) => setContractDuration(contractDuration, v)}>
              <SelectTrigger className="h-9 w-24 text-xs bg-background/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="t">Ticks</SelectItem>
                <SelectItem value="s">Segundos</SelectItem>
                <SelectItem value="m">Minutos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-1.5 mt-1">
            {[1, 3, 5, 15].map((d) => (
              <button key={d} onClick={() => setContractDuration(d, 'm')} className={`flex-1 text-[10px] py-1 rounded transition-colors ${contractDuration === d && contractDurationUnit === 'm' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-background/50 text-muted-foreground hover:bg-background/80 border border-border/30'}`}>{d}m</button>
            ))}
          </div>
        </div>

        {lastSignal && (
          <div className={`rounded-lg p-2.5 border text-xs ${lastSignal.type === 'CALL' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : lastSignal.type === 'PUT' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-background/50 border-border/30 text-muted-foreground'}`}>
            <div className="font-semibold text-[11px] mb-0.5">📊 {lastSignal.type || 'NONE'} ({lastSignal.confidence}%)</div>
            <div className="text-[10px] opacity-80">{lastSignal.reason}</div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => handleTrade('CALL')} disabled={!canTrade || busy} className="h-12 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><TrendingUp className="h-4 w-4 mr-1.5" />CALL</>}
          </Button>
          <Button onClick={() => handleTrade('PUT')} disabled={!canTrade || busy} className="h-12 text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><TrendingDown className="h-4 w-4 mr-1.5" />PUT</>}
          </Button>
        </div>

        {currentProposal && (
          <div className="rounded-lg bg-background/50 border border-border/30 p-2.5">
            <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Contrato:</span><span className="font-mono font-bold text-amber-400">{currentProposal.contractType}</span></div>
            <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Costo:</span><span className="font-mono font-bold">${currentProposal.askPrice.toFixed(2)}</span></div>
            <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Pago:</span><span className="font-mono font-bold text-emerald-400">${currentProposal.payout.toFixed(2)}</span></div>
          </div>
        )}

        {!canTrade && <p className="text-[10px] text-muted-foreground text-center">Conecta con Deriv para operar</p>}
      </CardContent>
    </Card>
  );
}
