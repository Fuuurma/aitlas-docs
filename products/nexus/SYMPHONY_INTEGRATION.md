# Symphony — Nexus Tasks Integration

**Status:** 🟡 Integration Candidate  
**Reference:** [openai/symphony](https://github.com/openai/symphony) (9K stars, Apache 2.0)  
**For:** Nexus → Tasks UI  
**Integrates with:** [f.loop](./f-loop.md)

---

## Overview

**Symphony** is OpenAI's task orchestration system that turns project work into autonomous implementation runs.

It solves the problem of **managing work instead of supervising coding agents** — exactly what Nexus Tasks needs!

---

## Why Symphony for Nexus

| Nexus Need | Symphony Solution |
|------------|------------------|
| Task tracking | Issue polling from Linear |
| Per-task execution | Isolated workspaces |
| Agent runs | Agent Runner |
| Progress tracking | Status Surface |
| No supervision | Manage work, not agents |
| Versioned workflows | WORKFLOW.md in repo |

---

## Architecture

### Symphony Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Symphony Architecture                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   Issue    │───▶│            │───▶│   Agent    │    │
│  │  Tracker   │    │Orchestrator│    │   Runner   │    │
│  │  Client   │    │            │    │            │    │
│  └─────────────┘    └──────┬──────┘    └─────────────┘    │
│                            │                                 │
│         ┌──────────────────┼──────────────────┐              │
│         ↓                  ↓                  ↓              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  Workspace  │  │    Work-    │  │   Status    │       │
│  │  Manager    │  │  flow.md   │  │  Surface    │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Components Deep Dive

#### 1. Issue Tracker Client
- Fetches candidate issues from Linear (or any tracker)
- Normalizes payloads into stable issue model
- Reconciliation on startup

#### 2. Orchestrator
- Owns the poll tick
- Maintains runtime state
- Decides: dispatch, retry, stop, release
- Tracks metrics and retry queue

#### 3. Workspace Manager
- Maps issue ID → workspace path
- Creates per-issue directories
- Runs lifecycle hooks
- Cleans up terminal issues

#### 4. Agent Runner
- Creates workspace
- Builds prompt from issue + workflow
- Launches coding agent
- Streams updates to orchestrator

#### 5. Workflow Loader
- Reads `WORKFLOW.md`
- Parses YAML front matter + prompt body
- Returns `{config, prompt_template}`

#### 6. Config Layer
- Typed getters for workflow config
- Defaults + environment indirection
- Validation

#### 7. Status Surface
- Structured logs
- Observability
- Debug multiple concurrent runs

---

## Nexus Integration

### How Symphony Fits in Aitlas

```
┌─────────────────────────────────────────────────────────────┐
│                       Aitlas                                 │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Nexus                              │   │
│  │                                                      │   │
│  │  ┌───────────┐    ┌───────────┐    ┌───────────┐   │   │
│  │  │  Tasks    │───▶│ Symphony  │───▶│  f.loop   │   │   │
│  │  │    UI     │    │   Engine  │    │  Worker   │   │   │
│  │  └───────────┘    └───────────┘    └───────────┘   │   │
│  │        │                  │                  │         │   │
│  │    Track tasks        Orchestrate        Execute    │   │
│  │    View progress     Per-task            Agent      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Integration Points

| Component | Nexus Use |
|----------|----------|
| Issue Tracker Client | → Task queue (our DB) |
| Orchestrator | → f.loop task dispatch |
| Workspace Manager | → Per-task isolation |
| Agent Runner | → f.loop execution |
| Status Surface | → Tasks UI progress |
| Workflow Loader | → Task templates |

---

## Nexus Tasks UI

### Screens

#### 1. Task Board
- Kanban view (To Do → In Progress → Review → Done)
- Task cards with progress
- Drag-and-drop

#### 2. Task Detail
- Task description
- Subtasks
- Progress timeline
- Agent logs
- Proof of work

#### 3. Task Creation
- Create from prompt
- Template selection
- Priority/status

#### 4. Workspace View
- Live terminal output
- File changes
- Git status

---

## WORKFLOW.md for Nexus

Symphony uses `WORKFLOW.md` in the repo — we can extend this:

```markdown
---
name: bug-fix
description: Fix a bug in the codebase
agent: claude-code
timeout: 30m
retries: 2
---

You are a coding agent tasked with fixing bugs.

## Task
{issue_description}

## Steps
1. Understand the bug
2. Find the relevant code
3. Implement fix
4. Test the fix

## Validation
- Tests pass
- No regressions
```

### Nexus-Enhanced Fields

```yaml
---
name: {task_name}
description: {description}
agent: {agent_type}        # claude-code, openai-codex, custom
timeout: {duration}
retries: {count}
priority: {1-5}
credits: {cost_estimate}
notify: {channels}
---
```

---

## Implementation

### Phase 1: Reference Implementation
- Study Symphony SPEC.md
- Design Nexus Tasks UI
- Define WORKFLOW.md format

### Phase 2: Build Core
- Task queue in our DB
- Orchestrator (simplified)
- Workspace Manager

### Phase 3: Integrate f.loop
- Agent Runner → f.loop
- Progress streaming
- Status updates

### Phase 4: UI
- Task board
- Detail views
- Live terminal

---

## Credit Model

| Action | Credits |
|--------|---------|
| Create task | 1 |
| Task execution | 10-50 (depends on complexity) |
| Workspace storage | 0.1/day |
| Priority boost | +2 |

---

## Comparison: Symphony vs Alternatives

| Feature | Symphony | Temporal | f.loop |
|---------|----------|----------|--------|
| Agent-native | ✅ | ❌ | ✅ |
| Issue tracking | ✅ | ❌ | ❌ |
| WORKFLOW.md | ✅ | ❌ | ❌ |
| Workspace isolation | ✅ | ❌ | Partial |
| MIT/Apache | ✅ | ✅ | ✅ |

---

## References

- [Symphony GitHub](https://github.com/openai/symphony)
- [Symphony SPEC.md](https://github.com/openai/symphony/blob/main/SPEC.md)
- [f.loop Spec](./f-loop.md)
- [Nexus Spec](../products/nexus/README.md)

---

*Status: 🟡 Integration Candidate — Design phase*
