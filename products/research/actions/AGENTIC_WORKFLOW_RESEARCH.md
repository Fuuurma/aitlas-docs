# Agentic Workflow Research - Open Source Landscape

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---
**Last Updated:** 2026-03-08  
**Purpose:** Map open source projects we can leverage for Aitlas

---

## Overview

We've researched 20+ open source projects across 5 tiers:

| Tier | Category | Examples |
|------|----------|----------|
| 1 | Coding Agents (BYOK) | OpenCode, Crush, T3 Code, Cline, Aider, Codex CLI |
| 2 | Multi-Agent Orchestration | CrewAI, LangGraph, OpenAI Agents SDK, Microsoft Agent Framework |
| 3 | Parallel Execution | Agent Orchestrator, Swarms |
| 4 | Workflow & Execution | Symphony, Trigger.dev |
| 5 | Visual/Low-Code | Flowise, Langflow |

---

## Tier 1: Coding Agents

### OpenCode (anomalyco/opencode)
- **Stars:** ~20K
- **License:** MIT
- **Key Features:**
  - Provider-agnostic (Claude, OpenAI, Google, local)
  - Desktop + TUI + IDE
  - Client/server architecture
  - Built-in agents: build + plan
  - LSP support

### Crush (charmbracelet/crush)
- **Stars:** ~15K
- **License:** FSL-1.1-MIT
- **Key Features:**
  - AGENTS.md format (same as ours!)
  - Agent Skills standard (agentskills.io)
  - MCP support (stdio, HTTP, SSE)
  - Bubble Tea TUI
  - Permission system

### T3 Code (nailbedsoftware/t3)
- **Stars:** ~5K
- **License:** MIT
- **Key Features:**
  - Desktop + web UI
  - WebSocket server
  - Provider routing
  - Codex wrapper architecture
  - **Cloned to:** `/Users/sergi/Projects/t3code-reference/`

---

## Tier 2: Multi-Agent Orchestration

### CrewAI (crewAIInc/crewAI) ⭐ TOP PICK
- **Stars:** 44K+
- **License:** MIT
- **Key Concepts:**
  - **Crews:** Teams of autonomous agents
  - **Flows:** Event-driven workflow control
  - **Decorators:** @start, @listen, @router
  - **Processes:** Sequential vs Hierarchical (manager)

**Architecture:**
```
Flow (control) → Crew (autonomy) → Agents (execution)
```

**What we use:**
- Crews for agent teams
- Flows for workflow orchestration
- Router pattern for branching

### LangGraph (langchain-ai/langgraph)
- **Stars:** 50K+
- **License:** MIT
- **Key Concepts:**
  - Graph-based workflows
  - State persistence
  - Checkpointing
  - Time-travel debugging
  - Conditional edges

**What we use:**
- State management patterns
- Checkpointing for long workflows
- Graph visualization

### OpenAI Agents SDK (openai/openai-agents-python)
- **Stars:** 19K+
- **License:** MIT
- **Key Concepts:**
  - **Handoffs:** Agent-to-agent delegation
  - **Agents as tools:** Wrap agents for composition
  - **Guardrails:** Input/output validation
  - **Tracing:** Built-in observability

**What we use:**
- Handoff mechanism
- Guardrails pattern
- Python-first design

### Microsoft Agent Framework
- **Stars:** ~10K
- **License:** MIT
- **Key Concepts:**
  - Python + .NET support
  - Graph-based orchestration
  - OpenTelemetry integration
  - DevUI for debugging

**What we use:**
- Multi-language patterns
- Observability patterns

### Agent Squad (awslabs/agent-squad)
- **Stars:** ~5K
- **License:** Apache 2.0
- **Key Concepts:**
  - **Classifier:** Intent-based routing
  - **SupervisorAgent:** Team coordination
  - **Parallel processing:** Execute multiple agents
  - Pre-built agents

**What we use:**
- Intent classification
- SupervisorAgent pattern

---

## Tier 3: Parallel Execution

### Agent Orchestrator (ComposioHQ/agent-orchestrator) ⭐ TOP PICK
- **Stars:** ~2K
- **License:** MIT
- **Key Concepts:**
  - Git worktrees for isolation
  - **Reactions:** Autonomous CI fixes, review handling
  - **Plugin architecture:** 8 swappable slots
  - Dashboard for supervision

**Plugin Slots:**
| Slot | Default | Alternatives |
|------|---------|--------------|
| Runtime | tmux | docker, k8s |
| Agent | claude-code | codex, aider, opencode |
| Workspace | worktree | clone |
| Tracker | github | linear |
| Notifier | desktop | slack, webhook |
| Terminal | iterm2 | web |

