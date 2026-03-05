/**
 * MetricsPanel Component
 *
 * Displays LLM performance metrics including token generation speed (gen_tps),
 * prompt processing speed (prompt_tps), token counts, and latency.
 *
 * @module components/dashboard/MetricsPanel
 */

import type { MetricsPanelProps } from '../../catalog';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Formats a TPS (tokens per second) value for display
 * @param value - The TPS value to format
 * @returns Formatted string with 2 decimal places or '-' if undefined
 */
const formatTps = (value: number | undefined): string => {
  if (value === undefined) return '-';
  return value.toFixed(2);
};

/**
 * Formats a token count with locale-aware thousands separators
 * @param value - The token count to format
 * @returns Formatted string with separators or '-' if undefined
 */
const formatTokens = (value: number | undefined): string => {
  if (value === undefined) return '-';
  return value.toLocaleString();
};

/**
 * Formats time in seconds
 * @param value - The time in seconds
 * @returns Formatted string with 2 decimal places and 's' suffix
 */
const formatTime = (value: number | undefined): string => {
  if (value === undefined) return '-';
  return `${value.toFixed(2)}s`;
};

/**
 * Formats latency in milliseconds
 * @param value - The latency in milliseconds
 * @returns Formatted string with 'ms' suffix
 */
const formatLatency = (value: number | null | undefined): string => {
  if (value === undefined || value === null) return '-';
  return `${value}ms`;
};

// ============================================================================
// Component Types
// ============================================================================

interface MetricsPanelComponentProps extends MetricsPanelProps {
  /** Optional className for additional styling */
  className?: string;
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * MetricsPanel Component
 *
 * Renders a card displaying LLM performance metrics. Primary metrics
 * (gen_tps and prompt_tps) are prominently displayed, with secondary
 * metrics shown in a grid layout.
 *
 * @example
 * ```tsx
 * <MetricsPanel
 *   genTps={45.2}
 *   promptTps={1250.5}
 *   totalTokens={1024}
 *   promptTokens={512}
 *   completionTokens={512}
 *   time={11.35}
 *   averageLatency={245}
 *   requestsCount={42}
 * />
 * ```
 */
export function MetricsPanel({
  genTps,
  promptTps,
  totalTokens,
  promptTokens,
  completionTokens,
  time,
  averageLatency,
  requestsCount,
  className = '',
}: MetricsPanelComponentProps) {
  return (
    <div className={`rounded-lg border border-border bg-card p-6 shadow-sm ${className}`}>
      {/* Header */}
      <h3 className="mb-4 text-lg font-semibold text-card-foreground">Performance Metrics</h3>

      {/* Primary Metrics - TPS Values */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="rounded-md bg-muted/50 p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Gen TPS
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground">
            {formatTps(genTps)}
          </div>
          <div className="text-xs text-muted-foreground">Generation speed</div>
        </div>
        <div className="rounded-md bg-muted/50 p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Prompt TPS
          </div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground">
            {formatTps(promptTps)}
          </div>
          <div className="text-xs text-muted-foreground">Processing speed</div>
        </div>
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Tokens:</span>
          <span className="font-mono font-medium text-foreground">
            {formatTokens(totalTokens)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Prompt Tokens:</span>
          <span className="font-mono font-medium text-foreground">
            {formatTokens(promptTokens)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Completion Tokens:</span>
          <span className="font-mono font-medium text-foreground">
            {formatTokens(completionTokens)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Time:</span>
          <span className="font-mono font-medium text-foreground">{formatTime(time)}</span>
        </div>
        {averageLatency !== undefined && averageLatency !== null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Latency:</span>
            <span className="font-mono font-medium text-foreground">
              {formatLatency(averageLatency)}
            </span>
          </div>
        )}
        {requestsCount !== undefined && requestsCount !== null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Requests:</span>
            <span className="font-mono font-medium text-foreground">
              {formatTokens(requestsCount)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricsPanel;
