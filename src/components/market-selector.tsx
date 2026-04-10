'use client';

import { useTradingStore } from '@/lib/store';
import { SYNTHETIC_MARKETS, type MarketInfo } from '@/lib/strategies';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Zap, BarChart3, Activity, Coins, Hash } from 'lucide-react';

const icons: Record<string, React.ReactNode> = {
  'Boom/Crash': <Zap className="h-3.5 w-3.5" />, 'Volatility': <Activity className="h-3.5 w-3.5" />,
  'Jump': <BarChart3 className="h-3.5 w-3.5" />, 'Step': <Hash className="h-3.5 w-3.5" />,
  'Metales': <Coins className="h-3.5 w-3.5" />, 'Forex': <TrendingUp className="h-3.5 w-3.5" />,
};
const colors: Record<string, string> = {
  'Boom/Crash': 'text-amber-400', 'Volatility': 'text-sky-400', 'Jump': 'text-purple-400',
  'Step': 'text-orange-400', 'Metales': 'text-yellow-400', 'Forex': 'text-emerald-400',
};
const bgs: Record<string, string> = {
  'Boom/Crash': 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20',
  'Volatility': 'bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/20',
  'Jump': 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20',
  'Step': 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20',
  'Metales': 'bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20',
  'Forex': 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20',
};

export function MarketSelector() {
  const { currentSymbol, isConnected, subscribeToMarket, supportedMarkets, availableSymbols } = useTradingStore();

  const markets = supportedMarkets.length > 0 ? supportedMarkets : SYNTHETIC_MARKETS;
  // Only mark N/A if API returned data AND the symbol is confirmed suspended
  const apiSet = new Set(availableSymbols.map((s) => s.symbol));
  const suspendedSet = new Set(availableSymbols.filter((s) => s.is_trading_suspended).map((s) => s.symbol));
  // If no API data yet, DON'T show N/A (let user try)
  const hasApiData = availableSymbols.length > 0;

  const categories = Array.from(new Set(markets.map((m) => m.category)));

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <TrendingUp className="h-4 w-4 text-amber-400" />
          Mercados
          <Badge className="ml-auto text-[9px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{markets.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto">
        {categories.map((cat) => {
          const items = markets.filter((m) => m.category === cat);
          if (!items.length) return null;
          return (
            <div key={cat}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={colors[cat] || ''}>{icons[cat]}</span>
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{cat}</span>
                <span className="text-[9px] text-muted-foreground/60">({items.length})</span>
                {!items.some((m) => m.supportsCallPut) && (
                  <Badge className="text-[7px] px-1 py-0 bg-amber-500/20 text-amber-300 border-amber-500/30 ml-1">DIGIT</Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {items.map((market) => {
                  // Only show N/A if: API confirmed the symbol exists AND it's suspended
                  const isSuspended = hasApiData && suspendedSet.has(market.symbol);
                  const disabled = !isConnected || isSuspended;
                  return (
                    <button
                      key={market.symbol}
                      onClick={() => subscribeToMarket(market.symbol)}
                      disabled={disabled}
                      className={`relative rounded-lg border px-2.5 py-2 text-left transition-all duration-200
                        ${bgs[cat] || ''}
                        ${currentSymbol === market.symbol ? 'ring-1 ring-white/30 shadow-lg scale-[1.02]' : ''}
                        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                      title={`${market.description}\nSímbolo: ${market.symbol}\nContratos: ${market.contractTypes.slice(0, 4).join(', ')}${!market.supportsCallPut ? '\n⚠ Solo contratos digit (no CALL/PUT)' : ''}`}
                    >
                      <div className="text-[11px] font-semibold text-foreground truncate">{market.name}</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5 font-mono">{market.symbol}</div>
                      {!market.supportsCallPut && (
                        <span className="text-[7px] text-amber-400/70">digit only</span>
                      )}
                      {currentSymbol === market.symbol && (
                        <Badge className="absolute -top-1 -right-1 text-[8px] px-1 py-0 bg-emerald-500">LIVE</Badge>
                      )}
                      {isSuspended && isConnected && (
                        <div className="absolute inset-0 rounded-lg bg-black/50 flex items-center justify-center">
                          <span className="text-[8px] text-red-400 font-bold">N/A</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
