import { MetricsPanel } from './components/dashboard/MetricsPanel';
import { CostPanel } from './components/dashboard/CostPanel';

// Sample metrics data for demonstration
const sampleMetrics = {
  genTps: 45.2,
  promptTps: 1250.5,
  totalTokens: 1024,
  promptTokens: 512,
  completionTokens: 512,
  time: 11.35,
  averageLatency: 245,
  requestsCount: 42,
};

// Sample cost data for demonstration
const sampleCosts = {
  inputCost: 0.015,
  outputCost: 0.030,
  totalCost: 0.045,
  costPerRequest: 0.00107,
  costPer1kTokens: 0.044,
  currency: 'USD' as const,
};

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-4">
        <h1 className="text-2xl font-semibold tracking-tight">LLM Chat Dashboard</h1>
        <p className="text-muted-foreground text-sm">Monitor and manage your LLM chat interactions</p>
      </header>
      <main className="p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Metrics Panel */}
          <MetricsPanel {...sampleMetrics} />
          {/* Cost Panel */}
          <CostPanel {...sampleCosts} />
          {/* Model Info Placeholder */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-medium">Model Info</h2>
            <p className="text-muted-foreground text-sm">Model details will appear here</p>
          </div>
          {/* Docs Placeholder */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-medium">Documentation</h2>
            <p className="text-muted-foreground text-sm">Docs will appear here</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
