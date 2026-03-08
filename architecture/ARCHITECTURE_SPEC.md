# Aitlas - Architecture Specification

**Version:** 1.0.0  
**Date:** March 6, 2026  
**Status:** Production Design

---

## 1. System Architecture

```
Aitlas OS
│
├── Nexus (Agent workspace / IDE)
│
├── Agents (Agent marketplace)
│
├── Actions (native f.xyz tools)
│
├── MCP Layer (external integrations)
│
└── Loop Engine (durable execution)
```

---

## 2. Core Components

### 2.1 Nexus (The Hub)

- Next.js 16 application (App Router)
- Dual-mode chat (Free/BYOK vs Agentic Mode)
- Project management
- Agent workspace
- Credit management

### 2.2 Loop Engine (f.loop)

Durable execution engine powered by the **Ralph Loop**:

```
OBSERVE → REASON → ACT → REPEAT
```

**Tech Stack:**
- Runtime: Bun
- Queue: Upstash Redis Streams
- Workers: Distributed (Hetzner / Fly.io)
- State: PostgreSQL (Neon)

### 2.3 Agent Store

Marketplace for real software agents (not just prompts).

### 2.4 Actions (f.xyz)

Native sovereign tools - the **real moat**.

---

## 3. Queue Architecture

**❌ Problem:** Polling does not scale.

**✅ Solution:** Event-driven queue.

```
Next.js API
 │
 ▼
Postgres (Task Record)
 │
 ▼
Redis Streams (Upstash)
 │
 ▼
Loop Engine Workers
```

**Why Redis Streams:**
- Already using Upstash Redis
- Consumer groups support
- Persistent messages
- Horizontal scaling

---

## 4. Task System Design

### Task Model

```prisma
model Task {
  id          String   @id @default(cuid())
  userId      String
  agentId     String?
  workflowId  String?
  
  status      String   @default("PENDING")
  // PENDING → QUEUED → RUNNING → COMPLETED/FAILED
  
  priority    Int      @default(0)
  
  input       Json
  result      Json?
  
  totalSteps  Int      @default(0)
  creditsUsed Int      @default(0)
  
  logs        Json[]   @default([])
  
  createdAt   DateTime @default(now())
  startedAt   DateTime?
  completedAt DateTime?
  
  steps       Step[]
  
  @@index([status, createdAt])
  @@index([userId])
}
```

### Step Model (Critical for Debugging)

```prisma
model Step {
  id        String   @id @default(cuid())
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id])
  
  stepNum   Int
  action    String   // "search", "llm_call", "tool_use"
  tool      String?  // "f.rsrx", "f.twyt"
  
  input     Json
  output    Json?
  
  latency   Int?     // milliseconds
  credits   Int      @default(0)
  
  status    String   @default("PENDING")
  error     String?
  
  createdAt DateTime @default(now())
  
  @@index([taskId])
}
```

---

## 5. Memory Layer

Agents without memory = useless.

### Memory Types

| Type | Purpose | Storage |
|------|---------|---------|
| **Short-term** | Current conversation | Redis (TTL: 1hr) |
| **Episodic** | Task history | PostgreSQL |
| **Semantic** | Knowledge retrieval | pgvector |
| **Agent State** | Loop state | PostgreSQL (TaskQueue) |

### Memory Model

```prisma
model Memory {
  id          String   @id @default(cuid())
  userId      String
  agentId     String?
  
  type        String   // "EPISODIC", "SEMANTIC", "STATE"
  content     String   @db.Text
  embedding   Unsupported("vector(1536)")?
  
  metadata    Json?
  
  // For semantic search
  @@index([userId, type])
}
```

---

## 6. Event System

Everything emits events for observability, analytics, and debugging.

### Event Types

```
task.created
task.queued
task.started
task.step.completed
task.step.failed
task.completed
task.failed

agent.spawned
agent.step
agent.completed

credits.purchased
credits.used
credits.low

tool.called
tool.failed
```

