// Trading Strategies Engine for Synthetic Indices
import type { Tick } from './deriv-api';

// ─── Technical Indicators ────────────────────────────────────────────────

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
  if (prices.length < slowPeriod + signalPeriod) {
    return { macd: 0, signal: 0, histogram: 0 };
  }

  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  const macdLine = fastEMA - slowEMA;

  const macdValues: number[] = [];
  for (let i = slowPeriod; i <= prices.length; i++) {
    const fEma = calculateEMA(prices.slice(0, i), fastPeriod);
    const sEma = calculateEMA(prices.slice(0, i), slowPeriod);
    macdValues.push(fEma - sEma);
  }

  const signalLine = macdValues.length >= signalPeriod
    ? calculateEMA(macdValues, signalPeriod)
    : macdValues[macdValues.length - 1] || 0;

  return {
    macd: macdLine,
    signal: signalLine,
    histogram: macdLine - signalLine,
  };
}

export function detectSpike(
  ticks: Tick[],
  lookback: number = 20,
  threshold: number = 2.5
): 'UP' | 'DOWN' | null {
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
  const stdChange = changes.length > 1
    ? Math.sqrt(changes.reduce((s, c) => s + Math.pow(c - avgChange, 2), 0) / (changes.length - 1))
    : avgChange;

  if (avgChange > 0 && change > threshold * stdChange && change > 0.01) {
    return currentPrice > avgPrice ? 'UP' : 'DOWN';
  }

  return null;
}

// ─── Strategy Signal Types ───────────────────────────────────────────────

export interface StrategySignal {
  type: 'CALL' | 'PUT' | null;
  strategy: string;
  confidence: number;
  reason: string;
  indicators: Record<string, number>;
}

// ─── Strategy Implementations ────────────────────────────────────────────

export function generateRSISignal(
  ticks: Tick[],
  oversoldThreshold: number = 30,
  overboughtThreshold: number = 70
): StrategySignal {
  const prices = ticks.map((t) => t.quote);
  const rsi = calculateRSI(prices, 14);
  const currentPrice = prices[prices.length - 1] || 0;

  const indicators: Record<string, number> = { rsi };

  if (rsi < oversoldThreshold) {
    return {
      type: 'CALL',
      strategy: 'RSI',
      confidence: Math.min(100, Math.round(((oversoldThreshold - rsi) / oversoldThreshold) * 100)),
      reason: `RSI is ${rsi.toFixed(1)} (oversold < ${oversoldThreshold}). Expecting price reversal upward.`,
      indicators,
    };
  }

  if (rsi > overboughtThreshold) {
    return {
      type: 'PUT',
      strategy: 'RSI',
      confidence: Math.min(100, Math.round(((rsi - overboughtThreshold) / (100 - overboughtThreshold)) * 100)),
      reason: `RSI is ${rsi.toFixed(1)} (overbought > ${overboughtThreshold}). Expecting price reversal downward.`,
      indicators,
    };
  }

  return {
    type: null,
    strategy: 'RSI',
    confidence: 0,
    reason: `RSI is ${rsi.toFixed(1)} (neutral zone ${oversoldThreshold}-${overboughtThreshold}). No clear signal.`,
    indicators,
  };
}

export function generateMACrossSignal(
  ticks: Tick[],
  fastPeriod: number = 5,
  slowPeriod: number = 20
): StrategySignal {
  const prices = ticks.map((t) => t.quote);

  if (prices.length < slowPeriod + 1) {
    return {
      type: null,
      strategy: 'MA Crossover',
      confidence: 0,
      reason: `Insufficient data. Need at least ${slowPeriod + 1} ticks.`,
      indicators: {},
    };
  }

  const currentFast = calculateSMA(prices, fastPeriod);
  const currentSlow = calculateSMA(prices, slowPeriod);
  const prevFast = calculateSMA(prices.slice(0, -1), fastPeriod);
  const prevSlow = calculateSMA(prices.slice(0, -1), slowPeriod);

  const indicators: Record<string, number> = {
    fastMA: currentFast,
    slowMA: currentSlow,
  };

  if (prevFast <= prevSlow && currentFast > currentSlow) {
    return {
      type: 'CALL',
      strategy: 'MA Crossover',
      confidence: Math.min(100, Math.round(((currentFast - currentSlow) / currentSlow) * 10000)),
      reason: `Golden Cross detected. Fast MA (${currentFast.toFixed(4)}) crossed above Slow MA (${currentSlow.toFixed(4)}). Bullish signal.`,
      indicators,
    };
  }

  if (prevFast >= prevSlow && currentFast < currentSlow) {
    return {
      type: 'PUT',
      strategy: 'MA Crossover',
      confidence: Math.min(100, Math.round(((currentSlow - currentFast) / currentSlow) * 10000)),
      reason: `Death Cross detected. Fast MA (${currentFast.toFixed(4)}) crossed below Slow MA (${currentSlow.toFixed(4)}). Bearish signal.`,
      indicators,
    };
  }

  const trend = currentFast > currentSlow ? 'bullish' : 'bearish';
  return {
    type: null,
    strategy: 'MA Crossover',
    confidence: 0,
    reason: `${trend.charAt(0).toUpperCase() + trend.slice(1)} trend. Fast MA: ${currentFast.toFixed(4)}, Slow MA: ${currentSlow.toFixed(4)}. No crossover detected.`,
    indicators,
  };
}

