/**
 * Mock Data for LLM Chat Dashboard
 *
 * This file contains mock data structures based on the benchmark JSON format
 * and dashboard component schemas. Used for development and testing.
 */

import type {
  Metrics,
  MetricsPanelData,
  Costs,
  CostPanelData,
  ModelInfo,
  ModelPanelData,
  ModelPortMapping,
  DocEntry,
  DocCategory,
  DocsPanelData,
  BenchmarkResult,
  BenchmarkData,
  AppState,
} from '../types';

// ============================================================================
// Mock Metrics Data
// ============================================================================

/**
 * Mock metrics data representing typical LLM usage statistics
 * Based on benchmark results from Qwen models
 */
export const mockMetrics: Metrics = {
  totalTokens: 15684,
  promptTokens: 8192,
  completionTokens: 7492,
  requestsCount: 42,
  averageLatency: 245,
};

/**
 * Mock performance metrics for token generation speed
 * Based on benchmark results from tests/benchmark.py
 */
export const mockPerformanceMetrics: MetricsPanelData = {
  ...mockMetrics,
  genTps: 45.2,
  promptTps: 1250.5,
  totalTime: 11.35,
};

/**
 * Multiple metrics samples for historical comparison
 */
export const mockMetricsHistory: MetricsPanelData[] = [
  {
    totalTokens: 15684,
    promptTokens: 8192,
    completionTokens: 7492,
    requestsCount: 42,
    averageLatency: 245,
    genTps: 45.2,
    promptTps: 1250.5,
    totalTime: 11.35,
  },
  {
    totalTokens: 12400,
    promptTokens: 6144,
    completionTokens: 6256,
    requestsCount: 35,
    averageLatency: 198,
    genTps: 52.1,
    promptTps: 1180.3,
    totalTime: 8.72,
  },
  {
    totalTokens: 18500,
    promptTokens: 10240,
    completionTokens: 8260,
    requestsCount: 48,
    averageLatency: 312,
    genTps: 38.7,
    promptTps: 1420.8,
    totalTime: 15.23,
  },
];

// ============================================================================
// Mock Cost Data
// ============================================================================

/**
 * Mock cost data for LLM API usage
 * Typical pricing: $0.0007/1K input tokens, $0.0028/1K output tokens
 */
export const mockCosts: Costs = {
  inputCost: 0.00573,
  outputCost: 0.02098,
  totalCost: 0.02671,
};

/**
 * Extended mock cost data with efficiency metrics
 */
export const mockCostPanelData: CostPanelData = {
  ...mockCosts,
  costPerRequest: 0.00064,
  costPer1kTokens: 0.00170,
};

/**
 * Multiple cost samples for comparison
 */
export const mockCostHistory: CostPanelData[] = [
  {
    inputCost: 0.00573,
    outputCost: 0.02098,
    totalCost: 0.02671,
    costPerRequest: 0.00064,
    costPer1kTokens: 0.00170,
  },
  {
    inputCost: 0.00430,
    outputCost: 0.01752,
    totalCost: 0.02182,
    costPerRequest: 0.00062,
    costPer1kTokens: 0.00176,
  },
  {
    inputCost: 0.00717,
    outputCost: 0.02313,
    totalCost: 0.03030,
    costPerRequest: 0.00063,
    costPer1kTokens: 0.00164,
  },
];

// ============================================================================
// Mock Model Data
// ============================================================================

/**
 * Mock model information for the currently active model
 */
export const mockModel: ModelInfo = {
  name: 'Qwen2.5-7B-Instruct',
  provider: 'Alibaba',
  contextWindow: 32768,
  maxOutput: 4096,
};

/**
 * Extended mock model data with deployment details
 */
export const mockModelPanelData: ModelPanelData = {
  ...mockModel,
  port: 8002,
  speed: 'fast',
  useCase: 'General purpose chat and code assistance',
  version: 'v2.5',
};

/**
 * Model port mappings for multiple model instances
 * Based on the server configuration from the qwen-llm project
 */
export const mockModelPortMappings: ModelPortMapping[] = [
  {
    port: 8000,
    model: 'Qwen2.5-0.5B-Instruct',
    speed: 'fast',
    useCase: 'Fast responses, simple tasks',
  },
  {
    port: 8001,
    model: 'Qwen2.5-1.5B-Instruct',
    speed: 'fast',
    useCase: 'Quick chat, short responses',
  },
  {
    port: 8002,
    model: 'Qwen2.5-7B-Instruct',
    speed: 'fast',
    useCase: 'General purpose chat and code assistance',
  },
  {
    port: 8003,
    model: 'Qwen2.5-14B-Instruct',
    speed: 'medium',
    useCase: 'Complex reasoning, detailed analysis',
  },
  {
    port: 8004,
    model: 'Qwen2.5-32B-Instruct',
    speed: 'medium',
    useCase: 'Advanced reasoning, long-form content',
  },
  {
    port: 8005,
    model: 'Qwen2.5-72B-Instruct',
    speed: 'slow',
    useCase: 'Highest quality, research tasks',
  },
];

