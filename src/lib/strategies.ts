// ═════════════════════════════════════════════════════════════════════════════════
// DERIV SYMBOL DICTIONARY — Final Version (Auto-Detect from API + Fallback)
// ═════════════════════════════════════════════════════════════════════════════════
// FIXES APPLIED:
// - app_id: 1089
// - URL: wss://ws.derivws.com (not binaryws.com)
// - active_symbols: "full" (not "brief")
// - Boom/Crash: DIGIT contracts ONLY (no CALL/PUT)
// - Gold/Metals: CALL/PUT with 1-hour minimum duration
// - Volatility/Jump/Step: CALL/PUT supported
// - Null price check before any trade execution

import type { Tick } from './deriv-api';

export type MarketType = 'synthetic' | 'volatility' | 'jump' | 'step' | 'metals' | 'forex';

export interface MarketInfo {
  symbol: string;
  name: string;
  category: string;
  description: string;
  marketType: MarketType;
  contractTypes: string[];
  supportsCallPut: boolean;
  minDurationMinutes: number;
  // Default duration/unit for this market when trading
  defaultDuration: number;
  defaultDurationUnit: string;
}

// ═════════════════════════════════════════════════════════════════════════════════
// MASTER SYMBOL TABLE — Verified Deriv Symbols
// ═════════════════════════════════════════════════════════════════════════════════

