# Nexus Remediation + Symphony Integration Plan

**Status:** Draft (implementation-ready)  
**Owner:** Engineering  
**Priority:** Nexus core conformance first  
**OSS Strategy:** Selective port from Symphony OSS  
**Directive:** MCP-first agentic engineering

## Summary

This plan brings the codebase into alignment with the canonical Nexus docs, fixes security and durability gaps, and selectively ports Symphony OSS components to deliver the full Tasks orchestration layer. Breaking API changes are allowed. Dates are intentionally omitted; execution is step-ordered for maximum clarity and correctness.

## Canonical Sources

- `docs/architecture/MASTER_ARCHITECTURE.md`
- `docs/products/nexus/nexus-technical-doc.md`
- `docs/architecture/agent-graphs.md`
- `docs/products/nexus/agent-graphs-technical-doc.md`
- `docs/architecture/integrations/AITLAS_MCP_SPEC.md`
- `docs/architecture/integrations/mcp-protocol.md`
- `docs/products/nexus/SYMPHONY_INTEGRATION.md`

## Non‑Negotiables (Must Hold After Remediation)

- All DB mutations use `Repo.with_transaction/1`.
- All queries are scoped by `user_id` where applicable.
- Credits are deducted **only after** successful execution.
- Decrypted API keys are never assigned to variables; inline usage only.
- Tool calls are validated by schema **and** allowlist enforcement.
- MCP is the primary tool execution interface.
- Deterministic replay is supported (hashes, seeds, trace).
- Hard limits enforced every loop iteration (iterations, tool calls, tokens, credits, runtime).
- Use `Aitlas.LoggerRedactor` for sanitized logs.

## Guiding Principles

- **MCP-first**: all tools and agentic actions flow through MCP-compatible interfaces.
- **Durable by default**: task execution must survive restarts.
- **Least privilege**: tool allowlists and dangerous tool gating.
- **Deterministic execution**: stable traces, replayable runs.
- **Selective OSS leverage**: port Symphony components that reduce risk/time without overriding Nexus architecture.

## Current Gaps (High Signal)

- Task execution is transient (`Task.start`) instead of durable (Oban worker).
- Repo mutations are not consistently wrapped in `Repo.with_transaction/1`.
- BYOK key handling assigns decrypted keys to variables.
- Tool allowlist enforcement is missing at execution time.
- CapabilityGraph exists but is unused for filtering tools.
- Agent Graphs tool is stubbed (`agent_call` not implemented).
- Local agent execution path exists but is not wired.
- Replay Engine is not implemented.
- MCP tooling is split from ToolRegistry/ToolExecutor.
- Symphony orchestration layer not implemented.

## Plan (Decision‑Complete)

### Phase 0 — Baseline Alignment

1. Confirm doc precedence and freeze on canonical sources listed above.
2. Deprecate internal references to outdated Nexus docs (`docs/products/nexus/nexus.md`, `nexus-implementation.md`).
3. Add a “canonical spec” header comment in key modules (AgentLoop, ToolExecutor, ProviderRouter, Tasks).

**Acceptance Criteria**

- All future changes explicitly reference canonical docs in commit descriptions or PR templates.

---

### Phase 1 — Security + Transactional Integrity

**Goal:** enforce non‑negotiables in the code path.

1. Wrap **all** DB mutations with `Repo.with_transaction/1`.
2. Enforce `user_id` scoping on all task queries that are user-facing.
3. Update BYOK key handling to inline usage only.
4. Route all log output through `Aitlas.LoggerRedactor`.
5. Add tests that fail if decrypted keys are assigned to variables.

**Required Code Touchpoints**

- `lib/aitlas/tasks.ex`
- `lib/aitlas/agent_loop/agent_loop.ex`
- `lib/aitlas/tool_executor.ex`
- `lib/aitlas_web/controllers/task_controller.ex`
- `lib/aitlas/provider_router/provider_router.ex`
- `lib/aitlas/logger_redactor.ex`

**Acceptance Criteria**

- DB writes are always inside `Repo.with_transaction/1`.
- BYOK keys never appear in logs and are never assigned to variables.
- Credit deductions are only executed on success.

**Tests**

- Unit tests for transactional writes.
- Tests that verify user scoping on task reads.
- Log redaction test that ensures key material is never logged.