// ============================================================================
// Mock Documentation Data
// ============================================================================

/**
 * Mock documentation entries
 */
export const mockDocEntries: DocEntry[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    category: 'Overview',
    content: `# Getting Started with Qwen LLM Dashboard

This dashboard provides real-time monitoring and management of your LLM chat interactions.

## Quick Start

1. Start your LLM servers using the provided batch scripts
2. Open this dashboard in your browser
3. Monitor metrics, costs, and model performance in real-time

## Features

- Real-time metrics display (tokens, TPS, latency)
- Cost tracking and efficiency analysis
- Model comparison and benchmarking
- Documentation browser`,
    updatedAt: '2026-03-05T12:00:00Z',
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    category: 'Technical',
    content: `# API Reference

## Endpoints

### POST /v1/chat/completions
Send a chat completion request.

### GET /health
Check server health status.

## Authentication

API key authentication is optional for local development.`,
    updatedAt: '2026-03-05T10:30:00Z',
  },
  {
    id: 'configuration',
    title: 'Configuration Guide',
    category: 'Technical',
    content: `# Configuration Guide

## Model Configuration

Configure model settings in \`config/config.yaml\`:

\`\`\`yaml
models:
  - name: Qwen2.5-7B-Instruct
    port: 8002
    context: 32768
    temp: 0.7
\`\`\``,
    updatedAt: '2026-03-04T15:45:00Z',
  },
  {
    id: 'benchmarking',
    title: 'Running Benchmarks',
    category: 'Testing',
    content: `# Running Benchmarks

## Speed Tests

Run speed benchmarks to measure token generation performance:

\`\`\`bash
python tests/benchmark.py --servers speed
\`\`\`

## Context Scaling

Test performance at different context sizes:

\`\`\`bash
python tests/benchmark.py --quick
\`\`\``,
    updatedAt: '2026-03-05T09:15:00Z',
  },
  {
    id: 'cost-optimization',
    title: 'Cost Optimization Tips',
    category: 'Best Practices',
    content: `# Cost Optimization Tips

1. **Use appropriate model sizes** - Smaller models are faster and cheaper
2. **Optimize prompts** - Shorter prompts reduce token costs
3. **Cache responses** - Avoid redundant API calls
4. **Monitor usage** - Track costs in real-time with this dashboard`,
    updatedAt: '2026-03-03T14:20:00Z',
  },
];

/**
 * Mock documentation categories
 */
export const mockDocCategories: DocCategory[] = [
  {
    id: 'overview',
    name: 'Overview',
    description: 'General information and quick start guides',
    entries: mockDocEntries.filter((e) => e.category === 'Overview'),
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'API reference and configuration guides',
    entries: mockDocEntries.filter((e) => e.category === 'Technical'),
  },
  {
    id: 'testing',
    name: 'Testing',
    description: 'Benchmarking and testing guides',
    entries: mockDocEntries.filter((e) => e.category === 'Testing'),
  },
  {
    id: 'best-practices',
    name: 'Best Practices',
    description: 'Tips and recommendations',
    entries: mockDocEntries.filter((e) => e.category === 'Best Practices'),
  },
];

/**
 * Mock docs panel data with categories
 */
export const mockDocsPanelData: DocsPanelData = {
  categories: mockDocCategories,
  searchQuery: undefined,
  selectedCategoryId: 'overview',
  expandedDocId: undefined,
};

// ============================================================================
// Mock Benchmark Data
// ============================================================================

/**
 * Mock benchmark results based on the benchmark Python structure
 * These represent typical results from tests/benchmark.py
 */
