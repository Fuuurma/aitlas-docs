> ⚠️ **DEPRECATED** — Content superseded by [MASTER_ARCHITECTURE.md](../../architecture/MASTER_ARCHITECTURE.md)

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---

# NEXUS — Technical Architecture (Deprecated)

Agent Runtime & Execution Engine for AITLAS

**See:** [MASTER_ARCHITECTURE.md](../../architecture/MASTER_ARCHITECTURE.md) (canonical)

---

# 1. Overview

Nexus is the **agent runtime and execution kernel** of the AITLAS ecosystem.

It is responsible for executing autonomous agents, orchestrating tool calls, managing memory, interacting with model providers, and maintaining deterministic execution logs.

Nexus operates as an **Agent Operating System**, exposing primitives for:

* agent execution
* tool invocation
* filesystem access
* memory storage and retrieval
* model inference
* observability
* deterministic replay

Agents themselves are not part of Nexus; they are **runtime configurations executed by Nexus**.

---

# 2. Core Responsibilities

Nexus provides the following core capabilities:

### Agent Execution

Execute iterative reasoning loops using LLMs.

### Tool Orchestration

Execute tools requested by the LLM safely and deterministically.

### Context Management

Build and compact context windows dynamically.

### Memory Management

Store and retrieve vector and structured memory.

### Filesystem Access

Provide agents controlled access to files.

### Provider Abstraction

Interface with external model providers using user-provided API keys.

### Observability

Track every action taken during agent execution.

### Deterministic Replay

Allow reproduction of agent runs for debugging and research.

---

# 3. High-Level Architecture

System structure:

```
Nova (UI / Client)
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
        │
        ├─ Agent Kernel
        ├─ Context Builder
        ├─ Tool Executor
        ├─ Memory Engine
        ├─ Filesystem Service
        └─ Provider Adapter
```

Workers perform execution tasks asynchronously.

---

# 4. Agent Execution Model

Agents run through a controlled **reasoning loop**.

### Agent Loop

