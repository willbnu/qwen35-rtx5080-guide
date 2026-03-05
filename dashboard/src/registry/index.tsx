/**
 * Component Registry for LLM Chat Dashboard
 *
 * This registry maps catalog component names to their React implementations.
 * It combines custom dashboard components with shadcn/ui components.
 *
 * The registry is used by JSONUIProvider to render JSON specs.
 */

import type { ComponentType, ReactNode } from 'react';
import { shadcnComponents } from '@json-render/shadcn';
import type {
  MetricsPanelProps,
  CostPanelProps,
  ModelInfoPanelProps,
  DocsPanelProps,
  DashboardLayoutProps,
  StatCardProps,
  BenchmarkPanelProps,
} from '../catalog';

// ============================================================================
// Types for Component Props
// ============================================================================

/**
 * Base props provided by the json-render renderer to all components
 */
interface BaseRenderProps {
  children?: ReactNode;
  /** Emit a named event */
  emit: (event: string) => void;
  /** Get an event handle with metadata */
  on: (event: string) => { emit: () => void; shouldPreventDefault: boolean; bound: boolean };
  /** Two-way binding paths */
  bindings?: Record<string, string>;
  loading?: boolean;
}

/**
 * Component render props with typed props
 */
type ComponentRenderProps<T> = T & BaseRenderProps;

// ============================================================================
// Stub Components (Phase 4 will provide full implementations)
// ============================================================================

/**
 * Stub component for DashboardLayout
 * Renders a grid layout for dashboard panels
 *
 * @phase 4 - Full implementation in src/components/dashboard/DashboardLayout.tsx
 */
const DashboardLayout: ComponentType<ComponentRenderProps<DashboardLayoutProps>> = ({
  title = 'LLM Chat Dashboard',
  showMetrics = true,
  showCosts = true,
  showModelInfo = true,
  showDocs = true,
  children,
}) => {
  return (
    <div className="min-h-screen bg-background p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      </header>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {showMetrics && (
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="text-sm text-muted-foreground">Metrics Panel</div>
            <div className="text-xs text-muted-foreground/60">(Component pending)</div>
          </div>
        )}
        {showCosts && (
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="text-sm text-muted-foreground">Cost Panel</div>
            <div className="text-xs text-muted-foreground/60">(Component pending)</div>
          </div>
        )}
        {showModelInfo && (
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="text-sm text-muted-foreground">Model Info Panel</div>
            <div className="text-xs text-muted-foreground/60">(Component pending)</div>
          </div>
        )}
        {showDocs && (
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="text-sm text-muted-foreground">Docs Panel</div>
            <div className="text-xs text-muted-foreground/60">(Component pending)</div>
          </div>
        )}
      </div>
      {children}
    </div>
  );
};

/**
 * Stub component for MetricsPanel
 * Displays LLM performance metrics including TPS and token counts
 *
 * @phase 4 - Full implementation in src/components/dashboard/MetricsPanel.tsx
 */
