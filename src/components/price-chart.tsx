'use client';

import { useMemo } from 'react';
import { useTradingStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export function PriceChart() {
  const { currentSymbol, currentPrice, ticks, priceDirection } = useTradingStore();

  const chartData = useMemo(() => {
    const displayTicks = ticks.slice(-150);
    return displayTicks.map((tick, i) => ({
      time: new Date(tick.epoch * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      price: tick.quote,
      index: i,
    }));
  }, [ticks]);

  const priceStats = useMemo(() => {
    if (ticks.length < 2) return { high: 0, low: 0, change: 0, changePercent: 0 };
    const prices = ticks.slice(-100).map((t) => t.quote);
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const first = prices[0];
    const last = prices[prices.length - 1];
    const change = last - first;
    const changePercent = (change / first) * 100;
    return { high, low, change, changePercent };
  }, [ticks]);

  const isPositive = priceStats.change >= 0;
  const marketName = currentSymbol.replace('R_', 'Vol ').replace('JD', 'Jump ');

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Activity className="h-4 w-4 text-sky-400" />
              {marketName}
            </CardTitle>
            <Badge variant="secondary" className="text-[10px] font-mono">
              {ticks.length > 0 ? `${ticks.length} ticks` : 'No data'}
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            {/* Current Price */}
            <div className="text-right">
              <div className={`flex items-center gap-1 text-lg font-bold font-mono ${
                priceDirection === 'up' ? 'text-emerald-400' :
                priceDirection === 'down' ? 'text-red-400' : 'text-foreground'
              }`}>
                {priceDirection === 'up' && <ArrowUp className="h-3.5 w-3.5" />}
                {priceDirection === 'down' && <ArrowDown className="h-3.5 w-3.5" />}
                {priceDirection === 'neutral' && <Minus className="h-3.5 w-3.5" />}
                {currentPrice > 0 ? currentPrice.toFixed(4) : '---.----'}
              </div>
              <div className={`text-[11px] font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{priceStats.change.toFixed(4)} ({isPositive ? '+' : ''}{priceStats.changePercent.toFixed(3)}%)
              </div>
            </div>
          </div>
        </div>

        {/* Price Stats Bar */}
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground mt-1">
          <span>H: <span className="text-emerald-400 font-mono">{priceStats.high.toFixed(4)}</span></span>
          <span>L: <span className="text-red-400 font-mono">{priceStats.low.toFixed(4)}</span></span>
          <span>O: <span className="font-mono">{ticks.length > 0 ? ticks[ticks.length - 100]?.quote.toFixed(4) || '---' : '---'}</span></span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[280px] sm:h-[320px] lg:h-[380px]">
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 9, fill: '#6b7280' }}
                  interval="preserveStartEnd"
                  tickLine={false}
                  axisLine={{ stroke: '#374151' }}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 9, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#374151' }}
                  tickFormatter={(v: number) => v.toFixed(2)}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e2432',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f3f4f6',
                  }}
                  formatter={(value: number) => [value.toFixed(4), 'Price']}
                  labelFormatter={(label: string) => `Time: ${label}`}
                />
                <ReferenceLine y={currentPrice} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1} />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive ? '#10b981' : '#ef4444'}
                  strokeWidth={1.5}
                  fill="url(#priceGradient)"
                  animationDuration={300}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              {currentPrice > 0 ? 'Loading chart data...' : 'Connect to see live prices'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
