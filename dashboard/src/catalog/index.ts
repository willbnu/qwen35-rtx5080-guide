/**
 * JSON-Render Catalog for LLM Chat Dashboard
 *
 * This catalog defines the Zod schemas for the dashboard components using the
 * @json-render ecosystem. Each component has a Zod schema for type-safe validation.
 */

import { z } from 'zod';

// ============================================================================
// Zod Schemas for Dashboard Components
// ============================================================================

/**
 * Schema for Metrics Panel component
 * Displays LLM performance metrics including token generation speed,
 * prompt processing speed, and token counts.
 */
const metricsPanelPropsSchema = z.object({
  /** Generation tokens per second */
  genTps: z.number().min(0).describe('Generation tokens per second'),
  /** Prompt processing tokens per second */
  promptTps: z.number().min(0).describe('Prompt processing tokens per second'),
  /** Total tokens processed */
  totalTokens: z.number().int().min(0).describe('Total tokens processed'),
  /** Prompt/input tokens */
  promptTokens: z.number().int().min(0).describe('Prompt/input tokens'),
  /** Completion/output tokens */
  completionTokens: z.number().int().min(0).describe('Completion/output tokens'),
  /** Total processing time in seconds */
  time: z.number().min(0).describe('Total processing time in seconds'),
  /** Average latency in milliseconds (optional) */
  averageLatency: z.number().min(0).nullable().describe('Average response latency in ms'),
  /** Total API requests count (optional) */
  requestsCount: z.number().int().min(0).nullable().describe('Total API requests made'),
});

/**
 * Schema for Cost Panel component
 * Displays cost/benefit analysis for LLM usage including input costs,
 * output costs, and efficiency metrics.
 */
const costPanelPropsSchema = z.object({
  /** Cost for input/prompt tokens in USD */
  inputCost: z.number().min(0).describe('Cost for input tokens in USD'),
  /** Cost for output/completion tokens in USD */
  outputCost: z.number().min(0).describe('Cost for output tokens in USD'),
  /** Total combined cost in USD */
  totalCost: z.number().min(0).describe('Total combined cost in USD'),
  /** Cost per request in USD (optional) */
  costPerRequest: z.number().min(0).nullable().describe('Average cost per request in USD'),
  /** Cost per 1K tokens in USD (optional) */
  costPer1kTokens: z.number().min(0).nullable().describe('Cost per 1000 tokens in USD'),
  /** Currency code (optional, defaults to USD) */
  currency: z.string().default('USD').describe('Currency code for cost display'),
});

/**
 * Schema for Model Info Panel component
 * Displays information about the current LLM model including name,
 * provider, context window, and deployment details.
 */
const modelInfoPanelPropsSchema = z.object({
  /** Display name of the model */
  name: z.string().min(1).describe('Display name of the model'),
  /** Provider/organization hosting the model */
  provider: z.string().min(1).describe('Provider/organization name'),
  /** Port number the model is running on */
  port: z.number().int().min(1).max(65535).describe('Server port number'),
  /** Maximum context window size in tokens */
  contextWindow: z.number().int().min(1).describe('Maximum context window in tokens'),
  /** Maximum output tokens per request */
  maxOutput: z.number().int().min(1).describe('Maximum output tokens per request'),
  /** Relative speed indicator (e.g., "fast", "medium", "slow") */
  speed: z.enum(['fast', 'medium', 'slow']).describe('Model speed classification'),
  /** Recommended use case for this model */
  useCase: z.string().min(1).describe('Recommended use case description'),
  /** Model version or variant (optional) */
  version: z.string().nullable().describe('Model version or variant'),
});

/**
 * Schema for individual documentation entry
 */
const docEntrySchema = z.object({
  /** Unique identifier for the document */
  id: z.string().min(1).describe('Unique document identifier'),
  /** Document title */
  title: z.string().min(1).describe('Document title'),
  /** Category for organization */
  category: z.string().min(1).describe('Document category'),
  /** Document content (markdown supported) */
  content: z.string().describe('Document content in markdown format'),
  /** Optional URL to external documentation */
  url: z.string().url().nullable().describe('External documentation URL'),
  /** Last updated timestamp (optional) */
  updatedAt: z.string().datetime().nullable().describe('Last update timestamp'),
});

/**
 * Schema for documentation category
 */
const docCategorySchema = z.object({
  /** Category identifier */
  id: z.string().min(1).describe('Category identifier'),
  /** Category display name */
  name: z.string().min(1).describe('Category display name'),
  /** Category description (optional) */
  description: z.string().nullable().describe('Category description'),
  /** Documents in this category */
  entries: z.array(docEntrySchema).describe('Documents in this category'),
});

/**
 * Schema for Docs Panel component
 * Displays organized documentation with categories and search functionality.
 */
const docsPanelPropsSchema = z.object({
  /** All documentation categories */
  categories: z.array(docCategorySchema).describe('Documentation categories'),
  /** Search query for filtering (optional) */
  searchQuery: z.string().nullable().describe('Search query for filtering'),
  /** Currently selected category ID (optional) */
  selectedCategoryId: z.string().nullable().describe('Selected category ID'),
  /** Currently expanded document ID (optional) */
  expandedDocId: z.string().nullable().describe('Expanded document ID'),
});