export const SYNTHETIC_MARKETS: MarketInfo[] = [

  // ─── BOOM INDICES (Digit-based ONLY — NO CALL/PUT) ────────────────────
  // Boom: price spikes UP. Use DIGITOVER/DIGITUNDER contracts only.
  // NOTE: BOOM* symbols can show ticks but CANNOT trade. Use 1HB* (continuous) for trading.
  { symbol: 'BOOM300',   name: 'Boom 300',       category: 'Boom',      description: 'Spike up in 300ms',       marketType: 'synthetic', contractTypes: ['DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITMATCH', 'DIGITDIFF', 'DIGITFROM', 'DIGITTO', 'DIGITACCUMULATE'], supportsCallPut: false, minDurationMinutes: 0, defaultDuration: 1, defaultDurationUnit: 't' },
  { symbol: 'BOOM500',   name: 'Boom 500',       category: 'Boom',      description: 'Spike up in 500ms',       marketType: 'synthetic', contractTypes: ['DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITMATCH', 'DIGITDIFF', 'DIGITFROM', 'DIGITTO', 'DIGITACCUMULATE'], supportsCallPut: false, minDurationMinutes: 0, defaultDuration: 1, defaultDurationUnit: 't' },
  { symbol: 'BOOM1000',  name: 'Boom 1000',      category: 'Boom',      description: 'Spike up in 1000ms',      marketType: 'synthetic', contractTypes: ['DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITMATCH', 'DIGITDIFF', 'DIGITFROM', 'DIGITTO', 'DIGITACCUMULATE'], supportsCallPut: false, minDurationMinutes: 0, defaultDuration: 1, defaultDurationUnit: 't' },
  { symbol: '1HB300V',   name: 'Boom 300 (CT)',   category: 'Boom',      description: 'Continuous Boom 300ms',   marketType: 'synthetic', contractTypes: ['DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITMATCH', 'DIGITDIFF', 'DIGITFROM', 'DIGITTO', 'DIGITACCUMULATE'], supportsCallPut: false, minDurationMinutes: 0, defaultDuration: 1, defaultDurationUnit: 't' },
  { symbol: '1HB500V',   name: 'Boom 500 (CT)',   category: 'Boom',      description: 'Continuous Boom 500ms',   marketType: 'synthetic', contractTypes: ['DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITMATCH', 'DIGITDIFF', 'DIGITFROM', 'DIGITTO', 'DIGITACCUMULATE'], supportsCallPut: false, minDurationMinutes: 0, defaultDuration: 1, defaultDurationUnit: 't' },
  { symbol: '1HB1000V',  name: 'Boom 1000 (CT)',  category: 'Boom',      description: 'Continuous Boom 1000ms',  marketType: 'synthetic', contractTypes: ['DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITMATCH', 'DIGITDIFF', 'DIGITFROM', 'DIGITTO', 'DIGITACCUMULATE'], supportsCallPut: false, minDurationMinutes: 0, defaultDuration: 1, defaultDurationUnit: 't' },

  // ─── CRASH INDICES (Digit-based ONLY — NO CALL/PUT) ───────────────────
  // Crash: price spikes DOWN. Use DIGITOVER/DIGITUNDER contracts only.
  // NOTE: CRASH* symbols can show ticks but CANNOT trade. Use 1HC* (continuous) for trading.
  { symbol: 'CRASH300',  name: 'Crash 300',       category: 'Crash',     description: 'Spike down in 300ms',      marketType: 'synthetic', contractTypes: ['DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITMATCH', 'DIGITDIFF', 'DIGITFROM', 'DIGITTO', 'DIGITACCUMULATE'], supportsCallPut: false, minDurationMinutes: 0, defaultDuration: 1, defaultDurationUnit: 't' },
  { symbol: 'CRASH500',  name: 'Crash 500',       category: 'Crash',     description: 'Spike down in 500ms',      marketType: 'synthetic', contractTypes: ['DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITMATCH', 'DIGITDIFF', 'DIGITFROM', 'DIGITTO', 'DIGITACCUMULATE'], supportsCallPut: false, minDurationMinutes: 0, defaultDuration: 1, defaultDurationUnit: 't' },
  { symbol: 'CRASH1000', name: 'Crash 1000',      category: 'Crash',     description: 'Spike down in 1000ms',     marketType: 'synthetic', contractTypes: ['DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITMATCH', 'DIGITDIFF', 'DIGITFROM', 'DIGITTO', 'DIGITACCUMULATE'], supportsCallPut: false, minDurationMinutes: 0, defaultDuration: 1, defaultDurationUnit: 't' },
  { symbol: '1HC300V',   name: 'Crash 300 (CT)',   category: 'Crash',     description: 'Continuous Crash 300ms',   marketType: 'synthetic', contractTypes: ['DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITMATCH', 'DIGITDIFF', 'DIGITFROM', 'DIGITTO', 'DIGITACCUMULATE'], supportsCallPut: false, minDurationMinutes: 0, defaultDuration: 1, defaultDurationUnit: 't' },
  { symbol: '1HC500V',   name: 'Crash 500 (CT)',   category: 'Crash',     description: 'Continuous Crash 500ms',   marketType: 'synthetic', contractTypes: ['DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITMATCH', 'DIGITDIFF', 'DIGITFROM', 'DIGITTO', 'DIGITACCUMULATE'], supportsCallPut: false, minDurationMinutes: 0, defaultDuration: 1, defaultDurationUnit: 't' },
  { symbol: '1HC1000V',  name: 'Crash 1000 (CT)',  category: 'Crash',     description: 'Continuous Crash 1000ms',  marketType: 'synthetic', contractTypes: ['DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITMATCH', 'DIGITDIFF', 'DIGITFROM', 'DIGITTO', 'DIGITACCUMULATE'], supportsCallPut: false, minDurationMinutes: 0, defaultDuration: 1, defaultDurationUnit: 't' },

  // ─── VOLATILITY INDEX (Standard — CALL/PUT supported) ─────────────────
  { symbol: 'R_10',     name: 'Volatility 10',  category: 'Volatility', description: '10% volatility index',  marketType: 'volatility', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITFROM', 'DIGITTO'], supportsCallPut: true, minDurationMinutes: 0, defaultDuration: 5, defaultDurationUnit: 't' },
  { symbol: 'R_25',     name: 'Volatility 25',  category: 'Volatility', description: '25% volatility index',  marketType: 'volatility', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITFROM', 'DIGITTO'], supportsCallPut: true, minDurationMinutes: 0, defaultDuration: 5, defaultDurationUnit: 't' },
  { symbol: 'R_50',     name: 'Volatility 50',  category: 'Volatility', description: '50% volatility index',  marketType: 'volatility', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITFROM', 'DIGITTO'], supportsCallPut: true, minDurationMinutes: 0, defaultDuration: 5, defaultDurationUnit: 't' },
  { symbol: 'R_75',     name: 'Volatility 75',  category: 'Volatility', description: '75% volatility index',  marketType: 'volatility', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITFROM', 'DIGITTO'], supportsCallPut: true, minDurationMinutes: 0, defaultDuration: 5, defaultDurationUnit: 't' },
  { symbol: 'R_100',    name: 'Volatility 100', category: 'Volatility', description: '100% volatility index', marketType: 'volatility', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITFROM', 'DIGITTO'], supportsCallPut: true, minDurationMinutes: 0, defaultDuration: 5, defaultDurationUnit: 't' },

  // ─── VOLATILITY INDEX (1-Second — CALL/PUT supported) ─────────────────
  { symbol: '1HZ10V',   name: 'Vol 10 (1s)',  category: 'Volatility', description: '10% vol, 1-second ticks',  marketType: 'volatility', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'], supportsCallPut: true, minDurationMinutes: 0, defaultDuration: 5, defaultDurationUnit: 't' },
  { symbol: '1HZ25V',   name: 'Vol 25 (1s)',  category: 'Volatility', description: '25% vol, 1-second ticks',  marketType: 'volatility', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'], supportsCallPut: true, minDurationMinutes: 0, defaultDuration: 5, defaultDurationUnit: 't' },
  { symbol: '1HZ50V',   name: 'Vol 50 (1s)',  category: 'Volatility', description: '50% vol, 1-second ticks',  marketType: 'volatility', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'], supportsCallPut: true, minDurationMinutes: 0, defaultDuration: 5, defaultDurationUnit: 't' },
  { symbol: '1HZ75V',   name: 'Vol 75 (1s)',  category: 'Volatility', description: '75% vol, 1-second ticks',  marketType: 'volatility', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'], supportsCallPut: true, minDurationMinutes: 0, defaultDuration: 5, defaultDurationUnit: 't' },
  { symbol: '1HZ100V',  name: 'Vol 100 (1s)', category: 'Volatility', description: '100% vol, 1-second ticks', marketType: 'volatility', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'], supportsCallPut: true, minDurationMinutes: 0, defaultDuration: 5, defaultDurationUnit: 't' },

  // ─── JUMP INDICES (CALL/PUT supported) ────────────────────────────────
  { symbol: 'JD10',     name: 'Jump 10',   category: 'Jump', description: 'Jump 10 Index',   marketType: 'jump', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'], supportsCallPut: true, minDurationMinutes: 0, defaultDuration: 5, defaultDurationUnit: 't' },
  { symbol: 'JD25',     name: 'Jump 25',   category: 'Jump', description: 'Jump 25 Index',   marketType: 'jump', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'], supportsCallPut: true, minDurationMinutes: 0, defaultDuration: 5, defaultDurationUnit: 't' },
  { symbol: 'JD50',     name: 'Jump 50',   category: 'Jump', description: 'Jump 50 Index',   marketType: 'jump', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'], supportsCallPut: true, minDurationMinutes: 0, defaultDuration: 5, defaultDurationUnit: 't' },
  { symbol: 'JD75',     name: 'Jump 75',   category: 'Jump', description: 'Jump 75 Index',   marketType: 'jump', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'], supportsCallPut: true, minDurationMinutes: 0, defaultDuration: 5, defaultDurationUnit: 't' },
  { symbol: 'JD100',    name: 'Jump 100',  category: 'Jump', description: 'Jump 100 Index',  marketType: 'jump', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'], supportsCallPut: true, minDurationMinutes: 0, defaultDuration: 5, defaultDurationUnit: 't' },

  // ─── STEP INDEX ───────────────────────────────────────────────────────
  { symbol: 'stpRNG',   name: 'Step RNG',   category: 'Step', description: 'Step Random 0-9',   marketType: 'step', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD', 'DIGITFROM', 'DIGITTO'], supportsCallPut: true, minDurationMinutes: 0, defaultDuration: 5, defaultDurationUnit: 't' },

  // ─── METALES / GOLD / SILVER (CALL/PUT — min 1 HOUR duration) ────────
  { symbol: 'frxXAUUSD', name: 'Gold/USD (Oro)',         category: 'Metales', description: 'Oro vs Dolar',          marketType: 'metals', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'], supportsCallPut: true, minDurationMinutes: 60, defaultDuration: 1, defaultDurationUnit: 'h' },
  { symbol: 'frxXAGUSD', name: 'Silver/USD (Plata)',     category: 'Metales', description: 'Plata vs Dolar',        marketType: 'metals', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'], supportsCallPut: true, minDurationMinutes: 60, defaultDuration: 1, defaultDurationUnit: 'h' },
  { symbol: 'frxXAUJPY', name: 'Gold/JPY (Oro/Yen)',     category: 'Metales', description: 'Oro vs Yen',            marketType: 'metals', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'], supportsCallPut: true, minDurationMinutes: 60, defaultDuration: 1, defaultDurationUnit: 'h' },
  { symbol: 'frxXAUEUR', name: 'Gold/EUR (Oro/Euro)',    category: 'Metales', description: 'Oro vs Euro',           marketType: 'metals', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'], supportsCallPut: true, minDurationMinutes: 60, defaultDuration: 1, defaultDurationUnit: 'h' },
  { symbol: 'frxXAGJPY', name: 'Silver/JPY (Plata/Yen)', category: 'Metales', description: 'Plata vs Yen',          marketType: 'metals', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'], supportsCallPut: true, minDurationMinutes: 60, defaultDuration: 1, defaultDurationUnit: 'h' },
  { symbol: 'frxXAGEUR', name: 'Silver/EUR (Plata/Euro)', category: 'Metales', description: 'Plata vs Euro',         marketType: 'metals', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD', 'DIGITOVER', 'DIGITUNDER'], supportsCallPut: true, minDurationMinutes: 60, defaultDuration: 1, defaultDurationUnit: 'h' },

  // ─── FOREX ────────────────────────────────────────────────────────────
  { symbol: 'frxEURUSD', name: 'EUR/USD', category: 'Forex', description: 'Euro vs Dolar',        marketType: 'forex', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'], supportsCallPut: true, minDurationMinutes: 0, defaultDuration: 1, defaultDurationUnit: 'm' },
  { symbol: 'frxGBPUSD', name: 'GBP/USD', category: 'Forex', description: 'Libra vs Dolar',       marketType: 'forex', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'], supportsCallPut: true, minDurationMinutes: 0, defaultDuration: 1, defaultDurationUnit: 'm' },
  { symbol: 'frxUSDJPY', name: 'USD/JPY', category: 'Forex', description: 'Dolar vs Yen',         marketType: 'forex', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'], supportsCallPut: true, minDurationMinutes: 0, defaultDuration: 1, defaultDurationUnit: 'm' },
  { symbol: 'frxAUDUSD', name: 'AUD/USD', category: 'Forex', description: 'Australiano vs USD',   marketType: 'forex', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'], supportsCallPut: true, minDurationMinutes: 0, defaultDuration: 1, defaultDurationUnit: 'm' },
  { symbol: 'frxUSDCAD', name: 'USD/CAD', category: 'Forex', description: 'Dolar vs Canadiense',  marketType: 'forex', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'], supportsCallPut: true, minDurationMinutes: 0, defaultDuration: 1, defaultDurationUnit: 'm' },
  { symbol: 'frxEURGBP', name: 'EUR/GBP', category: 'Forex', description: 'Euro vs Libra',        marketType: 'forex', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'], supportsCallPut: true, minDurationMinutes: 0, defaultDuration: 1, defaultDurationUnit: 'm' },
  { symbol: 'frxGBPJPY', name: 'GBP/JPY', category: 'Forex', description: 'Libra vs Yen',         marketType: 'forex', contractTypes: ['CALL', 'PUT', 'RISE', 'FALL', 'DIGITEVEN', 'DIGITODD'], supportsCallPut: true, minDurationMinutes: 0, defaultDuration: 1, defaultDurationUnit: 'm' },
];

// ─── Fast lookups ───────────────────────────────────────────────────────
const SYMBOL_MAP = new Map(SYNTHETIC_MARKETS.map((m) => [m.symbol, m]));

export function getMarket(symbol: string): MarketInfo | undefined {
  return SYMBOL_MAP.get(symbol);
}

/**
 * Detect if a symbol is Boom (price spikes UP).
 * Matches: BOOM300, BOOM500, BOOM1000, 1HB300V, 1HB500V, 1HB1000V
 */
function isBoom(symbol: string): boolean {
  const s = symbol.toUpperCase();
  return s.includes('BOOM') || s.startsWith('1HB');
}

/**
 * Detect if a symbol is Crash (price spikes DOWN).
 * Matches: CRASH300, CRASH500, CRASH1000, 1HC300V, 1HC500V, 1HC1000V
 */
function isCrash(symbol: string): boolean {
  const s = symbol.toUpperCase();
  return s.includes('CRASH') || s.startsWith('1HC');
}

/**
 * Detect if a symbol is Boom OR Crash (digit-only contracts, NO CALL/PUT).
 */
function isBoomOrCrash(symbol: string): boolean {
  return isBoom(symbol) || isCrash(symbol);
}

/**
 * Detect if a symbol is a metals market (Gold, Silver).
 */
function isMetal(symbol: string): boolean {
  return symbol.startsWith('frxXAU') || symbol.startsWith('frxXAG');
}

/**
 * Get the correct Deriv contract type for a given direction and market.
 *
 * CRITICAL RULES:
 * - Boom/Crash (1HB*, 1HC*, BOOM*, CRASH*) → DIGITMATCH/DIGITDIFF (NEVER CALL/PUT)
 * - Volatility (R_*, 1HZ*) → CALL/PUT
 * - Jump (JD*) → CALL/PUT
 * - Step (stpRNG) → CALL/PUT
 * - Metals (frxXAU*, frxXAG*) → CALL/PUT (min 1h duration)
 * - Forex (frx*) → CALL/PUT
 *
 * @param market - The MarketInfo object from our dictionary
 * @param direction - 'CALL' (buy/up) or 'PUT' (sell/down)
 * @param currentPrice - The last tick price (used for barrier in digit contracts)
 * @returns Object with contract_type, barrier (if digit), duration, duration_unit
 */
export function getDerivContractType(
  market: MarketInfo,
  direction: 'CALL' | 'PUT',
  currentPrice?: number
): { contractType: string; barrier?: string; duration: number; durationUnit: string } {
  // ─── DIGIT-ONLY: Boom & Crash (BOOM*, CRASH*, 1HB*, 1HC*) ──────
  // Boom/Crash do NOT support CALL/PUT. Only digit contracts work.
  if (!market.supportsCallPut && isBoomOrCrash(market.symbol)) {
    // Get the last digit of the current price for potential use
    const lastDigit = currentPrice ? Math.abs(Math.floor(currentPrice)) % 10 : Math.floor(Math.random() * 10);

    if (isBoom(market.symbol)) {
      // BOOM INDEX: Price spikes UP randomly
      // Strategy: CALL (bullish expectation) → DIGITOVER (last digit > 4)
      //           PUT (bearish expectation) → DIGITUNDER (last digit < 5)
      return {
        contractType: direction === 'CALL' ? 'DIGITOVER' : 'DIGITUNDER',
        barrier: direction === 'CALL' ? '4' : '4',
        duration: 1,
        durationUnit: 't',
      };
    }
    if (isCrash(market.symbol)) {
      // CRASH INDEX: Price spikes DOWN randomly
      // Strategy: PUT (bearish expectation) → DIGITOVER (last digit > 4)
      //           CALL (bullish expectation) → DIGITUNDER (last digit < 5)
      return {
        contractType: direction === 'PUT' ? 'DIGITOVER' : 'DIGITUNDER',
        barrier: direction === 'PUT' ? '4' : '4',
        duration: 1,
        durationUnit: 't',
      };
    }
  }

  // ─── CALL/PUT: Everything else ────────────────────────────────────
  return {
    contractType: direction,
    duration: market.defaultDuration,
    durationUnit: market.defaultDurationUnit,
  };
}

/**
 * Auto-detect market category and contract type from API symbol data.
 * Used when we get active_symbols from Deriv API.
 */
export function autoDetectFromSymbol(symbol: string): Partial<MarketInfo> {
  const info: Partial<MarketInfo> = {};

  if (isBoom(symbol)) {
    // Continuous Boom: 1HB300V, 1HB500V, 1HB1000V
    info.supportsCallPut = false;
    info.minDurationMinutes = 0;
    info.defaultDuration = 1;
    info.defaultDurationUnit = 't';
    info.category = 'Boom';
  } else if (isCrash(symbol)) {
    // Continuous Crash: 1HC300V, 1HC500V, 1HC1000V
    info.supportsCallPut = false;
    info.minDurationMinutes = 0;
    info.defaultDuration = 1;
    info.defaultDurationUnit = 't';
    info.category = 'Crash';
  } else if (symbol.startsWith('R_') || symbol.includes('HZ')) {
    info.supportsCallPut = true;
    info.category = 'Volatility';
    info.minDurationMinutes = 0;
    info.defaultDuration = 5;
    info.defaultDurationUnit = 't';
  } else if (symbol.startsWith('JD')) {
    info.supportsCallPut = true;
    info.category = 'Jump';
    info.minDurationMinutes = 0;
    info.defaultDuration = 5;
    info.defaultDurationUnit = 't';
  } else if (symbol === 'stpRNG') {
    info.supportsCallPut = true;
    info.category = 'Step';
    info.minDurationMinutes = 0;
    info.defaultDuration = 5;
    info.defaultDurationUnit = 't';
  } else if (isMetal(symbol)) {
    info.supportsCallPut = true;
    info.category = 'Metales';
    info.minDurationMinutes = 60; // 1 HOUR minimum for metals
    info.defaultDuration = 1;
    info.defaultDurationUnit = 'h';
  } else if (symbol.startsWith('frx')) {
    info.supportsCallPut = true;
    info.category = 'Forex';
    info.minDurationMinutes = 0;
    info.defaultDuration = 1;
    info.defaultDurationUnit = 'm';
  }

  return info;
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
