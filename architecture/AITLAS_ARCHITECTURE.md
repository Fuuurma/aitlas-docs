# Aitlas Architecture

**Last Updated:** 2026-03-08

---

## What is Aitlas?

Aitlas = **Nexus** + **Agents Store** + **Actions**

Three pillars that work together:

```
┌─────────────────────────────────────────────────────────────┐
│                         AITLAS                              │
│                                                             │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐      │
│   │   NEXUS     │   │   AGENTS    │   │   ACTIONS   │      │
│   │             │   │   STORE     │   │             │      │
│   └─────────────┘   └─────────────┘   └─────────────┘      │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           │                                 │
│                    ┌──────▼──────┐                         │
│                    │   F.LOOP    │                         │
│                    │ ORCHESTRATOR│                         │
│                    └─────────────┘                         │
│                           │                                 │
│              Subscription OR Credits                        │
└─────────────────────────────────────────────────────────────┘
```

---

## The Three Pillars

### 1. Nexus (UI Layer)

**What it is:** The interface where users interact with AI

**Forked from:** T3 Code

**Features:**
- Desktop app (Electron)
- Web app (React)
- Terminal UI (optional)
- Provider router (BYOK)

**Two modes:**
| Mode | Cost | Features |
|------|------|----------|
| **BYOK (Free)** | $0 | Use any coding agent (Codex, Claude Code, OpenCode, Gemini) with user's API keys |
| **Aitlas** | Subscription/Credits | Full ecosystem: Agents Store + Actions + f.loop orchestration |

---

### 2. Agents Store

**What it is:** Marketplace of pre-configured agents

**Inspired by:** Agency Agents (61 templates)

**Structure:**
```
Agent Store
├── Coding Agents
│   ├── Frontend Specialist
│   ├── Backend Developer
│   ├── DevOps Engineer
│   └── Code Reviewer
├── Research Agents
│   ├── Web Researcher
│   ├── Data Analyst
│   └── Document Summarizer
├── Creative Agents
│   ├── Content Writer
│   ├── Marketing Copywriter
│   └── Social Media Manager
└── Custom Agents
    └── User-created agents
```

**Agent Format:**
```yaml
name: Frontend Specialist
role: Expert in React, Next.js, TypeScript
tools:
  - file_read
  - file_write
  - bash
  - web_search
skills:
  - frontend-design
  - test-driven-development
model_preferences:
  - claude-sonnet-4
  - gpt-4.1
backstory: |
  You are a senior frontend developer with 10 years of experience.
  You specialize in React, Next.js, and TypeScript.
  You write clean, testable, accessible code.
```

---

### 3. Actions

**What it is:** Pre-built tools/tasks that agents can execute

**Inspired by:** OpenCode tools, Crush MCP

**Examples:**
| Action | Description |
|--------|-------------|
| `git_check` | Check git status, staged changes, branch |
| `docker_status` | Check container status, logs |
| `code_review` | Review PR with focus areas |
| `research` | Web search + summarization |
| `daily_news` | Fetch and summarize news |
| `github_pr` | Create/update PRs |

**Action Format:**
```yaml
name: Git Check
description: Check repository status
command: git status --short
output_format: text
category: developer_tools
```

---

## f.loop - The Orchestrator

**What it is:** The brain that connects everything

**Inspired by:** CrewAI Flows, Symphony, Trigger.dev

**Pricing:**
| Option | Cost | Use Case |
|--------|------|----------|
| **Subscription** | $20/mo | Unlimited orchestration, best for power users |
| **Credits** | Pay-per-use | Occasional users, pay only what you use |

**What f.loop does:**
```
User Request
    │
    ▼
┌─────────────────────────────────────┐
│           F.LOOP                    │
│                                     │
│  1. CLASSIFY                        │
│     └── Agent Squad classifier      │
│         └── Route to best agent     │
│                                     │
│  2. ORCHESTRATE                     │
│     └── CrewAI Flows                │
│         └── Event-driven control    │
│                                     │
│  3. EXECUTE                         │
│     └── Agents from Store           │
│         └── Use Actions             │
│                                     │
│  4. COORDINATE                      │
│     └── OpenAI SDK Handoffs         │
│         └── Agent-to-agent          │
│                                     │
│  5. REACT                           │
│     └── Agent Orchestrator patterns │
│         └── Auto CI fixes, reviews  │
└─────────────────────────────────────┘
```

---

## How They Work Together

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

## BYOK vs Aitlas Mode

| Feature | BYOK (Free) | Aitlas (Paid) |
|---------|-------------|---------------|
| **Interface** | ✅ Nexus UI | ✅ Nexus UI |
| **Coding Agents** | ✅ Codex, Claude Code, OpenCode, Gemini | ✅ All BYOK agents |
| **Agent Store** | ❌ | ✅ 61+ pre-configured agents |
| **Actions** | ❌ | ✅ 50+ pre-built actions |
| **f.loop Orchestration** | ❌ | ✅ Multi-agent coordination |
| **Memory** | ❌ | ✅ Persistent, semantic search |
| **Tasks** | ❌ | ✅ Scheduled, recurring |
| **Parallel Execution** | ❌ | ✅ Multiple agents simultaneously |
| **Reactions** | ❌ | ✅ Auto CI fixes, review handling |

---

## Pricing Model

### BYOK (Free)
- $0/month
- User provides own API keys
- Single agent at a time
- Basic tools (file, bash, search)

### Aitlas Subscription ($20/month)
- Everything in BYOK
- Full Agents Store access
- All Actions included
- Unlimited f.loop orchestration
- Memory + Tasks
- Parallel execution

### Aitlas Credits (Pay-per-use)
- For occasional users
- Buy credits: $5 = 500 credits
- Orchestration: 10 credits/task
- Agent execution: 5 credits/agent
- Actions: 1-5 credits/action

---

## Open Source Leverage

| Component | Source | What We Use |
|-----------|--------|-------------|
| **Nexus UI** | T3 Code | Desktop + web app, provider router |
| **Orchestration** | CrewAI | Flows (control) + Crews (teams) |
| **Handoffs** | OpenAI Agents SDK | Agent-to-agent delegation |
| **Classification** | Agent Squad | Intent routing |
| **Reactions** | Agent Orchestrator | Auto-handling |
| **State** | LangGraph | Checkpointing, persistence |
| **Context** | Crush | AGENTS.md format |

---

## File Locations

This doc synced to:
- `aitlas-ui-template/docs/architecture/AITLAS_ARCHITECTURE.md`
- `aitlas-action-template/docs/AITLAS_ARCHITECTURE.md`
- `aitlas-worker-template/docs/AITLAS_ARCHITECTURE.md`