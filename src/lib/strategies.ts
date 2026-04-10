// ═══════════════════════════════════════════════════════════════════════════
// SYNTHETIC MARKETS DICTIONARY — Official Deriv API Symbol Mapping
// ═══════════════════════════════════════════════════════════════════════════
// Every symbol here has been verified against Deriv's active_symbols API.
// These are the ONLY symbols the bot will use for ticks + proposals + buy.

export type MarketType = 'synthetic' | 'volatility' | 'jump' | 'step' | 'metals' | 'forex';

export interface MarketInfo {
  symbol: string;           // Exact Deriv API symbol (e.g. '1HB300V')
  name: string;             // Display name (e.g. 'Boom 300')
  category: string;         // UI grouping
  description: string;
  marketType: MarketType;
  supportedContracts: string[];  // CALL, PUT, RISE, FALL, DIGIT*, etc.
}

// ─── MASTER DICTIONARY ───────────────────────────────────────────────────
// DO NOT change these symbols. They are the official Deriv WebSocket IDs.

export const SYNTHETIC_MARKETS: MarketInfo[] = [

  // ━━━ BOOM / CRASH (Continuous Indices — support CALL/PUT) ━━━
  { symbol: '1HB300V',  name: 'Boom 300',     category: 'Boom/Crash',  description: 'Boom 300 Index (continuous)',  marketType: 'synthetic',  supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: '1HB500V',  name: 'Boom 500',     category: 'Boom/Crash',  description: 'Boom 500 Index (continuous)',  marketType: 'synthetic',  supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: '1HB1000V', name: 'Boom 1000',    category: 'Boom/Crash',  description: 'Boom 1000 Index (continuous)', marketType: 'synthetic',  supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: '1HC300V',  name: 'Crash 300',    category: 'Boom/Crash',  description: 'Crash 300 Index (continuous)', marketType: 'synthetic',  supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: '1HC500V',  name: 'Crash 500',    category: 'Boom/Crash',  description: 'Crash 500 Index (continuous)', marketType: 'synthetic',  supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: '1HC1000V', name: 'Crash 1000',   category: 'Boom/Crash',  description: 'Crash 1000 Index (continuous)',marketType: 'synthetic',  supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'] },

  // ━━━ VOLATILITY (Standard) ━━━
  { symbol: 'R_10',     name: 'Volatility 10',   category: 'Volatility',  description: 'Volatility 10 Index',    marketType: 'volatility', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITFROM', 'DIGITTO'] },
  { symbol: 'R_25',     name: 'Volatility 25',   category: 'Volatility',  description: 'Volatility 25 Index',    marketType: 'volatility', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITFROM', 'DIGITTO'] },
  { symbol: 'R_50',     name: 'Volatility 50',   category: 'Volatility',  description: 'Volatility 50 Index',    marketType: 'volatility', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITFROM', 'DIGITTO'] },
  { symbol: 'R_75',     name: 'Volatility 75',   category: 'Volatility',  description: 'Volatility 75 Index',    marketType: 'volatility', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITFROM', 'DIGITTO'] },
  { symbol: 'R_100',    name: 'Volatility 100',  category: 'Volatility',  description: 'Volatility 100 Index',   marketType: 'volatility', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITFROM', 'DIGITTO'] },

  // ━━━ VOLATILITY (1-Second) ━━━
  { symbol: '1HZ10V',   name: 'Volatility 10 (1s)',  category: 'Volatility',  description: 'Vol 10, 1-second ticks',  marketType: 'volatility', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: '1HZ25V',   name: 'Volatility 25 (1s)',  category: 'Volatility',  description: 'Vol 25, 1-second ticks',  marketType: 'volatility', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: '1HZ50V',   name: 'Volatility 50 (1s)',  category: 'Volatility',  description: 'Vol 50, 1-second ticks',  marketType: 'volatility', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: '1HZ75V',   name: 'Volatility 75 (1s)',  category: 'Volatility',  description: 'Vol 75, 1-second ticks',  marketType: 'volatility', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: '1HZ100V',  name: 'Volatility 100 (1s)', category: 'Volatility',  description: 'Vol 100, 1-second ticks', marketType: 'volatility', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'] },

  // ━━━ JUMP INDICES ━━━
  { symbol: 'JD10',     name: 'Jump 10',    category: 'Jump',  description: 'Jump 10 Index',  marketType: 'jump', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: 'JD25',     name: 'Jump 25',    category: 'Jump',  description: 'Jump 25 Index',  marketType: 'jump', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: 'JD50',     name: 'Jump 50',    category: 'Jump',  description: 'Jump 50 Index',  marketType: 'jump', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: 'JD75',     name: 'Jump 75',    category: 'Jump',  description: 'Jump 75 Index',  marketType: 'jump', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: 'JD100',    name: 'Jump 100',   category: 'Jump',  description: 'Jump 100 Index', marketType: 'jump', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'] },

  // ━━━ STEP INDEX ━━━
  { symbol: 'stpRNG',   name: 'Step RNG',   category: 'Step',  description: 'Step Random Index', marketType: 'step', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITFROM', 'DIGITTO'] },

  // ━━━ METALES (Gold & Silver) ━━━
  { symbol: 'frxXAUUSD', name: 'Gold/USD (Oro)',       category: 'Metales', description: 'Oro vs Dólar estadounidense',   marketType: 'metals', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'] },
  { symbol: 'frxXAGUSD', name: 'Silver/USD (Plata)',   category: 'Metales', description: 'Plata vs Dólar estadounidense', marketType: 'metals', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'] },
  { symbol: 'frxXAUJPY', name: 'Gold/JPY (Oro/Yen)',   category: 'Metales', description: 'Oro vs Yen japonés',             marketType: 'metals', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'] },
  { symbol: 'frxXAUEUR', name: 'Gold/EUR (Oro/Euro)',  category: 'Metales', description: 'Oro vs Euro',                   marketType: 'metals', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'] },
  { symbol: 'frxXAGJPY', name: 'Silver/JPY (Plata/Yen)', category: 'Metales', description: 'Plata vs Yen japonés',        marketType: 'metals', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'] },
  { symbol: 'frxXAGEUR', name: 'Silver/EUR (Plata/Euro)', category: 'Metales', description: 'Plata vs Euro',              marketType: 'metals', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'] },

  // ━━━ FOREX ━━━
  { symbol: 'frxEURUSD', name: 'EUR/USD',   category: 'Forex', description: 'Euro vs Dólar estadounidense', marketType: 'forex', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: 'frxGBPUSD', name: 'GBP/USD',   category: 'Forex', description: 'Libra vs Dólar estadounidense', marketType: 'forex', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: 'frxUSDJPY', name: 'USD/JPY',   category: 'Forex', description: 'Dólar vs Yen japonés',          marketType: 'forex', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: 'frxAUDUSD', name: 'AUD/USD',   category: 'Forex', description: 'Dólar australiano vs Dólar',    marketType: 'forex', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: 'frxUSDCAD', name: 'USD/CAD',   category: 'Forex', description: 'Dólar vs Dólar canadiense',     marketType: 'forex', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: 'frxEURGBP', name: 'EUR/GBP',   category: 'Forex', description: 'Euro vs Libra esterlina',       marketType: 'forex', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: 'frxGBPJPY', name: 'GBP/JPY',   category: 'Forex', description: 'Libra vs Yen japonés',          marketType: 'forex', supportedContracts: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'] },
];

// ─── ALL VALID SYMBOLS (fast lookup) ─────────────────────────────────────
export const VALID_SYMBOLS = new Set(SYNTHETIC_MARKETS.map((m) => m.symbol));

export function isSymbolValid(symbol: string): boolean {
  return VALID_SYMBOLS.has(symbol);
}

export function getMarketBySymbol(symbol: string): MarketInfo | undefined {
  return SYNTHETIC_MARKETS.find((m) => m.symbol === symbol);
}

// ─── Contract Type Mapping ───────────────────────────────────────────────
// All markets in this dictionary support CALL/PUT directly via the Deriv API.
// No special digit-contract translation is needed.

export function getContractType(direction: 'CALL' | 'PUT'): string {
  return direction; // All markets here support standard CALL/PUT
}

// ═══════════════════════════════════════════════════════════════════════════
// TECHNICAL INDICATORS
// ═══════════════════════════════════════════════════════════════════════════

import type { Tick } from './deriv-api';

export function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const slice = prices.slice(-period);
  return slice.reduce((sum, p) => sum + p, 0) / period;
}

export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((s, p) => s + p, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  return ema;
}

export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): { upper: number; middle: number; lower: number; currentPrice: number } {
  if (prices.length < period) {
    const current = prices[prices.length - 1] || 0;
    return { upper: current, middle: current, lower: current, currentPrice: current };
  }
  const slice = prices.slice(-period);
  const middle = slice.reduce((s, p) => s + p, 0) / period;
  const variance = slice.reduce((s, p) => s + Math.pow(p - middle, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  return {
    upper: middle + stdDevMultiplier * stdDev,
    middle,
    lower: middle - stdDevMultiplier * stdDev,
    currentPrice: prices[prices.length - 1],
  };
}

export function calculateMACD(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: number; signal: number; histogram: number } {
  if (prices.length < slowPeriod + signalPeriod) return { macd: 0, signal: 0, histogram: 0 };
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  const macdLine = fastEMA - slowEMA;
  const macdValues: number[] = [];
  for (let i = slowPeriod; i <= prices.length; i++) {
    macdValues.push(calculateEMA(prices.slice(0, i), fastPeriod) - calculateEMA(prices.slice(0, i), slowPeriod));
  }
  const signalLine = macdValues.length >= signalPeriod ? calculateEMA(macdValues, signalPeriod) : macdValues[macdValues.length - 1] || 0;
  return { macd: macdLine, signal: signalLine, histogram: macdLine - signalLine };
}

export function detectSpike(ticks: Tick[], lookback: number = 20, threshold: number = 2.5): 'UP' | 'DOWN' | null {
  if (ticks.length < lookback + 1) return null;
  const recentPrices = ticks.slice(-(lookback + 1)).map((t) => t.quote);
  const avgPrice = recentPrices.slice(0, -1).reduce((s, p) => s + p, 0) / lookback;
  const currentPrice = recentPrices[recentPrices.length - 1];
  const change = Math.abs(currentPrice - avgPrice) / avgPrice * 100;
  const changes: number[] = [];
  for (let i = 1; i < recentPrices.length - 1; i++) {
    changes.push(Math.abs(recentPrices[i] - recentPrices[i - 1]) / recentPrices[i - 1] * 100);
  }
  const avgChange = changes.length > 0 ? changes.reduce((s, c) => s + c, 0) / changes.length : 0;
  const stdChange = changes.length > 1 ? Math.sqrt(changes.reduce((s, c) => s + Math.pow(c - avgChange, 2), 0) / (changes.length - 1)) : avgChange;
  if (avgChange > 0 && change > threshold * stdChange && change > 0.01) {
    return currentPrice > avgPrice ? 'UP' : 'DOWN';
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// STRATEGY ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export interface StrategySignal {
  type: 'CALL' | 'PUT' | null;
  strategy: string;
  confidence: number;
  reason: string;
  indicators: Record<string, number>;
}

export function generateRSISignal(ticks: Tick[], oversold = 30, overbought = 70): StrategySignal {
  const prices = ticks.map((t) => t.quote);
  const rsi = calculateRSI(prices, 14);
  const indicators: Record<string, number> = { rsi };
  if (rsi < oversold) {
    return { type: 'CALL', strategy: 'RSI', confidence: Math.min(100, Math.round(((oversold - rsi) / oversold) * 100)), reason: `RSI ${rsi.toFixed(1)} (oversold < ${oversold}). Expecting reversal up.`, indicators };
  }
  if (rsi > overbought) {
    return { type: 'PUT', strategy: 'RSI', confidence: Math.min(100, Math.round(((rsi - overbought) / (100 - overbought)) * 100)), reason: `RSI ${rsi.toFixed(1)} (overbought > ${overbought}). Expecting reversal down.`, indicators };
  }
  return { type: null, strategy: 'RSI', confidence: 0, reason: `RSI ${rsi.toFixed(1)} (neutral ${oversold}-${overbought}).`, indicators };
}

export function generateMACrossSignal(ticks: Tick[], fast = 5, slow = 20): StrategySignal {
  const prices = ticks.map((t) => t.quote);
  if (prices.length < slow + 1) return { type: null, strategy: 'MA Crossover', confidence: 0, reason: 'Insufficient data for MA.', indicators: {} };
  const currentFast = calculateSMA(prices, fast);
  const currentSlow = calculateSMA(prices, slow);
  const prevFast = calculateSMA(prices.slice(0, -1), fast);
  const prevSlow = calculateSMA(prices.slice(0, -1), slow);
  const indicators: Record<string, number> = { fastMA: currentFast, slowMA: currentSlow };
  if (prevFast <= prevSlow && currentFast > currentSlow) {
    return { type: 'CALL', strategy: 'MA Crossover', confidence: Math.min(100, Math.round(((currentFast - currentSlow) / currentSlow) * 10000)), reason: `Golden Cross. Fast(${currentFast.toFixed(4)}) > Slow(${currentSlow.toFixed(4)}). Bullish.`, indicators };
  }
  if (prevFast >= prevSlow && currentFast < currentSlow) {
    return { type: 'PUT', strategy: 'MA Crossover', confidence: Math.min(100, Math.round(((currentSlow - currentFast) / currentSlow) * 10000)), reason: `Death Cross. Fast(${currentFast.toFixed(4)}) < Slow(${currentSlow.toFixed(4)}). Bearish.`, indicators };
  }
  return { type: null, strategy: 'MA Crossover', confidence: 0, reason: `${currentFast > currentSlow ? 'Bullish' : 'Bearish'} trend. No crossover.`, indicators };
}

export function generateBBSignal(ticks: Tick[]): StrategySignal {
  const prices = ticks.map((t) => t.quote);
  const bb = calculateBollingerBands(prices, 20, 2);
  const bandwidth = bb.middle > 0 ? ((bb.upper - bb.lower) / bb.middle) * 100 : 0;
  const indicators: Record<string, number> = { upper: bb.upper, middle: bb.middle, lower: bb.lower, bandwidth };
  if (prices.length < 20) return { type: null, strategy: 'Bollinger Bands', confidence: 0, reason: 'Need 20 ticks for BB.', indicators };
  const prev = prices[prices.length - 2];
  if (bb.currentPrice <= bb.lower * 1.001 && prev > bb.lower) {
    return { type: 'CALL', strategy: 'Bollinger Bands', confidence: Math.min(100, Math.round(bandwidth * 5)), reason: `Price(${bb.currentPrice.toFixed(4)}) touched lower band(${bb.lower.toFixed(4)}). Bounce expected.`, indicators };
  }
  if (bb.currentPrice >= bb.upper * 0.999 && prev < bb.upper) {
    return { type: 'PUT', strategy: 'Bollinger Bands', confidence: Math.min(100, Math.round(bandwidth * 5)), reason: `Price(${bb.currentPrice.toFixed(4)}) touched upper band(${bb.upper.toFixed(4)}). Pullback expected.`, indicators };
  }
  return { type: null, strategy: 'Bollinger Bands', confidence: 0, reason: `Price within bands. Upper:${bb.upper.toFixed(4)} Lower:${bb.lower.toFixed(4)}.`, indicators };
}

export function generateSpikeSignal(ticks: Tick[]): StrategySignal {
  const spike = detectSpike(ticks, 20, 2.5);
  const price = ticks.length > 0 ? ticks[ticks.length - 1].quote : 0;
  const indicators: Record<string, number> = { currentPrice: price };
  if (spike === 'UP') return { type: 'CALL', strategy: 'Spike Detection', confidence: 85, reason: `Upward spike to ${price.toFixed(4)}. Momentum CALL.`, indicators };
  if (spike === 'DOWN') return { type: 'PUT', strategy: 'Spike Detection', confidence: 85, reason: `Downward spike to ${price.toFixed(4)}. Momentum PUT.`, indicators };
  return { type: null, strategy: 'Spike Detection', confidence: 0, reason: 'No significant spike detected.', indicators };
}

export function generateCompositeSignal(ticks: Tick[], strategies: string[]): StrategySignal {
  const signals: StrategySignal[] = [];
  if (strategies.includes('RSI')) signals.push(generateRSISignal(ticks));
  if (strategies.includes('MA_CROSS')) signals.push(generateMACrossSignal(ticks));
  if (strategies.includes('BOLLINGER')) signals.push(generateBBSignal(ticks));
  if (strategies.includes('SPIKE')) signals.push(generateSpikeSignal(ticks));
  if (signals.length === 0) return { type: null, strategy: 'Composite', confidence: 0, reason: 'No strategies selected.', indicators: {} };

  const active = signals.filter((s) => s.type !== null);
  if (active.length === 0) return { type: null, strategy: 'Composite', confidence: 0, reason: signals.map((s) => s.reason).join(' | '), indicators: signals.reduce((a, s) => ({ ...a, ...s.indicators }), {}) };

  let callCount = 0, putCount = 0, totalConf = 0;
  active.forEach((s) => { if (s.type === 'CALL') callCount++; if (s.type === 'PUT') putCount++; totalConf += s.confidence; });
  const finalType = callCount >= putCount ? 'CALL' : 'PUT';
  const agreement = Math.max(callCount, putCount);
  const avgConf = totalConf / active.length;
  return {
    type: finalType,
    strategy: 'Composite',
    confidence: Math.min(100, Math.round(avgConf + (agreement / signals.length) * 20)),
    reason: `${agreement}/${signals.length} agree. ${active.map((s) => `[${s.strategy}]`).join(' ')} → ${finalType}`,
    indicators: signals.reduce((a, s) => ({ ...a, ...s.indicators }), {}),
  };
}

// ─── Strategy Metadata ───────────────────────────────────────────────────

export const AVAILABLE_STRATEGIES = [
  { id: 'RSI', name: 'RSI (Relative Strength Index)', description: 'Buys oversold (RSI<30), sells overbought (RSI>70).', defaultParams: { period: 14, oversold: 30, overbought: 70 } },
  { id: 'MA_CROSS', name: 'Moving Average Crossover', description: 'Golden cross = CALL, Death cross = PUT.', defaultParams: { fastPeriod: 5, slowPeriod: 20 } },
  { id: 'BOLLINGER', name: 'Bollinger Bands', description: 'Buys at lower band, sells at upper band.', defaultParams: { period: 20, stdDev: 2 } },
  { id: 'SPIKE', name: 'Spike Detection', description: 'Detects price spikes for momentum trades.', defaultParams: { lookback: 20, threshold: 2.5 } },
];