**What we use:**
- Git worktrees (already in OpenClaw)
- Reactions system
- Plugin architecture

---

## Architecture Patterns

### 1. CrewAI: Crews + Flows
```
Flow (event-driven control)
    │
    ├── @start() → triggers workflow
    ├── @listen() → responds to events
    └── @router() → conditional branching
            │
            ▼
        Crew (autonomous team)
            │
            ├── Agent 1 (role, goal, backstory)
            ├── Agent 2 (role, goal, backstory)
            └── Agent 3 (role, goal, backstory)
```

### 2. OpenAI SDK: Handoffs
```
TriageAgent
    │
    ├── handoff → SalesAgent
    ├── handoff → SupportAgent
    └── handoff → EngineerAgent
```

### 3. Agent Squad: Classifier + Supervisor
```
User Input
    │
    ▼
Classifier → routes to best agent
    │
    ├── Agent 1 (specialized)
    ├── Agent 2 (specialized)
    └── Agent 3 (specialized)
            │
            ▼
    SupervisorAgent (coordinates)
```

### 4. Agent Orchestrator: Parallel Worktrees
```
Issue #123
    │
    ├── Worktree 1 → Agent A → PR #1
    ├── Worktree 2 → Agent B → PR #2
    └── Worktree 3 → Agent C → PR #3
            │
            ▼
        Reactions (auto-fix CI, reviews)
```

---

## What We're Using

### Already Integrated
| Component | Source | Location |
|-----------|--------|----------|
| AGENTS.md | Crush | Project context |
| Skills system | OpenClaw | ~/.config/crush/skills/ |
| Git worktrees | Agent Orchestrator | OpenClaw native |
| Provider-agnostic | OpenCode | Planned for Nexus |

### Planned Integration
| Component | Source | Priority |
|-----------|--------|----------|
| Crews + Flows | CrewAI | HIGH |
| Handoffs | OpenAI SDK | HIGH |
| Intent classification | Agent Squad | MEDIUM |
| Reactions | Agent Orchestrator | MEDIUM |
| State management | LangGraph | MEDIUM |

---

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      NEXUS UI                           │
│              (Forked from T3 Code)                      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              PROVIDER ROUTER                     │   │
│  │                                                 │   │
│  │  BYOK Mode          │  Aitlas Mode             │   │
│  │  ─────────          │  ───────────             │   │
│  │  • Codex            │  • f.xyz Actions         │   │
│  │  • Claude Code      │  • Agents Store          │   │
│  │  • OpenCode         │  • Memory                │   │
│  │  • Gemini           │  • Tasks                 │   │
│  │                     │  • Orchestration         │   │
│  └─────────────────────────────────────────────────┘   │
│                         │                              │
│                         ▼                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │           F.LOOP ORCHESTRATOR                    │   │
│  │           (CrewAI Flows pattern)                │   │
│  │                                                 │   │
│  │  @start → @listen → @router → @listen           │   │
│  │                                                 │   │
│  │  Crews: Agent teams with handoffs               │   │
│  │  State: LangGraph patterns                      │   │
│  │  Classifier: Agent Squad patterns               │   │
│  │  Reactions: Agent Orchestrator patterns         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Repositories to Clone

```bash
# Already cloned
/Users/sergi/Projects/t3code-reference/

# Recommended for reference
git clone https://github.com/crewAIInc/crewAI.git crewai-reference
git clone https://github.com/openai/openai-agents-python.git openai-agents-reference
git clone https://github.com/awslabs/agent-squad.git agent-squad-reference
git clone https://github.com/ComposioHQ/agent-orchestrator.git agent-orchestrator-reference
git clone https://github.com/langchain-ai/langgraph.git langgraph-reference
```

---

## Key Decisions

1. **Use CrewAI Flows** for orchestration (event-driven, Python-native)
2. **Use OpenAI SDK handoffs** for agent delegation
3. **Use Agent Squad classifier** for routing
4. **Use Agent Orchestrator reactions** for autonomous handling
5. **Keep BYOK model** - validated by all major players

---

## Links

- CrewAI Docs: https://docs.crewai.com
- LangGraph Docs: https://langchain-ai.github.io/langgraph/
- OpenAI Agents SDK: https://openai.github.io/openai-agents-python/
- Agent Squad Docs: https://awslabs.github.io/agent-squad/
- Agent Orchestrator: https://github.com/ComposioHQ/agent-orchestrator