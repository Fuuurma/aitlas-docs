# AITLAS — Master Architecture Document
**Version:** 4.0 | **Date:** March 2026 | **Status:** CANONICAL  
**Owner:** Furma.tech | **Maintained by:** Herb (AI CTO)

> Single source of truth. Supersedes all previous versions.

---

## 1. Vision & Mental Model

### One Sentence
Aitlas is a **sovereign agentic OS** — users bring their own AI keys, connect tools via MCP, hire autonomous agents, and run long background tasks without trusting or paying any cloud AI vendor for tokens.

### Mental Model
```
The Internet             →  Browser
The OS                   →  Nexus (T3 Code fork)
The App Store            →  Agents Store
The System Utilities     →  Actions (f.xyz)
The Background Daemons   →  Nexus runtime (Ralph)
The File System          →  f.library
The Execution Sandbox    →  OpenSandbox
The Universal Connector  →  f.bridge (MCP gateway)
The Local Brain          →  ~/.aitlas/ (aitlas-cli)
The Network Layer        →  MCP
```

### Core Bets
| Bet | Why |
|-----|-----|
| BYOK always — even paid tier | Zero token liability. Furma charges compute, never tokens. |
| T3 Code fork not custom UI | Proven chat UX + free Electron desktop. Weeks saved. |
| Open source extraction | Warden, OpenSandbox, RTK, Agency Agents — don't rebuild battle-tested tools. |
| Nexus runtime as platform, not infra | External devs calling `POST /tasks` = real moat. |

---

## 2. How Ambitious Is This? (Honest Assessment)

**Ambitious product vision. Manageable build.**

The "orchestration layer" sounds scary. The actual custom code:

| What sounds scary | What it actually is |
|-------------------|---------------------|
| "Durable agent runtime" | ~300 lines Bun: poll DB, 5-phase loop, heartbeat |
| "Tool Gateway" | ~200 lines: fetch + retry + timeout + deduct credits |
| "Watchdog / recovery" | ~100 lines: find stale heartbeats, reset to PENDING |
| "Scheduler" | ~100 lines: cron loop that inserts task records |
| "Task queue" | A Postgres table + `FOR UPDATE SKIP LOCKED` |

**Total custom infrastructure: ~700-900 lines of TypeScript/Bun.**

What comes for free via open source:
| Component | Source | Status |
|-----------|--------|--------|
| Chat UI + Electron desktop | T3 Code (MIT) | Fork & modify |
| Code review engine | Warden/Sentry (FSL) | Wrap in MCP |
| Code execution sandbox | OpenSandbox/Alibaba (Apache 2.0) | Integrate TS SDK |
| Token compression | RTK (MIT, 4700★) | Drop-in library |
| 61 agent templates | Agency Agents (MIT) | Adapt YAML |
| Auth | Better Auth | Configure once |
| Vector search | pgvector (in Neon) | Already included |

**The real work:**
1. f.twyt — X API costs (~$100/mo for Basic API — verify pricing)
2. f.rsrx — research synthesis + web scraping pipeline (spec doc missing, needs writing)
3. Nexus provider router — T3 Code fork integration with Aitlas backend
4. Credit/billing UI — Stripe + balance display + purchase flow
5. Agent persona content — actual prompts for Rainmaker, Tax Ghost, etc.

**The moat:** BYOK + MCP + credits + marketplace + persistent memory, all connected. Nobody has assembled this stack.

---

## 3. Full Product Map

```
Aitlas
├── nexus.aitlas.xyz      → Nexus Web (T3 Code fork, Next.js 16)
├── nexus-desktop         → Electron app (T3 Code fork)
├── agents.aitlas.xyz     → Agents Store (Next.js 16)
├── f.xyz
│   ├── twyt.f.xyz        → f.twyt  [Mini-App, Next.js 16]
│   ├── rsrx.f.xyz        → f.rsrx  [Mini-App, Next.js 16]
│   ├── library.f.xyz     → f.library [Mini-App, Next.js 16]
│   ├── guard.f.xyz       → f.guard [Utility, Hono headless]
│   ├── support.f.xyz     → f.support [Utility, Hono headless]
│   ├── decloy.f.xyz      → f.decloy [Utility, Hono headless]
│   └── bridge.f.xyz      → f.bridge [Utility, Hono headless]
├── loop.internal         → Ralph workers (Hetzner, Bun)
└── aitlas-cli (npm)      → Local brain + repo scaffolder
```

---

## 4. Nexus (T3 Code Fork)

**Not a custom Next.js app.** Fork of `github.com/pingdotgg/t3code` + Provider Router.

### Provider Router
```
T3 Code UI (Nexus fork)
        │
        ▼
┌──────────────────────────────────────────────────────┐
│                PROVIDER ROUTER                       │
│  BYOK Mode (Free)           Aitlas Mode ($20/mo)    │
│  ─────────────────           ──────────────         │
│  Codex → user's key          Nexus Backend           │
│  Claude Code → user's key    f.xyz Actions           │
│  OpenCode → user's key       Agents Store            │
│  Gemini → user's key         Memory (pgvector)       │
│                              Tasks (Nexus runtime)          │
│                              OpenSandbox exec        │
│                              (still BYOK for LLM)   │
└──────────────────────────────────────────────────────┘
```

**Critical:** Aitlas mode is ALSO BYOK. The user brings their model key. Furma provides orchestration + tools. Furma never pays tokens.

