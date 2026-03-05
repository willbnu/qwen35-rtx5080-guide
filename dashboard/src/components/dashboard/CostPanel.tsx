/**
 * CostPanel Component
 *
 * Displays cost/benefit analysis for LLM usage including input costs,
 * output costs, total costs, and efficiency metrics.
 *
 * @module components/dashboard/CostPanel
 */

import type { CostPanelProps } from '../../catalog';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Formats a cost value for display in USD
 * @param value - The cost value to format
 * @param currency - The currency code (defaults to USD)
 * @returns Formatted string with currency symbol or '-' if undefined/null
 */
const formatCost = (value: number | null | undefined, currency: string = 'USD'): string => {
  if (value === undefined || value === null) return '-';

  if (value === 0) {
    return currency === 'USD' ? '$0.00' : `0.00 ${currency}`;
  }

  if (currency === 'USD') {
    if (value < 0.01) return '< $0.01';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value);
  }

  // For non-USD currencies
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
};

/**
 * Formats a cost per 1K tokens value for display
 * @param value - The cost per 1K tokens value
 * @param currency - The currency code
 * @returns Formatted string with currency and unit
 */
const formatCostPer1k = (value: number | null | undefined, currency: string = 'USD'): string => {
  if (value === undefined || value === null) return '-';
  return `${formatCost(value, currency)}/1K`;
};

/**
 * Calculates the percentage of a part relative to total
 * @param part - The part value
 * @param total - The total value
 * @returns Percentage string or '-' if invalid
 */
const calculatePercentage = (part: number, total: number): string => {
  if (total === 0) return '-';
  const percentage = (part / total) * 100;
  return `${percentage.toFixed(1)}%`;
};

// ============================================================================
// Component Types
// ============================================================================

interface CostPanelComponentProps extends CostPanelProps {
  /** Optional className for additional styling */
  className?: string;
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * CostPanel Component
 *
 * Renders a card displaying cost/benefit analysis for LLM API usage.
 * The total cost is prominently displayed, with input/output breakdown
 * and efficiency metrics shown in a grid layout.
 *
 * @example
 * ```tsx
 * <CostPanel
 *   inputCost={0.015}
 *   outputCost={0.030}
 *   totalCost={0.045}
 *   costPerRequest={0.001}
 *   costPer1kTokens={0.044}
 *   currency="USD"
 * />
 * ```
 */
export function CostPanel({
  inputCost,
  outputCost,
  totalCost,
  costPerRequest,
  costPer1kTokens,
  currency = 'USD',
  className = '',
}: CostPanelComponentProps) {
  return (
    <div className={`rounded-lg border border-border bg-card p-6 shadow-sm ${className}`}>
      {/* Header */}
      <h3 className="mb-4 text-lg font-semibold text-card-foreground">Cost Analysis</h3>

      {/* Primary Metric - Total Cost */}
      <div className="mb-4 rounded-md bg-muted/50 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Total Cost
        </div>
        <div className="mt-1 font-mono text-3xl font-bold text-foreground">
          {formatCost(totalCost, currency)}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {currency} spent on API usage
        </div>
      </div>

      {/* Cost Breakdown - Input vs Output */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="rounded-md bg-muted/30 p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Input Cost
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-foreground">
            {formatCost(inputCost, currency)}
          </div>
          <div className="text-xs text-muted-foreground">
            {totalCost > 0 ? calculatePercentage(inputCost, totalCost) : '-'} of total
          </div>
        </div>
        <div className="rounded-md bg-muted/30 p-3">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Output Cost
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-foreground">
            {formatCost(outputCost, currency)}
          </div>
          <div className="text-xs text-muted-foreground">
            {totalCost > 0 ? calculatePercentage(outputCost, totalCost) : '-'} of total
          </div>
        </div>
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cost/Request:</span>
          <span className="font-mono font-medium text-foreground">
            {formatCost(costPerRequest, currency)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cost/1K Tokens:</span>
          <span className="font-mono font-medium text-foreground">
            {formatCostPer1k(costPer1kTokens, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CostPanel;
