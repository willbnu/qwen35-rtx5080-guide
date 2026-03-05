/**
 * TypeScript type definitions for the LLM Chat Dashboard
 * These types define the data structures used throughout the application
 * for metrics, costs, model information, and documentation.
 */

// ============================================================================
// Metrics Types
// ============================================================================

/**
 * Core metrics data for LLM usage tracking
 */
export interface Metrics {
  /** Total tokens used across all requests */
  totalTokens: number;
  /** Tokens used in prompts/input */
  promptTokens: number;
  /** Tokens generated in completions/output */
  completionTokens: number;
  /** Total number of API requests made */
  requestsCount: number;
  /** Average response latency in milliseconds (optional) */
  averageLatency?: number;
}

/**
 * Performance metrics for token generation speed
 */
export interface PerformanceMetrics {
  /** Generation tokens per second */
  genTps: number;
  /** Prompt processing tokens per second */
  promptTps: number;
  /** Total generation time in seconds */
  totalTime: number;
}

/**
 * Combined metrics panel data
 */
export interface MetricsPanelData extends Metrics, PerformanceMetrics {}

// ============================================================================
// Cost Types
// ============================================================================

/**
 * Cost breakdown for LLM API usage
 */
export interface Costs {
  /** Cost for input/prompt tokens in USD */
  inputCost: number;
  /** Cost for output/completion tokens in USD */
  outputCost: number;
  /** Total combined cost in USD */
  totalCost: number;
}

/**
 * Extended cost data with efficiency metrics
 */
export interface CostPanelData extends Costs {
  /** Cost per request in USD */
  costPerRequest?: number;
  /** Cost per 1K tokens in USD */
  costPer1kTokens?: number;
}

// ============================================================================
// Model Types
// ============================================================================

/**
 * Model configuration and capabilities
 */
export interface ModelInfo {
  /** Display name of the model */
  name: string;
  /** Provider/organization hosting the model */
  provider: string;
  /** Maximum context window size in tokens */
  contextWindow: number;
  /** Maximum output tokens per request */
  maxOutput: number;
}

/**
 * Extended model information including deployment details
 */
export interface ModelPanelData extends ModelInfo {
  /** Port number the model is running on */
  port: number;
  /** Relative speed indicator (e.g., "fast", "medium", "slow") */
  speed: string;
  /** Recommended use case for this model */
  useCase: string;
  /** Model version or variant */
  version?: string;
}

/**
 * Model port mapping for multiple model instances
 */
export interface ModelPortMapping {
  /** Port number */
  port: number;
  /** Model identifier */
  model: string;
  /** Speed classification */
  speed: string;
  /** Use case description */
  useCase: string;
}

// ============================================================================
// Documentation Types
// ============================================================================

/**
 * Single documentation entry
 */
export interface DocEntry {
  /** Unique identifier for the document */
  id: string;
  /** Document title */
  title: string;
  /** Category for organization */
  category: string;
  /** Document content (markdown supported) */
  content: string;
  /** Optional URL to external documentation */
  url?: string;
  /** Last updated timestamp */
  updatedAt?: string;
}

/**
 * Documentation category with entries
 */
export interface DocCategory {
  /** Category identifier */
  id: string;
  /** Category display name */
  name: string;
  /** Category description */
  description?: string;
  /** Documents in this category */
  entries: DocEntry[];
}

/**
 * Documentation panel data structure
 */
export interface DocsPanelData {
  /** All documentation categories */
  categories: DocCategory[];
  /** Search query (if filtering) */
  searchQuery?: string;
  /** Currently selected category ID */
  selectedCategoryId?: string;
  /** Currently expanded document ID */
  expandedDocId?: string;
}

// ============================================================================
// Benchmark Types
// ============================================================================

/**
 * Benchmark result from LLM performance testing
 */
export interface BenchmarkResult {
  /** Port the model is running on */
  port: number;
  /** Model name/identifier */
  model: string;
  /** Speed classification */
  speed: string;
  /** Use case description */
  useCase: string;
  /** Generation tokens per second */
  genTps: number;
  /** Prompt processing tokens per second */
  promptTps: number;
  /** Total tokens processed */
  tokens: number;
  /** Total time in seconds */
  time: number;
  /** Timestamp of benchmark run */
  timestamp?: string;
}

/**
 * Collection of benchmark results
 */
export interface BenchmarkData {
  /** Array of benchmark results */
  results: BenchmarkResult[];
  /** When the benchmarks were run */
  runAt?: string;
}

// ============================================================================
// Application State Types
// ============================================================================

/**
 * Complete application state interface
 * Used by Zustand store and json-render integration
 */
export interface AppState {
  /** Performance metrics */
  metrics: Metrics;
  /** Cost tracking data */
  costs: Costs;
  /** Current model information */
  model: ModelInfo;
  /** Documentation entries */
  docs: DocEntry[];
  /** Benchmark data */
  benchmarks?: BenchmarkData;
}

/**
 * Action types for state updates
 */
export interface AppActions {
  /** Update metrics data */
  setMetrics: (metrics: Partial<Metrics>) => void;
  /** Update costs data */
  setCosts: (costs: Partial<Costs>) => void;
  /** Update model information */
  setModel: (model: Partial<ModelInfo>) => void;
  /** Update documentation entries */
  setDocs: (docs: DocEntry[]) => void;
  /** Update benchmark data */
  setBenchmarks: (benchmarks: BenchmarkData) => void;
  /** Reset all state to defaults */
  reset: () => void;
}

// ============================================================================
// JSON-Render Schema Types
// ============================================================================

/**
 * Base schema definition for json-render catalog
 */
export interface SchemaDefinition<T> {
  /** Zod schema for validation */
  schema: unknown;
  /** Component to render this schema */
  component: string;
  /** Default values for the schema */
  defaults?: Partial<T>;
}

/**
 * Catalog entry for json-render
 */
export interface CatalogEntry {
  /** Schema definition */
  schema: unknown;
  /** Component name to render */
  component: string;
  /** Optional description */
  description?: string;
}

/**
 * Component registry entry
 */
export interface RegistryEntry {
  /** React component reference */
  component: React.ComponentType<unknown>;
  /** Display name for debugging */
  displayName?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Status indicator for panels
 */
export type PanelStatus = 'loading' | 'ready' | 'error' | 'empty';

/**
 * Theme mode options
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Common panel props for dashboard components
 */
export interface PanelProps {
  /** Panel status indicator */
  status?: PanelStatus;
  /** Loading state */
  isLoading?: boolean;
  /** Error message if any */
  error?: string;
  /** Additional CSS class names */
  className?: string;
}