/**
 * Schema for Dashboard Layout component
 * Main layout that composes all dashboard panels.
 */
const dashboardLayoutPropsSchema = z.object({
  /** Dashboard title */
  title: z.string().default('LLM Chat Dashboard').describe('Dashboard title'),
  /** Show metrics panel */
  showMetrics: z.boolean().default(true).describe('Whether to show metrics panel'),
  /** Show cost panel */
  showCosts: z.boolean().default(true).describe('Whether to show cost panel'),
  /** Show model info panel */
  showModelInfo: z.boolean().default(true).describe('Whether to show model info panel'),
  /** Show documentation panel */
  showDocs: z.boolean().default(true).describe('Whether to show documentation panel'),
});

/**
 * Schema for Stat Card component
 * Individual statistic display card.
 */
const statCardPropsSchema = z.object({
  /** Stat label */
  label: z.string().min(1).describe('Stat label text'),
  /** Stat value */
  value: z.union([z.string(), z.number()]).describe('Stat value to display'),
  /** Optional unit suffix */
  unit: z.string().nullable().describe('Unit suffix (e.g., "tps", "ms")'),
  /** Optional description */
  description: z.string().nullable().describe('Additional description'),
  /** Trend direction (optional) */
  trend: z.enum(['up', 'down', 'neutral']).nullable().describe('Trend direction'),
  /** Trend value (optional) */
  trendValue: z.string().nullable().describe('Trend value text'),
});

/**
 * Schema for benchmark result entry
 */
const benchmarkResultSchema = z.object({
  /** Port the model is running on */
  port: z.number().int().min(1).max(65535).describe('Server port number'),
  /** Model name/identifier */
  model: z.string().min(1).describe('Model identifier'),
  /** Speed classification */
  speed: z.enum(['fast', 'medium', 'slow']).describe('Speed classification'),
  /** Use case description */
  useCase: z.string().describe('Use case description'),
  /** Generation tokens per second */
  genTps: z.number().min(0).describe('Generation tokens per second'),
  /** Prompt processing tokens per second */
  promptTps: z.number().min(0).describe('Prompt tokens per second'),
  /** Total tokens processed */
  tokens: z.number().int().min(0).describe('Total tokens processed'),
  /** Total time in seconds */
  time: z.number().min(0).describe('Total processing time'),
  /** Timestamp of benchmark run (optional) */
  timestamp: z.string().datetime().nullable().describe('Benchmark timestamp'),
});

/**
 * Schema for Benchmark Panel component
 * Displays benchmark comparison results for multiple models.
 */
const benchmarkPanelPropsSchema = z.object({
  /** Array of benchmark results */
  results: z.array(benchmarkResultSchema).describe('Benchmark results'),
  /** When the benchmarks were run (optional) */
  runAt: z.string().datetime().nullable().describe('Benchmark run timestamp'),
});

// ============================================================================
// Dashboard Component Definitions
// ============================================================================

/**
 * Dashboard Component Definitions
 *
 * Maps component names to their Zod schemas and metadata.
 * These definitions are used by json-render for type-safe rendering.
 *
 * @example
 * ```tsx
 * import { dashboardComponentDefinitions } from './catalog';
 * import { defineRegistry } from '@json-render/react';
 *
 * const registry = defineRegistry({
 *   ...dashboardComponentDefinitions,
 * });
 * ```
 */
