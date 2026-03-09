# Open Source Integrations

> ⚠️ **Proprietary** — All Aitlas products are **closed source**. No open source license.

---
**Last Updated:** 2026-03-08  
**Purpose:** Track open source projects we integrate with Aitlas ecosystem

---

## Overview

Aitlas leverages best-in-class open source projects. We don't use 100% of any project - we extract the best patterns and integrate them into our architecture.

---

## Active Integrations

### 1. Symphony (OpenAI)

**Repo:** https://github.com/openai/symphony  
**License:** Apache 2.0  
**Used For:** Nexus task orchestration  

#### What We Use
| Component | How We Use It |
|-----------|---------------|
| WORKFLOW.md pattern | Per-project task configuration |
| Per-task workspace isolation | Each task gets isolated execution |
| Orchestrator pattern | Nexus runtime manages task execution |
| Reconciliation loop | Detect stale runs, stop agents |
| Multi-turn continuation | Agents run across multiple turns |
| Hook system | before_run, after_run, etc. |

#### What We Skip
- Linear-specific code (we're tracker-agnostic)
- Codex app-server protocol (we use our own agent protocol)
- Elixir implementation (we use TypeScript/Bun)

#### Integration Location
- `apps/nexus/lib/orchestrator/` - Task orchestration
- `apps/nexus/lib/workspace/` - Workspace management
- `apps/loop/lib/` - Nexus engine (Nexus runtime)

---

### 2. Trigger.dev

**Repo:** https://github.com/triggerdotdev/trigger.dev  
**License:** Apache 2.0  
**Used For:** Nexus runtime (Nexus) durable execution engine  

#### What We Use
| Component | How We Use It |
|-----------|---------------|
| Durable execution | Tasks survive restarts |
| Retry logic | Exponential backoff, retry policies |
| Task orchestration | OBSERVE → REASON → ACT → REPEAT |
| Background workers | Long-running agent tasks |
| Webhook triggers | External integrations |

#### What We Skip
- Their UI (we have Nova)
- Their cloud hosting (self-hosted)
- Some notification features

#### Integration Location
- `apps/loop/` - Nexus runtime (Nexus engine)
- Built on Trigger.dev core

---

### 3. Agency Agents

**Repo:** https://github.com/msitarzewski/agency-agents  
**License:** MIT  
**Used For:** Agents Store templates, personality format  

#### What We Use
| Component | How We Use It |
|-----------|---------------|
| Agent personality format | Name, identity, mission, rules, deliverables |
| 61 agent templates | Seed Agents Store with proven patterns |
| Success metrics | Each agent has measurable outcomes |
| Multi-agent teams | Orchestration patterns |

#### What We Skip
- Copy-paste prompts (we adapt to our architecture)
- Some platform-specific agents (TikTok, Xiaohongshu)
- Manual activation (we auto-dispatch via Nexus runtime)

#### Agent Format We Use
```yaml
---
name: string
description: string
category: engineering | design | marketing | product | pm | testing | support
---

# Identity
[Personality, voice, approach]

# Core Mission
[What this agent does]

# Critical Rules
- [Domain-specific rules]

# Deliverables
[Concrete outputs with examples]

# Workflow
1. [Step-by-step process]

# Success Metrics
[Measurable outcomes]
```

#### Integration Location
- `apps/agents-store/data/seed-agents/` - Adapted templates
- `apps/agents-store/lib/parser/` - Agent format parser

---

### 4. Everything Claude Code (ECC)

**Repo:** https://github.com/affaan-m/everything-claude-code  
**License:** MIT  
**Used For:** Learning system, hooks, strategic compact  

#### What We Use
| Component | How We Use It |
|-----------|---------------|
| Hook architecture | PreToolUse, PostToolUse events |
| Instinct format | Atomic patterns with confidence scoring |
| Strategic compact | Compact at phase transitions |
| Continuous learning | Observer extracts patterns |

#### What We Skip
- Claude Code plugin format (we use our own)
- Cursor adapter
- Single-harness assumptions (we're multi-agent)

#### Instinct Format We Use
```yaml
---
id: prefer-functional-style
trigger: "when writing new functions"
confidence: 0.7
scope: project | global
domain: code-style | architecture | security
evidence:
  - "Observed 5 instances"
  - "User corrected class-based approach"
---

## Action
Use functional patterns over classes.
```

#### Integration Location
- `packages/learning/` - Instinct system
- `apps/nexus/lib/hooks/` - Event capture
- `apps/loop/lib/compact/` - Strategic compact

---

### 5. T3 Code

**Repo:** https://github.com/pingdotgg/t3code  
**License:** MIT  
**Used For:** Nova chat UI, desktop app, provider routing  

#### What We Use
| Component | How We Use It |
|-----------|---------------|
| Chat UI (React/Vite) | Agent conversation interface |
| File viewer | Code rendering |
| Desktop app (Electron) | Cross-platform native app |
| WebSocket protocol | Real-time events |
| Provider abstraction | Multi-agent routing |

#### What We Skip
- Their server (we use Nexus API)
- Codex-only backend
- No contributions (we fork)
- Their pricing/monetization

#### Integration Location
- `apps/nexus/web/` - Forked T3 Code UI
- `apps/nexus/desktop/` - Forked desktop app
- `apps/nexus/server/providers/` - Provider router

#### The Hybrid Model

We fork T3 Code and offer two modes:

```
T3 Code UI (forked as Nova)
    │
    ├── BYOK Mode (Free)
    │   ├── Codex → User's OpenAI key
    │   ├── Claude Code → User's Anthropic key
    │   └── OpenCode → User's key
    │   (Each uses their own tools)
    │
    └── Aitlas Mode (Paid)
        ├── Nexus backend
        ├── f.xyz Actions
        ├── Agents Store
        ├── Memory + Tasks
        └── Nexus runtime orchestration
```

**Why this works:**
- Free tier = user acquisition (no barrier)
- Paid tier = real value (our ecosystem)
- We become the "Swiss Army knife" of coding agents
- Users choose what they want

**Important:** Aitlas mode is also BYOK - users need their own model API keys. We provide the orchestration, tools, and ecosystem, but the user brings their model (GPT-4, Claude, GLM-5, etc.).

---

### 6. OpenCode

**Repo:** https://github.com/anomalyco/opencode  
**Website:** https://opencode.ai  
**License:** MIT  
**Used For:** BYOK reference, provider-agnostic architecture, TUI patterns  

#### What We Use
| Component | How We Use It |
|-----------|---------------|
| BYOK architecture | User provides API keys |
| Multi-model support | Provider-agnostic (Claude, OpenAI, Google, local) |
| TUI patterns | Terminal UI design reference |
| Client/server architecture | Remote control patterns |
| LSP support | Out-of-the-box LSP integration |
| Built-in agents | build + plan agent pattern |

#### Key Features
- **100% open source** - Full transparency
- **Provider-agnostic** - Works with Claude, OpenAI, Google, local models
- **OpenCode Zen** - Recommended models via subscription
- **Desktop app** - Cross-platform GUI
- **TUI focus** - Built by neovim users
- **Client/server** - Remote control architecture

#### What We Learn
- How to build provider-agnostic coding agent
- Multi-agent pattern (build + plan)
- Client/server architecture for remote control
- LSP integration patterns
- TUI design (Bubble Tea style)

#### Key Insight
OpenCode validates our approach:
- **BYOK is standard** - User provides keys
- **Provider-agnostic wins** - Models evolve, pricing drops
- **Open source matters** - 100% transparent
- **Desktop + TUI** - Multiple interfaces to same backend

#### Integration Location
- Reference for provider-agnostic architecture
- TUI patterns (if we add CLI)
- Client/server architecture reference

---

### 7. Crush (Charmbracelet)

**Repo:** https://github.com/charmbracelet/crush  
**License:** FSL-1.1-MIT  
**Used For:** AGENTS.md format, Agent Skills standard  

#### What We Use
| Component | How We Use It |
|-----------|---------------|
| AGENTS.md format | Project context file (same as ours!) |
| Agent Skills | agentskills.io standard |
| MCP support | stdio, HTTP, SSE transports |
| Permission system | Tool approval patterns |

#### Key Features
- **AGENTS.md** - Standard for project context (we use this!)
- **Agent Skills** - Supports agentskills.io standard
- **Multi-provider** - Same as OpenCode

#### Integration Location
- AGENTS.md format validation
- Agent Skills standard (consider adopting)

---

## Planned Integrations

### Under Evaluation

| Project | Purpose | Status |
|---------|---------|--------|
| LangChain | LLM orchestration patterns | Evaluating |
| LlamaIndex | RAG patterns | Evaluating |
| Mem0 | Memory management | Evaluating |
| Supabase | Auth, realtime, storage | Maybe replace some services |

---

## Version Tracking

**Why Track Versions:**
- Security updates
- Breaking changes
- New features to adopt
- Deprecations to handle

### Current Versions (when integrated)

| Project | Version Integrated | Last Checked | Notes |
|---------|-------------------|--------------|-------|
| Symphony | main (2026-03-08) | 2026-03-08 | Spec-driven, no releases |
| Trigger.dev | TBD | - | Not yet integrated |
| Agency Agents | main (2026-03-08) | 2026-03-08 | 61 agents |
| ECC | main (2026-03-08) | 2026-03-08 | 50K+ stars |
| T3 Code | main (2026-03-08) | 2026-03-08 | Cloned to t3code-reference |
| OpenCode | main (2026-03-08) | 2026-03-08 | anomalyco/opencode (maintained) |
| Crush | main (2026-03-08) | 2026-03-08 | Charmbracelet, AGENTS.md format |

### Update Check Process

```bash
# Run monthly or before major releases
./scripts/check-updates.sh

# Output:
# Symphony: main (no changes)
# Agency Agents: +2 agents, +5 workflow examples
# ECC: New strategic-compact pattern added
```

---

## Integration Principles

### What We Look For

1. **Patterns > Code** - We extract patterns, not just copy code
2. **Specs > Implementations** - Prefer well-documented specs
3. **Active Maintenance** - Active repos with recent commits
4. **Permissive Licenses** - MIT, Apache 2.0 preferred
5. **Production Tested** - Battle-tested in real environments

### What We Avoid

1. **Vendor Lock-in** - Must be self-hostable
2. **Heavy Dependencies** - Prefer minimal footprint
3. **Complex Setup** - Must integrate cleanly
4. **Unmaintained Projects** - No stale repos

---

## Contributing Back

When we improve integrations:
1. Document our changes
2. Submit PRs upstream when applicable
3. Share learnings in issues/discussions
4. Credit original projects in docs

---

## File Locations

| Template | This File |
|----------|-----------|
| aitlas-ui-template | `docs/architecture/OPEN_SOURCE_INTEGRATIONS.md` |
| aitlas-action-template | `docs/OPEN_SOURCE_INTEGRATIONS.md` |
| aitlas-worker-template | `docs/OPEN_SOURCE_INTEGRATIONS.md` |
| aitlas-cli | `docs/OPEN_SOURCE_INTEGRATIONS.md` |