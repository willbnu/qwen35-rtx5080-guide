/**
 * Zustand store for the LLM Chat Dashboard
 * Uses immer middleware for immutable state updates
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  DocCategory,
  BenchmarkData,
} from '../types';

/**
 * Extended metrics type with performance data for component binding
 */
export interface StoreMetrics {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  requestsCount: number;
  averageLatency?: number;
  genTps?: number;
  promptTps?: number;
  time?: number;
}

/**
 * Extended costs type with efficiency metrics for component binding
 */
export interface StoreCosts {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  costPerRequest?: number;
  costPer1kTokens?: number;
  currency?: 'USD' | 'EUR' | 'GBP';
}

/**
 * Extended model info type with deployment details for component binding
 */
export interface StoreModelInfo {
  name: string;
  provider: string;
  contextWindow: number;
  maxOutput: number;
  port?: number;
  speed?: 'fast' | 'medium' | 'slow';
  useCase?: string;
  version?: string;
}

/**
 * Extended app state for store with full component-compatible types
 */
export interface StoreAppState {
  metrics: StoreMetrics;
  costs: StoreCosts;
  model: StoreModelInfo;
  docs: DocCategory[];
  benchmarks?: BenchmarkData;
}

/**
 * Extended app actions for store
 */
export interface StoreAppActions {
  setMetrics: (metrics: Partial<StoreMetrics>) => void;
  setCosts: (costs: Partial<StoreCosts>) => void;
  setModel: (model: Partial<StoreModelInfo>) => void;
  setDocs: (docs: DocCategory[]) => void;
  setBenchmarks: (benchmarks: BenchmarkData) => void;
  reset: () => void;
}

/**
 * Default initial state values
 */
const defaultMetrics: StoreMetrics = {
  totalTokens: 0,
  promptTokens: 0,
  completionTokens: 0,
  requestsCount: 0,
  averageLatency: undefined,
  genTps: undefined,
  promptTps: undefined,
  time: undefined,
};

const defaultCosts: StoreCosts = {
  inputCost: 0,
  outputCost: 0,
  totalCost: 0,
  costPerRequest: undefined,
  costPer1kTokens: undefined,
  currency: 'USD',
};

const defaultModel: StoreModelInfo = {
  name: 'Qwen',
  provider: 'Alibaba',
  contextWindow: 32768,
  maxOutput: 4096,
  port: 8002,
  speed: 'fast',
  useCase: 'General purpose chat and code assistance',
  version: undefined,
};

/**
 * Combined store type for Zustand
 */
type AppStore = StoreAppState & StoreAppActions;

/**
 * Main application store using Zustand with immer middleware
 *
 * Usage:
 * ```tsx
 * const { metrics, setMetrics } = useAppStore();
 * setMetrics({ totalTokens: 1000 });
 * ```
 */
export const useAppStore = create<AppStore>()(
  immer((set) => ({
    // State
    metrics: { ...defaultMetrics },
    costs: { ...defaultCosts },
    model: { ...defaultModel },
    docs: [],
    benchmarks: undefined,

    // Actions
    setMetrics: (metrics: Partial<StoreMetrics>) =>
      set((state) => {
        Object.assign(state.metrics, metrics);
      }),

    setCosts: (costs: Partial<StoreCosts>) =>
      set((state) => {
        Object.assign(state.costs, costs);
      }),

    setModel: (model: Partial<StoreModelInfo>) =>
      set((state) => {
        Object.assign(state.model, model);
      }),

    setDocs: (docs: DocCategory[]) =>
      set((state) => {
        state.docs = docs;
      }),

    setBenchmarks: (benchmarks: BenchmarkData) =>
      set((state) => {
        state.benchmarks = benchmarks;
      }),

    reset: () =>
      set((state) => {
        state.metrics = { ...defaultMetrics };
        state.costs = { ...defaultCosts };
        state.model = { ...defaultModel };
        state.docs = [];
        state.benchmarks = undefined;
      }),
  }))
);

// Export selectors for optimized component re-renders
export const selectMetrics = (state: StoreAppState) => state.metrics;
export const selectCosts = (state: StoreAppState) => state.costs;
export const selectModel = (state: StoreAppState) => state.model;
export const selectDocs = (state: StoreAppState) => state.docs;
export const selectBenchmarks = (state: StoreAppState) => state.benchmarks;

// Export default for convenience
export default useAppStore;
