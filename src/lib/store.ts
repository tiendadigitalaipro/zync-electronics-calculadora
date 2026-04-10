import { create } from 'zustand';
import { getDerivAPI, type Tick, type ActiveSymbol } from './deriv-api';
import { generateCompositeSignal, type StrategySignal, SYNTHETIC_MARKETS, type MarketInfo, getMarketBySymbol, isSymbolValid, getContractType } from './strategies';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface TradeRecord {
  id?: string;
  symbol: string;
  contractType: string;
  direction: 'CALL' | 'PUT';
  entryTime: string;
  exitTime?: string;
  entryPrice: number;
  exitPrice?: number;
  profit: number;
  strategy: string;
  status: 'OPEN' | 'WON' | 'LOST' | 'SOLD';
  amount: number;
  payout: number;
  contractId?: number;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'error' | 'trade';
  message: string;
}

interface RiskSettings {
  maxDailyLoss: number;
  dailyProfitTarget: number;
  maxTradesPerSession: number;
  stopAfterConsecutiveLosses: number;
  useMartingale: boolean;
  martingaleMultiplier: number;
  martingaleMaxSteps: number;
  minSignalConfidence: number;
}

const defaultRiskSettings: RiskSettings = {
  maxDailyLoss: 20,
  dailyProfitTarget: 50,
  maxTradesPerSession: 30,
  stopAfterConsecutiveLosses: 5,
  useMartingale: false,
  martingaleMultiplier: 2.0,
  martingaleMaxSteps: 4,
  minSignalConfidence: 60,
};

interface TradingState {
  // Connection
  isConnected: boolean;
  isAuthorized: boolean;
  isConnecting: boolean;
  apiToken: string;
  connectionError: string | null;

  // Account
  balance: number;
  currency: string;
  loginId: string;
  accountList: any;

  // Market
  currentSymbol: string;
  currentMarket: MarketInfo | null;
  currentPrice: number;
  ticks: Tick[];
  tickHistory: Tick[];
  previousPrice: number;
  priceDirection: 'up' | 'down' | 'neutral';

  // Trading
  isAutoTrading: boolean;
  selectedStrategies: string[];
  baseTradeAmount: number;
  tradeAmount: number;
  contractDuration: number;
  contractDurationUnit: string;
  currentProposal: { id: string; askPrice: number; payout: number; contractType: string } | null;

  // Risk
  riskSettings: RiskSettings;
  sessionProfit: number;
  sessionTrades: number;
  consecutiveLosses: number;
  martingaleStep: number;
  sessionStartTime: Date | null;
  isSessionPaused: boolean;
  pauseReason: string;

  // Records
  openTrades: TradeRecord[];
  tradeHistory: TradeRecord[];
  totalProfit: number;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  currentStreak: number;
  streakType: 'win' | 'loss' | 'none';

  // Signals
  lastSignal: StrategySignal | null;
  signalHistory: StrategySignal[];

  // Log
  logs: LogEntry[];
  maxLogs: number;

  // Cooldowns
  autoTradeCooldown: boolean;
  minTicksBetweenTrades: number;
  maxConcurrentTrades: number;
  signalCooldown: boolean;

  // UI
  soundEnabled: boolean;
  notificationEnabled: boolean;

  // API verified symbols
  availableSymbols: ActiveSymbol[];
  supportedMarkets: MarketInfo[];

  // Actions
  connect: (token?: string) => Promise<void>;
  disconnect: () => void;
  subscribeToMarket: (symbol: string) => Promise<void>;
  setTradeAmount: (amount: number) => void;
  setContractDuration: (duration: number, unit: string) => void;
  toggleAutoTrading: () => void;
  toggleStrategy: (strategyId: string) => void;
  selectAllStrategies: () => void;
  clearStrategies: () => void;
  placeTrade: (type: 'CALL' | 'PUT') => Promise<void>;
  addLog: (type: LogEntry['type'], message: string) => void;
  clearLogs: () => void;
  updateTradeRecord: (contractId: number, updates: Partial<TradeRecord>) => void;
  loadTradeHistory: () => Promise<void>;
  processAutoTrade: () => void;
  updateRiskSettings: (settings: Partial<RiskSettings>) => void;
  resetSession: () => void;
  toggleSound: () => void;
  toggleNotifications: () => void;
}

