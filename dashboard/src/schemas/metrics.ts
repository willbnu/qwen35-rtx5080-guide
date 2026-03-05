/**
 * Zod Schema Definitions for Metrics Panel
 *
 * This module defines Zod schemas for the metrics panel component,
 * including validation rules for token generation speed, prompt processing,
 * and token counts.
 *
 * @module schemas/metrics
 */

import { z } from 'zod';

// ============================================================================
// Core Metrics Schemas
// ============================================================================

/**
 * Schema for generation tokens per second (gen_tps)
 * Represents the speed at which the model generates tokens during completion.
 */
export const genTpsSchema = z
  .number()
  .min(0, 'Generation TPS must be non-negative')
  .finite()
  .describe('Generation tokens per second - how fast the model generates output tokens');

/**
 * Schema for prompt tokens per second (prompt_tps)
 * Represents the speed at which the model processes prompt tokens.
 */
export const promptTpsSchema = z
  .number()
  .min(0, 'Prompt TPS must be non-negative')
  .finite()
  .describe('Prompt processing tokens per second - how fast the model processes input');

/**
 * Schema for total tokens processed
 * The total number of tokens (input + output) in a request or session.
 */
export const tokensSchema = z
  .number()
  .int('Total tokens must be an integer')
  .min(0, 'Total tokens must be non-negative')
  .describe('Total tokens processed including both prompt and completion tokens');

/**
 * Schema for processing time in seconds
 * The total time taken for request processing.
 */
export const timeSchema = z
  .number()
  .min(0, 'Time must be non-negative')
  .describe('Total processing time in seconds');

/**
 * Schema for prompt/input token count
 */
export const promptTokensSchema = z
  .number()
  .int('Prompt tokens must be an integer')
  .min(0, 'Prompt tokens must be non-negative')
  .describe('Number of tokens in the prompt/input');

/**
 * Schema for completion/output token count
 */
export const completionTokensSchema = z
  .number()
  .int('Completion tokens must be an integer')
  .min(0, 'Completion tokens must be non-negative')
  .describe('Number of tokens in the completion/output');

/**
 * Schema for average latency in milliseconds
 */
export const averageLatencySchema = z
  .number()
  .min(0, 'Latency must be non-negative')
  .nullable()
  .describe('Average response latency in milliseconds');

/**
 * Schema for total API requests count
 */
export const requestsCountSchema = z
  .number()
  .int('Request count must be an integer')
  .min(0, 'Request count must be non-negative')
  .nullable()
  .describe('Total number of API requests made');

// ============================================================================
// Composite Metrics Schemas
// ============================================================================

/**
 * Schema for basic benchmark metrics
 * Used for individual benchmark result entries with gen_tps, prompt_tps, tokens, time
 */
export const benchmarkMetricsSchema = z.object({
  /** Generation tokens per second */
  gen_tps: genTpsSchema,
  /** Prompt processing tokens per second */
  prompt_tps: promptTpsSchema,
  /** Total tokens processed */
  tokens: tokensSchema,
  /** Total processing time in seconds */
  time: timeSchema,
});

/**
 * Schema for extended benchmark metrics with timestamps
 */
export const benchmarkMetricsWithTimestampSchema = benchmarkMetricsSchema.extend({
  /** ISO timestamp of the benchmark run */
  timestamp: z.string().datetime().nullable().optional().describe('Benchmark run timestamp'),
});

/**
 * Schema for complete metrics panel data
 * Includes all metrics needed for the dashboard panel display
 */
export const metricsPanelSchema = z.object({
  // Core performance metrics (snake_case for API compatibility)
  /** Generation tokens per second */
  gen_tps: genTpsSchema,
  /** Prompt processing tokens per second */
  prompt_tps: promptTpsSchema,
  /** Total tokens processed */
  tokens: tokensSchema,
  /** Total processing time in seconds */
  time: timeSchema,

  // Detailed token counts
  /** Tokens in prompts/input */
  prompt_tokens: promptTokensSchema,
  /** Tokens in completions/output */
  completion_tokens: completionTokensSchema,

  // Optional metrics
  /** Average response latency in ms */
  average_latency: averageLatencySchema.optional(),
  /** Total API requests count */
  requests_count: requestsCountSchema.optional(),
});

