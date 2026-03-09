# Nexus — Durable Agent Runtime (Orchestration)

**Version:** 1.0 | **Date:** March 2026 | **Status:** Active Spec  
**Foundation:** **Cloned from trigger.dev** (Apache 2.0) — customized for AI agents  
**Repo:** `aitlas-nexus` | **Host:** Hetzner (Bun workers) + Vercel (API gateway)  
**Formerly:** Nexus runtime  
**Maintained by:** Herb (AI CTO)

---

> ⚠️ **Nexus is based on trigger.dev** — forked their architecture and customized for AI agent workloads.

---

## Table of Contents

1. [Mental Model & Positioning](#1-mental-model--positioning)
2. [The 5-Phase Execution Loop](#2-the-5-phase-execution-loop)
3. [Database Architecture](#3-database-architecture)
4. [Worker Architecture](#4-worker-architecture)
5. [Tool Gateway](#5-tool-gateway)
6. [Scheduling Engine](#6-scheduling-engine)
7. [Memory Integration (f.library)](#7-memory-integration-flibrary)
8. [Cost Control Model](#8-cost-control-model)
9. [Failure Recovery & Heartbeat](#9-failure-recovery--heartbeat)
10. [Horizontal Scaling](#10-horizontal-scaling)
11. [Observability](#11-observability)
12. [MCP Tool API (Public)](#12-mcp-tool-api-public)
13. [REST API (Developer Platform)](#13-rest-api-developer-platform)
14. [Security Model](#14-security-model)
15. [Prisma Schema (Complete)](#15-prisma-schema-complete)
16. [Implementation Roadmap](#16-implementation-roadmap)

---

## 1. Mental Model & Positioning

### What Nexus runtime Actually Is

Nexus runtime is not a background job runner. It is the **Durable Agent Runtime** — the engine that powers every autonomous action in the Aitlas ecosystem.

```
Without Nexus runtime:          With Nexus runtime:
─────────────────        ──────────────────────────────────
Nova = chat UI          Nova = command interface for agents
Agents = prompts         Agents = autonomous running workers
Actions = API calls      Actions = durable tool invocations
f.decloy = hosting       f.decloy = agent lifecycle manager
```

### Comparable Systems

| System | What it does | Nexus's advantage |
|--------|-------------|-------------------|
| **Temporal** | Durable workflows | Nexus is AI-native, MCP-first |
| **LangGraph** | Agent state graphs | Nexus is provider-agnostic (BYOK) |
| **Trigger.dev** | Background jobs | Nexus has PLAN→REFLECT loop built in |
| **Modal** | Compute runtime | Nexus is cheap (Hetzner, not Lambda) |
| **Airflow** | Task orchestration | Nexus is agent-first, not DAG-first |

**Nexus combines all of them.**

### The Strategic Opportunity

Nexus runtime exposed as a **developer API** (not just internal infrastructure) transforms Aitlas from a UI product into an **Agent Infrastructure Platform**. Developers outside Aitlas can `POST /tasks` and get durable agent execution. This is the moat.

```
Current scope:   Nexus runtime powers Nexus + Agents
Future scope:    Nexus runtime is the product — Nexus is one of many clients
```

### The Aitlas Stack

```
Aitlas
│
├── Nova ──────────────────── Calls Nexus runtime via MCP
│
├── Agents Store (Marketplace) ─── Agents reference Nexus runtime capabilities
│
├── Actions (f.xyz tools) ───────── Executed by Nexus runtime via Tool Gateway
│
├── Nexus runtime (Agent Runtime) ←────── POWERS EVERYTHING
│
├── f.decloy (Agent Hosting) ────── Uses Nexus runtime for lifecycle
│
└── MCP Registry (Curated Tools) ── Routed through Tool Gateway
```

---

## 2. The 5-Phase Execution Loop

### Why 5 Phases?

The original OBSERVE → REASON → ACT → EVALUATE loop is good but missing the **PLAN** and **REFLECT** phases that separate good agent behavior from great agent behavior.

- **PLAN** before acting prevents wasted tool calls (agent thinks before moving)
- **REFLECT** after acting catches errors and wrong-direction work before they compound

### The Complete Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                    Nexus runtime — Nexus Engine                         │
│                    Bun Worker Process                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ① OBSERVE                                                        │
│     └─ Poll task queue: SELECT FOR UPDATE SKIP LOCKED             │
│     └─ Load task: goal, steps so far, tool registry              │
│     └─ Load memory context (if memory_collection set)            │
│     └─ Mark task as CLAIMED, write worker_id + heartbeat_at      │
│                                                                   │
│  ② PLAN                                                           │
│     └─ Prompt: "Given this goal and what you've done so far,     │
│                 what is the single best next action?"             │
│     └─ LLM returns: { action, reasoning, toolName?, toolInput? } │
│     └─ Persist step (type: 'plan') to task_steps                 │
│     └─ If action = 'DONE': skip to PERSIST with final answer     │
│     └─ If action = 'STUCK': escalate to user, pause task         │
│                                                                   │
│  ③ ACT                                                            │
│     └─ Route tool call through Tool Gateway                       │
│     └─ Gateway handles: auth, timeout, retry, credits, logging   │
│     └─ Persist tool_call record (input, output, status, credits) │
│     └─ Persist step (type: 'action') to task_steps               │
│                                                                   │
│  ④ REFLECT                                                        │
│     └─ Prompt: "Here is what the tool returned. Is this          │
│                 useful? What did you learn? What's missing?"      │
│     └─ LLM returns: { quality, summary, nextDirection }          │
│     └─ Persist step (type: 'reflection') to task_steps           │
│     └─ If quality = 'poor': flag step, try alternative tool      │
│                                                                   │
│  ⑤ PERSIST                                                        │
│     └─ Write step summary to f.library (if memory enabled)       │
│     └─ Update task: current_step++, status, updated_at           │
│     └─ Update heartbeat_at (keep-alive signal)                   │
│     └─ Emit SSE event to Nexus: { type: 'step', step }           │
│                                                                   │
│  ⑥ REPEAT (or TERMINATE)                                          │
│     └─ If status = DONE: finalize, refund unused credits         │
│     └─ If current_step >= max_steps: mark TIMEOUT                │
│     └─ If 3 consecutive poor reflections: mark STUCK             │
│     └─ Else: back to ①                                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Real Execution Example

```
Goal: "Research best DeFi yield strategies on Solana"

─── Step 1 ─────────────────────────────────────────
PLAN    → "I should start with a broad web search to understand
           the current DeFi landscape on Solana"
ACT     → f.rsrx:search_web({ query: "Solana DeFi yield 2026" })
REFLECT → "Good results. Found mentions of Raydium, Marinade,
           Kamino. Should dig into each protocol specifically."

─── Step 2 ─────────────────────────────────────────
PLAN    → "Search Twitter for recent sentiment on these protocols"
ACT     → f.twyt:search_twitter({ query: "Raydium Marinade Kamino yield" })
REFLECT → "Good. Strong sentiment on Kamino, concerns about
           Raydium impermanent loss. Should research Kamino deeper."

─── Step 3 ─────────────────────────────────────────
PLAN    → "Deep research on Kamino Finance specifically"
ACT     → f.rsrx:deep_research({ query: "Kamino Finance Solana yields APY" })
REFLECT → "Excellent. Have enough data to write the report."

─── Step 4 ─────────────────────────────────────────
PLAN    → "Synthesize findings into structured report"
ACT     → f.rsrx:synthesize_report({ sources: [...], format: "markdown" })
REFLECT → "Report complete. Goal achieved."

→ DONE. Task COMPLETED. Report returned to Nexus.
```

### Task Status State Machine

```
                    ┌─────────────┐
           ┌───────>│   PENDING   │<──────── (retry)
           │        └──────┬──────┘
           │               │ worker claims
           │               ▼
           │        ┌─────────────┐
           │        │   CLAIMED   │ (worker_id set, 30s lease)
           │        └──────┬──────┘
           │               │ first step starts
           │               ▼
           │        ┌─────────────┐
           │        │   RUNNING   │◄─────────────────┐
           │        └──────┬──────┘                  │
           │               │                         │ (loop)
           │        ┌──────┼──────────┐              │
           │        ▼      ▼          ▼              │
           │   COMPLETED FAILED    TIMEOUT        STUCK
           │                          │              │
           │                          └──────────────┘
           │                          user can retry
           │
      CANCELLED (user-initiated, any state except COMPLETED)
```

---

## 3. Database Architecture

Three separated tables enable debugging, replay, analytics, and billing audits.

### tasks

The top-level job record. One per user request.

```sql
CREATE TABLE tasks (
  id                TEXT PRIMARY KEY,         -- cuid()
  user_id           TEXT NOT NULL,
  agent_id          TEXT,                     -- NULL if raw dispatch
  goal              TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'PENDING',
  
  -- Execution config
  max_steps         INT NOT NULL DEFAULT 50,
  current_step      INT NOT NULL DEFAULT 0,
  tool_registry     JSONB NOT NULL,           -- MCPToolRef[]
  memory_collection TEXT,                     -- f.library collection name
  
  -- Scheduling
  scheduled_for     TIMESTAMPTZ,             -- NULL = run immediately
  cron_expression   TEXT,                    -- NULL = one-shot
  parent_task_id    TEXT,                    -- For recurring: link to template
  
  -- Cost tracking
  credits_reserved  INT NOT NULL DEFAULT 0,
  credits_used      INT NOT NULL DEFAULT 0,
  llm_tokens_used   INT NOT NULL DEFAULT 0,
  compute_ms        INT NOT NULL DEFAULT 0,
  
  -- Worker lease (heartbeat)
  worker_id         TEXT,
  heartbeat_at      TIMESTAMPTZ,
  
  -- Result
  result            TEXT,                    -- Final answer (markdown/JSON)
  error_message     TEXT,
  
  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  scheduled_at      TIMESTAMPTZ            -- When it was scheduled (audit)
);

CREATE INDEX idx_tasks_status_scheduled ON tasks(status, scheduled_for);
CREATE INDEX idx_tasks_user_id ON tasks(user_id, created_at DESC);
CREATE INDEX idx_tasks_worker_heartbeat ON tasks(worker_id, heartbeat_at);
```

### task_steps

Append-only log of every PLAN, ACT, and REFLECT step. Never updated, only inserted.

```sql
CREATE TABLE task_steps (
  id          TEXT PRIMARY KEY,         -- cuid()
  task_id     TEXT NOT NULL REFERENCES tasks(id),
  step_number INT NOT NULL,
  type        TEXT NOT NULL,           -- 'plan' | 'action' | 'reflection' | 'final'
  content     TEXT NOT NULL,           -- LLM output for this step
  metadata    JSONB,                   -- { quality, reasoning, nextDirection, etc. }
  duration_ms INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_steps_task_id ON task_steps(task_id, step_number);
```

### tool_calls

Every individual MCP tool invocation. Linked to the step that triggered it.

```sql
CREATE TABLE tool_calls (
  id           TEXT PRIMARY KEY,          -- cuid()
  task_id      TEXT NOT NULL REFERENCES tasks(id),
  step_id      TEXT NOT NULL REFERENCES task_steps(id),
  tool_name    TEXT NOT NULL,             -- 'f.rsrx:deep_research'
  tool_input   JSONB NOT NULL,
  tool_output  JSONB,
  status       TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING'|'SUCCESS'|'FAILED'|'TIMEOUT'
  credits_used INT NOT NULL DEFAULT 0,
  duration_ms  INT,
  error        TEXT,
  retry_count  INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tool_calls_task_id ON tool_calls(task_id);
CREATE INDEX idx_tool_calls_tool_name ON tool_calls(tool_name, created_at DESC);
```

### scheduled_tasks

Template records for recurring/cron tasks. Spawns actual task records on each trigger.

```sql
CREATE TABLE scheduled_tasks (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  goal            TEXT NOT NULL,
  cron_expression TEXT NOT NULL,       -- "0 */6 * * *"
  tool_registry   JSONB NOT NULL,
  memory_collection TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at     TIMESTAMPTZ,
  next_run_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 4. Worker Architecture

### Worker Process Structure

Each Bun worker process is a single long-running script that:
1. Claims one task at a time
2. Runs the full 5-phase loop
3. Returns to polling

```typescript
// worker.ts — Main entry point (one process per worker)

import { createWorker } from './lib/worker';

const worker = createWorker({
  workerId: `worker-${Bun.env.WORKER_ID ?? crypto.randomUUID()}`,
  pollIntervalMs: 5_000,         // Check queue every 5s (idle)
  activeIntervalMs: 100,         // Loop interval while running (near-instant)
  heartbeatIntervalMs: 15_000,   // Update heartbeat every 15s
  maxConcurrentTasks: 1,         // One task per worker (simplicity > throughput)
});

worker.start();
```

### Task Claiming (Concurrency-Safe)

```typescript
// lib/worker.ts

async function claimNextTask(workerId: string): Promise<Task | null> {
  return await db.$transaction(async (tx) => {
    // Atomic claim: find PENDING task and lock it
    const task = await tx.$queryRaw<Task[]>`
      SELECT * FROM tasks
      WHERE status = 'PENDING'
        AND (scheduled_for IS NULL OR scheduled_for <= NOW())
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `;

    if (!task[0]) return null;

    // Claim it
    await tx.$executeRaw`
      UPDATE tasks
      SET status = 'CLAIMED',
          worker_id = ${workerId},
          heartbeat_at = NOW()
      WHERE id = ${task[0].id}
    `;

    return task[0];
  });
}
```

### Heartbeat Loop

Runs in a separate Bun interval alongside the main loop:

```typescript
// Each worker runs this concurrently with task execution
setInterval(async () => {
  if (currentTaskId) {
    await db.$executeRaw`
      UPDATE tasks
      SET heartbeat_at = NOW()
      WHERE id = ${currentTaskId}
        AND worker_id = ${workerId}
    `;
  }
}, 15_000);
```

---

## 5. Tool Gateway

The Tool Gateway is the single point through which ALL tool calls flow. Workers never call MCP servers directly — they always go through the gateway.

### Why This Layer Exists

Without a gateway, every worker has to implement: auth, retry logic, timeout handling, credit deduction, error normalization, and logging. That's 200+ lines of messy code per worker, prone to drift.

With a gateway: workers call one function. Everything else is handled.

```typescript
// lib/tool-gateway.ts

interface ToolCallRequest {
  taskId: string;
  stepId: string;
  userId: string;
  toolName: string;       // "f.rsrx:deep_research"
  toolInput: unknown;
  maxRetries?: number;    // Default: 2
  timeoutMs?: number;     // Default: 30_000
}

interface ToolCallResult {
  success: boolean;
  output?: unknown;
  error?: string;
  creditsUsed: number;
  durationMs: number;
}

export async function executeToolCall(req: ToolCallRequest): Promise<ToolCallResult> {
  const startTime = Date.now();
  const tool = resolveTool(req.toolName);

  // 1. Credit pre-check (before any network call)
  await checkCredits(req.userId, tool.creditCost);

  // 2. Resolve MCP endpoint
  const endpoint = await getToolEndpoint(req.userId, req.toolName);

  // 3. Create tool_call record
  const toolCall = await db.toolCall.create({
    data: {
      taskId: req.taskId,
      stepId: req.stepId,
      toolName: req.toolName,
      toolInput: req.toolInput as object,
      status: 'PENDING',
    }
  });

  // 4. Execute with retry + timeout
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= (req.maxRetries ?? 2); attempt++) {
    try {
      const result = await withTimeout(
        callMCPTool(endpoint, req.toolName, req.toolInput),
        req.timeoutMs ?? 30_000
      );

      const durationMs = Date.now() - startTime;

      // 5. Deduct credits (only on success)
      await deductCredits(req.userId, tool.creditCost, `${req.toolName}:task:${req.taskId}`);

      // 6. Update tool_call record
      await db.toolCall.update({
        where: { id: toolCall.id },
        data: {
          toolOutput: result as object,
          status: 'SUCCESS',
          creditsUsed: tool.creditCost,
          durationMs,
        }
      });

      // 7. Structured log (no API keys, no secrets)
      logger.info({ toolName: req.toolName, taskId: req.taskId, durationMs, creditsUsed: tool.creditCost }, 'tool_call_success');

      return { success: true, output: result, creditsUsed: tool.creditCost, durationMs };

    } catch (err) {
      lastError = err as Error;
      logger.warn({ toolName: req.toolName, attempt, error: lastError.message }, 'tool_call_attempt_failed');
      if (attempt < (req.maxRetries ?? 2)) await sleep(1000 * (attempt + 1)); // exponential backoff
    }
  }

  // All retries exhausted
  await db.toolCall.update({
    where: { id: toolCall.id },
    data: { status: 'FAILED', error: lastError!.message, retryCount: req.maxRetries ?? 2 }
  });

  return { success: false, error: lastError!.message, creditsUsed: 0, durationMs: Date.now() - startTime };
}
```

---

## 6. Scheduling Engine

The scheduler is a separate lightweight Bun process that runs alongside workers. It checks `scheduled_tasks` and spawns actual `tasks` records on time.

### Schedule Types

```typescript
type ScheduleType =
  | { type: 'immediate' }                         // Default — run now
  | { type: 'delayed'; runAt: Date }              // Run once, at specific time
  | { type: 'cron'; expression: string }          // "0 */6 * * *" — recurring
  | { type: 'after_task'; taskId: string }        // Run when another task completes
```

### Scheduler Process

```typescript
// scheduler.ts — separate Bun process

import { CronParser } from 'cron-parser';

async function schedulerLoop() {
  while (true) {
    // Find all active scheduled tasks due to run
    const due = await db.$queryRaw<ScheduledTask[]>`
      SELECT * FROM scheduled_tasks
      WHERE is_active = TRUE
        AND next_run_at <= NOW()
      FOR UPDATE SKIP LOCKED
    `;

    for (const scheduledTask of due) {
      // Spawn an actual task
      await db.task.create({
        data: {
          userId: scheduledTask.userId,
          goal: scheduledTask.goal,
          toolRegistry: scheduledTask.toolRegistry,
          memoryCollection: scheduledTask.memoryCollection,
          status: 'PENDING',
          parentTaskId: scheduledTask.id,
        }
      });

      // Compute next run time
      const next = CronParser.parse(scheduledTask.cronExpression).next().toDate();
      await db.$executeRaw`
        UPDATE scheduled_tasks
        SET last_run_at = NOW(), next_run_at = ${next}
        WHERE id = ${scheduledTask.id}
      `;
    }

    await sleep(10_000); // Check every 10 seconds
  }
}
```

### Example Usage

```typescript
// Recurring competitive intelligence agent
POST /api/tasks/schedule
{
  "goal": "Monitor competitor pricing changes and summarize",
  "schedule": {
    "type": "cron",
    "expression": "0 9 * * 1"   // Every Monday at 9am
  },
  "memory_collection": "competitor_intel",
  "tool_registry": ["f.rsrx", "f.twyt"]
}

// Delayed one-shot task
POST /api/tasks/schedule
{
  "goal": "Research Q2 earnings reports when they drop",
  "schedule": {
    "type": "delayed",
    "runAt": "2026-04-15T08:00:00Z"
  }
}
```

---

## 7. Memory Integration (f.library)

When a task has a `memory_collection` set, Nexus reads from and writes to f.library automatically at each step. This gives agents persistent, cross-session knowledge.

### Memory Lifecycle in a Task

```typescript
// In the OBSERVE phase:
if (task.memoryCollection) {
  const context = await callMCPTool('f.library:search_knowledge_base', {
    collection: task.memoryCollection,
    query: task.goal,
    limit: 5,
  });
  // Inject into PLAN prompt as: "Relevant context from memory: ..."
}

// In the PERSIST phase (after each REFLECT):
if (task.memoryCollection && reflection.quality !== 'poor') {
  await callMCPTool('f.library:ingest_document', {
    collection: task.memoryCollection,
    content: `Task: ${task.goal}\nStep ${step.number} insight: ${reflection.summary}`,
    metadata: { taskId: task.id, step: step.number, date: new Date().toISOString() },
  });
}
```

### Memory Collections by Agent Type

| Agent | Suggested Collection | What Gets Stored |
|-------|---------------------|-----------------|
| Crypto Quant | `crypto_research_[userId]` | Protocol analysis, market insights |
| Competitor Monitor | `competitor_intel_[userId]` | Pricing changes, feature launches |
| Code Guardian | `codebase_patterns_[userId]` | Bug patterns, refactor decisions |
| Personal Assistant | `user_context_[userId]` | Preferences, past decisions |

---

## 8. Cost Control Model

### The Problem with Flat Pricing

Agents are primarily bottlenecked by LLM calls, not CPU. A 30-minute task might use:
- 200ms of actual compute (cheap)
- 50,000 LLM tokens (expensive — borne by user's BYOK)
- 3 f.xyz tool calls (5 credits each)

Charging "10 credits/hour" under-captures tool usage and conflates compute time with actual cost.

### Revised Pricing Model

```typescript
interface TaskCostBreakdown {
  orchestrationFee: number;  // 1 credit flat per task dispatch (admin fee)
  computeCredits: number;    // 2 credits/hour of actual worker compute time
  toolCredits: number;       // Sum of all tool_calls.credits_used
  // LLM tokens: user's BYOK — Furma does NOT charge for these
}

// Example for a 20-minute DeFi research task:
// orchestration:  1 credit
// compute:        1 credit (20min ≈ 0.33hr × 2 = ~1 credit)
// tools:          f.rsrx × 2 (10) + f.twyt × 1 (1) = 11 credits
// TOTAL:          13 credits = $0.13 (at $0.01/credit)
```

### Credit Reserve Strategy

```typescript
// On task dispatch: reserve max possible credits
// This prevents task from running out mid-way and leaving partial results

async function dispatchTask(params: TaskDispatch): Promise<Task> {
  // Estimate max cost: max_steps × most_expensive_tool
  const maxCost = params.maxSteps * getMaxToolCost(params.toolRegistry)
                + 1  // orchestration fee
                + Math.ceil(params.estimatedMinutes / 60) * 2; // compute

  // Atomic: check + reserve in one transaction
  await db.$transaction([
    db.$executeRaw`
      UPDATE users
      SET compute_credits = compute_credits - ${maxCost}
      WHERE id = ${params.userId}
        AND compute_credits >= ${maxCost}
    `,
    // INSERT credit ledger entry for the reserve
  ]);

  // If update affected 0 rows: insufficient credits
  // Create task with credits_reserved = maxCost
  // On task completion: refund (maxCost - actualCost)
}
```

---

## 9. Failure Recovery & Heartbeat

### The Problem
A worker process can die (OOM, network partition, Hetzner reboot) mid-task. Without recovery, that task is stuck in CLAIMED/RUNNING forever.

### The Solution: Dead Worker Detection

A **Watchdog process** (lightweight, runs on same Hetzner box) checks for stale heartbeats and resets them to PENDING.

```typescript
// watchdog.ts — separate Bun process

async function watchdogLoop() {
  while (true) {
    const staleThreshold = new Date(Date.now() - 60_000); // 60 second timeout

    // Find tasks whose worker has gone silent
    const staleTasks = await db.$executeRaw`
      UPDATE tasks
      SET status = 'PENDING',
          worker_id = NULL,
          heartbeat_at = NULL
      WHERE status IN ('CLAIMED', 'RUNNING')
        AND heartbeat_at < ${staleThreshold}
      RETURNING id, user_id
    `;

    if (staleTasks.length > 0) {
      logger.warn({ count: staleTasks.length }, 'watchdog_recovered_stale_tasks');
    }

    await sleep(30_000); // Check every 30 seconds
  }
}
```

### Task Retry Logic

```typescript
async function retryTask(taskId: string, userId: string): Promise<Task> {
  const original = await getTask(taskId, userId);

  // Validate it's in a retryable state
  if (!['FAILED', 'TIMEOUT', 'STUCK'].includes(original.status)) {
    throw new Error(`Task ${taskId} is not retryable (status: ${original.status})`);
  }

  // Create a NEW task (don't reset old one — preserve history)
  return await db.task.create({
    data: {
      userId: original.userId,
      goal: original.goal,
      agentId: original.agentId,
      toolRegistry: original.toolRegistry,
      memoryCollection: original.memoryCollection,
      maxSteps: original.maxSteps,
      status: 'PENDING',
    }
  });
}
```

---

## 10. Horizontal Scaling

Workers are **stateless**. Scaling is adding boxes.

### Scale Tiers

| Daily Tasks | Config | Monthly Cost |
|------------|--------|-------------|
| 0–100 | 1× Hetzner CX21, 4 workers | ~€5 |
| 100–500 | 1× Hetzner CX31, 8 workers | ~€10 |
| 500–2,000 | 2× Hetzner CX31, 16 workers | ~€20 |
| 2,000–10,000 | 4× Hetzner CCX23, 32 workers | ~€80 |
| 10,000+ | Auto-scaling pool (Hetzner API) | Variable |

### Adding a Worker (30 seconds)

```bash
# On the new Hetzner box:
git clone git@github.com:furma/aitlas-loop.git /opt/aitlas-loop
cd /opt/aitlas-loop && bun install
cp /etc/aitlas/.env .env               # Shared env from config box
WORKER_ID=worker-5 bun run worker.ts  # Start immediately
```

No load balancer. No service mesh. All workers share the same Postgres queue. `FOR UPDATE SKIP LOCKED` is the only coordination needed.

### Database Connection Pooling

With many workers connecting to Neon, use **pgBouncer** (Neon provides this via the pooled connection string):

```bash
# Use unpooled for migrations, pooled for workers
DATABASE_URL=postgresql://...@ep-xxx.pooler.neon.tech/aitlas?pgbouncer=true
DATABASE_URL_UNPOOLED=postgresql://...@ep-xxx.neon.tech/aitlas
```

---

## 11. Observability

This is critical for agent systems. You cannot debug what you cannot see.

### Metrics to Track (Pino → structured logs → dashboard)

```typescript
// Every task completion emits:
logger.info({
  event: 'task_completed',
  taskId,
  userId,
  agentId,
  status,                    // COMPLETED | FAILED | TIMEOUT
  totalSteps: currentStep,
  durationMs,
  creditsUsed,
  llmTokensUsed,
  toolCallCount,
  toolCallSuccessRate,       // (successes / total) × 100
}, 'task_metrics');

// Every tool call emits:
logger.info({
  event: 'tool_call',
  toolName,
  taskId,
  status,
  durationMs,
  creditsUsed,
  retryCount,
}, 'tool_metrics');
```

### Key Dashboards (Grafana or simple Postgres queries)

```sql
-- Average task duration by agent type
SELECT agent_id, AVG(compute_ms) as avg_ms, COUNT(*) as total
FROM tasks WHERE status = 'COMPLETED' GROUP BY agent_id;

-- Tool error rate in last 24h
SELECT tool_name,
  COUNT(*) FILTER (WHERE status = 'FAILED') as failures,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'FAILED') / COUNT(*), 2) as error_rate
FROM tool_calls WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY tool_name ORDER BY error_rate DESC;

-- Credits consumed per user per day
SELECT user_id, DATE(created_at), SUM(credits_used) as daily_credits
FROM tool_calls GROUP BY user_id, DATE(created_at);

-- Worker health
SELECT worker_id, COUNT(*) as tasks_today,
  AVG(compute_ms) as avg_ms
FROM tasks WHERE DATE(created_at) = CURRENT_DATE
GROUP BY worker_id;
```

### Alerting Rules

| Alert | Condition | Action |
|-------|-----------|--------|
| Worker dead | No heartbeat update for >2 min | PagerDuty / Slack |
| High tool failure rate | >20% failures in 10 min window | Slack alert |
| Task queue depth | >50 PENDING tasks | Spin up extra worker |
| Credit anomaly | Single task uses >200 credits | Flag for review |
| DB connection pool exhausted | pgBouncer queue > 10 | Alert + scale |

---

## 12. MCP Tool API (Public)

Nexus runtime exposes these tools via MCP at `https://f.xyz/loop/api/mcp`.

### dispatch_background_task

```typescript
{
  name: 'dispatch_background_task',
  description: 'Dispatch a long-running agentic task to the Nexus engine. Returns taskId immediately.',
  creditCost: 1,  // orchestration fee
  isAsync: true,
  input: z.object({
    goal: z.string().min(10).max(2000),
    toolRegistry: z.array(z.string()),    // ['f.rsrx', 'f.twyt']
    maxSteps: z.number().min(5).max(100).default(50),
    creditBudget: z.number().min(5).max(500).default(50),
    memoryCollection: z.string().optional(),
    schedule: z.discriminatedUnion('type', [
      z.object({ type: z.literal('immediate') }),
      z.object({ type: z.literal('delayed'), runAt: z.string().datetime() }),
      z.object({ type: z.literal('cron'), expression: z.string() }),
    ]).default({ type: 'immediate' }),
  }),
  output: z.object({
    taskId: z.string(),
    status: z.literal('PENDING'),
    estimatedCredits: z.number(),
  }),
}
```

### get_task_status

```typescript
{
  name: 'get_task_status',
  description: 'Get current status and step progress of a background task.',
  creditCost: 0,  // Free — read-only
  input: z.object({ taskId: z.string() }),
  output: z.object({
    taskId: z.string(),
    status: TaskStatusEnum,
    currentStep: z.number(),
    maxSteps: z.number(),
    steps: z.array(TaskStepSchema),
    creditsUsed: z.number(),
    result: z.string().optional(),
  }),
}
```

### cancel_task

```typescript
{
  name: 'cancel_task',
  description: 'Cancel a running or pending task. Refunds unused reserved credits.',
  creditCost: 0,
  input: z.object({ taskId: z.string() }),
  output: z.object({
    taskId: z.string(),
    status: z.literal('CANCELLED'),
    creditsRefunded: z.number(),
  }),
}
```

### retry_task

```typescript
{
  name: 'retry_task',
  description: 'Retry a failed, timed-out, or stuck task. Creates a new task with same configuration.',
  creditCost: 1,  // new orchestration fee
  input: z.object({
    taskId: z.string(),
    adjustedMaxSteps: z.number().optional(),
    adjustedCreditBudget: z.number().optional(),
  }),
  output: z.object({
    newTaskId: z.string(),
    originalTaskId: z.string(),
    status: z.literal('PENDING'),
  }),
}
```

### list_tasks

```typescript
{
  name: 'list_tasks',
  description: 'List recent tasks for the current user.',
  creditCost: 0,
  input: z.object({
    status: TaskStatusEnum.optional(),
    limit: z.number().min(1).max(50).default(10),
    offset: z.number().default(0),
  }),
  output: z.object({
    tasks: z.array(TaskSummarySchema),
    total: z.number(),
  }),
}
```

### get_task_logs

```typescript
{
  name: 'get_task_logs',
  description: 'Get detailed step-by-step execution log for a task. Useful for debugging.',
  creditCost: 0,
  input: z.object({
    taskId: z.string(),
    includeToolCalls: z.boolean().default(false),
  }),
  output: z.object({
    taskId: z.string(),
    steps: z.array(TaskStepDetailSchema),
  }),
}
```

---

## 13. REST API (Developer Platform)

In addition to MCP tools (used by agents), Nexus runtime exposes a REST API for direct developer access. This is the foundation of the "Agent Infrastructure Platform" strategic opportunity.

```
Base URL: https://api.aitlas.xyz/v1/loop
Auth: Bearer token (Aitlas API key — generated in Nexus settings)
```

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/tasks` | POST | Dispatch a new task |
| `/tasks` | GET | List user's tasks |
| `/tasks/:id` | GET | Get task status + steps |
| `/tasks/:id` | DELETE | Cancel task |
| `/tasks/:id/logs` | GET | Full execution log |
| `/tasks/:id/retry` | POST | Retry failed/timed-out task |
| `/tasks/:id/stream` | GET | SSE stream of task progress |
| `/schedules` | POST | Create recurring task |
| `/schedules` | GET | List scheduled tasks |
| `/schedules/:id` | DELETE | Cancel scheduled task |
| `/workers/status` | GET | Health of worker fleet (admin) |

---

## 14. Security Model

### BYOK Key Handling (Non-Negotiable Rules)

```
1. BYOK key is NEVER stored in the task record.
   The task record stores: userId only.
   The worker fetches and decrypts the key at execution time.

2. BYOK key is decrypted inside the worker process only.
   The decrypted string lives in a local variable for <1ms per LLM call.
   It is never:
     - Logged (Pino, console.log, or any logger)
     - Serialized (JSON.stringify, db write)
     - Passed to other functions beyond the LLM client call
     - Included in error messages

3. If decryption fails, task status → FAILED with message:
   "API key decryption failed. Please re-enter your key in Settings."
   (No cryptographic details in the error)

4. ENCRYPTION_KEY rotation:
   - Rotate every 90 days
   - Re-encrypt all ApiKey records on rotation (background job)
   - Old key kept for 24h to handle in-flight tasks
```

### Network Security

```
Workers → Neon Postgres:    SSL required, connection string never logged
Workers → f.xyz MCP:        Internal FURMA_INTERNAL_SECRET header
Workers → Third-party MCP:  User's credentials (encrypted in ToolRegistry)
Workers → LLM providers:    BYOK key (in-memory only, per call)

Neon Postgres:              Not publicly accessible (Neon private networking)
Hetzner workers:            Firewall: only outbound, no public inbound ports
```

---

## 15. Prisma Schema (Complete)

```prisma
model Task {
  id                String       @id @default(cuid())
  userId            String
  agentId           String?
  goal              String       @db.Text
  status            TaskStatus   @default(PENDING)
  maxSteps          Int          @default(50)
  currentStep       Int          @default(0)
  toolRegistry      Json
  memoryCollection  String?
  scheduledFor      DateTime?
  cronExpression    String?
  parentTaskId      String?

  // Cost
  creditsReserved   Int          @default(0)
  creditsUsed       Int          @default(0)
  llmTokensUsed     Int          @default(0)
  computeMs         Int          @default(0)

  // Worker lease
  workerId          String?
  heartbeatAt       DateTime?

  // Result
  result            String?      @db.Text
  errorMessage      String?

  // Timestamps
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  completedAt       DateTime?

  user              User         @relation(fields: [userId], references: [id])
  steps             TaskStep[]
  toolCalls         ToolCall[]

  @@index([status, scheduledFor])
  @@index([userId, createdAt(sort: Desc)])
  @@index([workerId, heartbeatAt])
}

enum TaskStatus {
  PENDING
  CLAIMED
  RUNNING
  COMPLETED
  FAILED
  TIMEOUT
  STUCK
  CANCELLED
}

model TaskStep {
  id          String    @id @default(cuid())
  taskId      String
  stepNumber  Int
  type        StepType
  content     String    @db.Text
  metadata    Json?
  durationMs  Int?
  createdAt   DateTime  @default(now())

  task        Task      @relation(fields: [taskId], references: [id])
  toolCalls   ToolCall[]

  @@index([taskId, stepNumber])
}

enum StepType {
  PLAN
  ACTION
  REFLECTION
  FINAL
}

model ToolCall {
  id           String         @id @default(cuid())
  taskId       String
  stepId       String
  toolName     String
  toolInput    Json
  toolOutput   Json?
  status       ToolCallStatus @default(PENDING)
  creditsUsed  Int            @default(0)
  durationMs   Int?
  error        String?
  retryCount   Int            @default(0)
  createdAt    DateTime       @default(now())

  task         Task           @relation(fields: [taskId], references: [id])
  step         TaskStep       @relation(fields: [stepId], references: [id])

  @@index([taskId])
  @@index([toolName, createdAt(sort: Desc)])
}

enum ToolCallStatus {
  PENDING
  SUCCESS
  FAILED
  TIMEOUT
}

model ScheduledTask {
  id               String   @id @default(cuid())
  userId           String
  goal             String   @db.Text
  cronExpression   String
  toolRegistry     Json
  memoryCollection String?
  isActive         Boolean  @default(true)
  lastRunAt        DateTime?
  nextRunAt        DateTime?
  createdAt        DateTime @default(now())

  user             User     @relation(fields: [userId], references: [id])
}
```

---

## 16. Implementation Roadmap

### Phase 1 — Core Runtime (Ship First)
- [ ] Postgres schema + Prisma setup (tasks, task_steps, tool_calls)
- [ ] Basic worker: OBSERVE → PLAN → ACT → PERSIST (no REFLECT yet)
- [ ] `FOR UPDATE SKIP LOCKED` queue claiming
- [ ] Heartbeat loop (setInterval in worker)
- [ ] Watchdog process (dead worker recovery)
- [ ] Tool Gateway (auth + timeout + basic retry)
- [ ] MCP tools: `dispatch_background_task`, `get_task_status`, `cancel_task`
- [ ] SSE stream endpoint (`/tasks/:id/stream`)
- [ ] systemd service config (Hetzner)

**Milestone:** Nexus can run a basic f.rsrx research task end-to-end.

### Phase 2 — Production Hardening
- [ ] REFLECT phase (quality assessment + direction)
- [ ] Retry logic (`retry_task` MCP tool)
- [ ] `list_tasks` + `get_task_logs` MCP tools
- [ ] Structured observability (Pino metrics + Postgres dashboards)
- [ ] Credit reserve/refund on task completion
- [ ] Alerting (Slack webhook on worker death / high error rate)

**Milestone:** Nexus handles 50+ tasks/day reliably.

### Phase 3 — Scheduling + Memory
- [ ] Scheduler process (cron + delayed task support)
- [ ] `ScheduledTask` model + API endpoints
- [ ] f.library memory integration (OBSERVE reads, PERSIST writes)
- [ ] Per-agent memory collections
- [ ] `memory_collection` param in dispatch

**Milestone:** Agents run autonomously on schedule with persistent memory.

### Phase 4 — Developer Platform
- [ ] REST API (`/api/v1/loop/...`)
- [ ] API key generation in Nexus settings
- [ ] Developer documentation
- [ ] Rate limiting per API key
- [ ] Usage dashboard for developers
- [ ] Horizontal scaling documentation + Hetzner setup scripts

**Milestone:** External developers can use Nexus runtime via REST API.

---

## Appendix: Nexus Loop Prompt Templates

### PLAN Prompt

```
You are an agent working toward this goal: {goal}

Steps completed so far:
{steps_summary}

Available tools:
{tool_registry}

What is the single best next action to take toward the goal?
If you have enough information to complete the goal, respond with action: "DONE".
If you are stuck and need user input, respond with action: "STUCK" and explain why.

Respond in JSON:
{
  "action": "tool_call" | "DONE" | "STUCK",
  "reasoning": "why this action",
  "toolName": "tool name if action=tool_call",
  "toolInput": { ... },
  "doneResult": "final answer if action=DONE"
}
```

### REFLECT Prompt

```
You just called {toolName} with input:
{tool_input}

The result was:
{tool_output}

Evaluate this result:
1. Was it useful for the goal? (good / partial / poor)
2. What key insight did you get?
3. What should happen next?

Respond in JSON:
{
  "quality": "good" | "partial" | "poor",
  "summary": "key insight in 1-2 sentences",
  "nextDirection": "what to do next"
}
```

---

**Last Updated:** March 6, 2026  
**Next Review:** After Phase 1 ships  
**Maintained by:** Herb (AI CTO)