export function generateBBSignal(
  ticks: Tick[],
  period: number = 20,
  stdDevMultiplier: number = 2
): StrategySignal {
  const prices = ticks.map((t) => t.quote);
  const bb = calculateBollingerBands(prices, period, stdDevMultiplier);
  const bandwidth = bb.middle > 0 ? ((bb.upper - bb.lower) / bb.middle) * 100 : 0;

  const indicators: Record<string, number> = {
    upper: bb.upper,
    middle: bb.middle,
    lower: bb.lower,
    bandwidth,
  };

  if (prices.length < period) {
    return {
      type: null,
      strategy: 'Bollinger Bands',
      confidence: 0,
      reason: `Insufficient data. Need at least ${period} ticks for Bollinger Bands.`,
      indicators,
    };
  }

  const previousPrice = prices[prices.length - 2];

  if (bb.currentPrice <= bb.lower * 1.001 && previousPrice > bb.lower) {
    return {
      type: 'CALL',
      strategy: 'Bollinger Bands',
      confidence: Math.min(100, Math.round(bandwidth * 5)),
      reason: `Price (${bb.currentPrice.toFixed(4)}) touched lower band (${bb.lower.toFixed(4)}). Expecting bounce back to mean.`,
      indicators,
    };
  }

  if (bb.currentPrice >= bb.upper * 0.999 && previousPrice < bb.upper) {
    return {
      type: 'PUT',
      strategy: 'Bollinger Bands',
      confidence: Math.min(100, Math.round(bandwidth * 5)),
      reason: `Price (${bb.currentPrice.toFixed(4)}) touched upper band (${bb.upper.toFixed(4)}). Expecting pullback to mean.`,
      indicators,
    };
  }

  return {
    type: null,
    strategy: 'Bollinger Bands',
    confidence: 0,
    reason: `Price (${bb.currentPrice.toFixed(4)}) within bands. Upper: ${bb.upper.toFixed(4)}, Lower: ${bb.lower.toFixed(4)}, Middle: ${bb.middle.toFixed(4)}.`,
    indicators,
  };
}

export function generateSpikeSignal(
  ticks: Tick[],
  lookback: number = 20,
  threshold: number = 2.5
): StrategySignal {
  const spike = detectSpike(ticks, lookback, threshold);
  const currentPrice = ticks.length > 0 ? ticks[ticks.length - 1].quote : 0;

  const indicators: Record<string, number> = {
    currentPrice,
    threshold,
  };

  if (spike === 'UP') {
    return {
      type: 'CALL',
      strategy: 'Spike Detection',
      confidence: 85,
      reason: `Upward spike detected! Price surged to ${currentPrice.toFixed(4)}. Entering CALL on momentum.`,
      indicators,
    };
  }

  if (spike === 'DOWN') {
    return {
      type: 'PUT',
      strategy: 'Spike Detection',
      confidence: 85,
      reason: `Downward spike detected! Price dropped to ${currentPrice.toFixed(4)}. Entering PUT on momentum.`,
      indicators,
    };
  }

  return {
    type: null,
    strategy: 'Spike Detection',
    confidence: 0,
    reason: 'No significant spike detected in recent price action.',
    indicators,
  };
}

// ─── Composite Strategy ─────────────────────────────────────────────────