### Aitlas Mode Gate
```
Requires: Pro subscription ($20/mo) OR credit balance >= 500
```

### UI Surfaces
| Surface | BYOK | Aitlas |
|---------|------|--------|
| Chat Panel | ✅ | ✅ |
| Actions Sidebar | ❌ Locked | ✅ |
| Agent Panel | ❌ | ✅ |
| Task Monitor | ❌ | ✅ Live Nexus runtime |
| Workflow Builder | ❌ | ✅ DAG editor |

### Instinct System (ECC Pattern)
Tool call observations → background extracts patterns → `~/.aitlas/instincts/` → injected next session.

### Memory
pgvector in Neon. Auto-compaction at phase transitions (ECC strategic compact). Relevant chunks injected at session start via semantic similarity.

---

## 5. aitlas-cli

**Three jobs:**

```bash
# Scaffolding
aitlas new ui my-product
aitlas new action f-myaction
aitlas new worker my-worker

# Local brain
aitlas init               # Create ~/.aitlas/
aitlas sync               # Sync with Nexus
aitlas instincts list
aitlas run "rainmaker"    # Run agent locally

# Agent publishing (future)
aitlas create agent my-agent
aitlas agent publish
```

### ~/.aitlas/
```
~/.aitlas/
├── instincts/
│   ├── personal/         ← Global learned patterns
│   └── projects/{hash}/  ← Per-project patterns
├── config.json
├── credentials/          ← AES-256-GCM keys (NEVER synced to cloud)
├── cache/
└── workspaces/
```

---

## 6. Agents Store + GTM Personas

### Architecture
- Browse without auth, hire → `nexus.aitlas.xyz/activate?agentId=xxx`
- 61+ seed agents from Agency Agents (adapted YAML format)

### Launch Personas (Priority Order)
| Persona | Vertical | Core Tools | Why First |
|---------|----------|-----------|-----------|
| **Rainmaker** | Marketing/Sales | f.twyt + f.rsrx | Easiest ROI, broadest market |
| **Tax Ghost** | Finance | f.vault + f.pay | High WTP, niche |
| **Bio-Hacker** | Health | f.health + f.sense | Passionate community |
| **Concierge** | Travel | f.rsrx + f.brain | Good BYOK demo |

Funnel: persona → Aitlas account → Nexus → Aitlas mode → credits.

### Revenue Share
| Event | Furma | Author |
|-------|-------|--------|
| Free agent | 100% credits | 0% |
| Premium subscription | 30% | 70% |
| Agent's f.xyz tool calls | 100% | 0% |

---

## 7. Actions (f.xyz) — Complete Registry

### Two Types (LOCKED)
**Mini-App Actions** (Next.js 16, full UI + `/api/mcp`): f.twyt, f.rsrx, f.library  
**Utility Actions** (Hono, headless MCP only): f.guard, f.support, f.decloy, f.bridge

### Tool Reference

**f.twyt** — Twitter Intelligence
| Tool | Credits |
|------|---------|
| `search_twitter` | 1 (+ filters: since/until/min_likes, engagement_score field) |
| `get_user_timeline` | 1 |
| `search_user_mentions` | 1 (brand monitoring) |
| `ingest_tweets` | 1 + 0.1/tweet (bulk → f.library) |
| `get_trending` | 0.5 (WOEID-based) |

**f.library** — Vector Knowledge Base (pgvector, OpenAI embeddings)
| Tool | Credits |
|------|---------|
| `ingest_document` | 2 (500-token chunks, 50 overlap) |
| `search_knowledge_base` | 1 |
| `retrieve_context` | 1 (LLM-ready assembled, max_tokens param) |
| `delete_document` | 0 |
| `update_document` | 2 |
| `list_collections` | 0 |

**f.rsrx** — Deep Research (spec to be written)
| Tool | Credits |
|------|---------|
| `web_search` | 2 |
| `academic_search` | 3 |
| `deep_research` | 5 |
| `synthesize_report` | 5 |
| `monitor_topic` | 10/hr |

**f.guard** — AI Code Review (Warden/Sentry engine)
| Tool | Credits |
|------|---------|
| `scan_pull_request` | 3 |
| `scan_repository` | 5 |
| `scan_commit` | 1 |
| `apply_fix` | 2 |
| `configure_webhook` | 0 (GitHub auto-scan setup) |
| `add_skill` | 1 |

GitHub webhooks auto-trigger on push/PR. Findings posted as inline PR comments.

**f.support** — Helpdesk Automation
| Tool | Credits |
|------|---------|
| `ingest_support_message` | 1 (auto-triage: category + sentiment + priority) |
| `suggest_reply` | 1 |
| `resolve_ticket` | 3 (with f.library knowledge lookup) |
| `create_ticket` | 1 |
| `get_ticket` / `list_open_tickets` | 0 |
| `update_ticket_status` | 0 |

Channels: email, chat, Twitter, Discord, web widget. Uses f.library for knowledge base.

**f.decloy** — Agent Deployment
| Tool | Credits |
|------|---------|
| `deploy_agent` | 25 + 1/min runtime |
| `invoke_agent` | 1 |
| `get_logs` / `get_status` | 0 |

Execution: `container` / `microvm` (Firecracker) / `edge`  
Providers: `railway` / `fly` / `hetzner`  
Long-term vision: `aitlas-runner` = Modal/Fly competitor.

