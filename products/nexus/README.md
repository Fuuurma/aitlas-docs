# Nexus — Agent OS

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

## Overview

Nexus is the **agent operating system** — the execution engine that runs AI agents with deterministic replay.

**Stack:** Pure Elixir / Phoenix / Oban  
**Host:** Hetzner CPX31  
**DB:** Neon Postgres (pgvector)

---

## Core Files

| File | Description |
|------|-------------|
| [architecture.md](./architecture.md) | Technical architecture (30 sections) |
| [nexus.md](./nexus.md) | Runtime specification |
| [db-architecture.md](./db-architecture.md) | Database schema |
| [ORCHESTRATION_MOAT.md](./ORCHESTRATION_MOAT.md) | Competitive analysis |
| [SYMPHONY_INTEGRATION.md](./SYMPHONY_INTEGRATION.md) | Symphony integration |

---

## Architecture

```
Nova (UI) → Nexus API → Oban Queue → Agent Loop (GenServer)
                                          ↓
                              Tool Registry → Tool Executor → MCP
                                          ↓
                              Memory Engine → pgvector
                                          ↓
                              Replay Engine (trace storage)
```

## The 5-Phase Execution Loop

```
① OBSERVE   — Load task, memory context, tool registry
② PLAN      — LLM decides next action
③ ACT       — Tool execution via MCP
④ REFLECT   — LLM evaluates result quality
⑤ PERSIST   — Write step + hash to trace, update memory
```

---

## Key Features

- **Durable Execution** — Oban jobs survive crashes
- **OTP Supervision** — Auto-recovery built-in
- **Deterministic Replay** — Every run is a commit
- **Real-time Streaming** — Phoenix Channels
- **MCP-native** — First-class MCP tool support
- **BYOK** — User provides their own API keys
- **Hard Limits** — max_iterations, max_tool_calls, max_tokens, credit_budget

---

## The 8 Internal Engines

1. **Provider Router** — OpenAI / Anthropic / Gemini / local
2. **Context Builder** — system + history + memory + tools
3. **Agent Loop** — Core execution with hard limits
4. **Tool Executor** — MCP + internal + API
5. **Tool Registry** — ETS-cached tool definitions
6. **Memory Engine** — GenServer (hot) + Redis + pgvector
7. **File Processor** — parse / chunk / embed
8. **Observability** — events, metrics, traces

---

## Security (V1 Non-Negotiables)

- `decrypt_api_key/1` — never logged, never assigned to named variable
- All DB mutations → Ecto transactions
- All inputs → Ecto changesets
- All public routes → rate limited (Upstash)
- All queries → user_id scoped
- Credits → deduct only on successful tool execution

---

## Related

- [MASTER_ARCHITECTURE](../../architecture/MASTER_ARCHITECTURE.md) — Canonical source
- [Nexus Research](../research/nexus/) — Competitor analysis