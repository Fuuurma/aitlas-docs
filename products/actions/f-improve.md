# f.improve — Autonomous Code Improvement Agent

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---
**Version:** 1.0 | **Date:** March 2026 | **Status:** Active Spec
**Repo:** `f-improve` | **Host:** Vercel (API) + Nexus runtime (execution)
**Type:** Mini-App Action (Next.js)
**Credits:** 10/improvement cycle, 50/deep-improve, 5/quick-scan

---

## Strategic Value

**f.improve = Autonomous code improvement** — AI agents that iteratively improve code by running tests/benchmarks and measuring results.

This is a flagship Action — inspired by Karpathy's [autoresearch](https://github.com/karpathy/autoresearch), applied to general code improvement.

**Key capability:** "Improve this code" → Agent iterates autonomously → Returns improved version with metrics.

---

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      f.improve Pipeline                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Input: Code + test/benchmark + improvement goal            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ANALYZE                                              │   │
│  │  ├── Read current code                               │   │
│  │  ├── Run baseline tests/benchmarks                   │   │
│  │  ├── Identify improvement opportunities              │   │
│  │  └── Generate hypothesis                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                         │                                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  EXPERIMENT                                           │   │
│  │  ├── Apply change                                    │   │
│  │  ├── Run tests/benchmarks                            │   │
│  │  ├── Measure improvement                             │   │
│  │  └── Keep or discard                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                         │                                    │
│                         ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ITERATE (repeat until budget exhausted)              │   │
│  │  ├── Generate new hypothesis                         │   │
│  │  ├── Run experiment                                  │   │
│  │  ├── Track progress over iterations                  │   │
│  │  └── Stop on diminishing returns                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Output: Improved code + metrics + iteration log            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Mental Model

Like Karpathy's autoresearch but for code:

```
Traditional: Human writes code → Tests → Fixes → Repeats
f.improve:   Agent modifies code → Runs tests → Measures → Keeps/discards → Repeats
```

**The loop:**
1. Agent reads code
2. Agent proposes a change (optimize algorithm, refactor, etc.)
3. Agent runs tests/benchmarks
4. If metrics improve → keep change
5. If metrics degrade → discard change
6. Repeat for N iterations or until improvement plateaus

---

## Use Cases

| Use Case | Input | Output |
|----------|-------|--------|
| **Performance optimization** | Slow code + benchmark | Faster code + speedup metrics |
| **Code quality** | Messy code + linter rules | Clean code + quality score |
| **Test coverage** | Untested code + coverage tool | Tested code + coverage % |
| **Bug hunting** | Buggy code + test suite | Fixed code + bugs found |
| **Refactoring** | Legacy code + constraints | Modern code + maintainability score |

---

## Architecture

### Components

| Component | Tech | Description |
|-----------|------|-------------|
| **UI** | Next.js (ui-template) | Dashboard for improvement jobs, history |
| **API** | Hono (action-template) | MCP endpoint + REST API |
| **Sandbox** | Docker/Firecracker | Isolated execution environment |
| **LLM** | User's key (BYOK) | OpenAI/Claude/Gemini/Groq |
| **DB** | PostgreSQL | Job history, iterations, metrics |
| **Runtime** | Nexus | Job scheduling, credit deduction |

### Deployment

- **UI:** Vercel (Next.js)
- **API:** Vercel Serverless (Hono)
- **Sandbox:** Firecracker microVMs on Hetzner

---

## BYOK: User Provides Their Own LLM

**Critical differentiator:** f.improve uses **user's LLM key**.

| Provider | User Provides | Aitlas Cost |
|----------|---------------|-------------|
| OpenAI | ✅ Their API key | $0 |
| Anthropic | ✅ Their API key | $0 |
| Google Gemini | ✅ Their API key | $0 |
| Groq | ✅ Their API key | $0 |

**Aitlas only charges for the improvement orchestration** (credits), not the LLM.

---

## MCP Tools

### Core Tools

| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| `improve_code` | Full improvement loop | `{ code, tests, goal, iterations }` | `{ improved_code, metrics, log }` |
| `quick_scan` | One-shot improvement suggestions | `{ code }` | `{ suggestions }` |
| `run_benchmark` | Run benchmark on code | `{ code, benchmark }` | `{ metrics }` |
| `analyze_code` | Deep code analysis | `{ code, focus }` | `{ analysis }` |

### improve_code (Primary Tool)