/**
 * Schema for metrics panel props with camelCase naming
 * Used by React components with idiomatic JavaScript naming
 */
export const metricsPanelPropsSchema = z.object({
  // Core performance metrics
  /** Generation tokens per second */
  genTps: genTpsSchema,
  /** Prompt processing tokens per second */
  promptTps: promptTpsSchema,
  /** Total tokens processed */
  totalTokens: tokensSchema,
  /** Total processing time in seconds */
  time: timeSchema,

  // Detailed token counts
  /** Tokens in prompts/input */
  promptTokens: promptTokensSchema,
  /** Tokens in completions/output */
  completionTokens: completionTokensSchema,

  // Optional metrics
  /** Average response latency in ms */
  averageLatency: averageLatencySchema.optional(),
  /** Total API requests count */
  requestsCount: requestsCountSchema.optional(),
});

/**
 * Schema for metrics history entry (for charts/graphs)
 */
export const metricsHistoryEntrySchema = z.object({
  /** Timestamp of the metrics snapshot */
  timestamp: z.string().datetime().describe('When this metrics snapshot was taken'),
  /** Metrics data at this point in time */
  metrics: metricsPanelPropsSchema,
});

/**
 * Schema for array of metrics history entries
 */
export const metricsHistorySchema = z.array(metricsHistoryEntrySchema);

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates that a TPS value is reasonable (0-10000 range)
 * Used for additional runtime validation beyond schema
 */
export const isValidTpsRange = (value: number): boolean =>
  value >= 0 && value <= 10000 && Number.isFinite(value);

/**
 * Validates that token counts are reasonable (0-1M range)
 * Used for additional runtime validation beyond schema
 */
export const isValidTokenRange = (value: number): boolean =>
  Number.isInteger(value) && value >= 0 && value <= 1_000_000;

/**
 * Validates that time is reasonable (0-1 hour range)
 * Used for additional runtime validation beyond schema
 */
export const isValidTimeRange = (value: number): boolean =>
  value >= 0 && value <= 3600 && Number.isFinite(value);

/**
 * Custom refinement for validating complete metrics data
 */
export const metricsRefinement = z
  .object({
    genTps: genTpsSchema,
    promptTps: promptTpsSchema,
    totalTokens: tokensSchema,
    time: timeSchema,
  })
  .refine(
    (data) => {
      // Time should be reasonable relative to tokens and TPS
      if (data.time > 0 && data.genTps > 0) {
        const estimatedTokens = data.genTps * data.time;
        // Allow 50% variance in estimation
        return Math.abs(estimatedTokens - data.totalTokens) / data.totalTokens < 0.5;
      }
      return true;
    },
    {
      message: 'Metrics data appears inconsistent: time/TPS ratio does not match token count',
    }
  );

// ============================================================================
// Type Exports
// ============================================================================

/**
 * Type for basic benchmark metrics
 */
export type BenchmarkMetrics = z.infer<typeof benchmarkMetricsSchema>;

/**
 * Type for benchmark metrics with timestamp
 */
export type BenchmarkMetricsWithTimestamp = z.infer<typeof benchmarkMetricsWithTimestampSchema>;

/**
 * Type for complete metrics panel data (snake_case)
 */
export type MetricsPanelData = z.infer<typeof metricsPanelSchema>;

/**
 * Type for metrics panel props (camelCase)
 */
export type MetricsPanelProps = z.infer<typeof metricsPanelPropsSchema>;

/**
 * Type for metrics history entry
 */
export type MetricsHistoryEntry = z.infer<typeof metricsHistoryEntrySchema>;

/**
 * Type for metrics history array
 */
export type MetricsHistory = z.infer<typeof metricsHistorySchema>;

// Default export for convenience
export default {
  // Core schemas
  genTpsSchema,
  promptTpsSchema,
  tokensSchema,
  timeSchema,
  promptTokensSchema,
  completionTokensSchema,
  averageLatencySchema,
  requestsCountSchema,

  // Composite schemas
  benchmarkMetricsSchema,
  benchmarkMetricsWithTimestampSchema,
  metricsPanelSchema,
  metricsPanelPropsSchema,
  metricsHistoryEntrySchema,
  metricsHistorySchema,

  // Validation helpers
  isValidTpsRange,
  isValidTokenRange,
  isValidTimeRange,
  metricsRefinement,
};
