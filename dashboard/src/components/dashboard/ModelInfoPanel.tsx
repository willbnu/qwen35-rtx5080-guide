/**
 * ModelInfoPanel Component
 *
 * Displays information about the current LLM model including name,
 * provider, context window, port, and deployment details.
 *
 * @module components/dashboard/ModelInfoPanel
 */

import type { ModelInfoPanelProps } from '../../catalog';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Formats the context window size for display
 * @param tokens - The context window size in tokens
 * @returns Human-readable string (e.g., "32K", "128K", "1M")
 */
const formatContextWindow = (tokens: number): string => {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(tokens % 1000 === 0 ? 0 : 1)}K`;
  }
  return tokens.toString();
};

/**
 * Formats the port number for display with localhost prefix
 * @param port - The port number
 * @returns Formatted string with localhost prefix
 */
const formatPort = (port: number): string => {
  return `localhost:${port}`;
};

/**
 * Gets the display information for a speed classification
 * @param speed - The speed classification
 * @returns Object with label and color class
 */
const getSpeedDisplay = (
  speed: 'fast' | 'medium' | 'slow'
): { label: string; colorClass: string } => {
  const speedMap = {
    fast: { label: 'Fast', colorClass: 'text-green-600 dark:text-green-400' },
    medium: { label: 'Medium', colorClass: 'text-yellow-600 dark:text-yellow-400' },
    slow: { label: 'Slow', colorClass: 'text-red-600 dark:text-red-400' },
  };
  return speedMap[speed];
};

// ============================================================================
// Component Types
// ============================================================================

interface ModelInfoPanelComponentProps extends ModelInfoPanelProps {
  /** Optional className for additional styling */
  className?: string;
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * ModelInfoPanel Component
 *
 * Renders a card displaying the current LLM model configuration and capabilities.
 * The model name and port are prominently displayed, with additional details
 * shown in a grid layout.
 *
 * @example
 * ```tsx
 * <ModelInfoPanel
 *   name="Qwen2.5-7B-Instruct"
 *   provider="Alibaba"
 *   port={8002}
 *   contextWindow={32768}
 *   maxOutput={4096}
 *   speed="fast"
 *   useCase="General purpose chat and code assistance"
 *   version="v2.5"
 * />
 * ```
 */
export function ModelInfoPanel({
  name,
  provider,
  port,
  contextWindow,
  maxOutput,
  speed,
  useCase,
  version,
  className = '',
}: ModelInfoPanelComponentProps) {
  const speedDisplay = getSpeedDisplay(speed);

  return (
    <div className={`rounded-lg border border-border bg-card p-6 shadow-sm ${className}`}>
      {/* Header */}
      <h3 className="mb-4 text-lg font-semibold text-card-foreground">Model Information</h3>

      {/* Primary Info - Model Name and Port */}
      <div className="mb-4 rounded-md bg-muted/50 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Current Model
        </div>
        <div className="mt-1 text-xl font-bold text-foreground">{name}</div>
        {version && (
          <div className="mt-1 text-xs text-muted-foreground">{version}</div>
        )}
        <div className="mt-2 font-mono text-sm font-medium text-primary">
          {formatPort(port)}
        </div>
      </div>

      {/* Provider and Speed Row */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="rounded-md bg-muted/30 p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Provider
          </div>
          <div className="mt-1 font-medium text-foreground">{provider}</div>
        </div>
        <div className="rounded-md bg-muted/30 p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Speed
          </div>
          <div className={`mt-1 font-medium ${speedDisplay.colorClass}`}>
            {speedDisplay.label}
          </div>
        </div>
      </div>

      {/* Context and Output Limits */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="rounded-md bg-muted/30 p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Context Window
          </div>
          <div className="mt-1 font-mono text-lg font-bold text-foreground">
            {formatContextWindow(contextWindow)}
          </div>
          <div className="text-xs text-muted-foreground">tokens</div>
        </div>
        <div className="rounded-md bg-muted/30 p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Max Output
          </div>
          <div className="mt-1 font-mono text-lg font-bold text-foreground">
            {formatContextWindow(maxOutput)}
          </div>
          <div className="text-xs text-muted-foreground">tokens</div>
        </div>
      </div>

      {/* Use Case */}
      <div className="rounded-md bg-muted/30 p-3">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Use Case
        </div>
        <div className="mt-1 text-sm text-foreground">{useCase}</div>
      </div>
    </div>
  );
}

export default ModelInfoPanel;