**f.bridge** — Universal MCP Connector
```typescript
f.bridge("mcp://plaid.com/api")  // → instantly has Plaid tools
```
Registers to external MCP registries: Smithery, Pulse, mcp.get. Monetized via Nexus runtime credits.

### MCP Result Card Protocol
```typescript
// All mini-app tool responses include:
_aitlas: {
  resultId: 'report_abc123',
  deepLinkUrl: 'https://rsrx.f.xyz/reports/report_abc123',
  creditsUsed: 5,
  summary: '47 EU AI startups found.',
}
```
Nexus renders inline result card with deep link.

---

## 8. Nexus runtime — Ralph Engine

### Strategic Position
> Current: Nexus runtime powers Nexus + Agents  
> Future: Nexus runtime IS the product — REST API for external devs = real moat

### 5-Phase Execution Loop
```
① OBSERVE
   Poll: SELECT FOR UPDATE SKIP LOCKED (PENDING tasks)
   Load tool_registry, fetch memory context (if set)
   Mark CLAIMED + write worker_id + heartbeat_at

② PLAN
   LLM prompt: "Given goal + steps so far, what's the best next action?"
   Returns: { action: 'tool_call'|'DONE'|'STUCK', reasoning, toolName, toolInput }
   Persist TaskStep(type: PLAN)
   If DONE → skip to PERSIST. If STUCK → notify user, pause.

③ ACT
   Route through Tool Gateway (NEVER call MCP directly)
   Gateway: auth + RTK compress + timeout + retry + credits + log
   Persist ToolCall record + TaskStep(type: ACTION)

④ REFLECT
   LLM prompt: "Tool returned X. Was it useful? What did you learn?"
   Returns: { quality: 'good'|'partial'|'poor', summary, nextDirection }
   Persist TaskStep(type: REFLECTION)
   3× consecutive 'poor' → mark STUCK

⑤ PERSIST
   Write insight to f.library (if memory_collection set + quality != 'poor')
   Update task: current_step++, heartbeat_at
   Emit SSE → Nexus Task Monitor
   REPEAT from ① or TERMINATE
```

### State Machine
```
PENDING → CLAIMED → RUNNING → COMPLETED
                         └──→ FAILED
                         └──→ TIMEOUT (max_steps)
                         └──→ STUCK (3× poor)
                         └──→ CANCELLED
```

### Worker Process
```typescript
const worker = createWorker({
  workerId: `worker-${WORKER_ID}`,
  pollIntervalMs: 5_000,       // idle
  activeIntervalMs: 100,       // active loop
  heartbeatIntervalMs: 15_000, // keep-alive
  maxConcurrentTasks: 1,       // one task per worker
});
```

### Supporting Processes (same Hetzner box)
- **Watchdog**: every 30s, find heartbeat_at < NOW()-60s → reset to PENDING
- **Scheduler**: every 10s, find scheduled_tasks where next_run_at <= NOW() → insert task record

### Cost Model (Revised)
```
Per task = 1 credit (orchestration) 
         + 2 credits/hr (compute)
         + N credits (tool calls, charged only on success)
         + 0 credits (LLM tokens — user's BYOK)
```

### Scale (Hetzner)
| Daily tasks | Config | Cost |
|-------------|--------|------|
| 0–100 | 1× CX21, 4 workers | ~€5/mo |
| 100–500 | 1× CX31, 8 workers | ~€10/mo |
| 2,000+ | 2× CX31, 16 workers | ~€20/mo |

### MCP Tools
- `dispatch_background_task` — 1cr orchestration
- `get_task_status`, `cancel_task`, `retry_task`, `list_tasks`, `get_task_logs`

### REST API (Phase 4 — Developer Platform)
```
Base: https://api.aitlas.xyz/v1/loop
Auth: Bearer <aitlas-api-key>
POST /tasks | GET /tasks/:id | GET /tasks/:id/stream (SSE) | POST /schedules
```

### Prompt Templates
**PLAN:**
```
Goal: {goal}
Steps so far: {steps_summary}
Memory context: {memory_context}
Available tools: {tool_registry}

What is the single best next action? 
JSON: { "action": "tool_call"|"DONE"|"STUCK", "reasoning", "toolName", "toolInput", "doneResult" }
```

**REFLECT:**
```
Called {toolName} with: {input}
Result: {output}
JSON: { "quality": "good"|"partial"|"poor", "summary", "nextDirection" }
```

---

## 9. Tool Gateway

Central routing layer. Workers call this function — never MCP servers directly.

```typescript
export async function executeToolCall(req: ToolCallRequest): Promise<ToolCallResult> {
  // 1. Credit pre-check (before network)
  await checkCredits(req.userId, tool.creditCost);
  // 2. Resolve endpoint
  const endpoint = await getToolEndpoint(req.userId, req.toolName);
  // 3. Create tool_call record (PENDING)
  // 4. RTK compress input
  const input = await rtk.compressInput(req.toolInput);
  // 5. Execute with timeout + exponential backoff retry
  const raw = await withTimeout(callMCPTool(endpoint, req.toolName, input), timeoutMs);
  // 6. RTK compress output before returning to LLM
  const output = await rtk.compressOutput(req.toolName, raw);
  // 7. Deduct credits ONLY on success
  await deductCredits(req.userId, tool.creditCost, reason);
  // 8. Update tool_call record (SUCCESS)
  return { success: true, output, creditsUsed, durationMs };
}
```