```typescript
// tools/improve_code.ts

export const improve_code = {
  name: 'improve_code',
  description: 'Autonomously improve code by running tests/benchmarks and measuring results',
  input: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'Current code to improve' },
      tests: { type: 'string', description: 'Test file or benchmark command' },
      goal: {
        type: 'string',
        enum: ['performance', 'readability', 'coverage', 'bugs', 'refactor'],
        description: 'Improvement goal'
      },
      iterations: {
        type: 'number',
        default: 10,
        description: 'Maximum improvement iterations'
      },
      constraints: {
        type: 'object',
        properties: {
          preserve_behavior: { type: 'boolean', default: true },
          max_lines: { type: 'number' },
          allowed_changes: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    required: ['code', 'tests', 'goal']
  },
  output: {
    type: 'object',
    properties: {
      improved_code: { type: 'string' },
      baseline_metrics: { type: 'object' },
      final_metrics: { type: 'object' },
      improvement_percent: { type: 'number' },
      iterations_used: { type: 'number' },
      changes_log: { type: 'array' }
    }
  }
};
```

---

## Improvement Loop Implementation

```typescript
// lib/improvement-loop.ts

interface ImprovementJob {
  id: string;
  userId: string;
  code: string;
  tests: string;
  goal: 'performance' | 'readability' | 'coverage' | 'bugs' | 'refactor';
  maxIterations: number;
  constraints: Constraints;
}

interface IterationResult {
  iteration: number;
  hypothesis: string;
  change: string;
  metrics: Record<string, number>;
  kept: boolean;
  reasoning: string;
}

export async function runImprovementLoop(job: ImprovementJob) {
  const results: IterationResult[] = [];
  let currentCode = job.code;
  let baselineMetrics = await runBenchmark(currentCode, job.tests);
  let bestMetrics = baselineMetrics;
  let bestCode = currentCode;
  let iterationsWithoutImprovement = 0;

  for (let i = 0; i < job.maxIterations; i++) {
    // 1. Generate hypothesis
    const hypothesis = await generateHypothesis(
      currentCode,
      job.goal,
      bestMetrics,
      results
    );

    // 2. Apply change
    const modifiedCode = await applyChange(currentCode, hypothesis.change);

    // 3. Run benchmark
    const metrics = await runBenchmark(modifiedCode, job.tests);

    // 4. Check if improvement
    const isImprovement = checkImprovement(
      metrics,
      bestMetrics,
      job.goal
    );

    // 5. Keep or discard
    if (isImprovement) {
      bestMetrics = metrics;
      bestCode = modifiedCode;
      currentCode = modifiedCode;
      iterationsWithoutImprovement = 0;
    } else {
      iterationsWithoutImprovement++;
    }

    results.push({
      iteration: i + 1,
      hypothesis: hypothesis.description,
      change: hypothesis.change,
      metrics,
      kept: isImprovement,
      reasoning: hypothesis.reasoning
    });

    // 6. Early stop on diminishing returns
    if (iterationsWithoutImprovement >= 3) {
      break;
    }
  }

  return {
    improved_code: bestCode,
    baseline_metrics: baselineMetrics,
    final_metrics: bestMetrics,
    improvement_percent: calculateImprovement(baselineMetrics, bestMetrics, job.goal),
    iterations_used: results.length,
    changes_log: results.filter(r => r.kept)
  };
}
```

---

## Goal-Specific Strategies

### Performance Optimization

```typescript
const performanceStrategies = [
  'Cache repeated computations',
  'Use more efficient data structures',
  'Parallelize independent operations',
  'Reduce memory allocations',
  'Inline hot paths',
  'Use lazy evaluation',
  'Optimize algorithms (Big O)',
];
```

### Code Quality

```typescript
const qualityStrategies = [
  'Extract repeated code into functions',
  'Rename variables for clarity',
  'Add type annotations',
  'Reduce cyclomatic complexity',
  'Remove dead code',
  'Apply design patterns',
  'Improve error handling',
];
```

### Test Coverage

```typescript
const coverageStrategies = [
  'Add tests for uncovered branches',
  'Add edge case tests',
  'Add integration tests',
  'Add property-based tests',
  'Improve test assertions',
];
```

---

## Safety Constraints

### Preserve Behavior

By default, f.improve ensures tests pass after each change:

```typescript
async function validateBehavior(code: string, tests: string): Promise<boolean> {
  const result = await runTests(code, tests);
  return result.passed === result.total;
}
```

### Allowed Changes

Users can restrict what the agent can modify:

```json
{
  "allowed_changes": [
    "variable_names",
    "function_bodies",
    "comments"
  ],
  "forbidden_changes": [
    "function_signatures",
    "public_api"
  ]
}
```

### Sandbox Isolation

All code runs in isolated Firecracker microVMs:

- No network access (unless explicitly allowed)
- No file system access beyond workspace
- Resource limits (CPU, memory, time)
- Automatic cleanup after job

---

## MCP Endpoint

```typescript
// API: POST /api/mcp

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "improve_code",
    "arguments": {
      "code": "function fibonacci(n) { ... }",
      "tests": "assert(fibonacci(10) === 55)",
      "goal": "performance",
      "iterations": 5
    }
  }
}

// Response:
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "improved_code": "function fibonacci(n) { /* optimized */ }",
    "baseline_metrics": { "time_ms": 150 },
    "final_metrics": { "time_ms": 2 },
    "improvement_percent": 98.7,
    "iterations_used": 3,
    "changes_log": [...]
  }
}
```

---

## Pricing

| Operation | Credits | Description |
|-----------|---------|-------------|
| `improve_code` | 10 | Full improvement loop (up to 10 iterations) |
| `improve_code_deep` | 50 | Deep improvement (up to 50 iterations) |
| `quick_scan` | 5 | One-shot analysis + suggestions |
| `run_benchmark` | 2 | Run single benchmark |

---

## Roadmap

### Phase 1: MVP (Week 1-2)
- [ ] Basic improvement loop
- [ ] Performance optimization goal
- [ ] JavaScript/TypeScript support
- [ ] Simple test runner

### Phase 2: Multi-Language (Week 3-4)
- [ ] Python support
- [ ] Go support
- [ ] Rust support
- [ ] Multiple test frameworks

### Phase 3: Advanced Goals (Week 5-6)
- [ ] Code quality improvements
- [ ] Test coverage improvements
- [ ] Bug hunting mode
- [ ] Refactoring mode

### Phase 4: Integration (Week 7-8)
- [ ] GitHub integration (auto-PR)
- [ ] CI/CD integration
- [ ] VS Code extension
- [ ] Slack notifications

---

## Example Session

```
User: Improve the performance of this function:

function findDuplicates(arr) {
  const duplicates = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j] && !duplicates.includes(arr[i])) {
        duplicates.push(arr[i]);
      }
    }
  }
  return duplicates;
}

f.improve: Running improvement loop...

Iteration 1: Hypothesis - Use Set for O(1) lookups
  Baseline: 1250ms (1M items)
  Result: 45ms
  ✅ Kept (96.4% improvement)

Iteration 2: Hypothesis - Use Map for single pass
  Result: 38ms
  ✅ Kept (15.6% improvement)

Iteration 3: Hypothesis - Optimize loop structure
  Result: 38ms
  ❌ Discarded (no improvement)

Final result (3 iterations):

function findDuplicates(arr) {
  const seen = new Set();
  const duplicates = new Set();
  for (const item of arr) {
    if (seen.has(item)) {
      duplicates.add(item);
    } else {
      seen.add(item);
    }
  }
  return [...duplicates];
}

Improvement: 97.0% faster (1250ms → 38ms)
Credits used: 10
```

---

## Integration with Aitlas

### Nexus Integration

Agents can call f.improve via MCP:

```typescript
// In Nexus agent
const result = await mcp.call('f.improve', 'improve_code', {
  code: currentFile.content,
  tests: testFile.content,
  goal: 'performance',
  iterations: 5
});

// Agent receives improved code
currentFile.content = result.improved_code;
```

### Agent Store Integration

Pre-built agents can use f.improve:

- **Code Optimizer Agent**: Automatically improves slow code
- **Refactoring Agent**: Modernizes legacy code
- **Test Generator Agent**: Improves test coverage
- **Bug Hunter Agent**: Finds and fixes bugs

---

## Related Actions

| Action | Relationship |
|--------|--------------|
| f.rsrx | Research improvements (algorithms, patterns) |
| f.guard | Security-focused improvements |
| f.library | Code library improvements |

---

*Spec created: March 12, 2026*
*Inspired by: [karpathy/autoresearch](https://github.com/karpathy/autoresearch)*