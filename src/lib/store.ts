import { create } from 'zustand';
import { getDerivAPI, type Tick } from './deriv-api';
import { generateCompositeSignal, type StrategySignal, SYNTHETIC_MARKETS } from './strategies';

export interface TradeRecord {
  id?: string;
  symbol: string;
  contractType: 'CALL' | 'PUT';
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

  // Market
  currentSymbol: string;
  currentPrice: number;
  ticks: Tick[];
  tickHistory: Tick[];
  previousPrice: number;
  priceDirection: 'up' | 'down' | 'neutral';

  // Trading
  isAutoTrading: boolean;
  selectedStrategies: string[];
  tradeAmount: number;
  contractDuration: number;
  contractDurationUnit: string;
  currentProposal: { id: string; askPrice: number; payout: number } | null;

  // Records
  openTrades: TradeRecord[];
  tradeHistory: TradeRecord[];
  totalProfit: number;
  totalTrades: number;
  winCount: number;
  lossCount: number;
  currentStreak: number;
  streakType: 'win' | 'loss' | 'none';

  // Strategy signals
  lastSignal: StrategySignal | null;
  signalHistory: StrategySignal[];

  // Activity log
  logs: LogEntry[];
  maxLogs: number;

  // Auto-trade config
  autoTradeCooldown: boolean;
  minTicksBetweenTrades: number;
  maxConcurrentTrades: number;

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
}

let tickCounter = 0;