---

## 10. RTK — Token Compression

**RTK (Rust Token Killer)** — MIT, 4,700+ stars. Inside Tool Gateway. Free to users.

| Command | Without RTK | With RTK | Savings |
|---------|-------------|----------|---------|
| `npm test` | ~25,000 tokens | ~2,500 | -90% |
| `git diff` | ~10,000 tokens | ~2,500 | -75% |
| `git status` | ~2,000 tokens | ~400 | -80% |

Integration point: Tool Gateway compresses tool output before returning to PLAN/REFLECT LLM call.

Open question: Rust FFI vs TypeScript reimplementation.

---

## 11. Workflow System

Multi-agent DAG pipelines. "Zapier for AI Agents."

```json
{
  "name": "Research & Publish",
  "trigger": "manual",
  "nodes": [
    { "id": "1", "type": "agent", "config": { "agent": "researcher" } },
    { "id": "2", "type": "action", "config": { "action": "f.rsrx" } },
    { "id": "3", "type": "agent", "config": { "agent": "writer" } },
    { "id": "4", "type": "action", "config": { "action": "f.twyt" } }
  ],
  "edges": [{ "from": "1", "to": "2" }, { "from": "2", "to": "3" }, { "from": "3", "to": "4" }]
}
```

Node types: `agent` | `action` | `condition` | `wait`  
Triggers: `manual` | `webhook` | `schedule`

---

## 12. OpenSandbox

[github.com/alibaba/OpenSandbox] — Apache 2.0.

```typescript
const sandbox = await Sandbox.create({ image: 'opensandbox/code-interpreter:v1.0.1', timeout: 300 });
const result = await sandbox.commands.run('python3 -c "print(1+1)"');
await sandbox.kill();
```

Security: gVisor (default) / Kata / Firecracker. Used by Nexus runtime workers + f.decloy.

Sandbox MCP tools: `execute_code` (2cr), `run_command` (1cr), `browse_web` (3cr).

---

## 13. Open Source Map

| Project | License | Used For |
|---------|---------|---------|
| T3 Code | MIT | Nova + Electron |
| OpenSandbox (Alibaba) | Apache 2.0 | Code/sandbox execution |
| RTK | MIT | Token compression |
| Warden (Sentry) | FSL-1.1 | f.guard engine |
| Agency Agents | MIT | 61 agent templates |
| ECC | MIT | Hooks + instinct format |
| Crush | FSL-1.1 | AGENTS.md format |
| Trigger.dev | Apache 2.0 | Nexus runtime patterns |
| CrewAI | MIT | Orchestration patterns |
| OpenCode | MIT | BYOK arch reference |

---

## 14. Shared Infrastructure