export function generateCompositeSignal(
  ticks: Tick[],
  strategies: string[]
): StrategySignal {
  const signals: StrategySignal[] = [];

  if (strategies.includes('RSI')) signals.push(generateRSISignal(ticks));
  if (strategies.includes('MA_CROSS')) signals.push(generateMACrossSignal(ticks));
  if (strategies.includes('BOLLINGER')) signals.push(generateBBSignal(ticks));
  if (strategies.includes('SPIKE')) signals.push(generateSpikeSignal(ticks));

  if (signals.length === 0) {
    return {
      type: null,
      strategy: 'Composite',
      confidence: 0,
      reason: 'No strategies selected.',
      indicators: {},
    };
  }

  let callCount = 0;
  let putCount = 0;
  let totalConfidence = 0;
  let activeSignals = signals.filter((s) => s.type !== null);

  activeSignals.forEach((s) => {
    if (s.type === 'CALL') callCount++;
    if (s.type === 'PUT') putCount++;
    totalConfidence += s.confidence;
  });

  if (activeSignals.length === 0) {
    return {
      type: null,
      strategy: 'Composite',
      confidence: 0,
      reason: signals.map((s) => s.reason).join(' | '),
      indicators: signals.reduce((acc, s) => ({ ...acc, ...s.indicators }), {}),
    };
  }

  const finalType = callCount >= putCount ? 'CALL' : 'PUT';
  const agreement = Math.max(callCount, putCount);
  const avgConfidence = totalConfidence / activeSignals.length;
  const consensusBonus = (agreement / signals.length) * 20;

  return {
    type: finalType,
    strategy: 'Composite',
    confidence: Math.min(100, Math.round(avgConfidence + consensusBonus)),
    reason: `${agreement}/${signals.length} strategies agree. ${activeSignals.map((s) => `[${s.strategy}]`).join(' ')} → ${finalType}`,
    indicators: signals.reduce((acc, s) => ({ ...acc, ...s.indicators }), {}),
  };
}

// ─── Available Strategies ───────────────────────────────────────────────

export const AVAILABLE_STRATEGIES = [
  {
    id: 'RSI',
    name: 'RSI (Relative Strength Index)',
    description: 'Buys on oversold conditions (RSI < 30), sells on overbought (RSI > 70). Best for range-bound markets.',
    defaultParams: { period: 14, oversold: 30, overbought: 70 },
  },
  {
    id: 'MA_CROSS',
    name: 'Moving Average Crossover',
    description: 'Uses fast (5) and slow (20) period moving averages. Golden cross = CALL, Death cross = PUT.',
    defaultParams: { fastPeriod: 5, slowPeriod: 20 },
  },
  {
    id: 'BOLLINGER',
    name: 'Bollinger Bands',
    description: 'Buys at lower band, sells at upper band. Effective for volatility-based reversal trades.',
    defaultParams: { period: 20, stdDev: 2 },
  },
  {
    id: 'SPIKE',
    name: 'Spike Detection',
    description: 'Detects sudden price spikes for Boom/Crash indices. Trades on momentum continuation.',
    defaultParams: { lookback: 20, threshold: 2.5 },
  },
];

// ─── Market Type Definitions ────────────────────────────────────────────

// Deriv API has different contract types for different market categories:
// - Volatility/Jump indices: support CALL/PUT/RISE/FALL
// - Boom indices: support DIGITMATCH (digit matching for spike prediction)
// - Crash indices: support DIGITDIFF (digit different for spike prediction)
// - Continuous indices: support CALL/PUT with continuous contract types

export type MarketType = 'volatility' | 'boom' | 'crash' | 'jump' | 'continuous' | 'metals';

export interface MarketInfo {
  symbol: string;
  name: string;
  category: string;
  description: string;
  marketType: MarketType;
  // Contract types this market supports
  supportedContractTypes: string[];
  // For Boom/Crash: the digit to use for DIGITMATCH/DIGITDIFF
  defaultDigit?: number;
}

// ─── Available Markets ──────────────────────────────────────────────────

