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
  if (prices.length < period + 1) return 50; // neutral

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

  // Calculate signal line (EMA of MACD values)
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

  // Calculate standard deviation of recent changes
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
  confidence: number; // 0-100
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

  // Golden Cross: Fast MA crosses above Slow MA
  if (prevFast <= prevSlow && currentFast > currentSlow) {
    return {
      type: 'CALL',
      strategy: 'MA Crossover',
      confidence: Math.min(100, Math.round(((currentFast - currentSlow) / currentSlow) * 10000)),
      reason: `Golden Cross detected. Fast MA (${currentFast.toFixed(4)}) crossed above Slow MA (${currentSlow.toFixed(4)}). Bullish signal.`,
      indicators,
    };
  }

  // Death Cross: Fast MA crosses below Slow MA
  if (prevFast >= prevSlow && currentFast < currentSlow) {
    return {
      type: 'PUT',
      strategy: 'MA Crossover',
      confidence: Math.min(100, Math.round(((currentSlow - currentFast) / currentSlow) * 10000)),
      reason: `Death Cross detected. Fast MA (${currentFast.toFixed(4)}) crossed below Slow MA (${currentSlow.toFixed(4)}). Bearish signal.`,
      indicators,
    };
  }

  // Trend confirmation
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

  // Price touching or crossing lower band
  if (bb.currentPrice <= bb.lower * 1.001 && previousPrice > bb.lower) {
    return {
      type: 'CALL',
      strategy: 'Bollinger Bands',
      confidence: Math.min(100, Math.round(bandwidth * 5)),
      reason: `Price (${bb.currentPrice.toFixed(4)}) touched lower band (${bb.lower.toFixed(4)}). Expecting bounce back to mean.`,
      indicators,
    };
  }

  // Price touching or crossing upper band
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

  // Count CALL vs PUT signals
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

  // Determine final signal based on majority
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

// ─── Available Markets ──────────────────────────────────────────────────

export const SYNTHETIC_MARKETS = [
  { symbol: 'BOOM1000', name: 'Boom 1000', category: 'Boom/Crash', description: 'Spikes upward randomly' },
  { symbol: 'CRASH1000', name: 'Crash 1000', category: 'Boom/Crash', description: 'Spikes downward randomly' },
  { symbol: 'R_10', name: 'Volatility 10', category: 'Volatility', description: '10% volatility index' },
  { symbol: 'R_25', name: 'Volatility 25', category: 'Volatility', description: '25% volatility index' },
  { symbol: 'R_50', name: 'Volatility 50', category: 'Volatility', description: '50% volatility index' },
  { symbol: 'R_75', name: 'Volatility 75', category: 'Volatility', description: '75% volatility index' },
  { symbol: 'R_100', name: 'Volatility 100', category: 'Volatility', description: '100% volatility index' },
  { symbol: 'JD10', name: 'Jump 10', category: 'Jump', description: 'Jump index with 10% volatility' },
  { symbol: 'JD25', name: 'Jump 25', category: 'Jump', description: 'Jump index with 25% volatility' },
  { symbol: 'JD50', name: 'Jump 50', category: 'Jump', description: 'Jump index with 50% volatility' },
  { symbol: 'JD75', name: 'Jump 75', category: 'Jump', description: 'Jump index with 75% volatility' },
  { symbol: 'JD100', name: 'Jump 100', category: 'Jump', description: 'Jump index with 100% volatility' },
];