---

### Phase 2 — Durable Execution (Oban Worker)

**Goal:** replace transient execution with durable tasks.

1. Create `Aitlas.Workers.AgentRunner` (Oban) as the execution entrypoint.
2. Move task dispatch from `Task.start` to Oban.
3. Add task lifecycle management in `Aitlas.Tasks.Workflow`.
4. Add watchdog job for stale tasks.
5. Ensure all task state transitions are replayable and persisted.

**Required Code Touchpoints**

- `lib/aitlas/workers/agent_runner.ex`
- `lib/aitlas/tasks/workflow.ex`
- `lib/aitlas_web/controllers/task_controller.ex`
- `lib/aitlas/reconciliation.ex`

**Acceptance Criteria**

- Task execution survives process restarts.
- Task transitions are deterministic and persisted.
- Task timeouts are enforced by worker watchdog.

**Tests**

- Oban worker runs a task to completion.
- Worker crash and retry results in a single completion.

---

### Phase 3 — MCP‑First Tooling + Capability Filtering

**Goal:** unify tool execution under MCP and enforce allowlists.

1. Make ToolRegistry the single source of tool definitions, including MCP tools.
2. Add an MCP discovery adapter to register external tools into ToolRegistry.
3. Enforce allowlist validation **before** ToolExecutor executes any tool.
4. Integrate CapabilityGraph filtering into ContextBuilder.
5. Remove duplicate tool definitions from `Aitlas.MCP.Tools` or bridge them into ToolRegistry.

**Required Code Touchpoints**

- `lib/aitlas/tool_registry.ex`
- `lib/aitlas/tool_executor.ex`
- `lib/aitlas/context/context_builder.ex`
- `lib/aitlas/mcp/dispatcher.ex`
- `lib/aitlas/mcp/tools.ex`
- `lib/aitlas/capability_graph.ex`

**Acceptance Criteria**

- All tool calls use ToolRegistry‑defined schemas.
- Tool allowlists are enforced for every tool invocation.
- CapabilityGraph filters tool set before LLM sees them.

**Tests**

- Tool call rejected when not in allowlist.
- CapabilityGraph restricts tools by goal.
- MCP tool list reflects ToolRegistry state.

---

### Phase 4 — Agent Loop Conformance

**Goal:** bring loop phases and budgets into canonical compliance.

1. Implement **true REFLECT phase** as a separate LLM call.
2. Add Context Compression Pipeline (relevance filter, summarization, memory injection).
3. Enforce BudgetGuard checks every iteration, including agent depth.
4. Ensure step persistence includes prompt hash and response hash.
5. Add deterministic replay hashes at each step and tool call.

**Required Code Touchpoints**

- `lib/aitlas/agent_loop/agent_loop.ex`
- `lib/aitlas/context/context_builder.ex`
- `lib/aitlas/context/compactor.ex` (new)
- `lib/aitlas/budget_guard.ex`
- `lib/aitlas/memory_engine.ex`

**Acceptance Criteria**

- PLAN / ACT / REFLECT / PERSIST phases are explicit and persisted.
- Context compression runs before each LLM call.
- Budgets terminate tasks deterministically on limit breach.

**Tests**

- REFLECT uses its own LLM call.
- Context compression triggers at configured thresholds.
- BudgetGuard stops runaway loops.

---

### Phase 5 — Agent Graphs (Agent‑as‑Tool)

**Goal:** full agent‑graph feature per canonical docs.

1. Implement `GraphContext` and persist lineage in tasks.
2. Implement `Aitlas.Tools.AgentCall` to create child tasks and wait/return output.
3. Enforce cycle detection and depth limits.
4. Update TaskChannel broadcasting for graph events.
5. Ensure credit usage is inherited or capped by parent task.

**Required Code Touchpoints**

- `lib/aitlas/tools/agent_call.ex`
- `lib/aitlas/agent_loop/state.ex`
- `lib/aitlas/tasks/task.ex`
- `lib/aitlas/tasks/tool_call.ex`
- `lib/aitlas_web/channels/task_channel.ex`

**Acceptance Criteria**

- Agent calls execute as child tasks and return tool results.
- Graph depth and call budget are enforced.
- Replay includes graph lineage.