### Event Model

```prisma
model Event {
  id        String   @id @default(cuid())
  userId    String?
  
  type      String
  entity    String   // "task", "agent", "credits"
  entityId  String?
  
  data      Json
  
  createdAt DateTime @default(now())
  
  @@index([type, createdAt])
  @@index([userId, type])
}
```

---

## 7. Workflow System (The Killer Feature)

Multi-agent pipelines - "Zapier for AI Agents"

### Workflow Model

```prisma
model Workflow {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  
  // DAG definition
  nodes       Json     // [{id, type, config}]
  edges       Json     // [{from, to, condition}]
  
  isActive    Boolean  @default(true)
  trigger     String?  // "manual", "webhook", "schedule"
  
  executions  WorkflowExecution[]
  
  createdAt   DateTime @default(now())
}

model WorkflowExecution {
  id          String   @id @default(cuid())
  workflowId  String
  workflow    Workflow @relation(fields: [workflowId], references: [id])
  
  status      String   @default("PENDING")
  input       Json
  output      Json?
  
  startedAt   DateTime?
  completedAt DateTime?
  
  @@index([workflowId, status])
}
```

### Example Workflow

```json
{
  "name": "Research & Publish",
  "nodes": [
    { "id": "1", "type": "agent", "config": { "agent": "researcher" } },
    { "id": "2", "type": "action", "config": { "action": "f.rsrx" } },
    { "id": "3", "type": "agent", "config": { "agent": "writer" } },
    { "id": "4", "type": "action", "config": { "action": "f.twyt" } }
  ],
  "edges": [
    { "from": "1", "to": "2" },
    { "from": "2", "to": "3" },
    { "from": "3", "to": "4" }
  ]
}
```

---

## 8. MCP Strategy (Three Layers)

| Layer | Trust | Examples |
|-------|-------|----------|
| **Native (f.xyz)** | High | f.rsrx, f.guard, f.twyt |
| **Verified MCP** | Medium | Google Search MCP, Slack MCP |
| **External MCP** | Low | User-added, community |

### MCP Registry Model

```prisma
model MCPRegistry {
  id          String   @id @default(cuid())
  name        String   @unique
  displayName String
  description String   @db.Text
  
  type        String   // "NATIVE", "VERIFIED", "EXTERNAL"
  
  mcpEndpoint String
  inputSchema Json
  outputSchema Json?
  
  creditCost  Int      @default(0)
  
  isVerified  Boolean  @default(false)
  isActive    Boolean  @default(true)
  
  // Usage stats
  callCount   Int      @default(0)
  failRate    Float    @default(0)
  
  @@index([type, isActive])
}
```

---

## 9. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Vercel (Edge)                            │
│  - Nexus UI                                                 │
│  - API Routes (quick <15s)                                  │
│  - Auth (NextAuth)                                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Redis Streams
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 Hetzner / Fly.io                             │
│  - Loop Engine Workers                                       │
│  - Long-running agents (15s - 24h)                          │
│  - Ralph Loop Execution                                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Neon (PostgreSQL)                         │
│  - Users, Credits, Tasks                                     │
│  - Agent Store                                               │
│  - Tool Registry                                             │
│  - Memory (pgvector)                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Upstash Redis                             │
│  - Rate Limiting                                             │
│  - Queue (Streams)                                           │
│  - Short-term Memory                                         │
│  - Caching                                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Observability

**Required for debugging agents:**

| Component | Tool |
|-----------|------|
| Tracing | OpenTelemetry |
| Metrics | Prometheus |
| Dashboards | Grafana |
| Logs | Pino + Loki |
| Errors | Sentry |

### Key Metrics

```
task.latency.p50
task.latency.p99
task.success_rate
agent.step_latency
credits.burn_rate
mcp.call_latency
mcp.error_rate
```

---

**Last Updated:** March 6, 2026  
**Maintained by:** Furma.tech Engineering