export const mockBenchmarkResults: BenchmarkResult[] = [
  {
    port: 8000,
    model: 'Qwen2.5-0.5B-Instruct',
    speed: 'fast',
    useCase: 'Fast responses, simple tasks',
    genTps: 125.4,
    promptTps: 3500.2,
    tokens: 512,
    time: 4.08,
    timestamp: '2026-03-05T18:10:56Z',
  },
  {
    port: 8001,
    model: 'Qwen2.5-1.5B-Instruct',
    speed: 'fast',
    useCase: 'Quick chat, short responses',
    genTps: 85.7,
    promptTps: 2800.5,
    tokens: 768,
    time: 8.96,
    timestamp: '2026-03-05T18:12:23Z',
  },
  {
    port: 8002,
    model: 'Qwen2.5-7B-Instruct',
    speed: 'fast',
    useCase: 'General purpose chat and code assistance',
    genTps: 45.2,
    promptTps: 1250.5,
    tokens: 1024,
    time: 22.67,
    timestamp: '2026-03-05T18:15:45Z',
  },
  {
    port: 8003,
    model: 'Qwen2.5-14B-Instruct',
    speed: 'medium',
    useCase: 'Complex reasoning, detailed analysis',
    genTps: 28.3,
    promptTps: 680.2,
    tokens: 1536,
    time: 54.29,
    timestamp: '2026-03-05T18:20:12Z',
  },
  {
    port: 8004,
    model: 'Qwen2.5-32B-Instruct',
    speed: 'medium',
    useCase: 'Advanced reasoning, long-form content',
    genTps: 15.8,
    promptTps: 320.5,
    tokens: 2048,
    time: 129.65,
    timestamp: '2026-03-05T18:25:34Z',
  },
  {
    port: 8005,
    model: 'Qwen2.5-72B-Instruct',
    speed: 'slow',
    useCase: 'Highest quality, research tasks',
    genTps: 8.2,
    promptTps: 145.3,
    tokens: 2560,
    time: 312.20,
    timestamp: '2026-03-05T18:35:45Z',
  },
];

/**
 * Mock benchmark data with run metadata
 */
export const mockBenchmarkData: BenchmarkData = {
  results: mockBenchmarkResults,
  runAt: '2026-03-05T18:10:56Z',
};

/**
 * Benchmark summary statistics
 */
export const mockBenchmarkSummary = {
  totalModels: 6,
  averageGenTps: 51.43,
  averagePromptTps: 1449.45,
  fastestModel: mockBenchmarkResults[0],
  slowestModel: mockBenchmarkResults[5],
};

// ============================================================================
// Complete Mock Application State
// ============================================================================

/**
 * Complete mock application state for initial load
 * This can be used to initialize the Zustand store with realistic data
 */
export const mockAppState: AppState = {
  metrics: mockMetrics,
  costs: mockCosts,
  model: mockModel,
  docs: mockDocEntries,
  benchmarks: mockBenchmarkData,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get mock model data by port number
 */
export function getMockModelByPort(port: number): ModelPortMapping | undefined {
  return mockModelPortMappings.find((m) => m.port === port);
}

/**
 * Get mock benchmark result by port
 */
export function getMockBenchmarkByPort(port: number): BenchmarkResult | undefined {
  return mockBenchmarkResults.find((r) => r.port === port);
}

/**
 * Get mock documentation by category
 */
export function getMockDocsByCategory(categoryId: string): DocEntry[] {
  const category = mockDocCategories.find((c) => c.id === categoryId);
  return category?.entries ?? [];
}

/**
 * Generate random metrics for simulation
 */
export function generateRandomMetrics(): MetricsPanelData {
  const baseGenTps = 45;
  const basePromptTps = 1250;
  const variance = 0.2;

  return {
    genTps: baseGenTps * (1 + (Math.random() - 0.5) * variance),
    promptTps: basePromptTps * (1 + (Math.random() - 0.5) * variance),
    totalTokens: Math.floor(Math.random() * 10000) + 5000,
    promptTokens: Math.floor(Math.random() * 5000) + 2000,
    completionTokens: Math.floor(Math.random() * 5000) + 2000,
    totalTime: Math.random() * 20 + 5,
    averageLatency: Math.floor(Math.random() * 200) + 100,
    requestsCount: Math.floor(Math.random() * 50) + 20,
  };
}

/**
 * Generate random costs for simulation
 */
export function generateRandomCosts(): CostPanelData {
  const inputCost = Math.random() * 0.01 + 0.001;
  const outputCost = Math.random() * 0.03 + 0.01;
  const totalCost = inputCost + outputCost;

  return {
    inputCost,
    outputCost,
    totalCost,
    costPerRequest: totalCost / (Math.floor(Math.random() * 40) + 20),
    costPer1kTokens: totalCost / (Math.floor(Math.random() * 15) + 10),
  };
}

// Default export for convenience
export default {
  metrics: mockMetrics,
  performanceMetrics: mockPerformanceMetrics,
  metricsHistory: mockMetricsHistory,
  costs: mockCosts,
  costPanelData: mockCostPanelData,
  costHistory: mockCostHistory,
  model: mockModel,
  modelPanelData: mockModelPanelData,
  modelPortMappings: mockModelPortMappings,
  docEntries: mockDocEntries,
  docCategories: mockDocCategories,
  docsPanelData: mockDocsPanelData,
  benchmarkResults: mockBenchmarkResults,
  benchmarkData: mockBenchmarkData,
  benchmarkSummary: mockBenchmarkSummary,
  appState: mockAppState,
};