**Tests**

- Agent calling agent works end‑to‑end.
- Cycle detection blocks recursive calls.

---

### Phase 6 — Local Agent Integration (Codex/Claude Code/OpenCode)

**Goal:** enable local‑agent provider path.

1. Wire `run_local_agent_loop/1` to dispatch when provider type is `:local_agent`.
2. Ensure tool calls from local agents go through ToolExecutor.
3. Validate workspace sandboxing and lifecycle hooks.

**Required Code Touchpoints**

- `lib/aitlas/agent_loop/agent_loop.ex`
- `lib/aitlas/codex_client.ex`
- `lib/aitlas/workspace.ex`

**Acceptance Criteria**

- Local agent provider runs via JSON‑RPC with tool interception.
- Workspace isolation enforced.

**Tests**

- Mock local agent session uses ToolExecutor successfully.

---

### Phase 7 — Replay Engine

**Goal:** deliver deterministic replay and fork support.

1. Create ReplayEngine module that replays from persisted steps.
2. Store and validate prompt hashes and outputs.
3. Add replay endpoints and Phoenix events.

**Required Code Touchpoints**

- `lib/aitlas/replay_engine.ex` (new)
- `lib/aitlas_web/controllers/replay_controller.ex` (new)
- `lib/aitlas_web/channels/task_channel.ex`

**Acceptance Criteria**

- Replay of a completed task yields identical output when deterministic settings are used.

**Tests**

- Replay call returns identical outputs for pinned models.

---

### Phase 8 — Symphony Integration (Selective OSS Port)

**Goal:** build full orchestration layer aligned with Nexus.

**Selective components to port from Symphony OSS:**

1. Workspace Manager patterns.
2. Orchestrator loop and poll tick logic.
3. Workflow loader (`WORKFLOW.md`) parser.
4. Status surface telemetry patterns.
5. Issue tracker adapter interface.

**Implementation Steps**

1. Add a `WorkflowLoader` to parse `WORKFLOW.md` with YAML front matter.
2. Add `Orchestrator` module to fetch candidate tasks and dispatch into Nexus runtime.
3. Add `TrackerAdapter` behaviour and one implementation stub.
4. Add Nova Tasks UI hooks (server events) via Phoenix channels.
5. Link Workflow config to AgentLoop via task creation metadata.

**Required Code Touchpoints**

- `lib/aitlas/tasks/workflow_loader.ex` (new)
- `lib/aitlas/orchestrator.ex` (new)
- `lib/aitlas/tracker_adapter.ex` (new)
- `lib/aitlas/workspace.ex`
- `lib/aitlas_web/channels/task_channel.ex`

**Acceptance Criteria**

- `WORKFLOW.md` is parsed and applied to task execution.
- Orchestrator dispatches tasks to Nexus runtime.
- Task status updates map cleanly to Nova Tasks UI.

**Tests**

- Workflow config parsing.
- Orchestrator dispatch and retry behavior.

---

## API / Schema Changes (Breaking Allowed)

1. Update task creation API to accept `agent_spec`, `tool_allowlist`, `graph_context`, and `workflow_id`.
2. MCP endpoint becomes canonical tool execution gateway (ToolRegistry‑backed).
3. Add replay endpoints.

## Test Strategy

- Unit tests for each engine boundary.
- Integration tests for:
  - task lifecycle via Oban
  - MCP tool list + call
  - agent graphs
  - replay
- Property tests for BudgetGuard and InjectionGuard.

## Rollout Strategy

- Feature flags for:
  - MCP‑only tooling
  - Agent Graphs
  - Replay Engine
  - Symphony Orchestrator
- Staged migration from legacy API behavior to canonical behavior.

## Risks and Mitigations

- **Risk:** Breaking API changes destabilize clients.  
  **Mitigation:** Versioned endpoints; keep `/api/v1` stable until `/api/v2` is validated.

- **Risk:** Symphony OSS integration diverges from Nexus.  
  **Mitigation:** Port components selectively and keep Nexus runtime as the authoritative execution kernel.

## Deliverables

- Canonical‑aligned Nexus runtime.
- MCP‑first tool execution.
- Durable execution via Oban.
- Full Symphony‑style orchestration layer.
- Deterministic replay.