let tickCounter = 0;
let signalCooldownTimer: ReturnType<typeof setTimeout> | null = null;

export const useTradingStore = create<TradingState>((set, get) => ({
  isConnected: false, isAuthorized: false, isConnecting: false, apiToken: '', connectionError: null,
  balance: 0, currency: 'USD', loginId: '', accountList: null,
  currentSymbol: 'R_10', currentMarket: null, currentPrice: 0, ticks: [], tickHistory: [], previousPrice: 0, priceDirection: 'neutral',
  isAutoTrading: false, selectedStrategies: ['RSI'], baseTradeAmount: 1, tradeAmount: 1, contractDuration: 1, contractDurationUnit: 'm',
  currentProposal: null,
  riskSettings: { ...defaultRiskSettings }, sessionProfit: 0, sessionTrades: 0, consecutiveLosses: 0, martingaleStep: 0,
  sessionStartTime: null, isSessionPaused: false, pauseReason: '',
  openTrades: [], tradeHistory: [], totalProfit: 0, totalTrades: 0, winCount: 0, lossCount: 0, currentStreak: 0, streakType: 'none',
  lastSignal: null, signalHistory: [],
  logs: [], maxLogs: 300,
  autoTradeCooldown: false, minTicksBetweenTrades: 10, maxConcurrentTrades: 3, signalCooldown: false,
  soundEnabled: true, notificationEnabled: false,
  availableSymbols: [], supportedMarkets: SYNTHETIC_MARKETS,

  // ═══════════════════════════════════════════════════════════════════════
  // CONNECT
  // ═══════════════════════════════════════════════════════════════════════
  connect: async (token?: string) => {
    const api = getDerivAPI();
    const stateToken = get().apiToken || token;
    if (!stateToken) { set({ connectionError: 'API token is required' }); return; }

    set({ isConnecting: true, connectionError: null, apiToken: stateToken });
    get().addLog('info', 'Connecting to Deriv...');

    try {
      await api.connect();
      set({ isConnected: true, isConnecting: false });
      get().addLog('success', 'WebSocket connected');
      get().playSound('trade');

      const auth = await api.authorize(stateToken);
      set({
        isAuthorized: true,
        balance: auth.authorize.balance,
        currency: auth.authorize.currency,
        loginId: auth.authorize.loginid,
        accountList: auth.authorize.account_list || null,
      });
      get().addLog('success', `Authorized: ${auth.authorize.fullname} (${auth.authorize.loginid})`);
      get().addLog('info', `${auth.authorize.is_virtual ? 'DEMO' : 'REAL'} | ${auth.authorize.currency}`);

      // Balance subscription
      try {
        const bal = await api.getBalance();
        if (bal.balance) set({ balance: bal.balance.balance, currency: bal.balance.currency });
      } catch (_) {}

      // ─── Fetch & validate active symbols ──────────────────────────
      try {
        const activeSymbols = await api.getActiveSymbols('basic');
        set({ availableSymbols: activeSymbols });

        // Build map of what the API actually reports
        const apiSymbolMap = new Map<string, ActiveSymbol>();
        activeSymbols.forEach((s: ActiveSymbol) => {
          apiSymbolMap.set(s.symbol, s);
          // Also map by display_name for fallback
          apiSymbolMap.set(s.display_name, s);
        });

        // Filter our dictionary: only keep markets the API confirms exist & aren't suspended
        const verified = SYNTHETIC_MARKETS.filter((m) => {
          const apiSym = apiSymbolMap.get(m.symbol);
          if (!apiSym) return false;
          if (apiSym.is_trading_suspended) return false;
          // Must support at least CALL or RISE
          return apiSym.contract_types?.includes('CALL') || apiSym.contract_types?.includes('RISE');
        });

        set({ supportedMarkets: verified.length > 0 ? verified : SYNTHETIC_MARKETS });

        if (verified.length > 0) {
          const cats: Record<string, number> = {};
          verified.forEach(m => { cats[m.category] = (cats[m.category] || 0) + 1; });
          const summary = Object.entries(cats).map(([k, v]) => `${v} ${k}`).join(', ');
          get().addLog('success', `${verified.length} markets verified: ${summary}`);
        } else {
          get().addLog('warning', 'API verification found 0 matches. Showing all dictionary markets.');
          get().addLog('info', `Your account has ${activeSymbols.length} symbols. Check if your account has access to Synthetic indices.`);
        }
      } catch (e) {
        get().addLog('warning', 'Could not verify symbols via API. Showing all.');
      }

      // Open contract subscription
      api.subscribeToOpenContracts((data: any) => {
        if (data.proposal_open_contract) {
          const poc = data.proposal_open_contract;
          if (poc.is_sold || poc.status === 'sold') {
            const profit = poc.profit;
            const won = profit > 0;
            get().addLog(won ? 'success' : 'warning', `#${poc.contract_id} ${won ? 'WON' : 'LOST'} ${profit >= 0 ? '+' : ''}$${profit.toFixed(2)}`);
            if (won) get().playSound('win'); else get().playSound('loss');
            get().updateTradeRecord(poc.contract_id, {
              exitPrice: poc.current_spot, profit, status: won ? 'WON' : 'LOST', exitTime: new Date().toISOString(),
            });
          }
        }
      });

      await get().subscribeToMarket(get().currentSymbol);
    } catch (error: any) {
      set({ isConnecting: false, isConnected: false, connectionError: error.message });
      get().addLog('error', `Connection failed: ${error.message}`);
      get().playSound('alert');
    }
  },

  disconnect: () => {
    const api = getDerivAPI();
    api.unsubscribeFromTicks(get().currentSymbol);
    api.unsubscribeFromOpenContracts();
    api.disconnect();
    set({
      isConnected: false, isAuthorized: false, isAutoTrading: false,
      balance: 0, currency: 'USD', loginId: '', accountList: null,
      currentPrice: 0, currentMarket: null, ticks: [], tickHistory: [],
      currentProposal: null, connectionError: null, isSessionPaused: false, pauseReason: '',
    });
    get().addLog('info', 'Disconnected');
  },

  // ═══════════════════════════════════════════════════════════════════════
  // SUBSCRIBE TO MARKET
  // ═══════════════════════════════════════════════════════════════════════
  subscribeToMarket: async (symbol: string) => {
    // ─── Symbol validation against dictionary ──────────────────────
    if (!isSymbolValid(symbol)) {
      get().addLog('error', `Symbol "${symbol}" is NOT in the dictionary. Use only official symbols.`);
      return;
    }

    const api = getDerivAPI();
    const oldSymbol = get().currentSymbol;
    if (oldSymbol && oldSymbol !== symbol) api.unsubscribeFromTicks(oldSymbol);

    const market = getMarketBySymbol(symbol)!;
    set({ currentSymbol: symbol, currentMarket: market, ticks: [], tickHistory: [], currentPrice: 0 });
    get().addLog('info', `Subscribing to ${market.name} (${symbol})...`);

    try {
      const historyTicks = await api.subscribeToTicks(symbol, (data: any) => {
        if (data.tick) {
          const tick: Tick = {
            epoch: data.tick.epoch,
            quote: data.tick.quote,
            symbol: data.tick.symbol,
            id: data.tick.id,
          };
          set((state) => {
            const newTicks = [...state.ticks.slice(-200), tick];
            const newHistory = [...state.tickHistory.slice(-1000), tick];
            const direction = state.currentPrice > 0
              ? tick.quote > state.currentPrice ? 'up' : tick.quote < state.currentPrice ? 'down' : 'neutral'
              : 'neutral';
            tickCounter++;
            return { ticks: newTicks, tickHistory: newHistory, currentPrice: tick.quote, previousPrice: state.currentPrice, priceDirection: direction };
          });

          if (get().isAutoTrading && !get().autoTradeCooldown && tickCounter % 5 === 0) {
            get().processAutoTrade();
          }
        }
      });

      set({ tickHistory: historyTicks });
      if (historyTicks.length > 0) {
        set({
          currentPrice: historyTicks[historyTicks.length - 1].quote,
          previousPrice: historyTicks.length > 1 ? historyTicks[historyTicks.length - 2].quote : historyTicks[historyTicks.length - 1].quote,
        });
      }
      get().addLog('success', `${market.name} subscribed. ${historyTicks.length} ticks loaded.`);
    } catch (error: any) {
      get().addLog('error', `Subscribe failed for ${symbol}: ${error.message}`);
    }
  },

  setTradeAmount: (amount: number) => set({ baseTradeAmount: amount, tradeAmount: amount }),
  setContractDuration: (duration: number, unit: string) => set({ contractDuration: duration, contractDurationUnit: unit }),

  toggleAutoTrading: () => {
    set((s) => {
      const next = !s.isAutoTrading;
      if (next) {
        get().addLog('warning', '🤖 Auto-trading ENABLED');
        get().playSound('trade');
        return {
          isAutoTrading: next, sessionStartTime: s.sessionStartTime || new Date(),
          sessionProfit: 0, sessionTrades: 0, consecutiveLosses: 0, martingaleStep: 0,
          isSessionPaused: false, pauseReason: '', tradeAmount: s.baseTradeAmount,
        };
      } else {
        get().addLog('info', '🛑 Auto-trading DISABLED');
        return { isAutoTrading: next, signalCooldown: false };
      }
    });
  },

  toggleStrategy: (id: string) => set((s) => ({
    selectedStrategies: s.selectedStrategies.includes(id) ? s.selectedStrategies.filter((x) => x !== id) : [...s.selectedStrategies, id],
  })),
  selectAllStrategies: () => set({ selectedStrategies: ['RSI', 'MA_CROSS', 'BOLLINGER', 'SPIKE'] }),
  clearStrategies: () => set({ selectedStrategies: [] }),

  // ═══════════════════════════════════════════════════════════════════════
  // PLACE TRADE — Clean execution with dictionary validation
  // ═══════════════════════════════════════════════════════════════════════
  placeTrade: async (type: 'CALL' | 'PUT') => {
    const api = getDerivAPI();
    const state = get();

    if (!state.isConnected || !state.isAuthorized) {
      get().addLog('error', 'Not connected. Connect with API token first.');
      return;
    }
    if (state.isSessionPaused) {
      get().addLog('warning', `Paused: ${state.pauseReason}`);
      return;
    }
    if (state.openTrades.length >= state.maxConcurrentTrades) {
      get().addLog('warning', `Max concurrent trades (${state.maxConcurrentTrades}) reached.`);
      return;
    }

    const effectiveAmount = state.tradeAmount;
    if (effectiveAmount <= 0 || effectiveAmount > state.balance) {
      get().addLog('error', `Invalid amount $${effectiveAmount.toFixed(2)}. Balance: $${state.balance.toFixed(2)}`);
      return;
    }

    // ─── Symbol validation ─────────────────────────────────────────
    const symbol = state.currentSymbol;
    if (!isSymbolValid(symbol)) {
      get().addLog('error', `INVALID symbol "${symbol}". This symbol is not in the trading dictionary.`);
      get().playSound('alert');
      return;
    }

    const market = state.currentMarket || getMarketBySymbol(symbol);
    if (!market) {
      get().addLog('error', `Market info missing for ${symbol}.`);
      get().playSound('alert');
      return;
    }

    // ─── Determine contract type ──────────────────────────────────
    // All markets in our dictionary support CALL/PUT directly
    const contractType = getContractType(type);

    // ─── Determine duration ───────────────────────────────────────
    // Synthetic indices: use 1 minute duration
    // Metals/Forex: use 1 minute duration
    // User can override manually
    const duration = state.contractDuration;
    const durationUnit = state.contractDurationUnit;

    get().addLog('info', `→ ${type} on ${market.name} (${symbol}) | $${effectiveAmount.toFixed(2)} | ${duration}${durationUnit}`);

    // ─── Cross-check with API's active_symbols ────────────────────
    const activeSymbol = state.availableSymbols.find((s: ActiveSymbol) => s.symbol === symbol);
    if (activeSymbol) {
      const hasContract = activeSymbol.contract_types?.includes(contractType) || activeSymbol.contract_types?.includes('RISE');
      if (!hasContract) {
        get().addLog('error', `${market.name} (${symbol}) does not support ${contractType}. API reports: ${(activeSymbol.contract_types || []).slice(0, 8).join(', ')}`);
        get().playSound('alert');
        return;
      }
    }
    // If activeSymbol not found in API response, we still try (API may have returned incomplete data)

    // ─── Send proposal request ────────────────────────────────────
    try {
      const proposal = await api.getProposal({
        contract_type: contractType,
        symbol: symbol,
        amount: effectiveAmount,
        duration: duration,
        duration_unit: durationUnit,
        basis: 'stake',
        currency: state.currency,
      });

      if (proposal.proposal) {
        set({ currentProposal: { id: proposal.proposal.id, askPrice: proposal.proposal.ask_price, payout: proposal.proposal.payout, contractType } });
        get().addLog('info', `Proposal OK. Cost: $${proposal.proposal.ask_price.toFixed(2)} | Payout: $${proposal.proposal.payout.toFixed(2)}`);

        // ─── Buy ──────────────────────────────────────────────────
        const buyResult = await api.buy(proposal.proposal.id, proposal.proposal.ask_price);

        if (buyResult.buy) {
          const trade: TradeRecord = {
            symbol, contractType, direction: type,
            entryTime: new Date().toISOString(), entryPrice: state.currentPrice, profit: 0,
            strategy: state.selectedStrategies.join('+') || 'Manual',
            status: 'OPEN', amount: buyResult.buy.buy_price,
            payout: buyResult.buy.payout, contractId: buyResult.buy.contract_id,
          };

          set((s) => ({
            openTrades: [...s.openTrades, trade],
            balance: buyResult.buy.balance_after,
            currentProposal: null,
            sessionTrades: s.sessionTrades + 1,
          }));

          get().addLog('trade', `✅ ${contractType} BOUGHT | #${buyResult.buy.contract_id} | ${market.name} | $${buyResult.buy.buy_price.toFixed(2)} → $${buyResult.buy.payout.toFixed(2)}`);
          get().playSound('trade');

          try { await fetch('/api/trades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(trade) }); } catch (_) {}

          set({ autoTradeCooldown: true, signalCooldown: true });
          setTimeout(() => set({ autoTradeCooldown: false }), state.minTicksBetweenTrades * 500);
          if (signalCooldownTimer) clearTimeout(signalCooldownTimer);
          signalCooldownTimer = setTimeout(() => set({ signalCooldown: false }), 15000);
        }
      }
    } catch (error: any) {
      get().addLog('error', `Trade FAILED on ${market.name} (${symbol}): ${error.message}`);
      set({ currentProposal: null });
      get().playSound('alert');
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // AUTO-TRADE
  // ═══════════════════════════════════════════════════════════════════════
  processAutoTrade: () => {
    const state = get();
    if (!state.isAutoTrading || state.selectedStrategies.length === 0) return;
    if (state.tickHistory.length < 50) return;
    if (state.openTrades.length >= state.maxConcurrentTrades) return;
    if (state.signalCooldown) return;

    const risk = state.riskSettings;

    // Risk checks
    if (state.sessionProfit < -risk.maxDailyLoss) {
      if (!state.isSessionPaused) { set({ isSessionPaused: true, pauseReason: `Daily loss limit (-$${risk.maxDailyLoss})` }); get().addLog('error', `🛑 Daily loss limit! -$${risk.maxDailyLoss}`); get().playSound('alert'); }
      return;
    }
    if (state.sessionProfit >= risk.dailyProfitTarget) {
      if (!state.isSessionPaused) { set({ isSessionPaused: true, pauseReason: `Profit target (+$${risk.dailyProfitTarget})` }); get().addLog('success', `🎯 Profit target +$${risk.dailyProfitTarget}!`); get().playSound('win'); }
      return;
    }
    if (state.sessionTrades >= risk.maxTradesPerSession) {
      if (!state.isSessionPaused) { set({ isSessionPaused: true, pauseReason: `Max trades (${risk.maxTradesPerSession})` }); get().addLog('warning', '🛑 Max trades reached.'); }
      return;
    }
    if (state.consecutiveLosses >= risk.stopAfterConsecutiveLosses) {
      if (!state.isSessionPaused) { set({ isSessionPaused: true, pauseReason: `${risk.stopAfterConsecutiveLosses} consecutive losses` }); get().addLog('error', `🛑 ${risk.stopAfterConsecutiveLosses} consecutive losses!`); get().playSound('alert'); }
      return;
    }

    // Signal
    const signal = generateCompositeSignal(state.tickHistory, state.selectedStrategies);
    set({ lastSignal: signal });
    set((s) => ({ signalHistory: [...s.signalHistory.slice(-30), signal] }));

    if (signal.type && signal.confidence >= risk.minSignalConfidence) {
      const market = state.currentMarket;
      get().addLog('trade', `📊 ${signal.type} (${signal.confidence}%) on ${market?.name || state.currentSymbol} — ${signal.reason}`);

      // Martingale
      if (risk.useMartingale && state.consecutiveLosses > 0) {
        const step = Math.min(state.consecutiveLosses, risk.martingaleMaxSteps);
        const amt = Math.min(state.baseTradeAmount * Math.pow(risk.martingaleMultiplier, step), state.balance * 0.1);
        if (amt > state.balance) { get().addLog('warning', 'Martingale exceeds balance.'); return; }
        set({ tradeAmount: amt, martingaleStep: step });
        get().addLog('info', `📈 Martingale Step ${step}: $${amt.toFixed(2)}`);
      }

      get().placeTrade(signal.type);
    }
  },

  updateRiskSettings: (s) => { set((state) => ({ riskSettings: { ...state.riskSettings, ...s } })); get().addLog('info', 'Risk settings updated.'); },
  resetSession: () => { set({ sessionProfit: 0, sessionTrades: 0, consecutiveLosses: 0, martingaleStep: 0, sessionStartTime: new Date(), isSessionPaused: false, pauseReason: '', tradeAmount: get().baseTradeAmount }); get().addLog('info', '🔄 Session reset.'); },
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  toggleNotifications: async () => {
    const state = get();
    if (!state.notificationEnabled) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const p = await Notification.requestPermission();
        if (p === 'granted') { set({ notificationEnabled: true }); get().addLog('success', 'Notifications enabled.'); }
        else get().addLog('warning', 'Notification denied.');
      } else get().addLog('warning', 'Notifications not supported.');
    } else { set({ notificationEnabled: false }); get().addLog('info', 'Notifications disabled.'); }
  },

  playSound: (type: 'trade' | 'win' | 'loss' | 'alert') => {
    if (!get().soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination); gain.gain.value = 0.08;
      const t = ctx.currentTime;
      switch (type) {
        case 'trade': osc.frequency.value = 800; osc.type = 'sine'; gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15); osc.start(t); osc.stop(t + 0.15); break;
        case 'win': osc.frequency.value = 523; osc.type = 'sine'; osc.frequency.exponentialRampToValueAtTime(784, t + 0.15); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3); osc.start(t); osc.stop(t + 0.3); break;
        case 'loss': osc.frequency.value = 400; osc.type = 'sawtooth'; osc.frequency.exponentialRampToValueAtTime(200, t + 0.25); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3); osc.start(t); osc.stop(t + 0.3); break;
        case 'alert': osc.frequency.value = 300; osc.type = 'square'; gain.gain.value = 0.05; gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4); osc.start(t); osc.stop(t + 0.4); break;
      }
    } catch (_) {}
  },

  sendNotification: (title: string, body: string) => {
    if (!get().notificationEnabled) return;
    try { if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') new window.Notification(title, { body, tag: 'synthtrade' }); } catch (_) {}
  },

  addLog: (type, message) => {
    const entry: LogEntry = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, timestamp: new Date(), type, message };
    set((state) => ({ logs: [...state.logs.slice(-(state.maxLogs - 1)), entry] }));
  },
  clearLogs: () => set({ logs: [] }),

  updateTradeRecord: (contractId: number, updates: Partial<TradeRecord>) => {
    set((state) => {
      const idx = state.openTrades.findIndex((t) => t.contractId === contractId);
      if (idx === -1) return state;
      const updated = [...state.openTrades]; updated[idx] = { ...updated[idx], ...updates };
      const remaining = updates.status && updates.status !== 'OPEN' ? updated.filter((t) => t.contractId !== contractId) : updated;
      let history = state.tradeHistory;
      if (updates.status && updates.status !== 'OPEN') history = [{ ...updated[idx], ...updates } as TradeRecord, ...state.tradeHistory];
      const closed = history.filter((t) => t.status === 'WON' || t.status === 'LOST');
      const wins = closed.filter((t) => t.status === 'WON').length;
      const losses = closed.filter((t) => t.status === 'LOST').length;
      const totalProfit = closed.reduce((s, t) => s + (t.profit || 0), 0);
      let streak = 0, streakType: 'win' | 'loss' | 'none' = 'none';
      for (let i = 0; i < closed.length; i++) { if (i === 0) { streak = 1; streakType = closed[i].status === 'WON' ? 'win' : 'loss'; } else if (closed[i].status === closed[i - 1].status) streak++; else break; }
      let consLosses = 0; for (let i = 0; i < closed.length; i++) { if (closed[i].status === 'LOST') consLosses++; else break; }
      const tradeProfit = updates.profit || 0;
      const newSessionProfit = state.sessionProfit + (updates.status === 'WON' || updates.status === 'LOST' ? tradeProfit : 0);
      const newConsLosses = updates.status === 'LOST' ? state.consecutiveLosses + 1 : updates.status === 'WON' ? 0 : state.consecutiveLosses;
      const newAmt = updates.status === 'WON' ? state.baseTradeAmount : state.tradeAmount;
      return {
        openTrades: remaining, tradeHistory: history.slice(0, 100), totalProfit, totalTrades: closed.length, winCount: wins, lossCount: losses,
        currentStreak: streak, streakType, sessionProfit: newSessionProfit, consecutiveLosses: newConsLosses, martingaleStep: updates.status === 'WON' ? 0 : state.martingaleStep, tradeAmount: newAmt,
      };
    });
  },

  loadTradeHistory: async () => {
    try {
      const res = await fetch('/api/trades?limit=100'); const trades = await res.json();
      const closed = trades.filter((t: TradeRecord) => t.status === 'WON' || t.status === 'LOST');
      set({ tradeHistory: trades, openTrades: trades.filter((t: TradeRecord) => t.status === 'OPEN'), totalTrades: closed.length, winCount: closed.filter((t) => t.status === 'WON').length, lossCount: closed.filter((t) => t.status === 'LOST').length, totalProfit: closed.reduce((s: number, t: TradeRecord) => s + (t.profit || 0), 0) });
    } catch (_) {}
  },
}));
