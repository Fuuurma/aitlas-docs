# aitlas-loop — Original Nexus Runtime

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---
**Status:** 🔵 Historical / Replaced  
**Reference:** [Fuuurma/aitlas-loop](https://github.com/Fuuurma/aitlas-loop) (private)  
**Type:** Internal repository  
**Replaced by:** Nexus (products/nexus/nexus.md)

---

## Overview

**aitlas-loop** = Original internal repository for the Nexus runtime (initially called "Ralph Loop").

This was the **first implementation** of what is now **Nexus** — the durable agent runtime for Aitlas.

---

## History

| Date | Event |
|------|-------|
| 2026-03 | Initial implementation as `aitlas-loop` |
| 2026-03 | Rebranded to "Ralph Loop" |
| 2026-03 | Final rebranding → **Nexus** runtime |

---

## Architecture (from era)

### Stack

| Component | Technology |
|-----------|------------|
| Runtime | Bun |
| Database | Neon (PostgreSQL) |
| Queue | Postgres polling |
| Workers | Long-running Bun processes |
| Deployment | Hetzner |

### Key Files

```
/opt/aitlas-loop/
├── worker.ts          # Worker process
├── src/
│   ├── tasks/        # Task handlers
│   ├── tools/        # Tool executor
│   └── memory/       # Memory engine
├── .env              # Configuration
└── package.json
```

---

## Execution Model

### 5-Phase Loop

1. **PLAN** — Agent decides what to do
2. **REFLECT** — Validate plan against constraints
3. **ACT** — Execute tool calls
4. **OBSERVE** — Get tool results
5. **STORE** — Update memory & state

### Task Lifecycle

```
PENDING → RUNNING → WAITING_TOOL → COMPLETED
                  ↓
                FAILED → RETRY
```

---

## Database Schema

### tasks table
```sql
id              -- UUID
agent_id        -- Which agent
status          -- PENDING, RUNNING, COMPLETED, FAILED
inputs          -- JSON
outputs         -- JSON
error           -- Error message if failed
created_at
updated_at
```

### task_steps table
```sql
id              -- UUID
task_id         -- Foreign key
phase           -- PLAN, REFLECT, ACT, OBSERVE, STORE
tool_calls      -- JSON array
results         -- JSON
```

---

## Worker Architecture

### Process Model
```
Worker Process (bun run worker.ts)
    │
    ├── Polls task queue (Postgres)
    ├── Claims task (atomic)
    ├── Runs 5-phase loop
    └── Updates status
```

### Concurrency
- 4 workers per Hetzner CX21
- Task claiming via atomic UPDATE
- No external queue needed

---

## Key Implementation Details

### Task Claiming (Concurrency-Safe)
```typescript
// Atomic claim
const task = await db.task.findFirst({
  where: { status: 'PENDING' },
  orderBy: { created_at: 'asc' }
});

await db.task.update({
  where: { id: task.id },
  data: { status: 'RUNNING', worker_id: WORKER_ID }
});
```

### Tool Execution
```typescript
async function executeTool(toolCall: ToolCall) {
  const tool = getTool(toolCall.name);
  const result = await tool.execute(toolCall.args);
  return result;
}
```

---

## Deployment

### Hetzner Setup
```bash
git clone git@github.com:Fuuurma/aitlas-loop.git /opt/aitlas-loop
cd /opt/aitlas-loop && bun install
cp /etc/aitlas/.env .env
WORKER_ID=worker-5 bun run worker.ts
```

### Services
```
Nexus-worker@1.service  # Worker process 1
Nexus-worker@2.service  # Worker process 2
Nexus-worker@3.service  # Worker process 3
Nexus-worker@4.service  # Worker process 4
```

---

## What Worked

| Feature | Status |
|---------|--------|
| 5-phase loop | ✅ Core insight kept |
| Postgres polling | ✅ Simple, no external queue |
| Bun runtime | ✅ Fast, low memory |
| Worker pattern | ✅ Horizontal scaling |

---

## 🔌 How It Fits in Aitlas

### Product Alignment

| Aitlas Product | Fit Level | Use Case |
|---------------|-----------|----------|
| **Nexus** | ✅ **Direct** | Foundation of runtime |
| **Nova** | 🔵 Reference | Task status UI |
| **Actions** | ✅ Direct | Tool execution |
| **Agents Store** | ❌ | Agent marketplace |

### This is the FOUNDATION

aitlas-loop **IS** the original Nexus. It's not external — it's what we built.

### What to Keep (Already in Nexus)

1. **5-Phase Loop** — Core to Nexus
   ```
   PLAN → REFLECT → ACT → OBSERVE → STORE
   ```

2. **Postgres Polling** — Simple queue
   ```typescript
   // Poll for pending tasks
   const task = await db.task.findFirst({
     where: { status: 'PENDING' }
   })
   ```

3. **Worker Pattern** — Scaling
   ```typescript
   // Worker process
   while (true) {
     const task = await claimTask()
     await executeTask(task)
   }
   ```

4. **Task Status Machine** — State transitions
   ```typescript
   PENDING → RUNNING → WAITING_TOOL → COMPLETED
                         ↓
                       FAILED → RETRY
   ```

### Migration to Current Nexus

| aitlas-loop | Current Nexus |
|-------------|--------------|
| worker.ts | nexus-workers |
| 5-phase loop | Enhanced with Trigger.dev |
| Simple memory | 3-layer memory |
| No MCP | MCP-first |
| Basic DB | Enhanced schema |

---

## What Changed

| Original | Current (Nexus) |
|----------|-----------------|
| "Ralph Loop" | "Nexus" |
| aitlas-loop repo | Merged into Nexus spec |
| Basic task queue | Enhanced with Trigger.dev patterns |
| Simple memory | 3-layer memory system |
| No MCP | MCP-first architecture |

---

## Current Status

**Deprecated** — Replaced by:

| Document | Purpose |
|----------|---------|
| [products/nexus/nexus.md](../nexus/nexus.md) | Full specification (41KB) |
| [NEXUS_RUNTIME_ARCHITECTURE.md](./NEXUS_RUNTIME_ARCHITECTURE.md) | Architecture research |

The concepts from aitlas-loop evolved into the comprehensive Nexus architecture documented in these files.

---

## Related

- [Nexus Spec](../nexus/nexus.md) — Current specification
- [Nexus Architecture](./NEXUS_RUNTIME_ARCHITECTURE.md) — Architecture research
- [Trigger.dev](./TRIGGERDEV_RESEARCH.md) — Foundation for v2
- [Floop Analysis](./FLOOP_ANALYSIS.md) — Competitor comparison