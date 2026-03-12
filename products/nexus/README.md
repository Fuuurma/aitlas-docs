# Nexus — Agent OS

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

> **📖 Canonical Doc:** [nexus-technical-doc.md](./nexus-technical-doc.md) (90KB, 2907 lines)

---

## Overview

Nexus is the **agent operating system** — the execution engine that runs AI agents with deterministic replay.
It is the **core runtime**: Nexus owns task orchestration, tool calling, agent loops, and agent‑to‑agent execution.
All tool calls are MCP‑first; agents calling other agents is implemented as MCP tool calls routed through Nexus.

**Stack:** Pure Elixir / Phoenix / Oban  
**Host:** Hetzner  
**DB:** Neon Postgres (pgvector)

**Template:** [aitlas-backend-template](https://github.com/Fuuurma/aitlas-backend-template)

---

## Key Features

- **Durable Execution** — Oban jobs survive crashes
- **OTP Supervision** — Auto-recovery built-in
- **Deterministic Replay** — Every run is a commit
- **Replay Forks** — Fork tasks from any step (`replay_of_task_id`, `fork_from_step`)
- **Real-time Streaming** — Phoenix Channels
- **MCP-native** — First-class MCP tool support
- **MCP-first** — All tool calls (including agent‑to‑agent) route through MCP
- **Aitlas Actions prioritized** — f.xyz tools are preferred in tool selection when available (placeholders until MCP endpoints go live)
- **Replay-safe tool calls** — MCP requests/responses are sanitized and stored in tool call metadata
- **BYOK** — User provides their own API keys
- **Hard Limits** — max_iterations, max_tool_calls, max_tokens, credit_budget
- **Agent Graphs** — Agents can call other agents as tools

---

## The 11 Engines

1. **Provider Router** — OpenAI / Anthropic / Gemini / local
2. **Context Builder** — system + history + memory + tools
3. **Agent Loop** — Core execution with hard limits
4. **Tool Executor** — MCP + internal + API
5. **Tool Registry** — ETS-cached tool definitions
6. **Memory Engine** — GenServer (hot) + Redis + pgvector
7. **File Processor** — parse / chunk / embed
8. **Observability** — events, metrics, traces
9. **Workspace Manager** — isolated execution environments
10. **Codex Client** — OpenAI Codex integration
11. **Capability Graph** — permission system

---

## Related Docs

| File | Description |
|------|-------------|
| [nexus-technical-doc.md](./nexus-technical-doc.md) | **CANONICAL** - Full technical spec |
| [agent-graphs-technical-doc.md](../architecture/agent-graphs.md) | **CANONICAL** - Agent-to-agent execution |
| [symphony-analysis.md](./symphony-analysis.md) | Symphony analysis |
| [SYMPHONY_GAP_ANALYSIS.md](./SYMPHONY_GAP_ANALYSIS.md) | Symphony vs Nexus gap analysis |
| [CORE_LOGIC_REVIEW.md](./CORE_LOGIC_REVIEW.md) | Core logic review (critical issues) |
| [ORCHESTRATION_MOAT.md](./ORCHESTRATION_MOAT.md) | Competitive analysis |

---

## Security (V1 Non-Negotiables)

- `decrypt_api_key/1` — never logged, never assigned to named variable
- All DB mutations → Ecto transactions
- All inputs → Ecto changesets
- All public routes → rate limited (Upstash)
- All queries → user_id scoped
- Credits → deduct only on successful tool execution

---

*Last Updated: March 2026*