export const SYNTHETIC_MARKETS: MarketInfo[] = [
  // ── Boom Indices (DIGITMATCH - el digito final coincide) ──
  { symbol: 'BOOM300', name: 'Boom 300', category: 'Boom/Crash', description: 'Spike upward, 300ms', marketType: 'boom', supportedContractTypes: ['DIGITMATCH', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: 'BOOM500', name: 'Boom 500', category: 'Boom/Crash', description: 'Spike upward, 500ms', marketType: 'boom', supportedContractTypes: ['DIGITMATCH', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: 'BOOM1000', name: 'Boom 1000', category: 'Boom/Crash', description: 'Spike upward, 1000ms', marketType: 'boom', supportedContractTypes: ['DIGITMATCH', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'] },

  // ── Crash Indices (DIGITDIFF - el digito final NO coincide) ──
  { symbol: 'CRASH300', name: 'Crash 300', category: 'Boom/Crash', description: 'Spike downward, 300ms', marketType: 'crash', supportedContractTypes: ['DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: 'CRASH500', name: 'Crash 500', category: 'Boom/Crash', description: 'Spike downward, 500ms', marketType: 'crash', supportedContractTypes: ['DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: 'CRASH1000', name: 'Crash 1000', category: 'Boom/Crash', description: 'Spike downward, 1000ms', marketType: 'crash', supportedContractTypes: ['DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'] },

  // ── Volatility Indices (CALL/PUT/RISE/FALL) ──
  { symbol: 'R_10', name: 'Volatility 10', category: 'Volatility', description: '10% volatility index', marketType: 'volatility', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER', 'DIGITMATCH', 'DIGITDIFF', 'DIGITFROM', 'DIGITTO'] },
  { symbol: 'R_25', name: 'Volatility 25', category: 'Volatility', description: '25% volatility index', marketType: 'volatility', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER', 'DIGITMATCH', 'DIGITDIFF', 'DIGITFROM', 'DIGITTO'] },
  { symbol: 'R_50', name: 'Volatility 50', category: 'Volatility', description: '50% volatility index', marketType: 'volatility', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER', 'DIGITMATCH', 'DIGITDIFF', 'DIGITFROM', 'DIGITTO'] },
  { symbol: 'R_75', name: 'Volatility 75', category: 'Volatility', description: '75% volatility index', marketType: 'volatility', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER', 'DIGITMATCH', 'DIGITDIFF', 'DIGITFROM', 'DIGITTO'] },
  { symbol: 'R_100', name: 'Volatility 100', category: 'Volatility', description: '100% volatility index', marketType: 'volatility', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER', 'DIGITMATCH', 'DIGITDIFF', 'DIGITFROM', 'DIGITTO'] },

  // ── Volatility 10/25/50/75/100 (1s) ──
  { symbol: '1HZ10V', name: 'Volatility 10 (1s)', category: 'Volatility', description: '10% volatility, 1-second ticks', marketType: 'volatility', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'] },
  { symbol: '1HZ25V', name: 'Volatility 25 (1s)', category: 'Volatility', description: '25% volatility, 1-second ticks', marketType: 'volatility', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'] },
  { symbol: '1HZ50V', name: 'Volatility 50 (1s)', category: 'Volatility', description: '50% volatility, 1-second ticks', marketType: 'volatility', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'] },
  { symbol: '1HZ75V', name: 'Volatility 75 (1s)', category: 'Volatility', description: '75% volatility, 1-second ticks', marketType: 'volatility', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'] },
  { symbol: '1HZ100V', name: 'Volatility 100 (1s)', category: 'Volatility', description: '100% volatility, 1-second ticks', marketType: 'volatility', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'] },

  // ── Jump Indices (CALL/PUT/RISE/FALL) ──
  { symbol: 'JD10', name: 'Jump 10', category: 'Jump', description: 'Jump index with 10% volatility', marketType: 'jump', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'] },
  { symbol: 'JD25', name: 'Jump 25', category: 'Jump', description: 'Jump index with 25% volatility', marketType: 'jump', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'] },
  { symbol: 'JD50', name: 'Jump 50', category: 'Jump', description: 'Jump index with 50% volatility', marketType: 'jump', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'] },
  { symbol: 'JD75', name: 'Jump 75', category: 'Jump', description: 'Jump index with 75% volatility', marketType: 'jump', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'] },
  { symbol: 'JD100', name: 'Jump 100', category: 'Jump', description: 'Jump index with 100% volatility', marketType: 'jump', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'] },

  // ── Step Indices (simulan caminata aleatoria) ──
  { symbol: 'stpRNG', name: 'Step RNG', category: 'Step', description: 'Random step index, 0-9 range', marketType: 'continuous', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER', 'DIGITMATCH', 'DIGITDIFF', 'DIGITFROM', 'DIGITTO'] },

  // ── Oro y Metales (Gold & Metals) ──
  { symbol: 'frxXAUUSD', name: 'Gold/USD (Oro)', category: 'Metales', description: 'Oro vs Dólar estadounidense', marketType: 'metals', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'] },
  { symbol: 'frxXAGUSD', name: 'Silver/USD (Plata)', category: 'Metales', description: 'Plata vs Dólar estadounidense', marketType: 'metals', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'] },
  { symbol: 'frxXAUJPY', name: 'Gold/JPY (Oro/Yen)', category: 'Metales', description: 'Oro vs Yen japonés', marketType: 'metals', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'] },
  { symbol: 'frxXAUEUR', name: 'Gold/EUR (Oro/Euro)', category: 'Metales', description: 'Oro vs Euro', marketType: 'metals', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'] },
  { symbol: 'frxXAGJPY', name: 'Silver/JPY (Plata/Yen)', category: 'Metales', description: 'Plata vs Yen japonés', marketType: 'metals', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'] },
  { symbol: 'frxXAGEUR', name: 'Silver/EUR (Plata/Euro)', category: 'Metales', description: 'Plata vs Euro', marketType: 'metals', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'] },

  // ── Pares de Divisas (Forex) ──
  { symbol: 'frxEURUSD', name: 'EUR/USD', category: 'Forex', description: 'Euro vs Dólar estadounidense', marketType: 'continuous', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: 'frxGBPUSD', name: 'GBP/USD', category: 'Forex', description: 'Libra esterlina vs Dólar', marketType: 'continuous', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: 'frxUSDJPY', name: 'USD/JPY', category: 'Forex', description: 'Dólar vs Yen japonés', marketType: 'continuous', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: 'frxAUDUSD', name: 'AUD/USD', category: 'Forex', description: 'Dólar australiano vs Dólar', marketType: 'continuous', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: 'frxUSDCAD', name: 'USD/CAD', category: 'Forex', description: 'Dólar vs Dólar canadiense', marketType: 'continuous', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: 'frxEURGBP', name: 'EUR/GBP', category: 'Forex', description: 'Euro vs Libra esterlina', marketType: 'continuous', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'] },
  { symbol: 'frxGBPJPY', name: 'GBP/JPY', category: 'Forex', description: 'Libra esterlina vs Yen', marketType: 'continuous', supportedContractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'] },
];

/**
 * Get the correct Deriv contract type for a market based on the signal direction.
 * Boom/Crash markets don't support CALL/PUT, so we use digit-based contracts.
 */
export function getContractTypeForMarket(
  market: MarketInfo,
  direction: 'CALL' | 'PUT'
): string {
  switch (market.marketType) {
    case 'boom':
      // Boom: always trade DIGITMATCH (last digit matches prediction)
      // When signal is CALL (bullish), we expect price to spike up → use DIGITMATCH
      // When signal is PUT (bearish), we expect no spike → use DIGITDIFF
      return direction === 'CALL' ? 'DIGITMATCH' : 'DIGITDIFF';

    case 'crash':
      // Crash: always trade DIGITDIFF (last digit differs from prediction)
      // When signal is PUT (bearish), we expect price to crash down → use DIGITMATCH (spike happens)
      // When signal is CALL (bullish), we expect no crash → use DIGITDIFF
      return direction === 'PUT' ? 'DIGITMATCH' : 'DIGITDIFF';

    case 'volatility':
    case 'jump':
    case 'continuous':
    case 'metals':
      // Standard CALL/PUT for these markets (Oro, Plata, Metales, Forex)
      return direction;

    default:
      return direction;
  }
}

/**
 * Get display label for a trade direction on a specific market.
 * For Boom, CALL means "expecting spike", for Crash, PUT means "expecting crash".
 */
export function getTradeDirectionLabel(
  market: MarketInfo,
  direction: 'CALL' | 'PUT'
): string {
  switch (market.marketType) {
    case 'boom':
      return direction === 'CALL' ? 'BUY (Spike Expected)' : 'SELL (No Spike)';
    case 'crash':
      return direction === 'PUT' ? 'SELL (Crash Expected)' : 'BUY (No Crash)';
    default:
      return direction;
  }
}
