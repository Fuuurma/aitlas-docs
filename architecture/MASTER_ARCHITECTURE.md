# Aitlas — Master Architecture Document
**Version:** 7.0 | **Date:** March 2026 | **Status:** CANONICAL  
**Owner:** Furma.tech | **Maintained by:** Herb (AI CTO)

> ⚠️ Proprietary. All Aitlas products are closed source.  
> This is the single source of truth. Supersedes all previous versions.  
> **Nexus implementation detail:** See `nexus-technical-doc.md` (canonical Nexus spec).

---

## Changelog from v6

| Change | Type | Reason |
|--------|------|--------|
| **Nexus engines: 8 → 10** (Workspace Manager + Codex Client) | 🔴 V1 Fix | Symphony analysis revealed critical patterns |
| **Workspace Manager** (Engine 9) — per-task sandboxed dirs, path traversal protection | 🔴 V1 Fix | Code execution needs isolation; from Symphony |
| **Codex Client** (Engine 10) — JSON-RPC 2.0 over stdio | 🟢 V1 Feature | Enables Codex/Claude Code/OpenCode as managed sessions |
| Provider type split: `:api` vs `:local_agent` | 🔴 V1 Fix | API-based and stdio-based agents need different execution paths |
| Liquid templates (Solid) in Context Builder | 🔴 V1 Fix | System prompts need dynamic variables; from Symphony |
| Tracker adapter behaviour — `fetch_candidate_tasks`, `update_task_status` | 🟢 V1 Feature | Extension point for Linear/GitHub/Jira; from Symphony |
| `nexus-technical-doc.md` created | 🟢 Docs | Full Elixir implementation spec, replaces deprecated nexus-architecture.md |
| Nova task monitor: build fresh (not cloned from Symphony UI) | 🔴 Decision | Symphony LiveView not portable to Next.js |
| Orchestrator state shape: `running` map + `claimed` MapSet | 🔴 V1 Fix | Prevents double-dispatch during poll; from Symphony |

---

## Changelog from v5

| Change | Type | Reason |
|--------|------|--------|
| Agent loop: added `max_tool_calls`, `max_tokens`, `credit_budget` hard stops | 🔴 V1 Fix | Runaway agents burn keys |
| Tool Registry: added as first-class module | 🔴 V1 Fix | Tool discovery was undefined |
| Prompt injection guard + tool argument allowlist | 🔴 V1 Fix | Security gap |
| Secrets redaction middleware in all Elixir services | 🔴 V1 Fix | Log hygiene |
| pgvector HNSW index specified | 🔴 V1 Fix | Vector search at scale |
| DB indexes on `tasks`, `tool_calls`, `task_steps` | 🔴 V1 Fix | Missing, would degrade fast |
| Short-term memory: active context in GenServer state, Redis for persistence across restarts | 🔴 V1 Fix | Reduced Redis round-trips |
| **Agent State Replay + Deterministic Execution** | 🟢 V1 Feature | Core moat — details in §12 |
| Split database logical namespaces | 🟡 V2 Future | Premature now, planned |
| libcluster / Phoenix clustering | 🟡 V2 Future | Multi-node Nexus |
| Tool versioning (`tool@v2`) | 🟡 V2 Future | Needed at first breaking change |
| Task step retention policy | 🟡 V2 Future | Archive after 90 days |
| OpenTelemetry + Prometheus + Grafana | 🟡 V2 Future | Add when volume warrants it |
| Streaming tool results (`tools/stream`) | 🟡 V2 Future | When UX demands it |

---

## Table of Contents

