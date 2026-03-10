# Harness Engineering — Research

**Reference:** [OpenAI Harness Engineering](https://openai.com/index/harness-engineering/)

---

## Overview

> "Harness Engineering" = A paradigm where coding agents are managed through **isolated, autonomous implementation runs** rather than direct supervision.

The core idea: **manage work, not agents**.

---

## Core Principles

### Traditional Approach
```
Human → Agent → Task → Human supervises every step
```

### Harness Approach
```
Human → Work (issue) → Agent (autonomous) → Proof → Human reviews
```

---

## Key Concepts

### 1. Isolated Workspaces

Each task gets its own **sandboxed workspace**:

```
Issue-123/
├── code/
├── tests/
├── .symphony/
└── WORKFLOW.md
```

Agents can ONLY operate within their workspace.

### 2. WORKFLOW.md Contract

Workflow policy lives **in the repo**:

```yaml
---
name: fix-bug
agent: claude-code
max_runtime: 30m
approval_required: true
---

You are a coding agent. Fix the bug described in the issue.
```

### 3. Proof of Work

Agents must provide **verifiable evidence**:

- CI status
- PR review feedback  
- Complexity analysis
- Walkthrough videos
- Test results

### 4. Human-in-the-Loop

Not fully autonomous — humans **review and approve**:

```
Agent完成任务 → PR创建 → Human Review → Land or Reject
```

---

## Symphony Architecture

```
Linear Issue
     ↓
Symphony Orchestrator
     ↓
Isolated Workspace (per issue)
     ↓
Coding Agent (Codex)
     ↓
PR + Proof → Human Review → Land
```

### Components

| Component | Purpose |
|-----------|---------|
| Workflow Loader | Reads WORKFLOW.md |
| Issue Tracker Client | Fetches from Linear |
| Orchestrator | Polls, dispatches, retries |
| Workspace Manager | Isolates per-issue |
| Agent Runner | Executes coding agent |
| Status Surface | Observability |

---

## For Nexus

### Perfect Alignment

| Harness Concept | Nexus Implementation |
|-----------------|---------------------|
| Isolated workspaces | Tool scope enforcement |
| WORKFLOW.md | Agent manifest |
| Proof of work | Replay engine |
| Human review | Approval flow |

### What to Adopt

1. **Per-run workspaces** — Agents operate in isolation
   ```elixir
   # Nexus could enforce filesystem scopes
   scope: "/workspace/#{run_id}"
   ```

2. **Workflow contracts** — Agent behavior defined in-repo
   ```elixir
   %AgentManifest{
     workflow: "WORKFLOW.md",
     max_runtime: 30_minutes
   }
   ```

3. **Proof of execution** — Every run produces trace
   ```elixir
   %ExecutionProof{
     run_id: "...",
     steps: [...],
     artifacts: [...],
     ci_status: :passed
   }
   ```

4. **Human gates** — Approval before sensitive actions

---

## Why It Matters

Harness engineering solves:

| Problem | Solution |
|---------|----------|
| Agents run amok | Isolated workspaces |
| No accountability | Proof of work |
| Black box | Full replay + logs |
| Untrusted execution | Human approval gates |

---

## Related

- [Symphony Research](./SYMPHONY_RESEARCH.md)
- [Nexus Technical Architecture](./NEXUS_TECHNICAL_ARCHITECTURE.md)
