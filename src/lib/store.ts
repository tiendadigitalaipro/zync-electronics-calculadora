import { create } from 'zustand';
import { getDerivAPI, type Tick, type ActiveSymbol } from './deriv-api';
import { generateCompositeSignal, type StrategySignal, SYNTHETIC_MARKETS, type MarketInfo, getMarket, getDerivContractType } from './strategies';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface TradeRecord {
  id?: string; symbol: string; contractType: string; direction: 'CALL' | 'PUT';
  entryTime: string; exitTime?: string; entryPrice: number; exitPrice?: number;
  profit: number; strategy: string; status: 'OPEN' | 'WON' | 'LOST' | 'SOLD';
  amount: number; payout: number; contractId?: number;
}

export interface LogEntry { id: string; timestamp: Date; type: 'info' | 'success' | 'warning' | 'error' | 'trade'; message: string; }

interface RiskSettings {
  maxDailyLoss: number; dailyProfitTarget: number; maxTradesPerSession: number;
  stopAfterConsecutiveLosses: number; useMartingale: boolean; martingaleMultiplier: number;
  martingaleMaxSteps: number; minSignalConfidence: number;
}

const defaultRisk: RiskSettings = {
  maxDailyLoss: 20, dailyProfitTarget: 50, maxTradesPerSession: 30,
  stopAfterConsecutiveLosses: 5, useMartingale: false, martingaleMultiplier: 2.0,
  martingaleMaxSteps: 4, minSignalConfidence: 60,
};

interface TradingState {
  isConnected: boolean; isAuthorized: boolean; isConnecting: boolean;
  apiToken: string; connectionError: string | null;
  balance: number; currency: string; loginId: string; accountList: any;
  currentSymbol: string; currentMarket: MarketInfo | null;
  currentPrice: number; ticks: Tick[]; tickHistory: Tick[];
  previousPrice: number; priceDirection: 'up' | 'down' | 'neutral';
  isAutoTrading: boolean; selectedStrategies: string[];
  baseTradeAmount: number; tradeAmount: number;
  contractDuration: number; contractDurationUnit: string;
  currentProposal: { id: string; askPrice: number; payout: number; contractType: string } | null;
  riskSettings: RiskSettings; sessionProfit: number; sessionTrades: number;
  consecutiveLosses: number; martingaleStep: number;
  sessionStartTime: Date | null; isSessionPaused: boolean; pauseReason: string;
  openTrades: TradeRecord[]; tradeHistory: TradeRecord[];
  totalProfit: number; totalTrades: number; winCount: number; lossCount: number;
  currentStreak: number; streakType: 'win' | 'loss' | 'none';
  lastSignal: StrategySignal | null; signalHistory: StrategySignal[];
  logs: LogEntry[]; maxLogs: number;
  autoTradeCooldown: boolean; minTicksBetweenTrades: number;
  maxConcurrentTrades: number; signalCooldown: boolean;
  soundEnabled: boolean; notificationEnabled: boolean;
  availableSymbols: ActiveSymbol[];
  supportedMarkets: MarketInfo[];

  connect: (token?: string) => Promise<void>;
  disconnect: () => void;
  subscribeToMarket: (symbol: string) => Promise<void>;
  setTradeAmount: (amount: number) => void;
  setContractDuration: (d: number, u: string) => void;
  toggleAutoTrading: () => void;
  toggleStrategy: (id: string) => void;
  selectAllStrategies: () => void;
  clearStrategies: () => void;
  placeTrade: (type: 'CALL' | 'PUT') => Promise<void>;
  addLog: (type: LogEntry['type'], msg: string) => void;
  clearLogs: () => void;
  updateTradeRecord: (id: number, u: Partial<TradeRecord>) => void;
  loadTradeHistory: () => Promise<void>;
  processAutoTrade: () => void;
  updateRiskSettings: (s: Partial<RiskSettings>) => void;
  resetSession: () => void;
  toggleSound: () => void;
  toggleNotifications: () => void;
}

