'use client';

import { useTradingStore } from '@/lib/store';
import { ConnectionPanel } from '@/components/connection-panel';
import { MarketSelector } from '@/components/market-selector';
import { PriceChart } from '@/components/price-chart';
import { TradingControls } from '@/components/trading-controls';
import { StrategyPanel } from '@/components/strategy-panel';
import { TradeHistory } from '@/components/trade-history';
import { PerformanceStats } from '@/components/performance-stats';
import { ActivityLog } from '@/components/activity-log';
import { OpenPositions } from '@/components/open-positions';
import { Badge } from '@/components/ui/badge';
import { Bot, Wifi, WifiOff, Zap } from 'lucide-react';
import { useEffect } from 'react';

export default function Home() {
  const { isConnected, isAutoTrading, currentSymbol, currentPrice, loadTradeHistory } = useTradingStore();

  useEffect(() => {
    loadTradeHistory().catch(console.error);
  }, []);

  const marketLabel = currentSymbol
    .replace('BOOM1000', 'Boom 1000')
    .replace('CRASH1000', 'Crash 1000')
    .replace('R_', 'Vol ')
    .replace('JD', 'Jump ');

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-[#0a0e17]/90 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-900/30">
                <Bot className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-foreground tracking-tight leading-none">
                  SynthTrade<span className="text-amber-400">Pro</span>
                </h1>
                <p className="text-[9px] text-muted-foreground tracking-wider uppercase">Deriv Trading Bot</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-red-500'}`} />
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {isConnected ? (
                  <span className="flex items-center gap-1.5">
                    <Wifi className="h-3 w-3 text-emerald-400" />
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <WifiOff className="h-3 w-3 text-red-400" />
                    Disconnected
                  </span>
                )}
              </span>
            </div>

            {/* Auto Trading Badge */}
            {isAutoTrading && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] animate-pulse">
                <Zap className="h-2.5 w-2.5 mr-1" />
                AUTO TRADING
              </Badge>
            )}

            {/* Market + Price */}
            {isConnected && (
              <div className="hidden sm:flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-1.5 border border-border/30">
                <span className="text-[10px] text-muted-foreground">{marketLabel}</span>
                <span className="text-xs font-bold font-mono text-foreground">
                  {currentPrice > 0 ? currentPrice.toFixed(4) : '---'}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="max-w-[1600px] mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">

          {/* Left Sidebar */}
          <div className="lg:col-span-3 xl:col-span-3 space-y-3 sm:space-y-4">
            <ConnectionPanel />
            <MarketSelector />
          </div>

          {/* Center Content */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-3 sm:space-y-4">
            <PriceChart />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <TradingControls />
              <StrategyPanel />
            </div>
            <OpenPositions />
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-3 xl:col-span-3 space-y-3 sm:space-y-4">
            <PerformanceStats />
            <TradeHistory />
            <ActivityLog />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 mt-4 py-3">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>SynthTrade Pro v1.0 — Automated Trading Bot for Deriv Synthetic Indices</span>
          <span className="hidden sm:inline">
            ⚠️ Trading involves risk. Use demo accounts for testing.
          </span>
        </div>
      </footer>
    </div>
  );
}