1. [What Aitlas Is](#1-what-aitlas-is)
2. [The Four Products](#2-the-four-products)
3. [Tech Stack (Locked)](#3-tech-stack-locked)
4. [Nova — The UI](#4-nova--the-ui)
5. [Nexus — The Agent OS](#5-nexus--the-agent-os)
6. [Agents Store](#6-agents-store)
7. [Actions](#7-actions)
8. [How They Connect](#8-how-they-connect)
9. [Templates](#9-templates)
10. [Agent Definition & Deployment](#10-agent-definition--deployment)
11. [Nexus Runtime — Deep Spec](#11-nexus-runtime--deep-spec)
12. [Agent State Replay + Deterministic Execution](#12-agent-state-replay--deterministic-execution)
13. [MCP Protocol](#13-mcp-protocol)
14. [Credit System](#14-credit-system)
15. [BYOK Model](#15-byok-model)
16. [Auth Architecture](#16-auth-architecture)
17. [Database Architecture](#17-database-architecture)
18. [Security](#18-security)
19. [Infrastructure & Deployment](#19-infrastructure--deployment)
20. [Open Source Leverage](#20-open-source-leverage)
21. [Future Roadmap (V2+)](#21-future-roadmap-v2)
22. [Decision Log](#22-decision-log)

---

## 1. What Aitlas Is

**One sentence:** Aitlas is a sovereign agentic OS — users bring their own AI keys, connect tools via MCP, hire autonomous agents, run long background tasks, and can replay, fork, and audit every execution step-by-step.

### Mental Model

```
The Browser              →  Nova (UI)
The Operating System     →  Nexus (Agent Runtime)
The App Store            →  Agents Store
The System Utilities     →  Actions (f.xyz)
The Network Layer        →  MCP
The File System          →  f.library (an Action)
The Git + Debugger       →  Replay Engine (§12) ← NEW
```

### Core Bets

| Bet | Why |
|-----|-----|
| BYOK always, even paid tier | Zero token liability. Furma charges compute, never tokens. |
| Elixir/OTP for the runtime | BEAM concurrency maps perfectly to agent execution. |
| Clone + extend over build from scratch | T3 Code, Symphony, Mission Control — weeks saved. |
| MCP as the standard | Any MCP-compatible agent works in Aitlas automatically. |
| Credits for compute only | Users never get surprised by a token bill from Furma. |
| **Deterministic replay** | Every agent run can be inspected, replayed, forked. No other platform does this. |

---

## 2. The Four Products

```
┌─────────────────────────────────────────────────────────────┐
│                        AITLAS                               │
│                                                             │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────────┐   │
│  │  NOVA    │   │    AGENTS    │   │     ACTIONS      │   │
│  │  (UI)    │   │    STORE     │   │    (f.xyz)       │   │
│  │ Next.js  │   │  Next.js +   │   │  Next.js (FE)    │   │
│  │          │   │   Elixir     │   │  Elixir (BE)     │   │
│  └────┬─────┘   └──────┬───────┘   └────────┬─────────┘   │
│       │                │                    │              │
│       └────────────────┴────────────────────┘              │
│                        │                                    │
│                        ▼                                    │
│              ┌─────────────────┐                           │
│              │     NEXUS       │                           │
│              │  (Agent OS)     │                           │
│              │  Pure Elixir    │                           │
│              │  + Replay Engine│                           │
│              └─────────────────┘                           │
│                        │                                    │
│                   Providers                                 │
│         (OpenAI / Anthropic / Gemini / local)              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack (Locked)

| Product | Frontend | Backend | DB | Host |
|---------|----------|---------|-----|------|
| Nova | Next.js 16 + TypeScript | Next.js API routes | Neon Postgres | Vercel |
| Nexus | — | Pure Elixir / Phoenix / Oban | Neon Postgres | Hetzner |
| Agents Store | Next.js 16 + TypeScript | Elixir / Phoenix | Neon Postgres | Vercel (FE) + Hetzner (BE) |
| Actions (UI) | Next.js 16 + TypeScript | Elixir / Phoenix | Neon Postgres | Vercel (FE) + Hetzner (BE) |
| Actions (headless) | — | Pure Elixir / Phoenix | Neon Postgres | Hetzner |

**All backends:** Elixir/Phoenix + Oban + Neon Postgres (from `aitlas-elixir-template`)  
**All frontends:** Next.js 16 + Bun + shadcn/ui (from `aitlas-ui-template`)  
**Shared infra:** Neon Postgres (eu-west-2), Upstash Redis, Cloudflare DNS

---

## 4. Nova — The UI

### What It Is
Nova is the user-facing shell. Intentionally a "zombie" of cloned open source repos glued together. No novel UI engineering — only integration work.

### Three Zones, Three Sources

| Zone | Source | Purpose |
|------|--------|---------|
| **Chat** | T3 Code (pingdotgg) — MIT | BYOK chat interface, provider switcher |
| **Tasks** | Symphony (OpenAI) — MIT | Task monitor, live agent progress + **Replay Viewer** |
| **Dashboard** | Mission Control (builderz-labs) — MIT | Overview, metrics, agent management |

### Two Tiers

**Free (BYOK only)**
- Chat panel with Codex, Claude Code, OpenCode integrations
- User brings their own key
- No Nexus compute, no Actions, no Agents
- Cost to Furma: $0

**Paid (subscription or credits)**
- Full Nova: chat + tasks + dashboard
- Nexus unlocked → real agent execution
- Actions available → f.xyz tools via MCP
- Agents Store → hire and run agents
- **Replay Viewer** → step-by-step agent inspection, fork, export

### Nova Data Flow

```
User sends message in Chat
        │
        ├── Simple message? 
        │   → Call provider directly (BYOK key)
        │   → Stream tokens back via SSE
        │
        └── Needs agent loop?
            → POST /api/tasks (Nexus)
            → Receive taskId immediately
            → Subscribe to Phoenix Channel (taskId)
            → Task Monitor shows live steps
            → Each PLAN/ACT/REFLECT streamed in real-time
```

### Nova Replay UI (New)

Task Monitor panel gains replay controls:

```
Agent Run #9842 — "Research EU AI startups"
────────────────────────────────────────────
Step 1 [PLAN]    ✓  "Search web for EU AI startups"
Step 2 [ACTION]  ✓  f.rsrx.web_search → 47 results
Step 3 [REFLECT] ✓  "We found 47 startups, need to filter"
Step 4 [ACTION]  ✓  f.rsrx.synthesize_report
Step 5 [FINAL]   ✓  Report generated

[ ▶ Replay ]  [ ⑂ Fork from step... ]  [ ↓ Export ]  [ ⇄ Share ]
```

---

## 5. Nexus — The Agent OS

### What It Is
The agent operating system. Built in pure Elixir/OTP. Every agent task is an OTP GenServer process. Crashes are isolated and auto-recovered by supervisors. Oban handles durability and retries.

### The Ten Internal Engines (v7 — updated from v6)

```
NEXUS RUNTIME
├── 1. Provider Router      — OpenAI / Anthropic / Gemini / local
│                             provider types: :api | :local_agent
├── 2. Context Builder      — system + history + memory + files + tools
│                             Liquid templates via Solid
├── 3. Agent Loop           — core execution brain (hardened safeguards)
├── 4. Tool Executor        — MCP + internal + API + code + filesystem
├── 5. Tool Registry        — register / resolve / validate / track
├── 6. Memory Engine        — short-term (GenServer state) + vector + episodic
├── 7. File Processor       — parse / chunk / embed / index
├── 8. Observability        — events, metrics, traces, cost tracking
│   + Replay Engine         — deterministic trace + replay (§12)
├── 9. Workspace Manager    — per-task sandboxed dirs   ← FROM SYMPHONY ← NEW
└── 10. Codex Client        — JSON-RPC 2.0 over stdio   ← FROM SYMPHONY ← NEW
                              (Codex / Claude Code / OpenCode)
```

> **Full implementation spec:** `nexus-technical-doc.md`

### 1. Provider Router

```elixir
ProviderRouter.call(%{
  model: "openai:gpt-4o",
  input: context,
  tools: tool_definitions,
  seed: task.replay_seed         # deterministic mode
})
```

Two provider types (v7):

| Type | Providers | Transport |
|------|-----------|-----------|
| `:api` | OpenAI, Anthropic, Gemini, Ollama | HTTPS/SSE |
| `:local_agent` | Codex, Claude Code, OpenCode | JSON-RPC over stdio |

Normalizes tool schemas, streaming, multimodal across `:api` providers:

| Provider | Tool format | Stream |
|----------|-------------|--------|
| OpenAI | `tools` array | SSE |
| Anthropic | `tool_use` blocks | SSE |
| Gemini | `functions` | SSE |
| Local (Ollama) | OpenAI-compat | SSE |

**Model capability registry** (v1, in-memory map):

```elixir
@model_capabilities %{
  "openai:gpt-4o"              => %{tools: true, vision: true, stream: true, max_context: 128_000},
  "openai:gpt-4o-mini"         => %{tools: true, vision: true, stream: true, max_context: 128_000},
  "anthropic:claude-3-5-sonnet"=> %{tools: true, vision: true, stream: true, max_context: 200_000},
  "anthropic:claude-3-haiku"   => %{tools: true, vision: false, stream: true, max_context: 200_000},
  "gemini:gemini-2.0-flash"    => %{tools: true, vision: true, stream: true, max_context: 1_000_000},
}
```

Nexus checks this before assembling the context — avoids passing tool schemas to models that don't support them.

### 2. Context Builder

```
system_prompt (Liquid template, rendered via Solid)
+ conversation_history    (from Postgres)
+ vector_memories         (semantic search, pgvector, HNSW index)
+ relevant_files          (from file processor)
+ tool_definitions        (from Tool Registry)
→ assembled_context
```

**System prompts are Liquid templates.** Variables: `{{ user.goal }}`, `{{ agent.name }}`, `{{ task.id }}`, `{{ memory.recent_summaries }}`, `{{ tools | map: 'name' }}`. Plain-text prompts work unchanged (no templates required).

Context compaction (v1): sliding window (last N messages) + conversation summary.  
Context compaction (v2): semantic extraction → vector memory.

### 3. Agent Loop (Hardened)

Each agent task = one OTP GenServer process. Hard limits are non-negotiable — they are set on task creation and enforced in the loop itself, not just checked at the end.

```elixir
defmodule Nexus.AgentLoop do
  use GenServer

  # Hard limits (all checked on every iteration)
  @max_iterations_default 20
  @max_tool_calls_default 50
  @max_tokens_default 200_000
  @max_runtime_ms_default 30 * 60 * 1000  # 30 min

  def run(task) do
    start_time = System.monotonic_time(:millisecond)

    while within_limits?(task, start_time) do
      context = ContextBuilder.build(task)
      prompt_hash = hash(context)                    # for replay

      response = ProviderRouter.call(task.provider, context, seed: task.seed)

      case response do
        %{tool_call: tool_call} ->
          # Prompt injection check before executing
          :ok = InjectionGuard.validate(tool_call, task.agent.tool_allowlist)

          result = ToolExecutor.run(tool_call, task)
          task = Task.append_step(task, :action, result, prompt_hash: prompt_hash)
          continue

        %{done: true, result: result} ->
          Task.complete(task, result)
          break

        %{stuck: true} ->
          Task.mark_stuck(task)
          break
      end
    end
  end

  defp within_limits?(task, start_time) do
    task.iteration < task.max_iterations and
    task.tool_calls_made < task.max_tool_calls and
    task.tokens_used < task.max_tokens and
    task.credits_used < task.credit_budget and
    System.monotonic_time(:millisecond) - start_time < task.max_runtime_ms
  end
end
```

**All five limit types enforced (v1):**

| Limit | Default | Purpose |
|-------|---------|---------|
| `max_iterations` | 20 | Loop depth |
| `max_tool_calls` | 50 | Tool spend cap |
| `max_tokens` | 200k | Key burn prevention |
| `credit_budget` | Set by user or agent spec | Cost cap |
| `max_runtime_ms` | 30 min | Wall clock timeout |

**Heuristic fallback** in the Agent Loop (catches pathological behavior before LLM reflection):

```elixir
defmodule Nexus.AgentLoop.Heuristics do
  def check(task) do
    cond do
      duplicate_tool_calls?(task)   -> {:stuck, :tool_loop}
      last_n_failed?(task, 3)       -> {:stuck, :repeated_failures}
      no_progress?(task, 5)         -> {:stuck, :no_progress}
      true                          -> :ok
    end
  end
end
```

### 4. Tool Executor

All tool calls route here. Never called directly.

```
tool_call received
      │
      ▼
InjectionGuard.validate(tool_call, allowlist)      ← NEW
      │
      ▼
ToolRegistry.resolve(tool_name)                    ← NEW
      │
      ▼
credit pre-check
      │
      ▼
execute tool (with timeout + retry)
      │
      ▼
deduct credits (ONLY on success)
      │
      ▼
hash output for replay trace                       ← NEW
      │
      ▼
log tool_call record
      │
      ▼
return result to Agent Loop
```

Tool execution is async — uses `Task.Supervisor.async_nolink` so a crashing tool doesn't kill the agent loop GenServer:

```elixir
Task.Supervisor.async_nolink(Nexus.ToolSupervisor, fn ->
  MCPClient.call(tool, arguments, timeout: tool.timeout_ms)
end)
```

### 5. Tool Registry (New — V1)

Central source of truth for all tools available to Nexus.

```elixir
defmodule Nexus.ToolRegistry do
  # Register tool when Action starts
  def register(tool_definition)

  # Resolve a tool name to its endpoint + schema
  def resolve(tool_name) :: {:ok, tool} | {:error, :not_found}

  # Validate tool call arguments against schema
  def validate(tool_name, arguments) :: :ok | {:error, reason}

  # List all tools available to a given agent spec
  def list_for_agent(agent_spec) :: [tool]

  # Track usage per tool
  def record_usage(tool_name, user_id, credits_used)
end
```

Tool definition shape:

```elixir
%Tool{
  name: "web_search",
  namespace: "f.rsrx",
  full_name: "f.rsrx.web_search",
  version: "1",                        # for future versioning
  endpoint: "https://rsrx.f.xyz/api/mcp",
  input_schema: %{...},               # JSON Schema
  credit_cost: 2,
  timeout_ms: 30_000,
  requires_auth: true
}
```

At startup, all registered Actions call `ToolRegistry.register/1`. Tool resolution is in-memory (ETS table) — zero DB round-trips during agent loop.

### 6. Memory Engine

Three memory types with updated storage split:

| Type | Storage | Where lives | TTL | Used for |
|------|---------|-------------|-----|---------|
| **Active context** | GenServer state | In-process | Session | Current loop messages, tool results |
| **Short-term persistent** | Redis (Upstash) | External | 24h | Survive GenServer restarts |
| **Vector** | pgvector (Neon) | Postgres | Permanent | Preferences, facts, project context |
| **Episodic** | Postgres | Postgres | 90 days → archive | Task history, outcomes, errors |

Active context lives in process state — no Redis round-trips during the hot agent loop. Redis is only written when a GenServer is shutting down gracefully or on significant checkpoints (for crash recovery).

**Embeddings:** v1 uses OpenAI `text-embedding-3-small` via user's BYOK OpenAI key. Embedding tokens count against the user's own key. If user has no OpenAI key, vector memory is disabled (still functional without it). This must be clearly communicated in Nova settings.

### 7. File Processor

```
Upload → Parse → Chunk → Embed (OpenAI BYOK) → pgvector (HNSW index)
```

Parsers: PDF, DOCX, Markdown, CSV, code files, images (multimodal), audio.

### 8. Observability

Event bus events:

```
agent.started | agent.completed | agent.stuck | agent.failed | agent.replayed
llm.called | llm.tokens_used | llm.latency | llm.cost
tool.executed | tool.failed | tool.timeout | tool.injection_blocked
memory.updated | memory.retrieved
task.created | task.completed | task.failed
credits.reserved | credits.deducted | credits.refunded
```

V1: structured Elixir Logger + `:telemetry` events.  
V2: OpenTelemetry → Prometheus → Grafana (when volume warrants dedicated observability infra).

### 9. Workspace Manager ← NEW (from Symphony)

Per-task sandboxed directory. Created at task dispatch, removed on completion. Critical for code execution isolation and Codex/Claude Code sessions.

```elixir
# Derived from Symphony (github.com/openai/symphony) — Apache 2.0
defmodule Nexus.Workspace do
  @workspace_root "/var/nexus/workspaces"

  # Creates: /var/nexus/workspaces/<sanitized_task_id>/
  def create(task_id) :: {:ok, workspace_path} | {:error, term}

  # Path traversal protection — prevents ../../../etc/passwd via malicious IDs
  defp validate_path(path) :: :ok | {:error, :path_escape_attempt}

  # IDs sanitized: only [a-zA-Z0-9._-], max 64 chars
  defp sanitize_id(task_id) :: String.t()
end
```

Lifecycle hooks: `after_create`, `before_remove` — configurable bash commands run in workspace context.

### 10. Codex Client ← NEW (from Symphony)

JSON-RPC 2.0 client over stdio. Enables Nexus to orchestrate locally-installed Codex, Claude Code, and OpenCode as managed agent sessions. Tool calls are intercepted and routed through Nexus `ToolExecutor` — same credit system, same injection guard, same replay trace.

```
Protocol flow:
  initialize → thread/start → turn/start
  → tool/call ↔ tool/result (Nexus intercepts, routes through ToolExecutor)
  → turn/completed
```

Supported providers:

| String | Command |
|--------|---------|
| `"codex"` | `codex app-server` |
| `"claude-code"` | `claude --server` |
| `"opencode"` | `opencode serve` |

When provider is `:local_agent`, `AgentLoop` forks to `run_local_agent/2`:
```
Workspace.create(task_id)
→ CodexClient.start_session(workspace, provider)
→ CodexClient.run_turn(session, goal, tool_executor_fn)
→ CodexClient.stop_session(session)
→ Workspace.remove(task_id)
```

Steps broadcast via Phoenix Channel identically to API-based tasks — Nova UI is unaware of the difference.

### Tracker Adapter Behaviour ← NEW (from Symphony)

Extension point for issue tracker integrations (Linear, GitHub, Jira). Not a V1 feature but the behaviour is defined now so Actions can implement it later.

```elixir
defmodule Nexus.TrackerAdapter do
  @callback fetch_candidate_tasks(config :: map()) :: {:ok, [map()]} | {:error, term()}
  @callback update_task_status(task_id :: String.t(), status :: atom(), config :: map()) :: :ok
  @callback post_comment(task_id :: String.t(), comment :: String.t(), config :: map()) :: :ok
end
```

---

## 6. Agents Store

### What It Is
A marketplace of curated and user-created agents. Public browsing (no auth). Hiring redirects to Nova. Next.js (FE) + Elixir/Phoenix (BE).

### Agent Definition Format

```elixir
%Agent{
  name: "rainmaker",
  display_name: "The Rainmaker",
  version: "1.0.0",
  provider: "openai:gpt-4o",

  persona: %{
    system_prompt: "You are a marketing research specialist...",
    examples: []
  },

  skills: ["web_research", "summarization", "report_generation"],
  actions: ["f.rsrx", "f.twyt"],
  mcp_tools: [],
  tool_allowlist: ["f.rsrx.web_search", "f.rsrx.synthesize_report", "f.twyt.search_twitter"],

  memory: %{
    short_term: true,
    vector: true,
    episodic: true,
    retention: "30d"
  },

  execution: %{
    max_iterations: 20,
    max_tool_calls: 50,
    max_tokens: 100_000,
    timeout: "30m",
    credit_budget: 100
  },

  replay: %{
    enabled: true,
    seed: nil,           # nil = non-deterministic, integer = deterministic
    temperature: 0.7
  },

  pricing: %{
    model: "freemium",
    credit_cost: 10
  }
}
```

The `tool_allowlist` is used by `InjectionGuard` — agents can only call the tools explicitly listed.

### GTM — Launch Personas

| Persona | Tools | Why First |
|---------|-------|-----------|
| **Rainmaker** | f.rsrx + f.twyt | Broadest market, immediate ROI demo |
| **Tax Ghost** | f.vault + f.pay | High willingness to pay |
| **Bio-Hacker** | f.health + f.sense | Passionate community |
| **Concierge** | f.rsrx | Good BYOK demo |

### Revenue Share

| Event | Furma | Author |
|-------|-------|--------|
| Free agent | 100% credits | 0% |
| Premium subscription | 30% | 70% |
| Agent's Action tool calls | 100% | 0% |

---

## 7. Actions

### What Actions Are
Standalone products exposing capabilities via MCP. Each Action: Next.js FE + Elixir BE + Neon Postgres. All expose three MCP entry points.

```
Action = Next.js (UI) + Elixir/Phoenix (MCP server + logic) + Neon Postgres
```

### Three Exposure Points (all Actions)

```
Nova          → internal: actions sidebar, result cards
Nexus         → via Tool Registry + Tool Executor (MCP calls)
External      → public MCP API: any agent or developer
```

### Actions Registry

| Action | Type | Description | Status |
|--------|------|-------------|--------|
| **f.rsrx** | UI + Elixir | Deep research + synthesis | 🟡 Dev |
| **f.library** | UI + Elixir | Vector knowledge base (pgvector) | ✅ Prod |
| **f.twyt** | UI + Elixir | Twitter intelligence | ✅ Prod |
| **f.vault** | UI + Elixir | Secure document storage | 🟡 Roadmap |
| **f.memory** | Headless Elixir | Agent memory management | 🟡 Dev |
| **f.guard** | Headless Elixir | AI code review (Warden engine) | 🟡 Roadmap |
| **f.support** | UI + Elixir | Helpdesk automation | 🟡 Roadmap |
| **f.decloy** | UI + Elixir | Agent deployment (Firecracker) | 🟡 Roadmap |
| **f.bridge** | Headless Elixir | Universal MCP connector | 🟡 Roadmap |
| **f.hack** | UI + Elixir | Security tools | 🟡 Roadmap |
| **f.pay** | UI + Elixir | Payments | 🟡 Roadmap |
| **f.mcp** | Headless Elixir | MCP registry/gateway | 🟡 Roadmap |

### MCP Result Card Protocol

```json
{
  "content": [{ "type": "text", "text": "..." }],
  "_aitlas": {
    "resultId": "report_abc123",
    "deepLinkUrl": "https://rsrx.f.xyz/reports/report_abc123",
    "creditsUsed": 5,
    "summary": "47 EU AI startups found. Top: Paris (9), Berlin (7)."
  }
}
```

---

## 8. How They Connect

### Full Request Flow (Paid User, Agentic Task)

```
Nova (chat) → user sends message
      │
      ▼
Nova API: classify intent
      │
      ├── simple LLM call? → Provider Router (BYOK) → SSE stream back
      │
      └── agent task needed?
          → POST nexus.aitlas.xyz/api/v1/tasks
          → { taskId, status: "PENDING" }
          → Nova subscribes to Phoenix Channel (taskId)
                    │
                    ▼
          NEXUS picks up task (Oban queue)
          Agent Loop (GenServer) starts
          ToolRegistry.list_for_agent(agent_spec)
          Context Builder assembles prompt
                    │
                    ▼
          ② PLAN: LLM decides next action
          ③ InjectionGuard.validate(tool_call)
          ④ ACT: ToolExecutor → MCP call → Action
          ⑤ REFLECT: LLM evaluates result
          ⑥ PERSIST: write step + hash to trace
                    │
                    ▼
          Phoenix Channel broadcasts each step
                    │
                    ▼
          Nova Task Monitor + Replay Viewer updates live
```

### Service Communication

| From | To | Method |
|------|-----|--------|
| Nova | Nexus | REST + Phoenix Channels (WebSocket) |
| Nexus | Actions (BE) | MCP over HTTP (Tool Registry resolved endpoint) |
| Nexus | External MCPs | MCP over HTTP |
| External agents | Actions | MCP over HTTP (public API, MCP_API_KEY required) |
| External devs | Nexus | REST API (API key auth) |

---

## 9. Templates

### `aitlas-ui-template` (Next.js)
Base for all frontends.

```
aitlas-ui-template/
├── app/
│   ├── api/auth/           ← Better Auth handler
│   ├── api/health/
│   └── (pages)/
├── lib/
│   ├── auth.ts
│   ├── api-client.ts
│   └── env.ts
├── components/ui/          ← shadcn/ui
├── AGENTS.md
└── package.json            ← Next.js 16 + Bun + Tailwind v4
```

### `aitlas-elixir-template` (Elixir)
Base for all backends.

```
aitlas-elixir-template/
├── lib/
│   ├── app/
│   ├── app_web/
│   │   ├── channels/       ← Phoenix Channels
│   │   └── controllers/
│   ├── mcp/                ← MCP server (JSON-RPC 2.0)
│   ├── tool_registry/      ← ToolRegistry module  ← NEW
│   ├── injection_guard/    ← Prompt injection defense  ← NEW
│   ├── auth/
│   ├── credits/
│   └── workers/            ← Oban workers
├── priv/repo/migrations/
├── config/
└── mix.exs
```

### `aitlas-cli` (Bun)

```bash
aitlas new ui my-action
aitlas new elixir f-myaction
aitlas new full f-myaction
aitlas new nexus-worker
```

---

## 10. Agent Definition & Deployment

### How Nexus Runs an Agent

```
Nova: "Run rainmaker for this user"
        │
        ▼
Nexus: load AgentDefinition from DB (via Agents Store API)
Nexus: ToolRegistry.list_for_agent(agent_spec)
Nexus: spawn GenServer(AgentLoop, task)
Nexus: Context Builder assembles first prompt (hashed)
Nexus: Agent Loop begins → PLAN → InjectionGuard → ACT → REFLECT → PERSIST
Nexus: each step hashed and stored in trace
Nexus: streams progress to Nova via Phoenix Channel
Nexus: writes result to DB, emits agent.completed
Nova: shows result + Replay Viewer + deep links
```

### AgentSpec YAML (shareable format)

```yaml
agent:
  name: rainmaker
  version: 1.0.0
  provider: openai:gpt-4o

skills:
  - web_research
  - summarization
  - report_generation

actions:
  - f.rsrx
  - f.twyt

tool_allowlist:
  - f.rsrx.web_search
  - f.rsrx.synthesize_report
  - f.twyt.search_twitter

memory:
  short_term: true
  vector: true
  retention: 30d

execution:
  max_iterations: 20
  max_tool_calls: 50
  max_tokens: 100000
  timeout: 30m
  credit_budget: 100

replay:
  enabled: true
  seed: null          # null = non-deterministic
```

---

## 11. Nexus Runtime — Deep Spec

### Oban Job Types

```elixir
Nexus.Workers.AgentRunner       # main agent loop
Nexus.Workers.MemoryExtractor   # extract facts to vector store
Nexus.Workers.FileIndexer       # parse + chunk + embed files
Nexus.Workers.ScheduledTask     # recurring agent tasks
Nexus.Workers.ReplayRunner      # re-executes a task from trace  ← NEW
Nexus.Workers.Watchdog          # stale task cleanup (backup to OTP supervisors)
```

### Database Tables (Ecto)

**tasks**
```
id, user_id, agent_id, goal, status, provider,
max_iterations, max_tool_calls, max_tokens, credit_budget,
current_iteration, tool_calls_made, tokens_used,
tool_registry, memory_collection,
scheduled_for, cron_expression,
credits_reserved, credits_used, llm_tokens_used,
worker_id, heartbeat_at,

# Replay fields (NEW)
execution_hash,           -- sha256 of full trace
agent_spec_version,       -- version of agent at time of run
provider_version,         -- model snapshot (e.g. gpt-4o-2024-11-20)
seed,                     -- integer for deterministic, null for normal
replay_of_task_id,        -- if this is a replay, points to original
fork_from_step,           -- if this is a fork, which step it starts from

result, error_message,
created_at, completed_at
```

**task_steps**
```
id, task_id, step_number,
type,               -- PLAN | ACTION | REFLECTION | FINAL

# Replay fields (NEW)
prompt_hash,        -- sha256 of the exact prompt sent to LLM
model,              -- exact model used for this step
input_tokens,
output_tokens,
seed,               -- step-level seed (if deterministic mode)

content, metadata, duration_ms, created_at
```

**tool_calls**
```
id, task_id, step_id, tool_name, tool_input,

# Replay fields (NEW)
tool_version,       -- version of the tool at time of call
output_hash,        -- sha256 of the raw tool output

tool_output, status, credits_used,
duration_ms, error, retry_count, created_at
```

### Indexes (V1 — required)

```sql
-- tasks
CREATE INDEX idx_tasks_user_id_created ON tasks(user_id, created_at DESC);
CREATE INDEX idx_tasks_status ON tasks(status) WHERE status IN ('PENDING', 'RUNNING');

-- task_steps
CREATE INDEX idx_task_steps_task_id ON task_steps(task_id, step_number);

-- tool_calls
CREATE INDEX idx_tool_calls_task_id ON tool_calls(task_id);
CREATE INDEX idx_tool_calls_tool_name ON tool_calls(tool_name);

-- vector memory
CREATE INDEX idx_memory_vectors_hnsw ON memory_vectors
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- credits
CREATE INDEX idx_credit_ledger_user_id ON credit_ledger(user_id, created_at DESC);
```

### Cost Model

```
Per task:
  + 1 credit       orchestration fee (flat, on dispatch)
  + 2 credits/hr   actual compute time
  + N credits      tool calls (only on success)
  + 0 credits      LLM tokens (user's BYOK key)
  + 0 credits      replays (replay mode is free — it's using cached results)
```

Replays in `exact` mode re-use stored tool outputs and LLM responses — no new tokens burned, no new credits charged.

### Task State Machine

```
PENDING → CLAIMED → RUNNING → COMPLETED
                        └──→ FAILED
                        └──→ TIMEOUT
                        └──→ STUCK
                        └──→ CANCELLED
                        └──→ REPLAYED → (new task continues)
```

---

## 12. Agent State Replay + Deterministic Execution

> This is the core architectural moat. Almost no other agent platform implements this.

### What It Is

Every agent execution in Nexus is a fully recorded, cryptographically hashable event trace. This trace can be replayed exactly, inspected step by step, or forked at any point to continue from a different state.

Nexus stops being just a runtime and becomes a **deterministic AI execution engine** — closer to Git + Temporal + an agent OS than a simple task runner.

### Why It Matters

| Use Case | What Replay Enables |
|----------|---------------------|
| Debugging | Reproduce any agent failure exactly |
| Enterprise compliance | Full audit trail: prompt → reasoning → decision → output |
| Prompt improvement | Fork from step 2, try better system prompt |
| Model comparison | Fork from step 1, swap model |
| Agent training data | Millions of labeled traces → fine-tune |
| Marketplace trust | Users can inspect what a hired agent actually did |
| Sharing | "Clone this run" — others replay your exact execution |

### The Trace

Every task execution stores an immutable trace:

```
TASK RUN 9842 — "Research EU AI startups"
execution_hash: sha256(all steps)
provider_version: gpt-4o-2024-11-20
agent_spec_version: rainmaker@1.0.0
seed: 42 (deterministic mode)

Step 1 — PLAN
  model: openai:gpt-4o
  prompt_hash: ab92c1...
  input_tokens: 512
  output_tokens: 128
  output: "Search web for EU AI startups in Paris and Berlin"

Step 2 — ACTION
  tool: f.rsrx.web_search
  tool_version: 1
  input: { query: "EU AI startups 2026" }
  output_hash: 29afc2...
  credits_used: 2
  duration_ms: 1840

Step 3 — REFLECTION
  model: openai:gpt-4o
  prompt_hash: 98cd33...
  output: "47 results found, filter by funding stage"

Step 4 — ACTION
  tool: f.rsrx.synthesize_report
  ...

Step 5 — FINAL
  output: [full report]
  execution_hash: ab82ff...
```

### Replay Modes

**Exact Replay** — re-run using cached tool outputs and LLM responses. Zero new tokens. Used for debugging and audit.

**Live Replay** — re-run all steps for real. New LLM calls, new tool calls. Used for "try again" with different context.

**Fork** — continue from step N with modifications:
- Different model
- Different system prompt
- Different tool

### Replay API

```
POST   /api/v1/tasks/:id/replay
Body:
{
  "mode": "exact" | "live" | "fork",
  "fork_from_step": 3,              # fork mode only
  "replace_model": "anthropic:claude-3-5-sonnet",  # optional override
  "replace_system_prompt": "...",   # optional override
  "replace_tool_at_step": {         # optional override
    "step": 2,
    "tool": "f.rsrx.deep_research"
  }
}

Response:
{
  "new_task_id": "task_9843",
  "replay_of": "task_9842",
  "fork_from_step": 3,
  "status": "PENDING"
}
```

### Deterministic Mode

For a fully deterministic run:

```elixir
%Task{
  seed: 42,           # fixed seed passed to LLM call
  provider: "openai:gpt-4o-2024-11-20",   # pinned model version, not alias
  tool_registry: snapshot_of_tool_definitions_at_dispatch_time
}
```

With `seed` + pinned model version + stored tool outputs: replay is byte-identical.

### Replay Engine (Elixir)

```elixir
defmodule Nexus.ReplayEngine do

  def replay(task_id, opts \\ []) do
    mode = Keyword.get(opts, :mode, :exact)
    fork_from = Keyword.get(opts, :fork_from_step, nil)
    overrides = Keyword.get(opts, :overrides, %{})

    original = Tasks.get_with_trace!(task_id)

    new_task = build_replay_task(original, mode, fork_from, overrides)
    {:ok, dispatched} = Tasks.create_and_enqueue(new_task)

    dispatched
  end

  defp run_exact(task, step) do
    # Re-emit stored steps without calling LLM or tools
    # Used for inspection and audit — no API calls made
    Enum.each(task.steps, &broadcast_step/1)
  end

  defp run_fork(task, from_step, overrides) do
    # Replay steps 1..from_step-1 from cache
    # Then continue live from from_step with overrides applied
    steps_before = Enum.take(task.steps, from_step - 1)
    Enum.each(steps_before, &replay_cached_step/1)
    AgentLoop.continue_from(task, from_step, overrides)
  end
end
```

### Nova Replay Viewer

Task Monitor panel, replay controls:

```
Run #9842 — "Research EU AI startups"
agent: rainmaker@1.0.0 | model: gpt-4o-2024-11-20 | 5 steps | 47 credits
──────────────────────────────────────────────────────────────
● Step 1  PLAN       ✓  "Search web for EU AI startups"       [0.8s]
● Step 2  ACTION     ✓  f.rsrx.web_search → 47 results        [1.8s]
● Step 3  REFLECT    ✓  "Filter by funding stage"              [0.6s]
● Step 4  ACTION     ✓  f.rsrx.synthesize_report               [4.2s]
● Step 5  FINAL      ✓  Report: 47 EU AI startups              [0.3s]

[ ▶ Replay Exact ]  [ ⑂ Fork from step 3 ]  [ ↓ Export Trace ]  [ ⇄ Share Run ]
```

**Fork from step 3** opens a panel:
```
Fork Run #9842 from Step 3
─────────────────────────
Model:         [ gpt-4o ▼ ] or try [ claude-3-5-sonnet ]
System prompt: [ original ▼ ] or [ edit... ]
Tool override: [ none ▼ ]

[ Run Fork → ]
```

### Share Run (Agent GitHub)

A shared run link: `aitlas.xyz/runs/9842/share`

Visitors can:
- Inspect the full trace (if owner made it public)
- Clone the agent that produced it
- Fork the run and replay with their own key
- Export the trace as JSON

This is a distribution mechanic. A viral agent run shared on Twitter pulls people into Nova.

### Long-Term: Agent Training Data

Every completed task is a labeled trace:
- Goal → actions → result
- Tool calls with success/failure
- Reflection quality

At scale: millions of structured traces. Can be used to fine-tune models, optimize prompts, and train routing models to pick the right tools faster.

---

## 13. MCP Protocol

All Actions expose: `POST /api/mcp`, JSON-RPC 2.0.

**Authentication (V1):** All external MCP calls require `MCP_API_KEY` header.

```
Internal (Nexus → Action): Authorization: Bearer <session_token> + X-Furma-Internal
External (developer → Action): Authorization: Bearer <MCP_API_KEY>
```

Methods: `initialize` | `tools/list` | `tools/call` | `ping`

V2: `tools/stream` — for long-running tools (f.rsrx deep_research, code execution).

### Error Codes

| Code | Meaning |
|------|---------|
| -32001 | Tool execution error |
| -32002 | Authentication failed |
| -32003 | Credits exceeded |
| -32004 | Rate limit reached |
| -32005 | Tool argument validation failed |
| -32006 | Tool not in agent allowlist (injection blocked) |

---

## 14. Credit System

### Pricing

| Item | Credits | USD |
|------|---------|-----|
| Pro subscription/mo | +500 granted | $20/mo plan |
| Pack 100 | $1 | |
| Pack 1,000 | $8 (20% off) | |
| f.twyt search | 1 | $0.01 |
| f.library ingest | 2 | $0.02 |
| f.rsrx deep research | 5 | $0.05 |
| f.guard PR scan | 3 | $0.03 |
| execute_code (sandbox) | 2 | $0.02 |
| Nexus orchestration | 1 flat | $0.01 |
| Nexus compute | 2/hr | $0.02/hr |
| f.decloy deploy | 25 | $0.25 |
| f.decloy runtime | 1/min | $0.01/min |
| Replay (exact mode) | 0 | Free |
| Replay (live mode) | same as original | Re-runs cost |

### Rules
- Append-only ledger — never UPDATE credits directly
- Atomic: credit check + task create in one DB transaction
- Reserve on dispatch → settle on completion → refund unused
- NEVER charge for failed tool calls
- Exact replays are free — cached results, no new compute

---

## 15. BYOK Model

Both tiers are BYOK. Furma never pays for LLM tokens.

```
Free tier:   user pays API provider directly. Furma: $0.
Paid tier:   user STILL pays API provider.
             Furma charges credits for compute + tool calls only.
```

**Embeddings:** OpenAI `text-embedding-3-small` via user's BYOK OpenAI key. If no OpenAI key: vector memory + file indexing disabled (clearly communicated in Nova settings).

Key lifecycle:
1. User enters API key in Nova Settings
2. Encrypted AES-256-GCM → stored in `api_keys` table
3. At agent execution: Nexus fetches encrypted key by `user_id + provider`
4. Decrypted inline per LLM call, inside the GenServer process
5. Never stored in task record, never logged, GC'd after use

---

## 16. Auth Architecture

Better Auth (self-hosted, Neon Postgres). Sessions valid across all `*.aitlas.xyz` subdomains.

Cross-subdomain: `domain: '.aitlas.xyz'`

Service-to-service:
```
Authorization: Bearer <session_token>
X-Furma-Internal: <FURMA_INTERNAL_SECRET>
```

MCP external access:
```
Authorization: Bearer <MCP_API_KEY>
```

---

## 17. Database Architecture

**Single Neon Postgres instance** (eu-west-2). All services share it. Tables are namespaced by service convention.

**V1 schema namespaces (logical, same DB):**

```
aitlas_core:     users, sessions, api_keys, credit_ledger
nexus_runtime:   tasks, task_steps, tool_calls, scheduled_tasks
agents_store:    agents, agent_versions, agent_runs_summary
actions_*:       per-action tables (f_library_collections, f_twyt_feeds, etc.)
memory:          memory_vectors, episodic_memory
```

Neon pooled URL (`?pgbouncer=true`) for all runtime services.  
Neon unpooled URL for migrations only.

**V2:** Migrate to separate logical databases within the Neon cluster when query volumes warrant connection isolation.

**Shared secrets:**
- `ENCRYPTION_KEY` — 64 hex chars, AES-256 BYOK, rotate every 90 days
- `BETTER_AUTH_SECRET` — cross-service sessions
- `FURMA_INTERNAL_SECRET` — service-to-service auth

Stored in 1Password: `Aitlas/Production`

---

## 18. Security

### Non-Negotiables (V1)

- `decrypt_api_key/1` result: NEVER assigned to a named variable, NEVER logged
- ALL DB mutations: Ecto transactions
- ALL inputs: Ecto changesets + Zod (JS side)
- Rate limiting: ALL public routes (Upstash Redis)
- `user_id`: ALL DB queries — no cross-tenant leaks
- Credits deducted ONLY after successful tool execution
- MCP external routes: require `MCP_API_KEY` header

### Prompt Injection Guard (V1 — New)

Every tool call goes through `InjectionGuard.validate/2` before execution:

```elixir
defmodule Nexus.InjectionGuard do
  @suspicious_patterns [
    ~r/ignore (previous|all) instructions/i,
    ~r/exfiltrate/i,
    ~r/reveal (api|secret|key)/i,
    ~r/execute (system|shell|bash)/i,
    ~r/call (tool|function) .+ instead/i
  ]

  def validate(tool_call, allowlist) do
    cond do
      tool_call.name not in allowlist ->
        {:error, :tool_not_in_allowlist}

      contains_suspicious_patterns?(tool_call.arguments) ->
        {:error, :injection_detected}

      not ToolRegistry.validate(tool_call.name, tool_call.arguments) ->
        {:error, :invalid_arguments}

      true ->
        :ok
    end
  end
end
```

### Secrets Redaction (V1 — New)

Logger middleware auto-redacts in all Elixir services:

```elixir
defmodule Aitlas.Logger.Redactor do
  @redact_keys ~w(api_key authorization password secret token bearer)

  def filter(message) do
    Regex.replace(~r/(api_key|authorization|password|secret|token|bearer)[=:\s"']+\S+/i,
      message, "[REDACTED]")
  end
end
```

---

## 19. Infrastructure & Deployment

| Service | Host | Notes |
|---------|------|-------|
| Nova (web) | Vercel | Next.js, edge CDN |
| Agents Store (FE) | Vercel | Next.js |
| Actions (FE) | Vercel | Next.js |
| Nexus | Hetzner CPX31 | Pure Elixir, Oban workers |
| Agents Store (BE) | Hetzner | Elixir/Phoenix |
| Actions (BE) | Hetzner | Elixir/Phoenix |
| PostgreSQL | Neon eu-west-2 | Serverless, pgvector, HNSW |
| Redis | Upstash | Rate limiting, short-term memory persistence |
| DNS + proxy | Cloudflare | All domains |

**Starter:** CPX31 (2 vCPU, 8GB RAM) for all Elixir services — Elixir needs CPU more than RAM.  
**Scale path:** Additional CPX31 nodes + libcluster (V2) for Phoenix clustering.

**Launch cost: ~€15-20/mo**

---

## 20. Open Source Leverage

| Project | License | Used For |
|---------|---------|---------|
| T3 Code (pingdotgg) | MIT | Nova chat UI |
| Symphony (OpenAI) | Apache 2.0 | Nexus: Workspace Manager, Codex Client, Orchestrator patterns |
| Mission Control (builderz-labs) | MIT | Nova dashboard |
| OpenSandbox (Alibaba) | Apache 2.0 | Code execution sandbox |
| RTK | MIT | Token compression in Tool Executor |
| Warden (Sentry) | FSL-1.1 | f.guard code review engine |
| Agency Agents | MIT | 61 seed agent templates |
| ECC | MIT | Instinct format + compaction |
| Crush (Charmbracelet) | FSL-1.1 | AGENTS.md format |
| Oban | MIT | Durable job queue |
| pgvector | PostgreSQL | Vector memory with HNSW |
| Solid | MIT | Liquid template rendering in Context Builder |

> **Symphony license note:** Apache 2.0 — cleared for proprietary use. Attribution comment required in all ported files:  
> `# Derived from Symphony (github.com/openai/symphony) — Copyright OpenAI, Apache License 2.0`

---

## 21. Future Roadmap (V2+)

These are architecturally correct but explicitly **not in V1**. Listed here so they are not forgotten and not prematurely built.

| Feature | Trigger to implement | Notes |
|---------|---------------------|-------|
| **Split Neon databases** | When query isolation is needed or connection pooling breaks | One cluster, separate logical DBs: `nexus_runtime`, `agents_store`, etc. |
| **libcluster + Phoenix clustering** | When running more than one Nexus node | Erlang distribution, task sharding per node |
| **Tool versioning** (`search_twitter@v2`) | First time a tool has a breaking change | Tool Registry already has `version` field |
| **Task step retention policy** | When DB size becomes a concern | Archive after 90 days, soft-delete, cold storage |
| **OpenTelemetry + Prometheus + Grafana** | When volume warrants dedicated observability | V1 uses `:telemetry` + structured Logger |
| **Streaming tool results** (`tools/stream`) | When f.rsrx deep_research or code execution UX requires it | JSON-RPC extension: `tools/stream` method |
| **Agent dataset + fine-tuning pipeline** | When millions of traces exist | Use replay traces as training data |
| **Distributed Nexus cluster** | When single-node Hetzner is maxed | Erlang distribution + BEAM really shines here |
| **Semantic context compression** | When context windows are regularly hitting limits | Summarize old steps into vector memories |

---

## 22. Decision Log

| Decision | Chosen | Rejected | Reason |
|----------|--------|----------|--------|
| Nova stack | Next.js (clone T3/Symphony/MC) | Build from scratch | Weeks saved |
| Nexus stack | Pure Elixir/OTP | Node/Bun | BEAM perfect for agent loops |
| Actions stack | Next.js FE + Elixir BE | Pure Next.js | Best UI + best agentic backend |
| Task queue | Oban (Postgres) | Redis Streams, BullMQ | Elixir-native, zero new infra |
| Agent recovery | OTP Supervisors | Custom watchdog | Built into runtime |
| Auth | Better Auth (self-hosted) | Clerk, NextAuth | Sovereign, BYOK-safe |
| DB | Neon Postgres | PlanetScale, Supabase | pgvector, HNSW, Ecto |
| Repo structure | Polyrepo | Monorepo | AI context collapse prevention |
| Agent format | Declarative spec (YAML/Elixir map) | Imperative code | Portable, forkable |
| Encryption | AES-256-GCM | Vault, KMS | Zero new infra |
| Short-term memory | GenServer state (hot) + Redis (persistence) | Redis-only | Eliminate round-trips in hot loop |
| Phoenix Channels | Keep for task streaming | SSE | Bidirectional: supports cancel, pause, inject |
| Hetzner instance | CPX31 | CX21 | Elixir benefits from CPU headroom |
| Replay traces | V1 feature | V2 | Foundational moat, fits existing schema |
| Tool versioning | V2 feature | V1 | Premature without breaking changes |
| Observability stack | V2 (OTel + Prometheus) | V1 | Structured logs sufficient at launch |
| **Nova task monitor** | Build fresh (~5 components) | Clone Symphony UI | Symphony LiveView not portable to Next.js |
| **Workspace Manager** | Engine 9, from Symphony | Custom implementation | Symphony's pattern is production-proven |
| **Codex Client** | Engine 10, JSON-RPC stdio | HTTP-only providers | Enables Codex/Claude Code/OpenCode sessions |
| **Liquid templates** | Solid lib in Context Builder | Go/Handlebars/raw strings | Exactly what Symphony uses; dynamic + safe |
| **Symphony license** | Apache 2.0 (confirmed) | — | Attribution in ported files required |

---

## Appendix: Repo Registry

| Repo | Stack | Domain | Status |
|------|-------|--------|--------|
| `aitlas-ui-template` | Next.js 16 + Bun | — | ✅ Base template |
| `aitlas-elixir-template` | Elixir + Phoenix + Oban | — | ✅ Base template |
| `aitlas-cli` | Bun | npm | 🟡 Dev |
| `aitlas-nova` | Next.js (T3+Symphony+MC) | nova.aitlas.xyz | 🟡 Dev |
| `aitlas-nexus` | Pure Elixir | nexus.aitlas.xyz | 🟡 Dev |
| `aitlas-agents` | Next.js + Elixir | agents.aitlas.xyz | 🟡 Dev |
| `f-rsrx` | Next.js + Elixir | rsrx.f.xyz | 🟡 Dev |
| `f-library` | Next.js + Elixir | library.f.xyz | ✅ Prod |
| `f-twyt` | Next.js + Elixir | twyt.f.xyz | ✅ Prod |
| `f-vault` | Next.js + Elixir | vault.f.xyz | 🟡 Roadmap |
| `f-memory` | Elixir only | memory.f.xyz | 🟡 Dev |
| `f-guard` | Elixir only | guard.f.xyz | 🟡 Roadmap |
| `f-support` | Next.js + Elixir | support.f.xyz | 🟡 Roadmap |
| `f-decloy` | Next.js + Elixir | decloy.f.xyz | 🟡 Roadmap |
| `f-bridge` | Elixir only | bridge.f.xyz | 🟡 Roadmap |
| `f-hack` | Next.js + Elixir | hack.f.xyz | 🟡 Roadmap |

---

**Last Updated:** March 2026 (v7)  
**Maintained by:** Herb (AI CTO) + Furma (CEO)

> *Build fast. Stay sovereign. Zero token liability.*  
> *Every agent run is a commit. Nexus is the git.*
