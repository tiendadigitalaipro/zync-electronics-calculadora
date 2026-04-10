// ═════════════════════════════════════════════════════════════════════════════════
// DERIV OFFICIAL SYMBOL DICTIONARY — Verified against Deriv API active_symbols
// ═════════════════════════════════════════════════════════════════════════════════
// CRITICAL: These are the ONLY valid symbols. Do NOT invent symbols.
// Every symbol here has been verified to exist in Deriv's WebSocket API.

import type { Tick } from './deriv-api';

export type MarketType = 'synthetic' | 'volatility' | 'jump' | 'step' | 'metals' | 'forex';

export interface MarketInfo {
  symbol: string;
  name: string;
  category: string;
  description: string;
  marketType: MarketType;
  // Which contract types this market ACTUALLY supports on Deriv
  contractTypes: string[];
  // Does this market support CALL/PUT (Rise/Fall)?
  supportsCallPut: boolean;
  // Minimum duration in minutes (Deriv enforces this for metals)
  minDurationMinutes: number;
}

// ═════════════════════════════════════════════════════════════════════════════════
// MASTER SYMBOL TABLE
// ═════════════════════════════════════════════════════════════════════════════════

export const SYNTHETIC_MARKETS: MarketInfo[] = [

  // ─── BOOM INDICES (Digit-based contracts ONLY — NO CALL/PUT) ──────────
  { symbol: 'BOOM300',   name: 'Boom 300',   category: 'Boom/Crash', description: 'Spike up in 300ms',   marketType: 'synthetic', contractTypes: ['DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITFROM', 'DIGITTO', 'DIGITACCUMULATE'], supportsCallPut: false, minDurationMinutes: 0 },
  { symbol: 'BOOM500',   name: 'Boom 500',   category: 'Boom/Crash', description: 'Spike up in 500ms',   marketType: 'synthetic', contractTypes: ['DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITFROM', 'DIGITTO', 'DIGITACCUMULATE'], supportsCallPut: false, minDurationMinutes: 0 },
  { symbol: 'BOOM1000',  name: 'Boom 1000',  category: 'Boom/Crash', description: 'Spike up in 1000ms',  marketType: 'synthetic', contractTypes: ['DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITFROM', 'DIGITTO', 'DIGITACCUMULATE'], supportsCallPut: false, minDurationMinutes: 0 },

  // ─── CRASH INDICES (Digit-based contracts ONLY — NO CALL/PUT) ─────────
  { symbol: 'CRASH300',  name: 'Crash 300',  category: 'Boom/Crash', description: 'Spike down in 300ms',  marketType: 'synthetic', contractTypes: ['DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITFROM', 'DIGITTO', 'DIGITACCUMULATE'], supportsCallPut: false, minDurationMinutes: 0 },
  { symbol: 'CRASH500',  name: 'Crash 500',  category: 'Boom/Crash', description: 'Spike down in 500ms',  marketType: 'synthetic', contractTypes: ['DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITFROM', 'DIGITTO', 'DIGITACCUMULATE'], supportsCallPut: false, minDurationMinutes: 0 },
  { symbol: 'CRASH1000', name: 'Crash 1000', category: 'Boom/Crash', description: 'Spike down in 1000ms', marketType: 'synthetic', contractTypes: ['DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITFROM', 'DIGITTO', 'DIGITACCUMULATE'], supportsCallPut: false, minDurationMinutes: 0 },

  // ─── VOLATILITY (Standard — supports CALL/PUT) ──────────────────────
  { symbol: 'R_10',     name: 'Volatility 10',  category: 'Volatility', description: '10% volatility',  marketType: 'volatility', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITFROM', 'DIGITTO'], supportsCallPut: true, minDurationMinutes: 0 },
  { symbol: 'R_25',     name: 'Volatility 25',  category: 'Volatility', description: '25% volatility',  marketType: 'volatility', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITFROM', 'DIGITTO'], supportsCallPut: true, minDurationMinutes: 0 },
  { symbol: 'R_50',     name: 'Volatility 50',  category: 'Volatility', description: '50% volatility',  marketType: 'volatility', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITFROM', 'DIGITTO'], supportsCallPut: true, minDurationMinutes: 0 },
  { symbol: 'R_75',     name: 'Volatility 75',  category: 'Volatility', description: '75% volatility',  marketType: 'volatility', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITFROM', 'DIGITTO'], supportsCallPut: true, minDurationMinutes: 0 },
  { symbol: 'R_100',    name: 'Volatility 100', category: 'Volatility', description: '100% volatility', marketType: 'volatility', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITFROM', 'DIGITTO'], supportsCallPut: true, minDurationMinutes: 0 },

  // ─── VOLATILITY (1-Second — supports CALL/PUT) ──────────────────────
  { symbol: '1HZ10V',   name: 'Volatility 10 (1s)',  category: 'Volatility', description: '10% vol, 1s ticks',  marketType: 'volatility', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'], supportsCallPut: true, minDurationMinutes: 0 },
  { symbol: '1HZ25V',   name: 'Volatility 25 (1s)',  category: 'Volatility', description: '25% vol, 1s ticks',  marketType: 'volatility', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'], supportsCallPut: true, minDurationMinutes: 0 },
  { symbol: '1HZ50V',   name: 'Volatility 50 (1s)',  category: 'Volatility', description: '50% vol, 1s ticks',  marketType: 'volatility', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'], supportsCallPut: true, minDurationMinutes: 0 },
  { symbol: '1HZ75V',   name: 'Volatility 75 (1s)',  category: 'Volatility', description: '75% vol, 1s ticks',  marketType: 'volatility', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'], supportsCallPut: true, minDurationMinutes: 0 },
  { symbol: '1HZ100V',  name: 'Volatility 100 (1s)', category: 'Volatility', description: '100% vol, 1s ticks', marketType: 'volatility', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'], supportsCallPut: true, minDurationMinutes: 0 },

  // ─── JUMP INDICES (supports CALL/PUT) ───────────────────────────────
  { symbol: 'JD10',     name: 'Jump 10',   category: 'Jump', description: 'Jump 10 Index',  marketType: 'jump', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'], supportsCallPut: true, minDurationMinutes: 0 },
  { symbol: 'JD25',     name: 'Jump 25',   category: 'Jump', description: 'Jump 25 Index',  marketType: 'jump', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'], supportsCallPut: true, minDurationMinutes: 0 },
  { symbol: 'JD50',     name: 'Jump 50',   category: 'Jump', description: 'Jump 50 Index',  marketType: 'jump', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'], supportsCallPut: true, minDurationMinutes: 0 },
  { symbol: 'JD75',     name: 'Jump 75',   category: 'Jump', description: 'Jump 75 Index',  marketType: 'jump', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'], supportsCallPut: true, minDurationMinutes: 0 },
  { symbol: 'JD100',    name: 'Jump 100',  category: 'Jump', description: 'Jump 100 Index', marketType: 'jump', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'], supportsCallPut: true, minDurationMinutes: 0 },

  // ─── STEP INDEX ─────────────────────────────────────────────────────
  { symbol: 'stpRNG',   name: 'Step RNG',   category: 'Step', description: 'Step Random 0-9', marketType: 'step', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITFROM', 'DIGITTO'], supportsCallPut: true, minDurationMinutes: 0 },

  // ─── METALES / GOLD / SILVER (CALL/PUT — min 3 min duration) ──────
  { symbol: 'frxXAUUSD', name: 'Gold/USD (Oro)',       category: 'Metales', description: 'Oro vs Dólar',       marketType: 'metals', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'], supportsCallPut: true, minDurationMinutes: 3 },
  { symbol: 'frxXAGUSD', name: 'Silver/USD (Plata)',   category: 'Metales', description: 'Plata vs Dólar',     marketType: 'metals', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'], supportsCallPut: true, minDurationMinutes: 3 },
  { symbol: 'frxXAUJPY', name: 'Gold/JPY (Oro/Yen)',   category: 'Metales', description: 'Oro vs Yen',         marketType: 'metals', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'], supportsCallPut: true, minDurationMinutes: 3 },
  { symbol: 'frxXAUEUR', name: 'Gold/EUR (Oro/Euro)',  category: 'Metales', description: 'Oro vs Euro',        marketType: 'metals', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'], supportsCallPut: true, minDurationMinutes: 3 },
  { symbol: 'frxXAGJPY', name: 'Silver/JPY (Plata/Yen)', category: 'Metales', description: 'Plata vs Yen',     marketType: 'metals', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'], supportsCallPut: true, minDurationMinutes: 3 },
  { symbol: 'frxXAGEUR', name: 'Silver/EUR (Plata/Euro)', category: 'Metales', description: 'Plata vs Euro',  marketType: 'metals', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'], supportsCallPut: true, minDurationMinutes: 3 },

  // ─── FOREX ──────────────────────────────────────────────────────────
  { symbol: 'frxEURUSD', name: 'EUR/USD', category: 'Forex', description: 'Euro vs Dólar',    marketType: 'forex', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'], supportsCallPut: true, minDurationMinutes: 0 },
  { symbol: 'frxGBPUSD', name: 'GBP/USD', category: 'Forex', description: 'Libra vs Dólar',   marketType: 'forex', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'], supportsCallPut: true, minDurationMinutes: 0 },
  { symbol: 'frxUSDJPY', name: 'USD/JPY', category: 'Forex', description: 'Dólar vs Yen',     marketType: 'forex', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'], supportsCallPut: true, minDurationMinutes: 0 },
  { symbol: 'frxAUDUSD', name: 'AUD/USD', category: 'Forex', description: 'Australiano vs USD', marketType: 'forex', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'], supportsCallPut: true, minDurationMinutes: 0 },
  { symbol: 'frxUSDCAD', name: 'USD/CAD', category: 'Forex', description: 'Dólar vs Canadiense', marketType: 'forex', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'], supportsCallPut: true, minDurationMinutes: 0 },
  { symbol: 'frxEURGBP', name: 'EUR/GBP', category: 'Forex', description: 'Euro vs Libra',    marketType: 'forex', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'], supportsCallPut: true, minDurationMinutes: 0 },
  { symbol: 'frxGBPJPY', name: 'GBP/JPY', category: 'Forex', description: 'Libra vs Yen',     marketType: 'forex', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'], supportsCallPut: true, minDurationMinutes: 0 },
];

// ─── Fast lookups ───────────────────────────────────────────────────────
const SYMBOL_MAP = new Map(SYNTHETIC_MARKETS.map((m) => [m.symbol, m]));

export function getMarket(symbol: string): MarketInfo | undefined {
  return SYMBOL_MAP.get(symbol);
}

/**
 * Get the Deriv contract type for a given direction and market.
 * - Markets with supportsCallPut=true → use CALL/PUT directly
 * - Boom/Crash (supportsCallPut=false) → use DIGITMATCH/DIGITDIFF
 */
export function getDerivContractType(market: MarketInfo, direction: 'CALL' | 'PUT'): string {
  if (market.supportsCallPut) {
    return direction; // CALL or PUT
  }
  // Boom/Crash: digit-based
  if (market.marketType === 'synthetic') {
    if (market.symbol.startsWith('BOOM')) {
      // Boom: CALL signal = expect spike = DIGITMATCH, PUT signal = no spike = DIGITDIFF
      return direction === 'CALL' ? 'DIGITMATCH' : 'DIGITDIFF';
    }
    if (market.symbol.startsWith('CRASH')) {
      // Crash: PUT signal = expect crash = DIGITMATCH, CALL signal = no crash = DIGITDIFF
      return direction === 'PUT' ? 'DIGITMATCH' : 'DIGITDIFF';
    }
  }
  return direction;
}

// ═══════════════════════════════════════════════════════════════════════════
// TECHNICAL INDICATORS
// ═══════════════════════════════════════════════════════════════════════════

export function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  return prices.slice(-period).reduce((s, p) => s + p, 0) / period;
}

export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((s, p) => s + p, 0) / period;
  for (let i = period; i < prices.length; i++) ema = (prices[i] - ema) * k + ema;
  return ema;
}

export function calculateRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  let g = 0, l = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const d = prices[i] - prices[i - 1];
    if (d > 0) g += d; else l += Math.abs(d);
  }
  if (l === 0) return 100;
  return 100 - 100 / (1 + (g / period) / (l / period));
}

export function calculateBollingerBands(prices: number[], period = 20, mult = 2) {
  if (prices.length < period) { const c = prices[prices.length - 1] || 0; return { upper: c, middle: c, lower: c, currentPrice: c }; }
  const sl = prices.slice(-period);
  const mid = sl.reduce((s, p) => s + p, 0) / period;
  const sd = Math.sqrt(sl.reduce((s, p) => s + Math.pow(p - mid, 2), 0) / period);
  return { upper: mid + mult * sd, middle: mid, lower: mid - mult * sd, currentPrice: prices[prices.length - 1] };
}

export function detectSpike(ticks: Tick[], lookback = 20, threshold = 2.5): 'UP' | 'DOWN' | null {
  if (ticks.length < lookback + 1) return null;
  const rp = ticks.slice(-(lookback + 1)).map((t) => t.quote);
  const avg = rp.slice(0, -1).reduce((s, p) => s + p, 0) / lookback;
  const cur = rp[rp.length - 1];
  const chg = Math.abs(cur - avg) / avg * 100;
  const changes: number[] = [];
  for (let i = 1; i < rp.length - 1; i++) changes.push(Math.abs(rp[i] - rp[i - 1]) / rp[i - 1] * 100);
  const ac = changes.length > 0 ? changes.reduce((s, c) => s + c, 0) / changes.length : 0;
  const sc = changes.length > 1 ? Math.sqrt(changes.reduce((s, c) => s + Math.pow(c - ac, 2), 0) / (changes.length - 1)) : ac;
  if (ac > 0 && chg > threshold * sc && chg > 0.01) return cur > avg ? 'UP' : 'DOWN';
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

export function generateRSISignal(ticks: Tick[]): StrategySignal {
  const p = ticks.map((t) => t.quote);
  const rsi = calculateRSI(p);
  if (rsi < 30) return { type: 'CALL', strategy: 'RSI', confidence: Math.min(100, Math.round(((30 - rsi) / 30) * 100)), reason: `RSI ${rsi.toFixed(1)} oversold. Reversal up.`, indicators: { rsi } };
  if (rsi > 70) return { type: 'PUT', strategy: 'RSI', confidence: Math.min(100, Math.round(((rsi - 70) / 30) * 100)), reason: `RSI ${rsi.toFixed(1)} overbought. Reversal down.`, indicators: { rsi } };
  return { type: null, strategy: 'RSI', confidence: 0, reason: `RSI ${rsi.toFixed(1)} neutral.`, indicators: { rsi } };
}

export function generateMACrossSignal(ticks: Tick[]): StrategySignal {
  const p = ticks.map((t) => t.quote);
  if (p.length < 21) return { type: null, strategy: 'MA Cross', confidence: 0, reason: 'Need 21 ticks.', indicators: {} };
  const cf = calculateSMA(p, 5), cs = calculateSMA(p, 20), pf = calculateSMA(p.slice(0, -1), 5), ps = calculateSMA(p.slice(0, -1), 20);
  if (pf <= ps && cf > cs) return { type: 'CALL', strategy: 'MA Cross', confidence: Math.min(100, Math.round(((cf - cs) / cs) * 10000)), reason: `Golden Cross. Bullish.`, indicators: { fastMA: cf, slowMA: cs } };
  if (pf >= ps && cf < cs) return { type: 'PUT', strategy: 'MA Cross', confidence: Math.min(100, Math.round(((cs - cf) / cs) * 10000)), reason: `Death Cross. Bearish.`, indicators: { fastMA: cf, slowMA: cs } };
  return { type: null, strategy: 'MA Cross', confidence: 0, reason: `Trend. No cross.`, indicators: { fastMA: cf, slowMA: cs } };
}

export function generateBBSignal(ticks: Tick[]): StrategySignal {
  const p = ticks.map((t) => t.quote);
  if (p.length < 20) return { type: null, strategy: 'Bollinger', confidence: 0, reason: 'Need 20 ticks.', indicators: {} };
  const bb = calculateBollingerBands(p);
  const bw = bb.middle > 0 ? ((bb.upper - bb.lower) / bb.middle) * 100 : 0;
  const prev = p[p.length - 2];
  if (bb.currentPrice <= bb.lower * 1.001 && prev > bb.lower) return { type: 'CALL', strategy: 'Bollinger', confidence: Math.min(100, Math.round(bw * 5)), reason: `Lower band bounce.`, indicators: { lower: bb.lower, upper: bb.upper } };
  if (bb.currentPrice >= bb.upper * 0.999 && prev < bb.upper) return { type: 'PUT', strategy: 'Bollinger', confidence: Math.min(100, Math.round(bw * 5)), reason: `Upper band pullback.`, indicators: { lower: bb.lower, upper: bb.upper } };
  return { type: null, strategy: 'Bollinger', confidence: 0, reason: `Within bands.`, indicators: { lower: bb.lower, upper: bb.upper } };
}

export function generateSpikeSignal(ticks: Tick[]): StrategySignal {
  const sp = detectSpike(ticks);
  const pr = ticks.length > 0 ? ticks[ticks.length - 1].quote : 0;
  if (sp === 'UP') return { type: 'CALL', strategy: 'Spike', confidence: 85, reason: `Up spike at ${pr.toFixed(4)}.`, indicators: { currentPrice: pr } };
  if (sp === 'DOWN') return { type: 'PUT', strategy: 'Spike', confidence: 85, reason: `Down spike at ${pr.toFixed(4)}.`, indicators: { currentPrice: pr } };
  return { type: null, strategy: 'Spike', confidence: 0, reason: 'No spike.', indicators: {} };
}

export function generateCompositeSignal(ticks: Tick[], strategies: string[]): StrategySignal {
  const sigs: StrategySignal[] = [];
  if (strategies.includes('RSI')) sigs.push(generateRSISignal(ticks));
  if (strategies.includes('MA_CROSS')) sigs.push(generateMACrossSignal(ticks));
  if (strategies.includes('BOLLINGER')) sigs.push(generateBBSignal(ticks));
  if (strategies.includes('SPIKE')) sigs.push(generateSpikeSignal(ticks));
  if (!sigs.length) return { type: null, strategy: 'Composite', confidence: 0, reason: 'No strategies.', indicators: {} };
  const active = sigs.filter((s) => s.type);
  if (!active.length) return { type: null, strategy: 'Composite', confidence: 0, reason: sigs.map((s) => s.reason).join(' | '), indicators: {} };
  let cc = 0, pc = 0, tc = 0;
  active.forEach((s) => { if (s.type === 'CALL') cc++; if (s.type === 'PUT') pc++; tc += s.confidence; });
  return {
    type: cc >= pc ? 'CALL' : 'PUT',
    strategy: 'Composite',
    confidence: Math.min(100, Math.round(tc / active.length + (Math.max(cc, pc) / sigs.length) * 20)),
    reason: `${Math.max(cc, pc)}/${sigs.length} agree. ${active.map((s) => `[${s.strategy}]`).join(' ')}`,
    indicators: active.reduce((a, s) => ({ ...a, ...s.indicators }), {}),
  };
}

export const AVAILABLE_STRATEGIES = [
  { id: 'RSI', name: 'RSI', description: 'Oversold=CALL, Overbought=PUT.', defaultParams: { period: 14 } },
  { id: 'MA_CROSS', name: 'MA Crossover', description: 'Golden cross=CALL, Death cross=PUT.', defaultParams: { fast: 5, slow: 20 } },
  { id: 'BOLLINGER', name: 'Bollinger Bands', description: 'Lower band=CALL, Upper band=PUT.', defaultParams: { period: 20 } },
  { id: 'SPIKE', name: 'Spike Detection', description: 'Price spike momentum.', defaultParams: { lookback: 20 } },
];
