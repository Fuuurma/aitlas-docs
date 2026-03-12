/**
 * f.improve Tool Handlers
 * 
 * These handlers are called by the Tool Gateway.
 */

import { FImproveClient } from '../lib/f-improve-client';

const client = new FImproveClient(process.env.F_IMPROVE_URL || 'http://localhost:4000');

/**
 * improve_code - Full improvement loop
 * Credits: 10
 */
export async function improve_code(params: {
  code: string;
  tests: string;
  goal: 'performance' | 'readability' | 'coverage' | 'bugs' | 'refactor';
  iterations?: number;
  constraints?: {
    preserve_behavior?: boolean;
    max_lines?: number;
    allowed_changes?: string[];
  };
}, context: { userId: string; apiKey: string }) {
  // Create job
  const job = await client.createJob({
    user_id: context.userId,
    code: params.code,
    benchmark: params.tests,
    goal: params.goal,
    iterations: params.iterations || 10,
  });
  
  // Wait for completion (with timeout)
  const result = await client.waitForJob(job.id, {
    timeout: 300000, // 5 minutes
    pollInterval: 2000,
  });
  
  return {
    improved_code: result.best_code,
    baseline_metrics: result.baseline_metrics,
    final_metrics: result.final_metrics,
    improvement_percent: result.improvement_percent,
    iterations_used: result.iterations_used,
    changes_log: result.experiments,
  };
}

/**
 * quick_scan - One-shot improvement suggestions
 * Credits: 5
 */
export async function quick_scan(params: {
  code: string;
  goal: 'performance' | 'readability' | 'coverage' | 'bugs';
}, context: { userId: string; apiKey: string }) {
  // Call MCP endpoint for quick scan
  const result = await client.callMcp('quick_scan', {
    code: params.code,
    goal: params.goal,
  });
  
  return {
    suggestions: result.suggestions,
    estimated_improvement: result.estimated_improvement,
  };
}

/**
 * deep_improve - Deep improvement with extensive iterations
 * Credits: 50
 */
export async function deep_improve(params: {
  code: string;
  tests: string;
  goal: 'performance' | 'readability' | 'coverage' | 'bugs' | 'refactor';
  iterations?: number;
  exploration_depth?: 'standard' | 'deep' | 'exhaustive';
}, context: { userId: string; apiKey: string }) {
  const iterations = params.iterations || (params.exploration_depth === 'exhaustive' ? 50 : 25);
  
  const job = await client.createJob({
    user_id: context.userId,
    code: params.code,
    benchmark: params.tests,
    goal: params.goal,
    iterations,
  });
  
  const result = await client.waitForJob(job.id, {
    timeout: 600000, // 10 minutes
    pollInterval: 5000,
  });
  
  return {
    improved_code: result.best_code,
    baseline_metrics: result.baseline_metrics,
    final_metrics: result.final_metrics,
    improvement_percent: result.improvement_percent,
    iterations_used: result.iterations_used,
    changes_log: result.experiments,
    analysis: result.analysis,
  };
}

/**
 * get_experiments - Get experiment log for a job
 * Credits: 0 (free)
 */
export async function get_experiments(params: {
  job_id: string;
  format?: 'json' | 'tsv';
}, context: { userId: string }) {
  const experiments = await client.getExperiments(params.job_id);
  
  if (params.format === 'tsv') {
    return {
      format: 'tsv',
      data: formatTsv(experiments),
    };
  }
  
  return {
    format: 'json',
    experiments,
  };
}

// Helper: Format experiments as TSV (like autoresearch's results.tsv)
function formatTsv(experiments: any[]): string {
  const header = 'commit\tval_bpb\tmemory_gb\tstatus\tdescription\n';
  const rows = experiments.map(e => 
    `${e.commit}\t${e.metric_value}\t${e.memory_gb}\t${e.status}\t${e.description}`
  );
  return header + rows.join('\n');
}