- **Neon Postgres**: single instance, eu-west-2, pgvector enabled, DB branching per PR
- **Upstash Redis**: rate limiting + short-term memory cache (NOT task queue — that's Postgres)
- **Shared secrets** (identical across ALL services):
  - `ENCRYPTION_KEY` — 64 hex chars, AES-256 BYOK
  - `BETTER_AUTH_SECRET` — cross-service sessions
  - `FURMA_INTERNAL_SECRET` — service-to-service auth
- All in 1Password: `Aitlas/Production`

---

## 15. Database Schema

Key models (see full schema in aitlas-nexus prisma/schema.prisma):

**Core:** User, Session, ApiKey (encrypted BYOK)

**Credits:** CreditLedgerEntry (append-only, balance snapshot), CreditReservation

**Nexus runtime:** Task, TaskStep, ToolCall, ScheduledTask  
- Task status: `PENDING | CLAIMED | RUNNING | COMPLETED | FAILED | TIMEOUT | STUCK | CANCELLED`
- TaskStep type: `PLAN | ACTION | REFLECTION | FINAL`
- ToolCall status: `PENDING | SUCCESS | FAILED | TIMEOUT`

**Agents:** Agent, UserAgent

**Tools:** ToolRegistry (per-user, with trust level: native/verified/external)

**Memory:** Memory (pgvector, types: EPISODIC/SEMANTIC/STATE)

**Workflows:** Workflow (nodes+edges JSON), WorkflowExecution

**Observability:** Event (everything emits events — task.*, agent.*, credits.*, tool.*)

---

## 16. Auth

Better Auth (self-hosted, Neon). Cross-subdomain cookies for `*.aitlas.xyz` and `*.f.xyz`:

```typescript
advanced: {
  crossSubdomainCookies: { enabled: true, domain: '.aitlas.xyz' }
}
```

Service-to-service: `Authorization: Bearer <session_token>` + `X-Furma-Internal: <secret>`

---

## 17. Credit System

### Pricing
| Item | Credits |
|------|---------|
| Pro/mo | +500 granted |
| Pack 100 | $1 |
| Pack 1,000 | $8 (20% off) |
| f.twyt search | 1 |
| f.library ingest | 2 |
| f.rsrx research | 5 |
| f.guard PR scan | 3 |
| f.support auto-resolve | 3 |
| execute_code | 2 |
| Nexus runtime orchestration | 1 (flat) |
| Nexus runtime compute | 2/hr |
| f.decloy deploy | 25 |
| f.decloy runtime | 1/min |

### Rules
- Append-only ledger (never UPDATE credits directly)
- Atomic: credit check + task create in one transaction
- Reserve on dispatch → settle on completion → refund unused
- NEVER charge for failed tool calls

---

## 18. BYOK Model

Both modes BYOK. Furma never pays for LLM tokens.

```
Free (BYOK mode):    user pays API provider. Furma: $0.
Paid (Aitlas mode):  user STILL pays API provider.
                     Furma charges credits for compute/tools only.
```

Key lifecycle: encrypted → stored in ApiKey table → fetched by worker at runtime → decrypted inline per LLM call → never logged, never in task record.

---

## 19. Security

- `decryptApiKey()` result: NEVER assigned to named variable
- NEVER log near API key data
- ALL DB mutations: `$transaction`
- ALL inputs: Zod validation before logic
- Rate limiting: ALL public routes (Upstash)
- `userId`: ALL Prisma queries
- Credits: deducted ONLY after successful execution
- ENCRYPTION_KEY: rotate every 90 days

---

## 20. MCP Protocol

`POST /api/mcp`, JSON-RPC 2.0, all f.xyz services.

Methods: `initialize` | `tools/list` | `tools/call` | `ping`

Aitlas error codes: -32001 (tool error) | -32002 (auth) | -32003 (credits) | -32004 (rate limit)

Tool naming: `snake_case`. Each declares `inputSchema` (JSON Schema) + `creditCost`.

---

## 21. Deployment Map

| Service | Host | Template |
|---------|------|----------|
| Nexus web | Vercel | T3 Code fork |
| Nexus desktop | Self-dist | Electron |
| Agents Store | Vercel | ui-template |
| f.twyt/rsrx/library | Vercel | ui-template |
| f.guard/support/decloy/bridge | Vercel | action-template |
| Nexus runtime + watchdog + scheduler | Hetzner CX21 | worker-template |
| OpenSandbox | Hetzner (Docker) | internal |
| PostgreSQL | Neon eu-west-2 | — |
| Redis | Upstash | — |
| DNS | Cloudflare | — |

**Launch cost: ~€5/mo**

---

## 22. Templates

```
aitlas-ui-template     → Next.js 16 + Bun + shadcn/ui + Better Auth
aitlas-action-template → Hono + Bun + Zod + MCP server
aitlas-worker-template → Bun + Postgres queue + Tool Gateway + RTK
aitlas-cli             → Bun CLI (scaffold + local brain + publish)
```

---

## 23. API Conventions

```
URL:     /api/v1/[resource]/[id]/[action]
MCP:     POST /api/mcp

Success: { success: true, data: {...}, meta: { requestId, timestamp } }
Error:   { success: false, error: { code, message, details } }
```

---

## 24. Decision Log

| Decision | Chosen | Rejected | Reason |
|----------|--------|----------|--------|
| Next.js version | **16** | 15 | v16 is current |
| Nova | T3 Code fork | Custom | Free Electron + proven UX |
| Task queue | Postgres `FOR UPDATE SKIP LOCKED` | Redis Streams | Zero new infra |
| Execution sandbox | OpenSandbox | Build custom | Apache 2.0, TS SDK, Firecracker |
| Code review | Warden (Sentry) | Build custom | Production-ready, auto-fix |
| Token compression | RTK | Custom regex | MIT, -80% tokens, <10ms |
| Repo structure | Polyrepo | Monorepo | AI context collapse prevention |
| Auth | Better Auth | Clerk, NextAuth | Self-hosted, BYOK-safe |
| DB | Neon Postgres | PlanetScale, Supabase | pgvector, branching |
| @aitlas/sdk | **NOT in v1** | Ship in v1 | Premature — wait for 10+ repos |
| f.guard type | Hono headless v1 | Full mini-app | Ship faster |
| Queue transport | Postgres polling | Redis Streams | Simpler, zero new infra (confirmed in f-loop.md) |

---

## Stale Documents

| Doc | Issue |
|-----|-------|
| MASTER_ARCHITECTURE v1-v3 | Missing RTK, Tool Gateway, Workflow, Event system, full Nexus runtime spec |
| TECHNICAL_ARCHITECTURE.md | Older patterns, pre-Tool Gateway |
| ARCHITECTURE_SPEC.md (queue section) | Says Redis Streams — superseded by Postgres polling decision |
| Any doc: "10 credits/hr" | Revised: 1cr flat + 2/hr + tool credits |

---

---

## 30. Extensible Loop (Developer Platform)

### The Core Question
> **Is Nexus runtime an internal runtime... or a programmable economic layer?**

**Answer: Nexus runtime is a Public Runtime Protocol.**

### Hook System
Developers can plug into the execution loop:

```typescript
before_reasoning()    // Pre-planning logic
after_reasoning()     // Post-planning analysis
before_action()       // Pre-tool validation
after_action()        // Post-tool logging
memory_hook()         // Custom memory systems
policy_hook()         // Security/compliance
billing_hook()        // Custom billing
safety_hook()         // Safety guardrails
```

### Three-Layer Economy

| Layer | What | Monetization |
|-------|------|--------------|
| **Agent Economy** | Agents = apps | Revenue share |
| **Action Economy** | Actions = APIs | Per-call credits |
| **Runtime Economy** | Hooks = infrastructure | Per-loop credits |

**Design Principle:**
> Anything the core system can do inside the loop, developers should be able to extend.

### Developer Platform API

```
POST /tasks          # Dispatch agent workflow
GET /tasks/:id       # Check status
STREAM /tasks/:id    # Real-time updates
POST /hooks          # Register loop hooks
GET /hooks/:id       # List hooks
```

---

## 31. Agent Distribution (Viral Mechanism)

### The Problem with Marketplaces
Most marketplaces fail because they rely on **discovery** (browse store) instead of **distribution** (spread through use).

| Failed Model | Success Model |
|--------------|---------------|
| GPT Store, Hugging Face | WhatsApp, Slack, Notion |
| Users browse store | Users receive from others |
| Discovery-based | Distribution-based |

### The Solution: Agents as Shareable Artifacts

```
User → receives agent link → uses it → keeps/forks it
```

**NOT:**
```
User → browses store → installs
```

### `.aitlas-agent` Format

Single-file share format containing:
- Agent config (persona, prompts)
- Skills (capabilities)
- Dependencies (required actions)
- Action requirements (MCP tools needed)

### Viral Loop

1. Creator builds: "Startup Research Agent"
2. Shares link: `aitlas.com/a/startup-research-agent`
3. Recipient opens in Nexus → Options: Run, Duplicate, Install, Edit
4. Recipient forks → "PRD Generator for SaaS"
5. Ecosystem evolves organically

### GitHub Model for Agents

```
fork agent → add actions → improve prompts → share version
```

### Hidden Advantage: BYOK Portability

Agents don't depend on Aitlas API billing → They can move freely across:
- Nexus instances
- Teams
- Git repos
- External platforms

---

---

## 32. "Docker for Agents" Architecture

### The Analogy

| Docker | Aitlas |
|--------|--------|
| Dockerfile | **AgentSpec** |
| Image | **AgentImage** |
| Container | **AgentInstance** |
| Docker Hub | **Agent Store** |
| Kubernetes | **f.deploy infrastructure** |

### AgentSpec Format

```yaml
agent:
  name: startup-research
  version: 1.2

runtime:
  loop: Nexus runtime

skills:
  - web_research
  - summarization

actions:
  - twyt.post
  - library.search

permissions:
  - internet
  - files

memory:
  type: vector
```

### Three-Layer Ecosystem

| Layer | What | Analogy |
|-------|------|---------|
| **Agent Images** | Portable agents | Docker images |
| **Actions** | MCP tools | APIs/plugins |
| **Deployment Targets** | f.deploy targets | Kubernetes clusters |

### Deployment Targets

- Local machine
- Cloud workers (Hetzner)
- Enterprise server
- Edge device
- CI/CD pipeline

### The Wild Scenario

If Aitlas becomes the standard runtime:
- OpenAI → Model provider
- Anthropic → Model provider
- **Aitlas → Execution layer above models**

### The Real Pain to Solve

> "I built an agent and want it to run anywhere."

**Nail this → Architecture becomes extremely powerful.**

---

## 33. Cold Start Strategy

### The Problem

```
No agents → No users → No agents → (vicious cycle)
```

### 3-Step Bootstrap Strategy

#### Step 1: Seed the Agent Layer (10-20 Must-Have Agents)

| Consumer | Developer |
|----------|-----------|
| Personal Research Assistant | Code Assistant |
| Social Media Scheduler | Documentation Helper |
| Health Tracker | API Analyzer |
| Travel Concierge | Test Generator |

**Goal:** Make the ecosystem look alive from day one.

#### Step 2: Make Agents Viral

| Mechanism | Example |
|-----------|---------|
| Collaborative features | Agents invite others (Notion-style) |
| Shareable outputs | Recipients need Aitlas to view |
| Copyable templates | Import like GitHub repos/Figma files |

**Goal:** One user brings another, without paid ads.

#### Step 3: Low-Friction Developer Path

```
Agent Spec → f.deploy → Agent Store
```

**Early dev incentives:**
- Revenue share from store commissions
- Prominent placement
- Analytics on usage/virality

---

## 34. Rollout Plan: Day 1 → Week 12

### Phase 0 — Prep (Before Launch)

- [ ] Seed 10-20 high-value agents (consumer + dev mix)
- [ ] Create copyable/remixable agent templates
- [ ] Preload sample data for each agent
- [ ] Build dev onboarding: Agent Spec → f.deploy → Agent Store
- [ ] Include analytics dashboard

### Phase 1 — Launch (Day 1 → Week 2)

**Users:**
- Invite 50-200 engaged users (consumers + devs)
- Give access to must-have agents pre-configured
- Enable sharing/collaboration features

**Developers:**
- Early access for 10-15 trusted devs
- Early visibility + revenue share promises
- Real user feedback

**Mechanics:**
- Functional virality: Agents create reasons to invite others
- Social proof: "This agent is used by X people"
- Leaderboard: Highlight top-performing agents

### Phase 2 — Network Effects Ignite (Week 3 → Week 6)

- [ ] Enable agent remixing (fork → modify → credit original)
- [ ] Launch multi-agent workflows (DAGs)
- [ ] Show collaboration features ("X people using this agent")
- [ ] Deploy social proof widgets ("Cloned 17 times last week")

### Phase 3 — Marketplace Expansion (Week 6 → Week 9)

- [ ] Open Agent Store to public developers
- [ ] Built-in viral hooks for every agent
- [ ] Reward program: credits for clones, shares, invites
- [ ] Curate high-quality agents for trust

### Phase 4 — Consumer Growth & Stickiness (Week 9 → Week 12)

**Goal:** Make Aitlas sticky for non-dev users.

- [ ] Highlight high-utility agents (personalized "top agents for you")
- [ ] Suggest multi-agent workflows to showcase value
- [ ] Gamify discovery (unlock new agents after interactions)
- [ ] Leaderboards for top workflows/most-used agents
- [ ] Cross-device continuity (desktop + mobile + browser)
- [ ] Social signals (opt-in sharing of results to friends)

### Phase 5 — Self-Sustaining Ecosystem (Post Week 12)

**Network effect loops:**
- Users attract other users via shared agents
- Developers motivated to build (used, shared, rewarded)
- Multi-agent workflows create sticky patterns (daily usage)

**By now:**
- Agent Store full of useful agents
- Workflows show ecosystem depth
- Functional virality drives organic growth

**Focus shifts to:**
- Refining monetization
- Expanding marketplace
- Adding new verticals

---

## Key Principles Summary

| Principle | Description |
|-----------|-------------|
| **Seed vs Organic** | Seed agents first → organic network effect follows |
| **Functional Virality** | Users spread platform because agents *require sharing* |
| **Developer Incentives** | Low friction + clear feedback + rewards |
| **Consumer Stickiness** | Multi-agent workflows + personalized suggestions |
| **Cold Start Solved** | Small cohort → functional virality → supply + demand loop |

---

**Last Updated:** March 2026  
**Maintained by:** Herb (AI CTO) + Furma (CEO)

> *Build fast. Stay sovereign. Zero token liability. Nexus runtime is the product.*

| Capability | Why | Priority |
|------------|-----|----------|
| Persistent Memory | LLMs forget between sessions | P0 |
| Auto-Compaction | LLMs don't auto-summarize | P0 |
| Agent Orchestration | Multi-agent coordination | P1 |
| Codebase Search | Semantic file search | P1 |
| Tool Ecosystem | 68+ pre-built tools | P1 |

---

## 26. Dependency Graph

```
Nova ──────────────────────────────┐
Agents Store ──────────────────────┐ │
f.twyt / f.rsrx / f.library ────┐ │ │
                                ▼ ▼ ▼
                              Nexus runtime (Ralph)
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
              Tool Gateway              Postgres queue
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
      f.xyz    OpenSandbox  3rd-party
    actions                MCPs
```

**Key insight:** Without Nexus runtime, Aitlas is just a chat UI. With it, Aitlas is an agent that works while you sleep.

---

## 27. Tool Access Matrix

| Agent | f.finance | f.crypto | f.vault | f.scrape | f.news |
|-------|-----------|----------|---------|----------|--------|
| f.investor | ✅ | ✅ | ❌ | ✅ | ✅ |
| f.coder | ❌ | ❌ | ✅ | ✅ | ❌ |
| f.researcher | ❌ | ❌ | ❌ | ✅ | ✅ |
| f.hacker | ❌ | ✅ | ✅ | ✅ | ❌ |

---

## 28. How They Work Together

### Example: User asks "Build me a landing page"

```
┌──────────────────────────────────────────────────────────────┐
│ NEXUS (UI)                                                   │
│   User: "Build me a landing page for my SaaS"               │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ F.LOOP (Orchestrator)                                        │
│                                                              │
│   1. CLASSIFY → Frontend Specialist agent                   │
│   2. CREATE CREW:                                            │
│      ├── Designer Agent (layout)                             │
│      ├── Coder Agent (implementation)                        │
│      └── Reviewer Agent (quality check)                      │
│   3. EXECUTE FLOW:                                           │
│      @start → Designer creates mockup                        │
│      @listen → Coder implements in React                     │
│      @listen → Reviewer checks accessibility                 │
│   4. USE ACTIONS:                                            │
│      ├── file_write (create components)                      │
│      ├── bash (run dev server)                               │
│      └── git_check (commit changes)                          │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ NEXUS (UI)                                                   │
│   Show: Live preview, files created, git status              │
│   Agent: "Landing page created! 5 components, deployed."     │
└──────────────────────────────────────────────────────────────┘
```

---

## 29. Open Source Leverage

| Component | Source | What We Use |
|-----------|--------|-------------|
| **Nova** | T3 Code | Desktop + web app, provider router |
| **Orchestration** | CrewAI | Flows (control) + Crews (teams) |
| **Handoffs** | OpenAI Agents SDK | Agent-to-agent delegation |
| **Classification** | Agent Squad | Intent routing |
| **Reactions** | Agent Orchestrator | Auto-handling |
| **State** | LangGraph | Checkpointing, persistence |
| **Context** | Crush | AGENTS.md format |

---

**Last Updated:** March 2026  
**Maintained by:** Herb (AI CTO) + Furma (CEO)

---

## 35. Agent Store Monetization

### Revenue Models

| Model | Description | Revenue |
|-------|-------------|---------|
| **Commission** | 10-30% per agent sale/subscription | Per-transaction |
| **Premium Features** | Higher limits, multi-agent, MCP access | Freemium → paid |
| **Subscription Pass** | Unlimited access to curated agents | Monthly recurring |
| **Featured Placement** | Brands pay for spotlight | Marketing revenue |
| **Custom Services** | Enterprise custom agent creation | Consulting + hosting |

### Key Principle
> The store should incentivize sharing and usage, not just purchases. Each paid agent should still trigger functional virality, so revenue and ecosystem growth happen together.

---

## 36. Actions Ecosystem Classification

### 1. Core Engine Actions (Infrastructure)

| Action | Purpose | Monetization |
|--------|---------|--------------|
| Nexus runtime | Execution layer | API usage, premium capacity |
| f.deploy | Deployment | Developer subscription |
| f.flow | Workflow orchestration | Premium workflows |
| f.mcp | MCP gateway | API access |

### 2. Productivity / Knowledge Actions

| Action | Purpose | Monetization |
|--------|---------|--------------|
| f.library | Vector knowledge base | Premium content subscriptions |
| f.research | Deep research | Tiered access |
| f.memory | Agent memory | Storage tiers |
| f.assistant | General assistant | Freemium |
| f.vault | Secure storage | Storage tiers |

### 3. Business / Finance Actions

| Action | Purpose | Monetization |
|--------|---------|--------------|
| f.pay | Payments | Transaction fees |
| f.crm | Customer management | Multi-user access |
| f.crypto | Crypto data/trading | API access |
| f.finance | Financial data | Business intelligence |

### 4. Data / Intelligence Actions

| Action | Purpose | Monetization |
|--------|---------|--------------|
| f.news | News feeds | Premium feeds |
| f.scrape | Web scraping | Compute-based |
| f.google | Google integration | API access |

### 5. Niche / Engagement Actions

| Action | Purpose | Monetization |
|--------|---------|--------------|
| f.sports | Sports data | Affiliate/partnerships |
| f.bets | Betting integration | Affiliate |
| f.psychology | Mental wellness | Premium experiences |
| f.language | Language learning | Subscription |
| f.hack | Security tools | Premium access |


### 6. Support / Safety Actions

| Action | Purpose | Monetization |
|--------|---------|--------------|
| f.guard | Trust, safety, moderation | Premium monitoring (enterprise) |
| f.support | Helpdesk automation | Enhanced features (business) |

---

## 37. Integrations & Ecosystem Growth

### Integration Architecture

- All actions exposed via MCP → agents dynamically call them
- Nexus = central UI for all integrations

### Ecosystem Growth Tie-In

Actions act as **functional virality triggers:**

| Action | Viral Mechanism |
|--------|-----------------|
| f.pay | Workflow → notification → invite friends → credits to creator |
| f.research | Results shared → invite others → ecosystem grows |

**Key:** Tie monetization to actual usage and adoption, not just upfront purchase.

---

## 38. Agent Store: Forking Strategy

### Forking Trade-offs

| Pros | Cons |
|------|------|
| Encourages experimentation | May dilute revenue |
| Helps ecosystem growth | Complicates curated quality |
| Network effects (more forks = more users) | Users may find low-quality forks |

### Strategic Compromise

**Allow forks under conditions:**

1. Forks pay royalty/commission to original creator
2. Forks inherit base credit cost via Nexus runtime usage
3. Original agents remain "premium"
4. Forks can only be free/limited versions

**Result:** Virality without cannibalizing revenue

### Core Aitlas Agents

**Must have:** Default, high-quality agents shipped with platform.

**Purpose:**
- Showcase best practices → inspire developers
- Provide immediate value for consumers
- Anchor ecosystem growth

**Monetization:**
- Free for adoption to drive ecosystem usage
- OR partially gated: advanced features require subscription/credits

---

## 39. Actions Monetization: Nexus runtime Credits + Mini SaaS

### The Model

```
All actions → Nexus runtime → credits
```

### Monetization Layers

| Layer | Description |
|-------|-------------|
| **Base** | Every action call costs credits via Nexus runtime |
| **Subscription** | Higher limits / premium features |
| **Transaction** | Fees for business actions (f.pay, f.crypto) |
| **Tiered** | f.library premium research, f.language advanced lessons |

### Implications

- Single monetization backbone
- Every agent/user interaction passes through Nexus runtime → generates revenue
- Actions become essential hooks for network usage


---

## 40. Product Rename (2026-03-09)

### Changes

| Old Name | New Name | Description |
|----------|----------|-------------|
| Nova | **Nova** | Dashboard, chat, tasks |
| Nexus runtime | **Nexus** | Core product - agent runtime |

### New Product Structure (4 Products)

| Product | Domain | Description |
|---------|--------|-------------|
| **Nova** | nova.aitlas.xyz | UI - dashboard, chat, tasks |
| **Nexus** | nexus.aitlas.xyz | Agent runtime (formerly Nexus runtime) |
| **Agents Store** | agents.aitlas.xyz | Marketplace of agents |
| **Actions** | f.xyz | MCP tools |

### Key Insight

> Nexus runtime was never "just an action" - it's the core product. The rename reflects reality: Nexus IS the product.

### Updated Architecture

```
Aitlas
├── Nova (UI) ───────────────────── Calls Nexus via MCP
├── Agents Store ────────────────── Agents reference Nexus capabilities
├── Actions (f.xyz tools) ───────── Executed by Nexus via Tool Gateway
└── Nexus (Agent Runtime) ───────── POWERS EVERYTHING
    ├── Tool Gateway ────────────── Centralized auth, RTK, retry, credits
    ├── Postgres Queue ──────────── FOR UPDATE SKIP LOCKED
    └── Workers (Bun) ───────────── Durable agent execution
```