export const useTradingStore = create<TradingState>((set, get) => ({
  // Connection
  isConnected: false,
  isAuthorized: false,
  isConnecting: false,
  apiToken: '',
  connectionError: null,

  // Account
  balance: 0,
  currency: 'USD',
  loginId: '',

  // Market
  currentSymbol: 'R_10',
  currentPrice: 0,
  ticks: [],
  tickHistory: [],
  previousPrice: 0,
  priceDirection: 'neutral',

  // Trading
  isAutoTrading: false,
  selectedStrategies: ['RSI'],
  tradeAmount: 1,
  contractDuration: 5,
  contractDurationUnit: 't',
  currentProposal: null,

  // Records
  openTrades: [],
  tradeHistory: [],
  totalProfit: 0,
  totalTrades: 0,
  winCount: 0,
  lossCount: 0,
  currentStreak: 0,
  streakType: 'none',

  // Strategy signals
  lastSignal: null,
  signalHistory: [],

  // Activity log
  logs: [],
  maxLogs: 200,

  // Auto-trade config
  autoTradeCooldown: false,
  minTicksBetweenTrades: 10,
  maxConcurrentTrades: 3,

  // Actions
  connect: async (token?: string) => {
    const api = getDerivAPI();
    const stateToken = get().apiToken || token;

    if (!stateToken) {
      set({ connectionError: 'API token is required' });
      return;
    }

    set({ isConnecting: true, connectionError: null, apiToken: stateToken });
    get().addLog('info', 'Connecting to Deriv...');

    try {
      await api.connect();
      set({ isConnected: true, isConnecting: false });
      get().addLog('success', 'Connected to Deriv WebSocket server');

      // Authorize
      const auth = await api.authorize(stateToken);
      set({
        isAuthorized: true,
        balance: auth.authorize.balance,
        currency: auth.authorize.currency,
        loginId: auth.authorize.loginid,
      });
      get().addLog('success', `Authorized: ${auth.authorize.fullname} (${auth.authorize.loginid})`);

      // Subscribe to open contracts
      api.subscribeToOpenContracts((data: any) => {
        if (data.proposal_open_contract) {
          const poc = data.proposal_open_contract;
          if (poc.is_sold || poc.status === 'sold') {
            const profit = poc.profit;
            const won = profit > 0;
            get().addLog(
              won ? 'success' : 'warning',
              `Contract ${poc.contract_id} closed: ${won ? 'WON' : 'LOST'} $${Math.abs(profit).toFixed(2)}`
            );
            get().updateTradeRecord(poc.contract_id, {
              exitPrice: poc.current_spot,
              profit: profit,
              status: won ? 'WON' : 'LOST',
              exitTime: new Date().toISOString(),
            });
          }
        }
      });

      // Subscribe to current market
      await get().subscribeToMarket(get().currentSymbol);
    } catch (error: any) {
      set({
        isConnecting: false,
        isConnected: false,
        connectionError: error.message || 'Connection failed',
      });
      get().addLog('error', `Connection failed: ${error.message}`);
    }
  },

  disconnect: () => {
    const api = getDerivAPI();
    api.unsubscribeFromTicks(get().currentSymbol);
    api.unsubscribeFromOpenContracts();
    api.disconnect();
    set({
      isConnected: false,
      isAuthorized: false,
      isAutoTrading: false,
      balance: 0,
      currency: 'USD',
      loginId: '',
      currentPrice: 0,
      ticks: [],
      tickHistory: [],
      currentProposal: null,
      connectionError: null,
    });
    get().addLog('info', 'Disconnected from Deriv');
  },

  subscribeToMarket: async (symbol: string) => {
    const api = getDerivAPI();
    const oldSymbol = get().currentSymbol;

    if (oldSymbol && oldSymbol !== symbol) {
      api.unsubscribeFromTicks(oldSymbol);
    }

    set({ currentSymbol: symbol, ticks: [], tickHistory: [], currentPrice: 0 });
    const market = SYNTHETIC_MARKETS.find((m) => m.symbol === symbol);
    get().addLog('info', `Subscribing to ${market?.name || symbol}...`);

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

            return {
              ticks: newTicks,
              tickHistory: newHistory,
              currentPrice: tick.quote,
              previousPrice: state.currentPrice,
              priceDirection: direction,
            };
          });

          // Auto-trading logic
          if (get().isAutoTrading && !get().autoTradeCooldown) {
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
      get().addLog('success', `Subscribed to ${market?.name || symbol}. History: ${historyTicks.length} ticks loaded.`);
    } catch (error: any) {
      get().addLog('error', `Failed to subscribe to ${symbol}: ${error.message}`);
    }
  },

  setTradeAmount: (amount: number) => set({ tradeAmount: amount }),
  setContractDuration: (duration: number, unit: string) => set({ contractDuration: duration, contractDurationUnit: unit }),

  toggleAutoTrading: () => {
    set((state) => {
      const newState = !state.isAutoTrading;
      if (newState) {
        get().addLog('warning', '🤖 Auto-trading ENABLED. The bot will now execute trades based on selected strategies.');
      } else {
        get().addLog('info', '🛑 Auto-trading DISABLED.');
      }
      return { isAutoTrading: newState };
    });
  },

  toggleStrategy: (strategyId: string) => {
    set((state) => {
      const selected = state.selectedStrategies.includes(strategyId)
        ? state.selectedStrategies.filter((s) => s !== strategyId)
        : [...state.selectedStrategies, strategyId];
      return { selectedStrategies: selected };
    });
  },

  selectAllStrategies: () => {
    set({ selectedStrategies: ['RSI', 'MA_CROSS', 'BOLLINGER', 'SPIKE'] });
  },

  clearStrategies: () => {
    set({ selectedStrategies: [] });
  },

  placeTrade: async (type: 'CALL' | 'PUT') => {
    const api = getDerivAPI();
    const state = get();

    if (!state.isConnected || !state.isAuthorized) {
      get().addLog('error', 'Not connected. Please connect with your API token first.');
      return;
    }

    if (state.openTrades.length >= state.maxConcurrentTrades) {
      get().addLog('warning', `Maximum concurrent trades (${state.maxConcurrentTrades}) reached.`);
      return;
    }

    if (state.tradeAmount <= 0 || state.tradeAmount > state.balance) {
      get().addLog('error', 'Invalid trade amount.');
      return;
    }

    get().addLog('info', `Requesting ${type} contract for ${state.currentSymbol}...`);

    try {
      const proposal = await api.getProposal({
        contract_type: type,
        symbol: state.currentSymbol,
        amount: state.tradeAmount,
        duration: state.contractDuration,
        duration_unit: state.contractDurationUnit,
        basis: 'stake',
        currency: state.currency,
      });

      if (proposal.proposal) {
        set({ currentProposal: { id: proposal.proposal.id, askPrice: proposal.proposal.ask_price, payout: proposal.proposal.payout } });
        get().addLog('info', `Proposal received. Price: $${proposal.proposal.ask_price.toFixed(2)}, Payout: $${proposal.proposal.payout.toFixed(2)}`);

        // Buy the contract
        const buyResult = await api.buy(proposal.proposal.id, proposal.proposal.ask_price);

        if (buyResult.buy) {
          const newTrade: TradeRecord = {
            symbol: state.currentSymbol,
            contractType: type,
            entryTime: new Date().toISOString(),
            entryPrice: state.currentPrice,
            profit: 0,
            strategy: state.selectedStrategies.join('+') || 'Manual',
            status: 'OPEN',
            amount: buyResult.buy.buy_price,
            payout: buyResult.buy.payout,
            contractId: buyResult.buy.contract_id,
          };

          set((s) => ({
            openTrades: [...s.openTrades, newTrade],
            balance: buyResult.buy.balance_after,
            currentProposal: null,
          }));

          get().addLog('trade', `✅ ${type} BOUGHT on ${state.currentSymbol} | Contract #${buyResult.buy.contract_id} | Stake: $${buyResult.buy.buy_price.toFixed(2)} | Payout: $${buyResult.buy.payout.toFixed(2)}`);

          // Save trade to database
          try {
            await fetch('/api/trades', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newTrade),
            });
          } catch (dbError) {
            console.error('Failed to save trade to database:', dbError);
          }

          // Set cooldown
          set({ autoTradeCooldown: true });
          setTimeout(() => set({ autoTradeCooldown: false }), state.minTicksBetweenTrades * 500);
        }
      }
    } catch (error: any) {
      get().addLog('error', `Trade failed: ${error.message}`);
      set({ currentProposal: null });
    }
  },

  processAutoTrade: () => {
    const state = get();
    if (!state.isAutoTrading || state.selectedStrategies.length === 0) return;
    if (state.tickHistory.length < 50) return;
    if (state.openTrades.length >= state.maxConcurrentTrades) return;

    const signal = generateCompositeSignal(state.tickHistory, state.selectedStrategies);
    set({ lastSignal: signal });

    // Keep signal history
    set((s) => ({
      signalHistory: [...s.signalHistory.slice(-20), signal],
    }));

    if (signal.type && signal.confidence >= 60) {
      get().addLog('trade', `📊 Signal: ${signal.type} (${signal.confidence}% confidence) - ${signal.strategy}`);
      get().placeTrade(signal.type);
    }
  },

  addLog: (type, message) => {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date(),
      type,
      message,
    };
    set((state) => ({
      logs: [...state.logs.slice(-(state.maxLogs - 1)), entry],
    }));
  },

  clearLogs: () => set({ logs: [] }),

  updateTradeRecord: (contractId: number, updates: Partial<TradeRecord>) => {
    set((state) => {
      // Update in open trades
      const openIdx = state.openTrades.findIndex((t) => t.contractId === contractId);
      if (openIdx !== -1) {
        const updatedOpen = [...state.openTrades];
        updatedOpen[openIdx] = { ...updatedOpen[openIdx], ...updates };

        // Remove from open trades if closed
        const remaining = updates.status && updates.status !== 'OPEN'
          ? updatedOpen.filter((t) => t.contractId !== contractId)
          : updatedOpen;

        // Add to history
        let newHistory = state.tradeHistory;
        if (updates.status && updates.status !== 'OPEN') {
          newHistory = [{ ...updatedOpen[openIdx], ...updates } as TradeRecord, ...state.tradeHistory];
        }

        // Recalculate stats
        const allClosed = [...newHistory.filter((t) => t.status === 'WON' || t.status === 'LOST')];
        const wins = allClosed.filter((t) => t.status === 'WON').length;
        const losses = allClosed.filter((t) => t.status === 'LOST').length;
        const totalProfit = allClosed.reduce((s, t) => s + (t.profit || 0), 0);

        // Calculate streak
        let streak = 0;
        let streakType: 'win' | 'loss' | 'none' = 'none';
        for (let i = 0; i < allClosed.length; i++) {
          if (i === 0) {
            streak = 1;
            streakType = allClosed[i].status === 'WON' ? 'win' : 'loss';
          } else if (allClosed[i].status === allClosed[i - 1].status) {
            streak++;
          } else {
            break;
          }
        }

        return {
          openTrades: remaining,
          tradeHistory: newHistory.slice(0, 100),
          totalProfit,
          totalTrades: allClosed.length,
          winCount: wins,
          lossCount: losses,
          currentStreak: streak,
          streakType,
        };
      }

      return state;
    });
  },

  loadTradeHistory: async () => {
    try {
      const response = await fetch('/api/trades?limit=100');
      const trades = await response.json();

      const closedTrades = trades.filter((t: TradeRecord) => t.status === 'WON' || t.status === 'LOST');
      const wins = closedTrades.filter((t: TradeRecord) => t.status === 'WON').length;
      const losses = closedTrades.filter((t: TradeRecord) => t.status === 'LOST').length;
      const totalProfit = closedTrades.reduce((s: number, t: TradeRecord) => s + (t.profit || 0), 0);

      set({
        tradeHistory: trades,
        openTrades: trades.filter((t: TradeRecord) => t.status === 'OPEN'),
        totalTrades: closedTrades.length,
        winCount: wins,
        lossCount: losses,
        totalProfit,
      });
    } catch (error) {
      console.error('Failed to load trade history:', error);
    }
  },
}));