const MetricsPanel: ComponentType<ComponentRenderProps<MetricsPanelProps>> = ({
  genTps,
  promptTps,
  totalTokens,
  promptTokens,
  completionTokens,
  time,
  averageLatency,
  requestsCount,
}) => {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold text-card-foreground">Performance Metrics</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-muted-foreground">Gen TPS:</span>{' '}
          <span className="font-mono font-medium">{genTps?.toFixed(2) ?? '-'}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Prompt TPS:</span>{' '}
          <span className="font-mono font-medium">{promptTps?.toFixed(2) ?? '-'}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Total Tokens:</span>{' '}
          <span className="font-mono font-medium">{totalTokens?.toLocaleString() ?? '-'}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Prompt Tokens:</span>{' '}
          <span className="font-mono font-medium">{promptTokens?.toLocaleString() ?? '-'}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Completion Tokens:</span>{' '}
          <span className="font-mono font-medium">{completionTokens?.toLocaleString() ?? '-'}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Time:</span>{' '}
          <span className="font-mono font-medium">{time?.toFixed(2) ?? '-'}s</span>
        </div>
        {averageLatency !== undefined && averageLatency !== null && (
          <div>
            <span className="text-muted-foreground">Latency:</span>{' '}
            <span className="font-mono font-medium">{averageLatency}ms</span>
          </div>
        )}
        {requestsCount !== undefined && requestsCount !== null && (
          <div>
            <span className="text-muted-foreground">Requests:</span>{' '}
            <span className="font-mono font-medium">{requestsCount}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Stub component for CostPanel
 * Displays cost/benefit analysis for LLM usage
 *
 * @phase 4 - Full implementation in src/components/dashboard/CostPanel.tsx
 */
const CostPanel: ComponentType<ComponentRenderProps<CostPanelProps>> = ({
  inputCost,
  outputCost,
  totalCost,
  costPerRequest,
  costPer1kTokens,
  currency = 'USD',
}) => {
  const formatCost = (cost: number | undefined): string => {
    if (cost === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 4,
    }).format(cost);
  };

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold text-card-foreground">Cost Analysis</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-muted-foreground">Input Cost:</span>{' '}
          <span className="font-mono font-medium">{formatCost(inputCost)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Output Cost:</span>{' '}
          <span className="font-mono font-medium">{formatCost(outputCost)}</span>
        </div>
        <div className="col-span-2 border-t pt-2">
          <span className="text-muted-foreground">Total Cost:</span>{' '}
          <span className="font-mono text-lg font-bold text-primary">{formatCost(totalCost)}</span>
        </div>
        {costPerRequest !== undefined && costPerRequest !== null && (
          <div>
            <span className="text-muted-foreground">Per Request:</span>{' '}
            <span className="font-mono font-medium">{formatCost(costPerRequest)}</span>
          </div>
        )}
        {costPer1kTokens !== undefined && costPer1kTokens !== null && (
          <div>
            <span className="text-muted-foreground">Per 1K Tokens:</span>{' '}
            <span className="font-mono font-medium">{formatCost(costPer1kTokens)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Stub component for ModelInfoPanel
 * Displays current LLM model configuration
 *
 * @phase 4 - Full implementation in src/components/dashboard/ModelInfoPanel.tsx
 */
const ModelInfoPanel: ComponentType<ComponentRenderProps<ModelInfoPanelProps>> = ({
  name,
  provider,
  port,
  contextWindow,
  maxOutput,
  speed,
  useCase,
  version,
}) => {
  const speedColors: Record<string, string> = {
    fast: 'text-green-600',
    medium: 'text-yellow-600',
    slow: 'text-orange-600',
  };

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold text-card-foreground">Model Information</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Name:</span>
          <span className="font-medium">{name ?? 'Not configured'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Provider:</span>
          <span className="font-medium">{provider ?? 'Not configured'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Port:</span>
          <span className="font-mono font-medium">{port ?? '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Context Window:</span>
          <span className="font-mono font-medium">{contextWindow?.toLocaleString() ?? '-'} tokens</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Max Output:</span>
          <span className="font-mono font-medium">{maxOutput?.toLocaleString() ?? '-'} tokens</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Speed:</span>
          <span className={`font-medium capitalize ${speed ? speedColors[speed] ?? '' : ''}`}>
            {speed ?? '-'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Use Case:</span>
          <span className="font-medium text-right max-w-[60%]">{useCase ?? '-'}</span>
        </div>
        {version && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version:</span>
            <span className="font-mono font-medium">{version}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Stub component for DocsPanel
 * Displays organized documentation with categories
 *
 * @phase 4 - Full implementation in src/components/dashboard/DocsPanel.tsx
 */
const DocsPanel: ComponentType<ComponentRenderProps<DocsPanelProps>> = ({
  categories,
  searchQuery,
  selectedCategoryId,
  expandedDocId,
}) => {
  const totalDocs = categories?.reduce((sum, cat) => sum + cat.entries.length, 0) ?? 0;

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold text-card-foreground">Documentation</h3>
      {searchQuery && (
        <div className="mb-2 text-sm text-muted-foreground">
          Search: "{searchQuery}"
        </div>
      )}
      <div className="space-y-3">
        {categories?.map((category) => (
          <div key={category.id} className="border-b pb-2 last:border-b-0">
            <div
              className={`cursor-pointer font-medium ${
                selectedCategoryId === category.id ? 'text-primary' : 'text-foreground'
              }`}
            >
              {category.name}
              <span className="ml-2 text-xs text-muted-foreground">
                ({category.entries.length} docs)
              </span>
            </div>
            {category.description && (
              <p className="mt-1 text-xs text-muted-foreground">{category.description}</p>
            )}
            {selectedCategoryId === category.id && (
              <ul className="mt-2 space-y-1 pl-4">
                {category.entries.map((entry) => (
                  <li
                    key={entry.id}
                    className={`cursor-pointer text-sm ${
                      expandedDocId === entry.id ? 'font-medium text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {entry.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-muted-foreground">
        {totalDocs} documents in {categories?.length ?? 0} categories
      </div>
    </div>
  );
};

/**
 * Stub component for StatCard
 * Individual statistic display card
 *
 * @phase 4 - May be extracted to separate file if needed
 */
const StatCard: ComponentType<ComponentRenderProps<StatCardProps>> = ({
  label,
  value,
  unit,
  description,
  trend,
  trendValue,
}) => {
  const trendColors: Record<string, string> = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-muted-foreground',
  };

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {description && (
        <div className="mt-1 text-xs text-muted-foreground">{description}</div>
      )}
      {trend && trendValue && (
        <div className={`mt-1 text-xs ${trendColors[trend] ?? ''}`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
        </div>
      )}
    </div>
  );
};

/**
 * Stub component for BenchmarkPanel
 * Displays benchmark comparison results
 *
 * @phase 4 - Full implementation if needed
 */
const BenchmarkPanel: ComponentType<ComponentRenderProps<BenchmarkPanelProps>> = ({
  results,
  runAt,
}) => {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold text-card-foreground">Benchmark Results</h3>
      {runAt && (
        <div className="mb-2 text-xs text-muted-foreground">
          Run at: {new Date(runAt).toLocaleString()}
        </div>
      )}
      <div className="space-y-2">
        {results?.map((result, index) => (
          <div key={`${result.port}-${index}`} className="border-b pb-2 last:border-b-0">
            <div className="font-medium">{result.model}</div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>Port: {result.port}</div>
              <div>Speed: {result.speed}</div>
              <div>Gen TPS: {result.genTps?.toFixed(2)}</div>
              <div>Prompt TPS: {result.promptTps?.toFixed(2)}</div>
              <div>Tokens: {result.tokens?.toLocaleString()}</div>
              <div>Time: {result.time?.toFixed(2)}s</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Registry Assembly
// ============================================================================

/**
 * Component registry for the LLM Chat Dashboard
 *
 * Maps component names from the catalog to their React implementations.
 * Includes both custom dashboard components and shadcn/ui components.
 *
 * @example
 * ```tsx
 * import { JSONUIProvider } from '@json-render/react';
 * import { registry } from './registry';
 *
 * function App() {
 *   return (
 *     <JSONUIProvider registry={registry}>
 *       <Renderer spec={spec} registry={registry} />
 *     </JSONUIProvider>
 *   );
 * }
 * ```
 */
export const registry = {
  // Custom dashboard components
  DashboardLayout,
  MetricsPanel,
  CostPanel,
  ModelInfoPanel,
  DocsPanel,
  StatCard,
  BenchmarkPanel,

  // shadcn/ui components (35 available)
  ...shadcnComponents,
} as const;

/**
 * Type of the component registry
 */
export type DashboardRegistry = typeof registry;

/**
 * Names of all available components in the registry
 */
export type ComponentName = keyof DashboardRegistry;

// Default export for convenience
export default registry;