export const dashboardComponentDefinitions = {
  // Main dashboard components
  DashboardLayout: {
    props: dashboardLayoutPropsSchema,
    slots: ['header', 'sidebar', 'content', 'footer'],
    description: 'Main dashboard layout component that composes all panels',
    example: {
      title: 'LLM Chat Dashboard',
      showMetrics: true,
      showCosts: true,
      showModelInfo: true,
      showDocs: true,
    },
  },

  MetricsPanel: {
    props: metricsPanelPropsSchema,
    slots: ['header', 'footer'],
    description: 'Panel displaying LLM performance metrics including TPS, token counts, and latency',
    example: {
      genTps: 45.2,
      promptTps: 1250.5,
      totalTokens: 1024,
      promptTokens: 512,
      completionTokens: 512,
      time: 11.35,
      averageLatency: 245,
      requestsCount: 42,
    },
  },

  CostPanel: {
    props: costPanelPropsSchema,
    slots: ['header', 'footer'],
    description: 'Panel displaying cost/benefit analysis for LLM API usage',
    example: {
      inputCost: 0.015,
      outputCost: 0.030,
      totalCost: 0.045,
      costPerRequest: 0.001,
      costPer1kTokens: 0.044,
      currency: 'USD',
    },
  },

  ModelInfoPanel: {
    props: modelInfoPanelPropsSchema,
    slots: ['header', 'actions'],
    description: 'Panel displaying current LLM model configuration and capabilities',
    example: {
      name: 'Qwen2.5-7B-Instruct',
      provider: 'Alibaba',
      port: 8002,
      contextWindow: 32768,
      maxOutput: 4096,
      speed: 'fast',
      useCase: 'General purpose chat and code assistance',
      version: 'v2.5',
    },
  },

  DocsPanel: {
    props: docsPanelPropsSchema,
    slots: ['header', 'search', 'footer'],
    events: ['onCategorySelect', 'onDocExpand', 'onSearch'],
    description: 'Panel displaying organized documentation with categories and search',
    example: {
      categories: [
        {
          id: 'getting-started',
          name: 'Getting Started',
          description: 'Quick start guides and tutorials',
          entries: [
            {
              id: 'installation',
              title: 'Installation',
              category: 'getting-started',
              content: '## Installation\n\nFollow these steps...',
            },
          ],
        },
      ],
    },
  },

  BenchmarkPanel: {
    props: benchmarkPanelPropsSchema,
    slots: ['header', 'footer'],
    description: 'Panel displaying benchmark comparison results for multiple models',
    example: {
      results: [
        {
          port: 8002,
          model: 'Qwen2.5-7B-Instruct',
          speed: 'fast',
          useCase: 'General purpose',
          genTps: 45.2,
          promptTps: 1250.5,
          tokens: 1024,
          time: 11.35,
        },
      ],
    },
  },

  // Reusable UI components
  StatCard: {
    props: statCardPropsSchema,
    description: 'Individual statistic display card for metrics',
    example: {
      label: 'Generation Speed',
      value: 45.2,
      unit: 'tps',
      description: 'Tokens generated per second',
      trend: 'up',
      trendValue: '+5.2%',
    },
  },
} as const;

// ============================================================================
// Dashboard Action Definitions
// ============================================================================

/**
 * Dashboard Action Definitions
 *
 * Maps action names to their parameter schemas and descriptions.
 */
export const dashboardActionDefinitions = {
  refreshMetrics: {
    params: z.object({
      force: z.boolean().nullable().describe('Force refresh even if cached'),
    }),
    description: 'Refresh metrics data from the server',
  },

  updateModel: {
    params: z.object({
      port: z.number().int().min(1).max(65535).describe('New model port'),
      model: z.string().min(1).describe('Model identifier'),
    }),
    description: 'Switch to a different model',
  },

  exportData: {
    params: z.object({
      format: z.enum(['json', 'csv']).describe('Export format'),
      dateRange: z.object({
        start: z.string().datetime(),
        end: z.string().datetime(),
      }).nullable().describe('Date range for export'),
    }),
    description: 'Export dashboard data in specified format',
  },

  searchDocs: {
    params: z.object({
      query: z.string().min(1).describe('Search query'),
      category: z.string().nullable().describe('Filter by category'),
    }),
    description: 'Search documentation entries',
  },
} as const;

// ============================================================================
// Custom Validation Functions
// ============================================================================

/**
 * Validates that a number is a valid port (1-65535)
 */
export const isValidPort = (value: unknown): boolean =>
  typeof value === 'number' && value >= 1 && value <= 65535;

/**
 * Validates that a cost value is non-negative
 */
export const isPositiveCost = (value: unknown): boolean =>
  typeof value === 'number' && value >= 0;

/**
 * Validates that a TPS value is a non-negative finite number
 */
export const isValidTps = (value: unknown): boolean =>
  typeof value === 'number' && value >= 0 && Number.isFinite(value);

// ============================================================================
// Export Types
// ============================================================================

/**
 * Type for dashboard component definitions
 */
export type DashboardComponentDefinitions = typeof dashboardComponentDefinitions;

/**
 * Type for dashboard action definitions
 */
export type DashboardActionDefinitions = typeof dashboardActionDefinitions;

/**
 * Component names available in the dashboard catalog
 */
export type DashboardComponentName = keyof typeof dashboardComponentDefinitions;

/**
 * Action names available in the dashboard catalog
 */
export type DashboardActionName = keyof typeof dashboardActionDefinitions;

// ============================================================================
// Export Inferred Types from Schemas
// ============================================================================

export type MetricsPanelProps = z.infer<typeof metricsPanelPropsSchema>;
export type CostPanelProps = z.infer<typeof costPanelPropsSchema>;
export type ModelInfoPanelProps = z.infer<typeof modelInfoPanelPropsSchema>;
export type DocsPanelProps = z.infer<typeof docsPanelPropsSchema>;
export type DashboardLayoutProps = z.infer<typeof dashboardLayoutPropsSchema>;
export type StatCardProps = z.infer<typeof statCardPropsSchema>;
export type BenchmarkPanelProps = z.infer<typeof benchmarkPanelPropsSchema>;
export type BenchmarkResult = z.infer<typeof benchmarkResultSchema>;
export type DocEntry = z.infer<typeof docEntrySchema>;
export type DocCategory = z.infer<typeof docCategorySchema>;

// Default export for convenience
export default dashboardComponentDefinitions;
