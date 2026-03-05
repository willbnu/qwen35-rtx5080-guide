import { MetricsPanel } from './components/dashboard/MetricsPanel';

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
          {/* Cost Panel Placeholder */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-medium">Cost/Benefit</h2>
            <p className="text-muted-foreground text-sm">Cost analysis will appear here</p>
          </div>
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