let tickCounter = 0;
let cooldownTimer: ReturnType<typeof setTimeout> | null = null;

export const useTradingStore = create<TradingState>((set, get) => ({
  isConnected: false, isAuthorized: false, isConnecting: false, apiToken: '', connectionError: null,
  balance: 0, currency: 'USD', loginId: '', accountList: null,
  currentSymbol: 'R_10', currentMarket: null, currentPrice: 0,
  ticks: [], tickHistory: [], previousPrice: 0, priceDirection: 'neutral',
  isAutoTrading: false, selectedStrategies: ['RSI'], baseTradeAmount: 1, tradeAmount: 1,
  contractDuration: 1, contractDurationUnit: 'm', currentProposal: null,
  riskSettings: { ...defaultRisk }, sessionProfit: 0, sessionTrades: 0,
  consecutiveLosses: 0, martingaleStep: 0, sessionStartTime: null,
  isSessionPaused: false, pauseReason: '',
  openTrades: [], tradeHistory: [], totalProfit: 0, totalTrades: 0,
  winCount: 0, lossCount: 0, currentStreak: 0, streakType: 'none',
  lastSignal: null, signalHistory: [], logs: [], maxLogs: 300,
  autoTradeCooldown: false, minTicksBetweenTrades: 10, maxConcurrentTrades: 3, signalCooldown: false,
  soundEnabled: true, notificationEnabled: false,
  availableSymbols: [], supportedMarkets: SYNTHETIC_MARKETS,

  // ═══════════════════════════════════════════════════════════════════════
  // CONNECT — Authorize FIRST, then fetch symbols, then subscribe to ticks
  // ═══════════════════════════════════════════════════════════════════════
  connect: async (token?: string) => {
    const api = getDerivAPI();
    const tk = get().apiToken || token;
    if (!tk) { set({ connectionError: 'Token requerido' }); return; }
    set({ isConnecting: true, connectionError: null, apiToken: tk });
    get().addLog('info', 'Conectando a Deriv (app_id: 1089)...');

    try {
      // STEP 1: Open WebSocket
      await api.connect('1089');
      set({ isConnected: true, isConnecting: false });
      get().addLog('success', 'WebSocket conectado');

      // STEP 2: Authorize FIRST (before any other API call)
      const auth = await api.authorize(tk);
      set({ isAuthorized: true, balance: auth.authorize.balance, currency: auth.authorize.currency, loginId: auth.authorize.loginid, accountList: auth.authorize.account_list || null });
      get().addLog('success', `Autorizado: ${auth.authorize.fullname} (${auth.authorize.loginid}) — ${auth.authorize.is_virtual ? 'DEMO' : 'REAL'} — ${auth.authorize.currency}`);

      // STEP 3: Subscribe to balance
      try { const b = await api.getBalance(); if (b.balance) set({ balance: b.balance.balance }); } catch (_) {}

      // STEP 4: Fetch active symbols (non-blocking — don't fail if this fails)
      try {
        const active = await api.getActiveSymbols('basic');
        set({ availableSymbols: active });

        // Build a set of symbols the API confirms exist
        const apiSet = new Set(active.map((s: ActiveSymbol) => s.symbol));

        // Filter: keep markets that exist in API AND aren't suspended
        // CRITICAL FIX: If API returns empty data, show ALL markets anyway
        const verified = SYNTHETIC_MARKETS.filter((m) => {
          const apiSym = active.find((s: ActiveSymbol) => s.symbol === m.symbol);
          if (!apiSym) return false;
          if (apiSym.is_trading_suspended) return false;
          return true;
        });

        // If verification found nothing (API returned no matching symbols), show all
        if (verified.length > 0) {
          set({ supportedMarkets: verified });
          const cats: Record<string, number> = {};
          verified.forEach((m) => { cats[m.category] = (cats[m.category] || 0) + 1; });
          get().addLog('success', `${verified.length} mercados verificados: ${Object.entries(cats).map(([k, v]) => `${v} ${k}`).join(', ')}`);
        } else {
          set({ supportedMarkets: SYNTHETIC_MARKETS });
          get().addLog('warning', 'API no confirmó símbolos. Mostrando todos los mercados del diccionario.');
          get().addLog('info', `Símbolos disponibles en tu cuenta: ${apiSet.size}. Intenta Volatility 10, 25, 50, 75, 100 primero.`);
        }
      } catch (e) {
        // If active_symbols fails entirely, still show all markets
        set({ supportedMarkets: SYNTHETIC_MARKETS });
        get().addLog('warning', 'No se pudieron verificar los símbolos. Mostrando todos.');
      }

      // STEP 5: Subscribe to open contracts
      api.subscribeToOpenContracts((data: any) => {
        const poc = data.proposal_open_contract;
        if (poc && (poc.is_sold || poc.status === 'sold')) {
          const profit = poc.profit;
          const won = profit > 0;
          get().addLog(won ? 'success' : 'warning', `#${poc.contract_id} ${won ? 'WON' : 'LOST'} ${profit >= 0 ? '+' : ''}$${profit.toFixed(2)}`);
          if (won) get().playSound('win'); else get().playSound('loss');
          get().updateTradeRecord(poc.contract_id, { exitPrice: poc.current_spot, profit, status: won ? 'WON' : 'LOST', exitTime: new Date().toISOString() });
        }
      });

      // STEP 6: Subscribe to market ticks (LAST — after auth + symbols)
      await get().subscribeToMarket(get().currentSymbol);
    } catch (error: any) {
      set({ isConnecting: false, isConnected: false, connectionError: error.message });
      get().addLog('error', `Error de conexión: ${error.message}`);
      get().playSound('alert');
    }
  },

  disconnect: () => {
    const api = getDerivAPI();
    try { api.unsubscribeFromTicks(get().currentSymbol); } catch (_) {}
    try { api.unsubscribeFromOpenContracts(); } catch (_) {}
    api.disconnect();
    set({ isConnected: false, isAuthorized: false, isAutoTrading: false, balance: 0, currency: 'USD', loginId: '', currentPrice: 0, currentMarket: null, ticks: [], tickHistory: [], currentProposal: null, isSessionPaused: false, pauseReason: '' });
    get().addLog('info', 'Desconectado');
  },

  // ═══════════════════════════════════════════════════════════════════════
  // SUBSCRIBE TO MARKET
  // ═══════════════════════════════════════════════════════════════════════
  subscribeToMarket: async (symbol: string) => {
    const market = getMarket(symbol);
    if (!market) {
      get().addLog('error', `Símbolo "${symbol}" no existe en el diccionario.`);
      return;
    }

    const api = getDerivAPI();
    const old = get().currentSymbol;
    if (old && old !== symbol) {
      try { api.unsubscribeFromTicks(old); } catch (_) {}
    }

    set({ currentSymbol: symbol, currentMarket: market, ticks: [], tickHistory: [], currentPrice: 0 });
    get().addLog('info', `Suscribiendo a ${market.name} (${symbol})...`);

    try {
      const historyTicks = await api.subscribeToTicks(symbol, (data: any) => {
        if (!data.tick) return;
        const tick: Tick = { epoch: data.tick.epoch, quote: data.tick.quote, symbol: data.tick.symbol, id: data.tick.id };

        // CRITICAL FIX: Skip if price is null/NaN/undefined
        if (!tick.quote || !isFinite(tick.quote)) return;

        set((s) => {
          const newTicks = [...s.ticks.slice(-200), tick];
          const newHistory = [...s.tickHistory.slice(-1000), tick];
          const dir = s.currentPrice > 0 ? (tick.quote > s.currentPrice ? 'up' : tick.quote < s.currentPrice ? 'down' : 'neutral') : 'neutral';
          tickCounter++;
          return { ticks: newTicks, tickHistory: newHistory, currentPrice: tick.quote, previousPrice: s.currentPrice, priceDirection: dir };
        });

        // Auto-trade every 5 ticks
        if (get().isAutoTrading && !get().autoTradeCooldown && tickCounter % 5 === 0) {
          get().processAutoTrade();
        }
      });

      set({ tickHistory: historyTicks });
      if (historyTicks.length > 0) {
        const last = historyTicks[historyTicks.length - 1];
        if (last && last.quote && isFinite(last.quote)) {
          set({ currentPrice: last.quote, previousPrice: historyTicks.length > 1 ? historyTicks[historyTicks.length - 2].quote : last.quote });
        }
      }
      get().addLog('success', `${market.name} OK. ${historyTicks.length} ticks cargados. ${market.supportsCallPut ? 'CALL/PUT disponible' : 'Solo contratos digit'}`);
    } catch (error: any) {
      get().addLog('error', `Error suscribiendo a ${symbol}: ${error.message}`);
    }
  },

  setTradeAmount: (a) => set({ baseTradeAmount: a, tradeAmount: a }),
  setContractDuration: (d, u) => set({ contractDuration: d, contractDurationUnit: u }),

  toggleAutoTrading: () => {
    set((s) => {
      const next = !s.isAutoTrading;
      if (next) {
        get().addLog('warning', '🤖 Auto-trading ACTIVADO');
        get().playSound('trade');
        return { isAutoTrading: next, sessionStartTime: s.sessionStartTime || new Date(), sessionProfit: 0, sessionTrades: 0, consecutiveLosses: 0, martingaleStep: 0, isSessionPaused: false, pauseReason: '', tradeAmount: s.baseTradeAmount };
      }
      get().addLog('info', '🛑 Auto-trading DESACTIVADO');
      return { isAutoTrading: next, signalCooldown: false };
    });
  },

  toggleStrategy: (id) => set((s) => ({ selectedStrategies: s.selectedStrategies.includes(id) ? s.selectedStrategies.filter((x) => x !== id) : [...s.selectedStrategies, id] })),
  selectAllStrategies: () => set({ selectedStrategies: ['RSI', 'MA_CROSS', 'BOLLINGER', 'SPIKE'] }),
  clearStrategies: () => set({ selectedStrategies: [] }),

  // ═══════════════════════════════════════════════════════════════════════
  // PLACE TRADE — With all 3 corrections
  // ═══════════════════════════════════════════════════════════════════════
  placeTrade: async (type: 'CALL' | 'PUT') => {
    const api = getDerivAPI();
    const s = get();

    // Pre-checks
    if (!s.isConnected || !s.isAuthorized) { get().addLog('error', 'No conectado. Conecta con tu token API primero.'); return; }
    if (s.isSessionPaused) { get().addLog('warning', `Pausado: ${s.pauseReason}`); return; }
    if (s.openTrades.length >= s.maxConcurrentTrades) { get().addLog('warning', `Máximo ${s.maxConcurrentTrades} trades abiertos.`); return; }

    // CORRECCIÓN 2: Skip if price is null/NaN/undefined
    if (!s.currentPrice || !isFinite(s.currentPrice)) {
      get().addLog('error', 'Precio N/A o nulo. Esperando ticks reales...');
      return;
    }

    const amt = s.tradeAmount;
    if (amt <= 0 || amt > s.balance) { get().addLog('error', `Monto inválido $${amt.toFixed(2)}. Saldo: $${s.balance.toFixed(2)}`); return; }

    const symbol = s.currentSymbol;
    const market = s.currentMarket || getMarket(symbol);
    if (!market) { get().addLog('error', `Mercado no encontrado: ${symbol}`); return; }

    // Get the correct Deriv contract type
    const contractType = getDerivContractType(market, type);

    // CORRECCIÓN 3: Metal duration fix — minimum 3 minutes for Gold/Silver
    let duration = s.contractDuration;
    let durationUnit = s.contractDurationUnit;

    if (market.minDurationMinutes > 0) {
      const minDur = market.minDurationMinutes;
      if (durationUnit === 't') {
        // Convert ticks to minutes approximation (1 tick ≈ varies)
        duration = minDur;
        durationUnit = 'm';
      } else if (durationUnit === 's') {
        if (duration < minDur * 60) {
          duration = minDur;
          durationUnit = 'm';
        }
      } else if (durationUnit === 'm') {
        if (duration < minDur) duration = minDur;
      }
      get().addLog('info', `⚠️ Metales: duración ajustada a ${duration}${durationUnit} (mínimo ${minDur} min)`);
    }

    get().addLog('info', `→ ${contractType} en ${market.name} (${symbol}) | $${amt.toFixed(2)} | ${duration}${durationUnit}`);

    // Send proposal
    try {
      const proposalParams: any = {
        contract_type: contractType,
        symbol: symbol,
        amount: amt,
        duration: duration,
        duration_unit: durationUnit,
        basis: 'stake',
        currency: s.currency,
      };

      // For digit contracts (Boom/Crash), add barrier
      if (contractType.startsWith('DIGIT')) {
        const lastDigit = Math.abs(Math.floor(s.currentPrice)) % 10;
        proposalParams.barrier = lastDigit.toString();
        get().addLog('info', `Dígito barrera: ${lastDigit} (último dígito de ${s.currentPrice})`);
      }

      const proposal = await api.getProposal(proposalParams);

      if (proposal.proposal) {
        set({ currentProposal: { id: proposal.proposal.id, askPrice: proposal.proposal.ask_price, payout: proposal.proposal.payout, contractType } });
        get().addLog('info', `Propuesta OK. Costo: $${proposal.proposal.ask_price.toFixed(2)} | Pago: $${proposal.proposal.payout.toFixed(2)}`);

        const buy = await api.buy(proposal.proposal.id, proposal.proposal.ask_price);

        if (buy.buy) {
          const trade: TradeRecord = {
            symbol, contractType, direction: type,
            entryTime: new Date().toISOString(), entryPrice: s.currentPrice, profit: 0,
            strategy: s.selectedStrategies.join('+') || 'Manual',
            status: 'OPEN', amount: buy.buy.buy_price, payout: buy.buy.payout, contractId: buy.buy.contract_id,
          };

          set((st) => ({ openTrades: [...st.openTrades, trade], balance: buy.buy.balance_after, currentProposal: null, sessionTrades: st.sessionTrades + 1 }));
          get().addLog('trade', `✅ ${contractType} COMPRADO | #${buy.buy.contract_id} | ${market.name} | $${buy.buy.buy_price.toFixed(2)} → $${buy.buy.payout.toFixed(2)}`);
          get().playSound('trade');

          try { await fetch('/api/trades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(trade) }); } catch (_) {}

          set({ autoTradeCooldown: true, signalCooldown: true });
          setTimeout(() => set({ autoTradeCooldown: false }), s.minTicksBetweenTrades * 500);
          if (cooldownTimer) clearTimeout(cooldownTimer);
          cooldownTimer = setTimeout(() => set({ signalCooldown: false }), 15000);
        }
      }
    } catch (error: any) {
      const msg = error.message || 'Error desconocido';
      // Parse Deriv API errors for useful info
      if (msg.includes('Invalid contract type')) {
        get().addLog('error', `${market.name}: tipo de contrato "${contractType}" no válido. Disponibles: ${market.contractTypes.slice(0, 5).join(', ')}`);
      } else if (msg.includes('Minimum duration')) {
        get().addLog('error', `${market.name}: duración mínima no cumplida. Usa al menos ${market.minDurationMinutes} minutos.`);
      } else {
        get().addLog('error', `Trade falló en ${market.name} (${symbol}): ${msg}`);
      }
      set({ currentProposal: null });
      get().playSound('alert');
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // AUTO-TRADE
  // ═══════════════════════════════════════════════════════════════════════
  processAutoTrade: () => {
    const s = get();
    if (!s.isAutoTrading || !s.selectedStrategies.length) return;

    // CORRECCIÓN 2: Don't trade with null price
    if (!s.currentPrice || !isFinite(s.currentPrice)) return;
    if (s.tickHistory.length < 50) return;
    if (s.openTrades.length >= s.maxConcurrentTrades) return;
    if (s.signalCooldown) return;

    const r = s.riskSettings;
    if (s.sessionProfit < -r.maxDailyLoss) { if (!s.isSessionPaused) { set({ isSessionPaused: true, pauseReason: `Pérdida máx -$${r.maxDailyLoss}` }); get().addLog('error', '🛑 Límite de pérdida diaria'); get().playSound('alert'); } return; }
    if (s.sessionProfit >= r.dailyProfitTarget) { if (!s.isSessionPaused) { set({ isSessionPaused: true, pauseReason: `Objetivo +$${r.dailyProfitTarget}` }); get().addLog('success', `🎯 Objetivo +$${r.dailyProfitTarget} alcanzado`); get().playSound('win'); } return; }
    if (s.sessionTrades >= r.maxTradesPerSession) { if (!s.isSessionPaused) { set({ isSessionPaused: true, pauseReason: 'Máx trades' }); get().addLog('warning', '🛑 Máximo de trades'); } return; }
    if (s.consecutiveLosses >= r.stopAfterConsecutiveLosses) { if (!s.isSessionPaused) { set({ isSessionPaused: true, pauseReason: `${r.stopAfterConsecutiveLosses} pérdidas seguidas` }); get().addLog('error', '🛑 Demasiadas pérdidas seguidas'); get().playSound('alert'); } return; }

    const signal = generateCompositeSignal(s.tickHistory, s.selectedStrategies);
    set({ lastSignal: signal });
    set((st) => ({ signalHistory: [...st.signalHistory.slice(-30), signal] }));

    if (signal.type && signal.confidence >= r.minSignalConfidence) {
      const m = s.currentMarket;
      get().addLog('trade', `📊 ${signal.type} (${signal.confidence}%) en ${m?.name || s.currentSymbol} — ${signal.reason}`);

      if (r.useMartingale && s.consecutiveLosses > 0) {
        const step = Math.min(s.consecutiveLosses, r.martingaleMaxSteps);
        const ma = Math.min(s.baseTradeAmount * Math.pow(r.martingaleMultiplier, step), s.balance * 0.1);
        if (ma > s.balance) return;
        set({ tradeAmount: ma, martingaleStep: step });
        get().addLog('info', `📈 Martingale paso ${step}: $${ma.toFixed(2)}`);
      }
      get().placeTrade(signal.type);
    }
  },

  updateRiskSettings: (u) => { set((s) => ({ riskSettings: { ...s.riskSettings, ...u } })); get().addLog('info', 'Riesgo actualizado'); },
  resetSession: () => { set({ sessionProfit: 0, sessionTrades: 0, consecutiveLosses: 0, martingaleStep: 0, sessionStartTime: new Date(), isSessionPaused: false, pauseReason: '', tradeAmount: get().baseTradeAmount }); get().addLog('info', '🔄 Sesión reiniciada'); },
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  toggleNotifications: async () => {
    const s = get();
    if (!s.notificationEnabled) {
      if (typeof window !== 'undefined' && 'Notification' in window) { const p = await Notification.requestPermission(); if (p === 'granted') { set({ notificationEnabled: true }); } else get().addLog('warning', 'Notif denegada'); }
    } else set({ notificationEnabled: false });
  },

  playSound: (type) => {
    if (!get().soundEnabled) return;
    try {
      const c = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination); g.gain.value = 0.08;
      const t = c.currentTime;
      switch (type) {
        case 'trade': o.frequency.value = 800; o.type = 'sine'; g.gain.exponentialRampToValueAtTime(0.001, t + .15); o.start(t); o.stop(t + .15); break;
        case 'win': o.frequency.value = 523; o.type = 'sine'; o.frequency.exponentialRampToValueAtTime(784, t + .15); g.gain.exponentialRampToValueAtTime(0.001, t + .3); o.start(t); o.stop(t + .3); break;
        case 'loss': o.frequency.value = 400; o.type = 'sawtooth'; o.frequency.exponentialRampToValueAtTime(200, t + .25); g.gain.exponentialRampToValueAtTime(0.001, t + .3); o.start(t); o.stop(t + .3); break;
        case 'alert': o.frequency.value = 300; o.type = 'square'; g.gain.value = 0.05; g.gain.exponentialRampToValueAtTime(0.001, t + .4); o.start(t); o.stop(t + .4); break;
      }
    } catch (_) {}
  },

  addLog: (type, message) => {
    const e: LogEntry = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, timestamp: new Date(), type, message };
    set((s) => ({ logs: [...s.logs.slice(-(s.maxLogs - 1)), e] }));
  },
  clearLogs: () => set({ logs: [] }),

  updateTradeRecord: (contractId, updates) => {
    set((s) => {
      const i = s.openTrades.findIndex((t) => t.contractId === contractId);
      if (i === -1) return s;
      const u = [...s.openTrades]; u[i] = { ...u[i], ...updates };
      const rem = updates.status && updates.status !== 'OPEN' ? u.filter((t) => t.contractId !== contractId) : u;
      let h = s.tradeHistory;
      if (updates.status && updates.status !== 'OPEN') h = [{ ...u[i], ...updates } as TradeRecord, ...s.tradeHistory];
      const cl = h.filter((t) => t.status === 'WON' || t.status === 'LOST');
      const w = cl.filter((t) => t.status === 'WON').length, l = cl.filter((t) => t.status === 'LOST').length;
      const tp = cl.reduce((a, t) => a + (t.profit || 0), 0);
      let sk = 0; const st = cl[0]?.status === 'WON' ? 'win' : 'loss';
      for (let j = 0; j < cl.length; j++) { if (j === 0 || cl[j].status === cl[j - 1].status) sk++; else break; }
      let cL = 0; for (let j = 0; j < cl.length; j++) { if (cl[j].status === 'LOST') cL++; else break; }
      const sp = s.sessionProfit + ((updates.status === 'WON' || updates.status === 'LOST') ? (updates.profit || 0) : 0);
      return { openTrades: rem, tradeHistory: h.slice(0, 100), totalProfit: tp, totalTrades: cl.length, winCount: w, lossCount: l, currentStreak: sk, streakType: st as any, sessionProfit: sp, consecutiveLosses: updates.status === 'LOST' ? s.consecutiveLosses + 1 : updates.status === 'WON' ? 0 : s.consecutiveLosses, martingaleStep: updates.status === 'WON' ? 0 : s.martingaleStep, tradeAmount: updates.status === 'WON' ? s.baseTradeAmount : s.tradeAmount };
    });
  },

  loadTradeHistory: async () => {
    try { const r = await fetch('/api/trades?limit=100'); const t = await r.json(); const c = t.filter((x: TradeRecord) => x.status === 'WON' || x.status === 'LOST'); set({ tradeHistory: t, openTrades: t.filter((x: TradeRecord) => x.status === 'OPEN'), totalTrades: c.length, winCount: c.filter((x) => x.status === 'WON').length, lossCount: c.filter((x) => x.status === 'LOST').length, totalProfit: c.reduce((a: number, x: TradeRecord) => a + (x.profit || 0), 0) }); } catch (_) {}
  },
}));