```
initialize run
↓
build context
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

The loop terminates when:

* the agent produces a final response
* limits are reached
* runtime fails

---

# 5. Hard Limits

Every run enforces strict constraints.

### Execution Limits

```
max_iterations
max_tool_calls
max_tokens
max_context_tokens
credit_budget
max_runtime_ms
```

These limits prevent runaway agent behavior.

### Loop Protection

Additional heuristics detect:

```
duplicate tool calls
recursive loops
tool thrashing
```

Runs are aborted if detected.

---

# 6. Context Management

Context management is composed of three subsystems:

```
Context Planner
Context Builder
Context Compactor
```

---

# 7. Context Planner

The planner decides **what information to include**.

Possible context sources:

```
conversation history
retrieved memory
files
tool outputs
system instructions
```

The planner uses heuristics to determine relevance.

Example:

```
query → retrieve top 5 memory vectors
```

---

# 8. Context Builder

Constructs the final prompt.

Example structure:

```
system prompt
conversation history
memory results
tool outputs
file excerpts
```

Supports multimodal input:

```
text
image
file
audio
```

---

# 9. Context Compaction

Compaction ensures prompts remain within token limits.

### Compaction Strategies

#### Sliding Window

Keep most recent messages.

```
last N messages
```

#### Summarization

Older messages summarized.

```
conversation summary
```

#### Tool Output Compression

Large outputs summarized before injection.

#### Token Budget Enforcement

If context exceeds limits:

```
prune oldest context
```

Compaction remains deterministic to preserve replay.

---

# 10. Tool System

Tools allow agents to perform external actions.

Tools are registered in a **Tool Registry**.

Tool categories:

```
filesystem
memory
external APIs
AITLAS actions
custom user tools
```

---

# 11. Tool Execution Flow

```
LLM response
↓
detect tool call
↓
validate tool
↓
execute tool
↓
inject output
↓
continue loop
```

---

# 12. Tool Registry

The registry stores metadata about all tools.

Implementation uses an in-memory registry for speed.

Example structure:

```
tool_name
description
input_schema
permissions
runtime
```

The registry is cached using ETS.

---

# 13. Tool Security

Tool execution passes through a **Prompt Injection Guard**.

Checks include:

```
tool_allowlist
argument validation
permission scope
```

Unauthorized tools are blocked.

---

# 14. Filesystem Service

Provides controlled file access.

Core operations:

```
fs.read
fs.write
fs.list
fs.search
fs.metadata
```

Scopes:

```
project
workspace
user
```

Permissions are enforced by the runtime.

---

# 15. Memory System

Memory allows agents to retain long-term knowledge.

Two memory types exist:

### Vector Memory

Semantic embeddings for retrieval.

### Structured Memory

Key-value storage.

---

# 16. Memory Operations

Available tools:

```
memory.store
memory.search
memory.update
memory.delete
```

Vector search uses:

```
HNSW index
```

This enables fast similarity queries.

---

# 17. Provider Adapter Layer

Nexus supports multiple model providers.

Examples include:

* OpenAI
* Anthropic
* Google

Users provide their own API keys.

This approach is known as **Bring Your Own Key (BYOK)**.

---

# 18. Multimodal Support

Models may accept multiple input types.

Nexus supports:

```
text
image
audio
video
files
```

The provider adapter normalizes requests across providers.

---

# 19. Task Execution System

Agent runs are executed as background jobs.

Job orchestration uses:

Oban

Benefits:

```
durable jobs
retries
queue priorities
rate limiting
distributed execution
```

Each agent run corresponds to a job.

---

# 20. Workflow Orchestration

Complex workflows may involve multiple agents.

Architectural ideas are inspired by:

* DeerFlow
* Jido

These systems influence pipeline design.

---

# 21. Deterministic Replay

Every run can be reproduced.

Replay data includes:

```
execution_hash
prompt_hash
output_hash
provider_version
seed
```

Replay modes:

### Strict Replay

Reproduce exact execution.

### Live Replay

Execute again with current models.

---

# 22. Observability

Every execution step produces telemetry.

Metrics include:

```
run_id
step
model
tokens
tool_calls
cost
latency
errors
```

These metrics support:

```
debugging
analytics
billing
optimization
```

Logs are sanitized through **Secrets Redaction Middleware**.

---

# 23. Data Storage

Primary database:

```
PostgreSQL
```

Tables include:

```
agent_runs
agent_steps
tool_calls
memory_vectors
files
events
```

Vector search is implemented using HNSW indexing.

---

# 24. Worker Architecture

Workers process queued tasks.

Worker categories:

```
agent_runner
tool_executor
memory_indexer
file_processor
embedding_worker
```

Workers scale horizontally.

---

# 25. Event System

Nexus emits internal events.

Examples:

```
agent.run.started
agent.step.completed
tool.call.executed
memory.entry.created
```

Events enable:

```
observability
analytics
UI updates
```

---

# 26. Security Model

Security protections include:

### Prompt Injection Guard

Prevents malicious tool calls.

### Tool Allowlists

Agents may only access approved tools.

### Filesystem Scopes

Agents cannot access unrestricted files.

### Secret Redaction

Sensitive data removed from logs.

---

# 27. Scaling Strategy

Nexus is designed for horizontal scaling.

Scaling layers:

```
stateless API nodes
distributed workers
Postgres replication
```

Queue throughput increases by adding workers.

---

# 28. Integration with AITLAS Ecosystem

Nexus powers the following components:

### MCP

External connectors.

### Actions

Applications built on tools.

### Skills

Curated internal capabilities.

### Agents

Deployable intelligent workers.

Nexus executes all of them.

---

# 29. OSS Components Leveraged

The architecture builds on proven open-source systems.

Key inspirations include:

* Oban
* Trigger.dev
* Jido
* DeerFlow
* pi-mono

These projects provide patterns for workflow orchestration, agent execution, and tool pipelines.

---

# 30. Core Principle

The fundamental design philosophy of Nexus is:

```
Every agent run is a commit.
```

Execution logs form a complete record of reasoning, actions, and outputs.

Over time this creates a dataset that enables:

```
debugging
training
optimization
research
```

Nexus therefore acts as **the Git system of agent execution**.

---
