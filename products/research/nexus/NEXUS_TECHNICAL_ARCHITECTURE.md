# Nexus — Technical Architecture

**Version:** v1 | **Status:** Architecture Specification  
**Owner:** Herb (AI CTO)

> ⚠️ **Proprietary** — All Aitlas products are closed source. No open source license.

---

This is the internal engineering spec for Nexus — the agent runtime and execution kernel of Aitlas.

---

## 1. Overview

Nexus is the **agent runtime and execution kernel** of the AITLAS ecosystem.

### Core Responsibilities

| Responsibility | Description |
|---------------|-------------|
| Agent Execution | Execute iterative reasoning loops using LLMs |
| Tool Orchestration | Execute tools requested by the LLM safely |
| Context Management | Build and compact context windows |
| Memory | Store and retrieve vector and structured memory |
| Filesystem | Provide agents controlled file access |
| Provider Abstraction | Interface with external model providers (BYOK) |
| Observability | Track every action during execution |
| Deterministic Replay | Reproduce agent runs for debugging |

---

## 2. High-Level Architecture

```
Nova (UI)
 │
 ▼
Nexus API Gateway
 │
 ▼
PostgreSQL (State + Logs)
 │
 ▼
Oban Queue System
 │
 ▼
Worker Pool
 ├─ Agent Kernel
 ├─ Context Builder + Compactor
 ├─ Tool Executor
 ├─ Memory Engine
 ├─ Filesystem Service
 └─ Provider Adapter
```

---

## 3. Agent Execution Model

Agents run through a controlled reasoning loop:

```
initialize run
↓
build context (with compaction)
↓
call LLM
↓
if tool requested
  execute tool
  update context
  repeat
else
  return final response
```

### Loop terminates when:
- Agent produces final response
- Limits reached (max_iterations, max_tool_calls, etc.)
- Runtime fails

---

## 4. Hard Limits (Non-Negotiable)

| Limit | Default | Purpose |
|-------|---------|---------|
| max_iterations | 20 | Loop depth |
| max_tool_calls | 50 | Tool spend cap |
| max_tokens | 200k | Output token cap |
| max_context_tokens | 60k | Input prompt cap |
| credit_budget | User-set | Cost cap |
| max_runtime_ms | 30 min | Wall clock timeout |

### Loop Protection

Additional heuristics detect:
- Duplicate tool calls
- Recursive loops
- Tool thrashing

---

## 5. Context Pipeline

Three subsystems manage context:

```
Context Planner    → What to include (relevance)
Context Builder   → Construct final prompt
Context Compactor → Stay within token limits
```

### Context Compaction Strategies

| Strategy | When |
|----------|------|
| **Sliding Window** | Keep last N messages |
| **Summarization** | Compress old messages |
| **Tool Output Compression** | Summarize large outputs |
| **Token Budget** | Prune if exceeded |

Compaction is **always deterministic** so replay works.

---

## 6. Tool System

### Tool Categories

| Category | Examples |
|----------|----------|
| filesystem | fs.read, fs.write, fs.list |
| memory | memory.store, memory.search |
| external APIs | HTTP calls |
| Aitlas Actions | f.rsrx, f.twyt, f.library |
| custom | User-registered tools |

### Execution Flow

```
LLM response
↓
detect tool call
↓
validate (allowlist + schema)
↓
execute tool
↓
inject output
↓
continue loop
```

---

## 7. Tool Registry

In-memory registry (ETS) for speed:

```elixir
%Tool{
  name: "web_search",
  namespace: "f.rsrx",
  full_name: "f.rsrx.web_search",
  input_schema: %{...},
  credit_cost: 2,
  timeout_ms: 30_000,
  requires_auth: true
}
```

### Security

- Prompt Injection Guard blocks malicious calls
- Tool allowlist per agent spec
- Argument validation against schema

---

## 8. Filesystem Service

Core operations:
- `fs.read`
- `fs.write`
- `fs.list`
- `fs.search`
- `fs.metadata`

### Scopes

| Scope | Access |
|--------|--------|
| project | project/* |
| workspace | workspace/* |
| user | user/* |

Permissions enforced by runtime.

---

## 9. Memory System

### Two Types

| Type | Storage | Use Case |
|------|---------|----------|
| Vector | pgvector HNSW | Semantic search |
| Structured | Postgres | Key-value |

### Operations

```
memory.store
memory.search
memory.update
memory.delete
```

---

## 10. Provider Adapter (BYOK)

Supports multiple providers:

| Provider | Key Source |
|----------|------------|
| OpenAI | User's API key |
| Anthropic | User's API key |
| Google | User's API key |

### Flow

```
User → Nova → Nexus → Provider (user's key)
                 ↓
           Nexus charges credits
```

---

## 11. Task Execution (Oban)

Jobs executed asynchronously:

```elixir
Nexus.Workers.AgentRunner      # main loop
Nexus.Workers.ToolExecutor     # tool calls
Nexus.Workers.MemoryIndexer   # embeddings
Nexus.Workers.FileProcessor   # parsing
Nexus.Workers.ReplayRunner   # deterministic replay
```

---

## 12. Deterministic Replay

Every run is fully recorded.

### Replay Data

```
execution_hash    # sha256 of all steps
prompt_hash      # sha256 of prompt
output_hash      # sha256 of output
provider_version # model snapshot
seed            # for deterministic mode
```

### Modes

| Mode | Description |
|------|-------------|
| **Strict Replay** | Use cached tool outputs, no new API calls |
| **Live Replay** | Re-execute everything |
| **Fork** | Continue from step N with modifications |

**Core moat:** Every agent run is a commit. Nexus is the git.

---

## 13. Observability

Metrics per step:

```
run_id, step, model, tokens, cost, tool, duration_ms
```

### Event Types

```
agent.run.started
agent.step.completed
tool.call.executed
memory.entry.created
```

### Secrets Redaction

Logger middleware auto-redacts API keys from logs.

---

## 14. Worker Architecture

```
API Nodes (stateless)
       ↓
Oban Queues
       ↓
Worker Pool (horizontal scaling)
 ├─ agent_runner
 ├─ tool_executor
 ├─ memory_indexer
 └─ file_processor
```

---

## 15. OSS Components Leveraged

| Project | Use |
|---------|-----|
| Oban | Job queue, retries, durability |
| Trigger.dev | Inspiration for DX |
| Jido | Agent behavior patterns |
| DeerFlow | Multi-agent flow ideas |
| pi-mono | Tool orchestration reference |

---

## 16. Integration Points

| Component | Connection |
|----------|-----------|
| Nova | Phoenix Channels (WebSocket) |
| Actions | MCP over HTTP |
| External Agents | MCP API |
| Memory | pgvector |

---

## 17. Scaling Strategy

```
V1: Single Hetzner CPX31
  - Oban workers process jobs
  - Neon Postgres for state
  
V2: Multi-node (libcluster)
  - Erlang distribution
  - Task sharding per node
```

---

## Related

- [MASTER_ARCHITECTURE](../../architecture/MASTER_ARCHITECTURE.md)
- [Nexus Spec](../nexus/nexus.md)
