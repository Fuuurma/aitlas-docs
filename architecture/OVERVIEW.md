# Architecture Overview

**Aitlas = Nexus + Agents Store + Actions**

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Agents System](#2-agents-system)
3. [Actions System](#3-actions-system)
4. [Infrastructure](#4-infrastructure)
5. [Decision Records](#5-decision-records)

---

## 1. System Architecture

### What Aitlas Builds (LLMs Don't Have)

| Capability | Why | Priority |
|------------|-----|----------|
| Persistent Memory | LLMs forget between sessions | P0 |
| Auto-Compaction | LLMs don't auto-summarize | P0 |
| Agent Orchestration | Multi-agent coordination | P1 |
| Codebase Search | Semantic file search | P1 |
| Tool Ecosystem | 68+ pre-built tools | P1 |

### The Aitlas Stack

```
Aitlas
│
├── Nexus (UI) ──────────────────── Calls f.loop via MCP
│
├── Agents Store (Marketplace) ─── Agents reference f.loop capabilities
│
├── Actions (f.xyz tools) ───────── Executed by f.loop via Tool Gateway
│
├── f.loop (Agent Runtime) ←────── POWERS EVERYTHING
│   │
│   ├── Tool Gateway ────────────── Centralized auth, RTK, retry, credits
│   ├── Postgres Queue ──────────── FOR UPDATE SKIP LOCKED
│   └── Workers (Bun) ───────────── Durable agent execution
│
├── f.decloy (Agent Hosting) ────── Uses f.loop for lifecycle
│
└── MCP Registry (Curated Tools) ── Routed through Tool Gateway
```

### Dependency Graph

```
Nexus UI ──────────────────────────────┐
Agents Store ──────────────────────┐ │
f.twyt / f.rsrx / f.library ────┐ │ │
 ▼ ▼ ▼
 f.loop (Ralph)
 │
 ┌────────────┴────────────┐
 ▼ ▼
 Tool Gateway Postgres queue
 │
 ┌──────────┼──────────┐
 ▼ ▼ ▼
 f.xyz OpenSandbox 3rd-party
 actions MCPs
```

**Key insight:** Without f.loop, Aitlas is just a chat UI. With it, Aitlas is an agent that works while you sleep.

---

## 2. Agents System

### Agent Architecture

Each agent has:
1. **System Identity** - Role, persona, tone, core belief
2. **Activation Protocol** - Exact first output
3. **Diagnostic Protocol** - Data collection before advice
4. **Tool Access Matrix** - Which tools the agent can use
5. **Output Structure** - Structured response format
6. **Ongoing Rules** - Accountability, behavior checks

### Agent System Prompt Template

```json
{
  "system_identity": {
    "role": "Agent Name",
    "persona": {
      "model": "Thinks like...",
      "tone": "Direct, precise...",
      "core_belief": "The methodology...",
      "what_this_is_not": "This is not..."
    },
    "forbidden_behaviors": [
      "Behavior 1",
      "Behavior 2"
    ]
  },
  "activation_protocol": {
    "on_context_load": "Output exactly this..."
  },
  "diagnostic_protocol": {
    "method": "Sequential blocks...",
    "challenge_rule": "Name contradictions directly"
  },
  "tool_access": ["f.tool1", "f.tool2"],
  "output_structure": [...],
  "ongoing_rules": {...}
}
```

### Tool Access Matrix

| Agent | f.finance | f.crypto | f.vault | f.scrape | f.news |
|-------|-----------|----------|---------|----------|--------|
| f.investor | ✅ | ✅ | ❌ | ✅ | ✅ |
| f.coder | ❌ | ❌ | ✅ | ✅ | ❌ |
| f.researcher | ❌ | ❌ | ❌ | ✅ | ✅ |
| f.hacker | ❌ | ✅ | ✅ | ✅ | ❌ |

### See Also

- `products/agents-store/specs/f.investor.md` - Complete agent spec example
- `products/agents-store/WEALTH_ARCHITECT_ANALYSIS.md` - Professional prompt analysis

---

## 3. Actions System

### Action Categories

| Category | Actions | Description |
|----------|---------|-------------|
| **Core** | f.loop, f.library | Orchestration, memory |
| **Finance** | f.finance, f.crypto | Market data, trading |
| **Research** | f.rsrx, f.research | Web search, analysis |
| **Automation** | f.twyt, f.support | Twitter, support |
| **DevOps** | f.guard, f.decloy | Security, deployment |

### f.loop - Durable Agent Runtime

**The backbone of Aitlas.**

```
┌─────────────────────────────────────────────────────────────────┐
│                    f.loop — Ralph Engine                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ① OBSERVE - Poll queue, load task, claim                       │
│  ② PLAN - LLM decides next action                                │
│  ③ ACT - Execute tool via Tool Gateway                           │
│  ④ REFLECT - Assess quality (optional)                           │
│  ⑤ PERSIST - Save to memory, emit SSE                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Key features:**
- Postgres queue with `FOR UPDATE SKIP LOCKED`
- Tool Gateway for centralized auth/RTK/retry/credits
- SSE events for real-time UI updates
- Horizontal scaling via multiple workers

**See:** `products/actions/f-loop.md` (41KB complete spec)

### Tool Gateway

All tool calls route through a single gateway:

```
Tool Call → Tool Gateway → Auth → RTK → Retry → Execute → Log → Credits
```

**Benefits:**
- Prevents ~200 lines of duplicated code per worker
- Centralized logging and monitoring
- RTK compression (60-80% token savings)
- Credit tracking

---

## 4. Infrastructure

### Database

**PostgreSQL** for:
- Task queue
- User data
- Memory storage
- Credit ledger

**Connection:** Neon serverless (eu-west-2)

### Key Caching (ADR-001)

```typescript
// Cache BYOK API keys for 5 minutes
const keyCache = new Map<string, { key: string; expiresAt: number }>();
```

**Impact:** 90% fewer DB calls

### RTK Integration

**Rust Token Killer** - MIT licensed, 4,700★

**Benefits:**
- 60-80% token cost reduction on command outputs
- Free competitive advantage for BYOK users
- Slotted into Tool Gateway

### Deployment

| Component | Platform | Notes |
|-----------|----------|-------|
| API Gateway | Vercel | Edge functions |
| Workers | Hetzner | Bun processes |
| Database | Neon | Serverless Postgres |
| Queue | Postgres | FOR UPDATE SKIP LOCKED |

### Security

- Encrypted API keys at rest
- BYOK model (user provides keys)
- No secrets in code
- Rate limiting per tier

---

## 5. Decision Records

### ADR-001: BYOK Key Flow

**Decision:** Worker cache with 5-min TTL

**Rationale:** Fresh enough for most tasks, user rotation propagates in 5 min

**Impact:** 20-step task = 2 DB calls instead of 20

### ADR-002: REFLECT Phase

**Decision:** Opt-in, default OFF for Phase 1

**Rationale:** Simple tasks don't need overhead

**Impact:** 50% fewer LLM calls

### ADR-003: STUCK Notification

**Decision:** SSE push + optional email/webhook

**Rationale:** In-app always, email opt-in, webhook optional

### ADR-004: Phase 1 Scope

**Decision:** 3-phase loop (no REFLECT) + 3 f.rsrx tools

**Rationale:** MVP for end-to-end research task

**See:** `architecture/DECISIONS.md` for full ADRs

---

## Pricing Model

| Tier | Cost | Features |
|------|------|----------|
| BYOK | Free | Basic tools, session-only |
| Subscription | $20/mo | Memory, compaction, orchestration |
| Credits | $5/500 | Pay-per-use features |

---

**Last Updated:** 2026-03-08